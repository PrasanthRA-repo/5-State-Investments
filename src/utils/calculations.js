import xirr from 'xirr'
import {
  INFLOW_TYPES,
  OUTFLOW_TYPES,
  OUTFLOW_TO_INVESTMENT_TYPES,
  INVESTMENT_CATEGORIES,
  CATEGORY_OUTFLOW_TYPES,
  CATEGORY_INFLOW_TYPES,
} from '../constants'

// Shared math used by Overall + Individual dashboards. Kept separate from
// the UI so both dashboards compute totals the same way.

export function totalPooledFund(transactions) {
  // Contribution - Withdrawal (cash the group has ever put in, net of takeouts)
  return transactions.reduce((sum, t) => {
    if (t.type === 'Contribution') return sum + Number(t.amount)
    if (t.type === 'Withdrawal') return sum - Number(t.amount)
    return sum
  }, 0)
}

export function memberContribution(transactions, memberId) {
  return transactions
    .filter((t) => t.member_id === memberId && t.type === 'Contribution')
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

export function memberWithdrawals(transactions, memberId) {
  return transactions
    .filter((t) => t.member_id === memberId && t.type === 'Withdrawal')
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

export function totalContributions(transactions) {
  return transactions
    .filter((t) => t.type === 'Contribution')
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

// Cash currently sitting uninvested in the pool:
// contributions + repayments + dividends - withdrawals - expenses - money moved into investments
// NOTE: repayments/dividends received DO flow back into this figure -- so a
// dividend never "disappears", it just becomes liquid cash instead of staying
// tied up in the category it came from.
export function cashAvailable(transactions) {
  return transactions.reduce((sum, t) => {
    const amt = Number(t.amount)
    if (INFLOW_TYPES.includes(t.type)) return sum + amt
    if (OUTFLOW_TYPES.includes(t.type)) return sum - amt
    if (OUTFLOW_TO_INVESTMENT_TYPES.includes(t.type)) return sum - amt
    return sum
  }, 0)
}

export function recentTransactions(transactions, count = 8) {
  return [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.created_at || '').localeCompare(a.created_at || ''))
    .slice(0, count)
}

export function runningBalance(sortedTransactions) {
  // Expects transactions sorted ascending by date. Returns array of
  // { ...tx, balance } where balance is the pool balance after that tx.
  let balance = 0
  return sortedTransactions.map((t) => {
    const amt = Number(t.amount)
    if (INFLOW_TYPES.includes(t.type)) balance += amt
    else if (OUTFLOW_TYPES.includes(t.type)) balance -= amt
    else if (OUTFLOW_TO_INVESTMENT_TYPES.includes(t.type)) balance -= amt
    return { ...t, balance }
  })
}

export function formatCurrency(amount, currency = '₹') {
  const n = Number(amount) || 0
  return `${currency}${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

// ---------------------------------------------------------------------------
// Per-category math (Lending / Stock Market / Real Estate / Liquid Fund /
// Others): grouped by the transaction's `category` field (not `type`), so a
// Dividend/Return gets credited to whichever category it was tagged under.
//
// Two different "invested" numbers are tracked on purpose:
//  - categoryGrossInvested: lifetime total ever put in. Never goes down.
//    Used as the denominator for % returns and CAGR so those percentages
//    stay meaningful even after a loan is fully repaid.
//  - categoryAmountInvested: NET principal still outstanding right now
//    (gross minus principal already repaid). This is the headline "Invested"
//    figure on the card -- a fully repaid loan nets back to ₹0 here instead
//    of showing as invested forever.
// ---------------------------------------------------------------------------

export function categoryGrossInvested(transactions, category) {
  return transactions
    .filter((t) => t.category === category && CATEGORY_OUTFLOW_TYPES.includes(t.type))
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

// Net principal currently deployed/outstanding in this category (gross
// invested minus principal already repaid via Loan Repayment Received).
// Dividends/interest do NOT reduce this -- only a return OF principal does.
export function categoryAmountInvested(transactions, category) {
  const gross = categoryGrossInvested(transactions, category)
  const principalReturned = transactions
    .filter((t) => t.category === category && t.type === 'Loan Repayment Received')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  return Math.max(gross - principalReturned, 0)
}

// All cash returned so far from this category: principal repayments AND
// dividends/interest combined.
export function categoryReturnsReceived(transactions, category) {
  return transactions
    .filter((t) => t.category === category && CATEGORY_INFLOW_TYPES.includes(t.type))
    .reduce((sum, t) => sum + Number(t.amount), 0)
}

// Current value for one category: manual holdings win if any exist for that
// category (periodic manual price/appraisal update); otherwise falls back to
// net principal outstanding (assumes no gain/loss on the still-open position
// until you tell us otherwise via the Holdings editor).
export function categoryCurrentValue(transactions, holdings, category) {
  const matching = holdings.filter((h) => h.category === category)
  if (matching.length > 0) {
    return matching.reduce((sum, h) => sum + Number(h.current_value || 0), 0)
  }
  return categoryAmountInvested(transactions, category)
}

export function categoryPositionsCount(transactions, holdings, category) {
  const holdingCount = holdings.filter((h) => h.category === category).length
  if (holdingCount > 0) return holdingCount
  return transactions.filter((t) => t.category === category && CATEGORY_OUTFLOW_TYPES.includes(t.type)).length
}

// Dated, signed cash flows for one category: investing money out is
// negative, repayments/dividends received are positive. Sorted ascending.
export function categoryCashFlows(transactions, category) {
  return transactions
    .filter((t) => t.category === category && (CATEGORY_OUTFLOW_TYPES.includes(t.type) || CATEGORY_INFLOW_TYPES.includes(t.type)))
    .map((t) => ({
      when: new Date(t.date),
      amount: CATEGORY_OUTFLOW_TYPES.includes(t.type) ? -Number(t.amount) : Number(t.amount),
    }))
    .sort((a, b) => a.when - b.when)
}

// Simplified point-to-point CAGR from the first transaction in the category
// to today, using the lifetime gross invested as the base. Null (shown as
// "—") once a position is fully closed out (current value back to 0) --
// CAGR's current/invested formula isn't meaningful for a closed position
// with distributions; XIRR (which is date/amount aware) covers that case.
export function categoryCAGR(transactions, holdings, category) {
  const gross = categoryGrossInvested(transactions, category)
  const current = categoryCurrentValue(transactions, holdings, category)
  const flows = categoryCashFlows(transactions, category)
  if (gross <= 0 || current <= 0 || flows.length === 0) return null
  const firstDate = flows[0].when
  const years = (Date.now() - firstDate.getTime()) / (365 * 24 * 60 * 60 * 1000)
  if (years <= 0) return null
  return (Math.pow(current / gross, 1 / years) - 1) * 100
}

// Annualized return accounting for the actual dates/amounts of every cash
// flow in this category, plus a final "as of today" flow equal to the
// current value (as if the remaining position were liquidated today).
// Correctly handles fully-closed positions since repayments/dividends are
// already in the flow list with their real dates.
export function categoryXIRR(transactions, holdings, category) {
  const flows = categoryCashFlows(transactions, category)
  if (flows.length === 0) return null

  const current = categoryCurrentValue(transactions, holdings, category)
  const allFlows = [...flows]
  if (current > 0) {
    allFlows.push({ when: new Date(), amount: current })
  }

  const hasNegative = allFlows.some((f) => f.amount < 0)
  const hasPositive = allFlows.some((f) => f.amount > 0)
  if (!hasNegative || !hasPositive || allFlows.length < 2) return null

  try {
    const rate = xirr(allFlows)
    return rate * 100
  } catch (e) {
    return null
  }
}

// Everything a category performance card needs, in one call.
//
// Absolute returns is a TOTAL return figure: current asset value PLUS every
// distribution ever received (principal repayments + dividends) MINUS the
// lifetime gross amount invested. The principal-repayment portion of
// "returns received" always cancels out against the same amount being
// subtracted from "current value" (since current value nets down when
// principal comes back) -- so a fully repaid loan with zero profit correctly
// nets to ₹0 / 0%, while a loan that pays interest before being repaid shows
// just the interest as profit.
export function categoryPerformance(transactions, holdings, category) {
  const invested = categoryAmountInvested(transactions, category) // net outstanding, for display
  const grossInvested = categoryGrossInvested(transactions, category) // % denominator, never shrinks
  const current = categoryCurrentValue(transactions, holdings, category)
  const returnsReceived = categoryReturnsReceived(transactions, category)
  const absoluteReturns = current + returnsReceived - grossInvested
  const absoluteReturnsPct = grossInvested > 0 ? (absoluteReturns / grossInvested) * 100 : 0

  return {
    category,
    invested,
    current,
    returnsReceived,
    absoluteReturns,
    absoluteReturnsPct,
    cagr: categoryCAGR(transactions, holdings, category),
    xirr: categoryXIRR(transactions, holdings, category),
    positions: categoryPositionsCount(transactions, holdings, category),
    hasData: grossInvested > 0 || current > 0 || returnsReceived > 0,
  }
}

// ---------------------------------------------------------------------------
// Portfolio-wide totals (Overall Dashboard stat cards + pie chart). Built on
// top of the per-category functions above so every number on the page agrees.
// ---------------------------------------------------------------------------

// Net amount currently deployed per category (Cash uses the uninvested-cash
// figure, not "invested" in the category sense).
export function investedByCategory(transactions) {
  const totals = {}
  INVESTMENT_CATEGORIES.forEach((c) => {
    totals[c] = categoryAmountInvested(transactions, c)
  })
  totals.Cash = cashAvailable(transactions)
  return totals
}

// Current value by category (manual holdings win, else net-invested fallback).
export function currentValueByCategory(transactions, holdings) {
  const result = { Cash: cashAvailable(transactions) }
  INVESTMENT_CATEGORIES.forEach((c) => {
    result[c] = categoryCurrentValue(transactions, holdings, c)
  })
  return result
}

// Total portfolio value across ALL categories (cash + every investment category)
export function totalPortfolioValue(transactions, holdings) {
  const byCategory = currentValueByCategory(transactions, holdings)
  return Object.values(byCategory).reduce((sum, v) => sum + v, 0)
}

// Invested vs current, excluding cash -- but INCLUDING distributions already
// received, since that money is real investment performance even though it
// now sits as cash rather than inside the category. This is the same total-
// return logic as the category cards, just summed across all 5 categories,
// so this stat card always agrees with them.
export function investedVsCurrent(transactions, holdings) {
  let investedTotal = 0
  let currentTotal = 0
  let returnsTotal = 0
  INVESTMENT_CATEGORIES.forEach((c) => {
    investedTotal += categoryGrossInvested(transactions, c)
    currentTotal += categoryCurrentValue(transactions, holdings, c)
    returnsTotal += categoryReturnsReceived(transactions, c)
  })
  const gainLoss = currentTotal + returnsTotal - investedTotal
  const gainLossPct = investedTotal ? (gainLoss / investedTotal) * 100 : 0
  return {
    invested: investedTotal,
    current: currentTotal,
    gainLoss,
    gainLossPct,
  }
}

// Member's ownership % of the group, based purely on cash contributed
// (net of their own withdrawals) divided by the group's total pooled fund.
export function memberOwnershipPct(transactions, memberId) {
  const total = totalPooledFund(transactions)
  if (!total) return 0
  const netContribution = memberContribution(transactions, memberId) - memberWithdrawals(transactions, memberId)
  return (netContribution / total) * 100
}

// Member's share of current holdings by category = ownership % applied to
// the group's current value in each category.
export function memberHoldingsShare(transactions, holdings, memberId) {
  const pct = memberOwnershipPct(transactions, memberId) / 100
  const byCategory = currentValueByCategory(transactions, holdings)
  return Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, v * pct]))
}

export function memberTransactions(transactions, memberId) {
  return transactions
    .filter((t) => t.member_id === memberId)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.created_at || '').localeCompare(a.created_at || ''))
}

// ---------------------------------------------------------------------------
// Idle cash held by member. The pool's uninvested cash (cashAvailable) isn't
// sitting in one central account -- at any moment one of the 5 members is
// physically holding it. `member_id` on Contribution/Withdrawal/Expense/
// investment transactions represents whoever is holding the cash right
// before that transaction happens; 'Transfer' moves idle cash from one
// member to another without changing the group-wide total. Summing every
// member's idle cash should always equal cashAvailable(transactions).
// ---------------------------------------------------------------------------
export function memberIdleCash(transactions, memberId) {
  return transactions.reduce((sum, t) => {
    const amt = Number(t.amount)

    if (t.type === 'Transfer') {
      if (t.member_id === memberId) return sum - amt
      if (t.to_member_id === memberId) return sum + amt
      return sum
    }

    if (t.member_id !== memberId) return sum
    if (INFLOW_TYPES.includes(t.type)) return sum + amt
    if (OUTFLOW_TYPES.includes(t.type)) return sum - amt
    if (OUTFLOW_TO_INVESTMENT_TYPES.includes(t.type)) return sum - amt
    return sum
  }, 0)
}

export function idleCashByMember(transactions, members) {
  return members.map((m) => ({ member: m, amount: memberIdleCash(transactions, m.id) }))
}

// Splits `total` into whole-rupee shares proportional to `weights` (same
// order), always summing back to exactly `total` (leftover rupees from
// rounding go to the members with the largest fractional remainder). Falls
// back to a flat equal split if every weight is zero/negative (nobody has
// any idle cash to weight by).
export function splitByWeights(total, weights) {
  const positive = weights.map((w) => Math.max(Number(w) || 0, 0))
  const sumWeights = positive.reduce((a, b) => a + b, 0)

  if (sumWeights <= 0) {
    const base = Math.floor(total / weights.length)
    const remainder = total - base * weights.length
    return weights.map((_, i) => base + (i < remainder ? 1 : 0))
  }

  const raw = positive.map((w) => (w / sumWeights) * total)
  const floors = raw.map(Math.floor)
  let remainder = total - floors.reduce((a, b) => a + b, 0)

  const order = raw
    .map((r, i) => ({ i, frac: r - floors[i] }))
    .sort((a, b) => b.frac - a.frac)

  const shares = [...floors]
  for (let k = 0; k < remainder; k++) {
    shares[order[k % order.length].i] += 1
  }
  return shares
}
