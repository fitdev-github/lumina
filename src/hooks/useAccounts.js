import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  subscribeToAccounts,
  addAccount as addAccountToFirebase,
  updateAccount as updateAccountInFirebase,
  deleteAccount as deleteAccountFromFirebase,
} from '@/firebase/services'

export function useAccounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setAccounts([])
      setLoading(false)
      return
    }

    setLoading(true)
    const unsubscribe = subscribeToAccounts(user.uid, (data) => {
      setAccounts(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const addAccount = async (accountData) => {
    if (!user) return null
    try {
      const id = await addAccountToFirebase(user.uid, accountData)
      return id
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateAccount = async (accountId, data) => {
    if (!user) return
    try {
      await updateAccountInFirebase(user.uid, accountId, data)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteAccount = async (accountId) => {
    if (!user) return
    try {
      await deleteAccountFromFirebase(user.uid, accountId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)

  return {
    accounts,
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    totalBalance,
  }
}

export default useAccounts
