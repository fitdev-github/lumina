import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  subscribeToTransactions,
  addTransaction as addTransactionToFirebase,
  deleteTransaction as deleteTransactionFromFirebase,
  getTransactions,
} from '@/firebase/services'

export function useTransactions(limitCount = 50) {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setTransactions([])
      setLoading(false)
      return
    }

    setLoading(true)
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToTransactions(user.uid, (data) => {
      setTransactions(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const addTransaction = async (transactionData) => {
    if (!user) return null
    try {
      const id = await addTransactionToFirebase(user.uid, transactionData)
      return id
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteTransaction = async (transactionId) => {
    if (!user) return
    try {
      await deleteTransactionFromFirebase(user.uid, transactionId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

  const balance = totalIncome - totalExpense

  // Group by category
  const byCategory = transactions.reduce((acc, t) => {
    const cat = t.category || 'อื่นๆ'
    if (!acc[cat]) acc[cat] = 0
    acc[cat] += Math.abs(t.amount || 0)
    return acc
  }, {})

  return {
    transactions,
    loading,
    error,
    addTransaction,
    deleteTransaction,
    totals: { income: totalIncome, expense: totalExpense, balance },
    byCategory,
  }
}

export default useTransactions
