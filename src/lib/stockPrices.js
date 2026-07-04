// Best-effort live price sync via Twelve Data (https://twelvedata.com).
// This runs entirely in the browser -- there's no backend/proxy in this app,
// so it depends on Twelve Data allowing direct CORS requests from arbitrary
// origins on their free tier.
//
// CONFIRMED LIMITATION (tested live): Twelve Data's free "Basic" plan only
// covers US stocks/forex/crypto -- NSE (India) is NOT included and requires
// their paid "Grow" plan ($29/mo) or higher. A free-tier key will return
// HTTP 404 for any NSE ticker (e.g. RELIANCE:NSE), which is what the error
// message below calls out -- it's a plan restriction, not a broken ticker.
//
// Free tier is rate-limited (roughly 8 requests/minute, ~800/day as of
// writing) -- refreshing a handful of tickers occasionally should be fine,
// but don't hit "Refresh" repeatedly in a loop.

const BASE_URL = 'https://api.twelvedata.com/price'

// Indian NSE tickers use the `SYMBOL:NSE` format, e.g. `RELIANCE:NSE`,
// `INFY:NSE`, `SBIN:NSE`. If the user already typed a suffix (":NSE",
// ":BSE") we leave it alone; otherwise we default to NSE.
export function normalizeTicker(rawTicker) {
  const t = (rawTicker || '').trim().toUpperCase()
  if (!t) return ''
  if (t.includes(':')) return t
  return `${t}:NSE`
}

// Fetches the latest price for one ticker. Returns a number, or throws an
// Error with a human-readable message on failure.
export async function fetchLivePrice(rawTicker, apiKey) {
  const ticker = normalizeTicker(rawTicker)
  if (!ticker) throw new Error('No ticker provided')
  if (!apiKey) throw new Error('No Twelve Data API key set — add one in Stock Sync settings')

  const url = `${BASE_URL}?symbol=${encodeURIComponent(ticker)}&apikey=${encodeURIComponent(apiKey)}`

  let res
  try {
    res = await fetch(url)
  } catch (e) {
    // Most likely a CORS block or network issue -- this is the failure mode
    // we can't rule out from outside a real browser session.
    throw new Error(`Network/CORS error fetching ${ticker}: ${e.message}`)
  }

  if (!res.ok) {
    if (res.status === 404 && ticker.includes(':')) {
      throw new Error(
        `${ticker}: HTTP 404 — Twelve Data's free plan doesn't include NSE/India data (needs their paid "Grow" plan or higher). Use manual "Current value" updates instead, or upgrade your Twelve Data plan.`
      )
    }
    throw new Error(`Twelve Data returned HTTP ${res.status} for ${ticker}`)
  }

  const data = await res.json()

  if (data.status === 'error' || data.code) {
    throw new Error(data.message || `Twelve Data error for ${ticker}`)
  }

  const price = Number(data.price)
  if (!price || Number.isNaN(price)) {
    throw new Error(`No price returned for ${ticker} (check the ticker/exchange suffix)`)
  }

  return price
}

// Fetches prices for multiple tickers one at a time (simplest, most
// rate-limit-friendly approach). Returns { [ticker]: { price } | { error } }.
export async function fetchLivePrices(tickers, apiKey) {
  const results = {}
  for (const raw of tickers) {
    const ticker = normalizeTicker(raw)
    if (!ticker || results[ticker]) continue
    try {
      const price = await fetchLivePrice(ticker, apiKey)
      results[ticker] = { price }
    } catch (e) {
      results[ticker] = { error: e.message }
    }
  }
  return results
}
