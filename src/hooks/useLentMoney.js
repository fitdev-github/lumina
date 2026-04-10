import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeToLentMoney,
  addLentMoney,
  updateLentMoney,
  deleteLentMoney,
} from '@/firebase/services'

export function useLentMoney() {
  const { user } = useAuth()
  const [lentItems, setLentItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLentItems([])
      setLoading(false)
      return
    }
    const unsub = subscribeToLentMoney(user.uid, (data) => {
      setLentItems(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  const addItem = (data) => {
    if (!user) return
    return addLentMoney(user.uid, data)
  }

  const updateItem = (id, data) => {
    if (!user) return
    return updateLentMoney(user.uid, id, data)
  }

  const removeItem = (id) => {
    if (!user) return
    return deleteLentMoney(user.uid, id)
  }

  const pending = lentItems.filter(i => i.status !== 'paid')
  const paid = lentItems.filter(i => i.status === 'paid')
  // totalPending = sum of remaining (amount - paidAmount) across pending items
  const totalPending = pending.reduce((sum, i) => sum + Math.max((i.amount || 0) - (i.paidAmount || 0), 0), 0)

  return { lentItems, pending, paid, totalPending, loading, addItem, updateItem, removeItem }
}
