// CoinGecko public API — no key needed, ~30 req/min free
const BASE = 'https://api.coingecko.com/api/v3'

// Coins available on Bitkub, mapped to CoinGecko IDs
export const COIN_LIST = [
  { symbol: 'BTC',   name: 'Bitcoin',       id: 'bitcoin',          color: 'from-orange-400 to-orange-500' },
  { symbol: 'ETH',   name: 'Ethereum',      id: 'ethereum',         color: 'from-blue-400 to-blue-600' },
  { symbol: 'BNB',   name: 'BNB',           id: 'binancecoin',      color: 'from-yellow-400 to-yellow-500' },
  { symbol: 'XRP',   name: 'XRP',           id: 'ripple',           color: 'from-sky-400 to-sky-600' },
  { symbol: 'SOL',   name: 'Solana',        id: 'solana',           color: 'from-purple-400 to-purple-600' },
  { symbol: 'ADA',   name: 'Cardano',       id: 'cardano',          color: 'from-blue-500 to-indigo-500' },
  { symbol: 'DOGE',  name: 'Dogecoin',      id: 'dogecoin',         color: 'from-yellow-300 to-yellow-500' },
  { symbol: 'AVAX',  name: 'Avalanche',     id: 'avalanche-2',      color: 'from-red-400 to-red-600' },
  { symbol: 'DOT',   name: 'Polkadot',      id: 'polkadot',         color: 'from-pink-400 to-pink-600' },
  { symbol: 'MATIC', name: 'Polygon',       id: 'matic-network',    color: 'from-violet-400 to-violet-600' },
  { symbol: 'LINK',  name: 'Chainlink',     id: 'chainlink',        color: 'from-blue-400 to-blue-500' },
  { symbol: 'ATOM',  name: 'Cosmos',        id: 'cosmos',           color: 'from-indigo-400 to-indigo-600' },
  { symbol: 'LTC',   name: 'Litecoin',      id: 'litecoin',         color: 'from-slate-400 to-slate-500' },
  { symbol: 'TRX',   name: 'TRON',          id: 'tron',             color: 'from-red-500 to-red-700' },
  { symbol: 'SUI',   name: 'Sui',           id: 'sui',              color: 'from-blue-400 to-cyan-500' },
  { symbol: 'ARB',   name: 'Arbitrum',      id: 'arbitrum',         color: 'from-sky-500 to-blue-600' },
  { symbol: 'OP',    name: 'Optimism',      id: 'optimism',         color: 'from-red-400 to-rose-500' },
  { symbol: 'NEAR',  name: 'NEAR Protocol', id: 'near',             color: 'from-green-400 to-green-600' },
  { symbol: 'FTM',   name: 'Fantom',        id: 'fantom',           color: 'from-blue-400 to-indigo-500' },
  { symbol: 'SAND',  name: 'The Sandbox',   id: 'the-sandbox',      color: 'from-blue-300 to-blue-500' },
  { symbol: 'AXS',   name: 'Axie Infinity', id: 'axie-infinity',    color: 'from-sky-400 to-blue-500' },
  { symbol: 'USDT',  name: 'Tether',        id: 'tether',           color: 'from-green-400 to-green-600' },
  { symbol: 'USDC',  name: 'USD Coin',      id: 'usd-coin',         color: 'from-blue-400 to-blue-500' },
  { symbol: 'KUB',   name: 'Bitkub Coin',   id: 'bitkub-coin',      color: 'from-green-500 to-teal-500' },
  { symbol: 'THB',   name: 'บาทไทย',         id: null,               color: 'from-blue-600 to-blue-800' },
]

// Simple in-memory cache (60-second TTL)
let priceCache = { data: null, ts: 0 }
const CACHE_TTL = 60_000

export function getCoinInfo(symbol) {
  return COIN_LIST.find(c => c.symbol === symbol) || null
}

export async function fetchPrices(coinIds) {
  const now = Date.now()
  if (priceCache.data && now - priceCache.ts < CACHE_TTL) {
    return priceCache.data
  }
  const ids = coinIds.join(',')
  const res = await fetch(
    `${BASE}/simple/price?ids=${ids}&vs_currencies=thb&include_24hr_change=true`,
    { signal: AbortSignal.timeout(8000) }
  )
  if (!res.ok) throw new Error('CoinGecko fetch failed')
  const data = await res.json()
  priceCache = { data, ts: now }
  return data
}

export function invalidateCache() {
  priceCache = { data: null, ts: 0 }
}
