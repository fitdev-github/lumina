import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useFinance } from './FinanceContext'
import { generateInsights } from '@/services/groqService'

const AIInsightsContext = createContext(null)

const CACHE_KEY = 'lumina_ai_insights'
const CACHE_DURATION = 60 * 60 * 1000

function getCachedInsights() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    const isExpired = Date.now() - timestamp > CACHE_DURATION
    
    if (isExpired) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    
    return data
  } catch {
    return null
  }
}

function setCachedInsights(insights) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: insights,
      timestamp: Date.now()
    }))
  } catch (e) {
    console.warn('Failed to cache insights:', e)
  }
}

const defaultInsights = {
  greeting: 'สวัสดีค่ะ! 😊',
  mainInsight: 'ยินดีต้อนรับสู่ Lumina Finance ค่ะ',
  recommendations: [
    'เริ่มบันทึกรายรับรายจ่ายวันนี้เพื่อติดตามการเงินของคุณ',
    'ตั้งเป้าหมายการออมเพื่อวางแผนอนาคต',
    'ติดตามค่าใช้จ่ายสม่ำเสมอจะช่วยให้คุณประหยัดได้มากขึ้น'
  ],
  highlight: 'เริ่มต้นวางแผนการเงินวันนี้!'
}

export function AIInsightsProvider({ children }) {
  const finance = useFinance()
  const [insights, setInsights] = useState(defaultInsights)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const lastTransactionCount = useRef(null)
  
  const fetchInsights = useCallback(async (force = false) => {
    if (!finance?.user) return
    
    if (!force) {
      const cached = getCachedInsights()
      if (cached) {
        setInsights(cached)
        setLoading(false)
        return
      }
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await generateInsights(finance)
      
      if (result.success) {
        setInsights(result.insights)
        setCachedInsights(result.insights)
      } else {
        setError(result.error)
        if (!insights || insights === defaultInsights) {
          setInsights(defaultInsights)
        }
      }
    } catch (err) {
      setError('ไม่สามารถโหลด insights ได้')
      console.error('AI Insights Error:', err)
    } finally {
      setLoading(false)
    }
  }, [finance])

  useEffect(() => {
    if (finance?.user) {
      const cached = getCachedInsights()
      if (cached) {
        setInsights(cached)
        setLoading(false)
      }
      
      fetchInsights()
    } else {
      setInsights(defaultInsights)
      setLoading(true)
    }
  }, [finance?.user, fetchInsights])

  useEffect(() => {
    if (!finance) return

    // Fingerprint of key financial state — triggers refresh when anything meaningful changes
    const fingerprint = JSON.stringify({
      salary: finance.cashFlow?.monthlySalary,
      totalFixed: finance.cashFlow?.totalFixed,
      remaining: Math.round(finance.cashFlow?.remainingFree || 0),
      spendingTier: finance.cashFlow?.spendingTier,
      accountsTotal: finance.accounts?.reduce((s, a) => s + (a.balance || 0), 0),
      goalsTotal: finance.goals?.reduce((s, g) => s + (g.currentAmount || 0), 0),
      debtsTotal: finance.debts?.reduce((s, d) => s + (d.balance || 0), 0),
      income: finance.totals?.income,
      expense: finance.totals?.expense,
    })

    if (lastTransactionCount.current !== null &&
        fingerprint !== lastTransactionCount.current) {
      setRefreshing(true)
      fetchInsights(true).finally(() => setRefreshing(false))
    }

    lastTransactionCount.current = fingerprint
  }, [finance, fetchInsights])

  const refreshInsights = useCallback(async () => {
    setRefreshing(true)
    await fetchInsights(true)
    setRefreshing(false)
  }, [fetchInsights])

  const value = {
    insights,
    loading,
    refreshing,
    error,
    refreshInsights
  }

  return (
    <AIInsightsContext.Provider value={value}>
      {children}
    </AIInsightsContext.Provider>
  )
}

export function useAIInsights() {
  const context = useContext(AIInsightsContext)
  if (context === undefined) {
    throw new Error('useAIInsights must be used within an AIInsightsProvider')
  }
  return context
}

export default AIInsightsContext
