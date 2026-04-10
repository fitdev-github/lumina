import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useFixedExpenses } from './useFixedExpenses'
import {
  getOrCreateMonthlyChecklist,
  subscribeToMonthlyChecklist,
  updateChecklistItem,
} from '@/firebase/services'

export function useMonthlyChecklist() {
  const { user } = useAuth()
  const { fixedExpenses, monthlySalary, loading: fixedLoading } = useFixedExpenses()
  const [checklist, setChecklist] = useState(null)
  const [loading, setLoading] = useState(true)

  const currentMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  // Subscribe once on mount
  useEffect(() => {
    if (!user) return
    let unsub = null
    unsub = subscribeToMonthlyChecklist(user.uid, currentMonth, (data) => {
      setChecklist(data)
      setLoading(false)
    })
    return () => { if (unsub) unsub() }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync whenever fixedExpenses or salary changes (also handles first-time creation)
  useEffect(() => {
    if (!user || fixedLoading) return
    getOrCreateMonthlyChecklist(user.uid, currentMonth, fixedExpenses, monthlySalary)
  }, [user, fixedLoading, fixedExpenses, monthlySalary]) // eslint-disable-line react-hooks/exhaustive-deps

  const checkItem = (itemId, updates = {}) => {
    if (!user) return
    return updateChecklistItem(user.uid, currentMonth, itemId, {
      status: 'done',
      doneAt: new Date().toISOString(),
      ...updates,
    })
  }

  const uncheckItem = (itemId) => {
    if (!user) return
    return updateChecklistItem(user.uid, currentMonth, itemId, {
      status: 'pending',
      doneAt: null,
      accountId: null,
    })
  }

  const items = checklist?.items || []
  const doneCount = items.filter(i => i.status === 'done').length
  const totalCount = items.length

  return {
    checklist,
    items,
    loading,
    doneCount,
    totalCount,
    currentMonth,
    checkItem,
    uncheckItem,
  }
}
