import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  subscribeToDebts,
  addDebt as addDebtToFirebase,
  updateDebt as updateDebtInFirebase,
  deleteDebt as deleteDebtFromFirebase,
} from '@/firebase/services'

export function useDebts() {
  const { user } = useAuth()
  const [debts, setDebts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setDebts([])
      setLoading(false)
      return
    }

    setLoading(true)
    
    const unsubscribe = subscribeToDebts(user.uid, (data) => {
      setDebts(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const addDebt = async (debtData) => {
    if (!user) return null
    try {
      const id = await addDebtToFirebase(user.uid, debtData)
      return id
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateDebt = async (debtId, data) => {
    if (!user) return
    try {
      await updateDebtInFirebase(user.uid, debtId, data)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteDebt = async (debtId) => {
    if (!user) return
    try {
      await deleteDebtFromFirebase(user.uid, debtId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const makePayment = async (debtId, amount) => {
    const debt = debts.find(d => d.id === debtId)
    if (!debt) return
    const newBalance = Math.max(0, (debt.balance || 0) - amount)
    await updateDebt(debtId, {
      balance: newBalance,
      isPaidOff: newBalance === 0,
      lastPayment: { amount, date: new Date().toISOString() },
    })
    return { newBalance, isPaidOff: newBalance === 0 }
  }

  // Calculate totals
  const totalDebt = debts.reduce((sum, d) => sum + (d.balance || 0), 0)
  const totalMinPayment = debts.reduce((sum, d) => sum + (d.minPayment || 0), 0)

  return {
    debts,
    loading,
    error,
    addDebt,
    updateDebt,
    deleteDebt,
    makePayment,
    totals: { debt: totalDebt, minPayment: totalMinPayment },
  }
}

export default useDebts
