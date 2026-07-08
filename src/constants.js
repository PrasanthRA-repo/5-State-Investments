// Core enums for the data model. Keep these in sync with README data model section.

export const TRANSACTION_TYPES = [
  'Contribution',
  'Lending',
  'Stock Investment',
  'Real Estate Investment',
  'Withdrawal',
  'Expense',
  'Loan Repayment Received',
  'Dividend/Return',
  'Transfer',
]

// The one type that needs a SECOND member (who it's going to). Every other
// type only has the one `member_id`.
export const TRANSFER_TYPE = 'Transfer'

// Sentinel value for the Member dropdown meaning "split this equally across
// all current members" -- never stored on a transaction itself. On submit,
// the form fans this out into one real transaction per member (real
// member_id, equal share of the amount), so every existing per-member
// calculation (ownership %, idle cash, personal history) just works without
// needing to know about a fake "everyone" member.
export const EVERYONE_VALUE = '__everyone__'

// 'Cash' = pool-level uninvested money (contributions/withdrawals/expenses).
// The other five are investment categories, each with its own performance
// card on the Overall Dashboard (invested, current value, returns, XIRR, CAGR).
export const CATEGORIES = ['Cash', 'Lending', 'Stock Market', 'Real Estate', 'Liquid Fund', 'Others']

export const INVESTMENT_CATEGORIES = ['Lending', 'Stock Market', 'Real Estate', 'Liquid Fund', 'Others']

export const STATUSES = ['Active', 'Closed/Sold', 'Repaid']

// Suggested default category per transaction type — used to pre-fill the form,
// but the field stays editable since e.g. a Dividend could still be tagged
// under Stock Market or Real Estate depending on the source asset. Liquid
// Fund / Others have no natural default type, so they're picked manually.
export const TYPE_TO_DEFAULT_CATEGORY = {
  Contribution: 'Cash',
  Withdrawal: 'Cash',
  Expense: 'Cash',
  Lending: 'Lending',
  'Loan Repayment Received': 'Lending',
  'Stock Investment': 'Stock Market',
  'Real Estate Investment': 'Real Estate',
  'Dividend/Return': 'Stock Market',
  Transfer: 'Cash',
}

// Types that move money OUT of the shared cash pool into an investment/loan
export const OUTFLOW_TO_INVESTMENT_TYPES = [
  'Lending',
  'Stock Investment',
  'Real Estate Investment',
]

// Types that move money back INTO the shared cash pool
export const INFLOW_TYPES = [
  'Contribution',
  'Loan Repayment Received',
  'Dividend/Return',
]

// Types that reduce the pool entirely (money leaves the group)
export const OUTFLOW_TYPES = ['Withdrawal', 'Expense']

// Note: 'Transfer' deliberately isn't in any of the three lists above --
// it moves cash between two members but the pool-wide total is unchanged,
// so it's a no-op for cashAvailable()/runningBalance().

// Types representing money invested INTO a specific category (negative cash
// flow for XIRR purposes) vs returns received back FROM that category
// (positive cash flow). Used by the per-category performance cards.
export const CATEGORY_OUTFLOW_TYPES = ['Lending', 'Stock Investment', 'Real Estate Investment']
export const CATEGORY_INFLOW_TYPES = ['Loan Repayment Received', 'Dividend/Return']

// Inflow types where the money is received from an external source (a
// borrower repaying a loan, a company paying a dividend) and necessarily
// lands in ONE member's real bank/broker account, even though it's split
// equally among all 5 for ownership/history purposes. When "Everyone" is
// used for one of these types, the form offers an optional "Collected by"
// choice -- picking a member auto-generates Transfer transactions moving
// every other member's equal share to that person, so idle cash correctly
// reflects who's physically holding the cash instead of requiring manual
// follow-up transfers.
export const INFLOW_COLLECTIBLE_TYPES = ['Dividend/Return', 'Loan Repayment Received']

// Status options for a Project card (independent of the financial STATUSES above).
export const PROJECT_STATUSES = ['Active', 'Hold', 'Closed']

export const PROJECT_STATUS_COLORS = {
  Active: '#22c55e',
  Hold: '#f59e0b',
  Closed: '#6b7280',
}

export const DEFAULT_MEMBERS = [
  { id: 'm1', name: 'Prasanth', email: '', date_joined: '' },
  { id: 'm2', name: 'Balaji', email: '', date_joined: '' },
  { id: 'm3', name: 'Gokul', email: '', date_joined: '' },
  { id: 'm4', name: 'Ravi', email: '', date_joined: '' },
  { id: 'm5', name: 'Suresh', email: '', date_joined: '' },
]

export const CURRENCY = '₹'

export const CATEGORY_COLORS = {
  Cash: '#22c55e',
  Lending: '#a855f7',
  'Stock Market': '#3b82f6',
  'Real Estate': '#f59e0b',
  'Liquid Fund': '#06b6d4',
  Others: '#6b7280',
}

export const CATEGORY_ICONS = {
  Cash: '💰',
  Lending: '🤝',
  'Stock Market': '📈',
  'Real Estate': '🏠',
  'Liquid Fund': '💧',
  Others: '📦',
}
