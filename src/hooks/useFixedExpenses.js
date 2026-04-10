import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeToFixedExpenses,
  addFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
} from '@/firebase/services'

function getSalaryKey(uid) {
  return `lumina_salary_${uid}`
}

function loadSalaryFromStorage(uid) {
  try {
    const raw = localStorage.getItem(getSalaryKey(uid))
    return raw ? parseFloat(raw) : 0
  } catch {
    return 0
  }
}

function saveSalaryToStorage(uid, value) {
  try {
    localStorage.setItem(getSalaryKey(uid), value.toString())
  } catch {}
}

export function useFixedExpenses() {
  const { user } = useAuth()
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [monthlySalary, setMonthlySalary] = useState(0)
  const [loading, setLoading] = useState(true)

  // Load salary from localStorage when user is available
  useEffect(() => {
    if (!user) return
    const saved = loadSalaryFromStorage(user.uid)
    setMonthlySalary(saved)
  }, [user])

  // Subscribe to fixed expenses in real-time
  useEffect(() => {
    if (!user) {
      setFixedExpenses([])
      setLoading(false)
      return
    }

    const unsub = subscribeToFixedExpenses(user.uid, (data) => {
      setFixedExpenses(data)
      setLoading(false)
    })

    return () => unsub()
  }, [user])

  const saveSalary = async (amount) => {
    if (!user) return
    const value = parseFloat(amount) || 0
    saveSalaryToStorage(user.uid, value)
    setMonthlySalary(value)
  }

  const addExpense = async (data) => {
    if (!user) return
    return addFixedExpense(user.uid, data)
  }

  const updateExpense = async (id, data) => {
    if (!user) return
    return updateFixedExpense(user.uid, id, data)
  }

  const removeExpense = async (id) => {
    if (!user) return
    return deleteFixedExpense(user.uid, id)
  }

  const totalFixed = fixedExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const freeMoney = monthlySalary - totalFixed

  return {
    fixedExpenses,
    monthlySalary,
    totalFixed,
    freeMoney,
    loading,
    saveSalary,
    addExpense,
    updateExpense,
    removeExpense,
  }
}
