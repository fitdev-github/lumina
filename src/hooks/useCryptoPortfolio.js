import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeToCryptoHoldings,
  addCryptoHolding,
  updateCryptoHolding,
  deleteCryptoHolding,
} from '@/firebase/services'
import { fetchPrices, getCoinInfo } from '@/services/cryptoService'

export function useCryptoPortfolio() {
  const { user } = useAuth()
  const [holdings, setHoldings] = useState([])
  const [prices, setPrices] = useState({}) // { [coinGeckoId]: { thb, thb_24h_change } }
  const [loading, setLoading] = useState(true)
  const [priceLoading, setPriceLoading] = useState(false)
  const [priceError, setPriceError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Subscribe to holdings
  useEffect(() => {
    if (!user) {
      setHoldings([])
      setLoading(false)
      return
    }
    const unsub = subscribeToCryptoHoldings(user.uid, (data) => {
      setHoldings(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  // Fetch prices whenever holdings change
  const refreshPrices = useCallback(async (currentHoldings) => {
    const ids = [...new Set(
      currentHoldings
        .map(h => getCoinInfo(h.symbol)?.id)
        .filter(Boolean) // null id (e.g. THB) excluded
    )]
    if (ids.length === 0) return
    setPriceLoading(true)
    setPriceError(null)
    try {
      const data = await fetchPrices(ids)
      setPrices(data)
      setLastUpdated(new Date())
    } catch (e) {
      setPriceError('ไม่สามารถดึงราคาได้ในขณะนี้')
    } finally {
      setPriceLoading(false)
    }
  }, [])

  useEffect(() => {
    if (holdings.length > 0) {
      refreshPrices(holdings)
    }
  }, [holdings, refreshPrices])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (holdings.length === 0) return
    const interval = setInterval(() => refreshPrices(holdings), 60_000)
    return () => clearInterval(interval)
  }, [holdings, refreshPrices])

  const addHolding = (data) => {
    if (!user) return
    return addCryptoHolding(user.uid, data)
  }

  const updateHolding = (id, data) => {
    if (!user) return
    return updateCryptoHolding(user.uid, id, data)
  }

  const removeHolding = (id) => {
    if (!user) return
    return deleteCryptoHolding(user.uid, id)
  }

  // Enrich holdings with live price data
  const enriched = holdings.map(h => {
    const coin = getCoinInfo(h.symbol)
    // THB (or any coin with null id) uses fixed price of 1
    const isFixed = coin?.id === null
    const priceData = coin && !isFixed ? prices[coin.id] : null
    const currentPrice = isFixed ? 1 : (priceData?.thb ?? null)
    const change24h = isFixed ? 0 : (priceData?.thb_24h_change ?? null)
    const currentValue = currentPrice != null ? currentPrice * (h.amount || 0) : null
    const costBasis = (h.avgCost || 0) * (h.amount || 0)
    const pnl = currentValue != null ? currentValue - costBasis : null
    const pnlPct = costBasis > 0 && pnl != null ? (pnl / costBasis) * 100 : null
    return { ...h, coin, currentPrice, change24h, currentValue, costBasis, pnl, pnlPct }
  })

  // Use currentValue if available, else costBasis — consistent across loading states
  const pricesReady = Object.keys(prices).length > 0
  const totalValue = enriched.reduce((s, h) => {
    const val = pricesReady ? (h.currentValue ?? h.costBasis) : h.costBasis
    return s + val
  }, 0)
  const totalCost = enriched.reduce((s, h) => s + h.costBasis, 0)
  const totalPnl = enriched.every(h => h.pnl != null)
    ? enriched.reduce((s, h) => s + (h.pnl ?? 0), 0)
    : null

  return {
    holdings: enriched,
    prices,
    loading,
    priceLoading,
    priceError,
    lastUpdated,
    totalValue,
    totalCost,
    totalPnl,
    refreshPrices: () => refreshPrices(holdings),
    addHolding,
    updateHolding,
    removeHolding,
  }
}
