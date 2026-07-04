import { useEffect, useState } from 'react'
import { useData } from '../context/DataContext'
import * as storage from '../lib/storage'
import { fetchLivePrices } from '../lib/stockPrices'

// Best-effort live price sync for Stock Market holdings, via Twelve Data.
// This calls their API directly from the browser (no backend/proxy here),
// so it's only as reliable as Twelve Data's free-tier CORS policy -- that
// has not been verified live. If "Refresh" fails for every ticker with a
// network/CORS-looking error, live sync isn't going to work from this setup
// and prices will need to stay manual.
export default function StockSyncPanel() {
  const { holdings, updateHolding } = useData()
  const [apiKey, setApiKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [status, setStatus] = useState(null) // { loading, results: {ticker: {price|error}} }

  useEffect(() => {
    setApiKey(storage.getSettings().twelveDataApiKey || '')
  }, [])

  function saveKey(key) {
    setApiKey(key)
    storage.saveSettings({ ...storage.getSettings(), twelveDataApiKey: key })
  }

  const stockHoldings = holdings.filter((h) => h.category === 'Stock Market' && h.ticker)

  async function handleRefresh() {
    if (!apiKey) {
      setStatus({ loading: false, results: {}, error: 'Add your Twelve Data API key first.' })
      setShowKeyInput(true)
      return
    }
    if (stockHoldings.length === 0) {
      setStatus({ loading: false, results: {}, error: 'No Stock Market holdings have a ticker set yet.' })
      return
    }

    setStatus({ loading: true, results: {} })
    const tickers = stockHoldings.map((h) => h.ticker)
    const results = await fetchLivePrices(tickers, apiKey)

    await Promise.all(
      stockHoldings.map((h) => {
        const key = h.ticker.includes(':') ? h.ticker.toUpperCase() : `${h.ticker.toUpperCase()}:NSE`
        const result = results[key]
        if (!result?.price) return null
        return updateHolding(h.id, {
          live_price: result.price,
          price_updated_at: new Date().toISOString(),
          current_value: Number(h.quantity || 0) * result.price,
        }).catch(() => {})
      })
    )

    setStatus({ loading: false, results })
  }

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Stock price sync (Twelve Data, experimental)</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowKeyInput((s) => !s)}
            className="text-xs font-medium text-gray-500 hover:text-gray-800"
          >
            {showKeyInput ? 'Hide key' : apiKey ? 'Change key' : 'Add API key'}
          </button>
          <button
            onClick={handleRefresh}
            disabled={status?.loading}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
          >
            {status?.loading ? 'Refreshing…' : 'Refresh prices'}
          </button>
        </div>
      </div>

      {showKeyInput && (
        <div className="mb-3">
          <input
            type="text"
            value={apiKey}
            onChange={(e) => saveKey(e.target.value)}
            placeholder="Twelve Data API key (free tier at twelvedata.com)"
            className="input text-xs"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Stored only in this browser's localStorage. Get a free key at twelvedata.com — free tier is rate-limited
            (roughly 8 requests/min), so refresh occasionally rather than repeatedly.
          </p>
        </div>
      )}

      {status?.error && (
        <p className="text-xs text-red-600 mb-2">{status.error}</p>
      )}

      {status && !status.loading && Object.keys(status.results).length > 0 && (
        <ul className="text-xs space-y-1">
          {Object.entries(status.results).map(([ticker, r]) => (
            <li key={ticker} className={r.error ? 'text-red-600' : 'text-green-600'}>
              {ticker}: {r.error ? r.error : `₹${r.price}`}
            </li>
          ))}
        </ul>
      )}

      {stockHoldings.length === 0 && (
        <p className="text-xs text-gray-400">
          Add a Stock Market holding with a ticker above to enable price sync.
        </p>
      )}
    </div>
  )
}
