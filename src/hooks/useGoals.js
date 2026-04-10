import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  subscribeToGoals,
  addGoal as addGoalToFirebase,
  updateGoal as updateGoalInFirebase,
  deleteGoal as deleteGoalFromFirebase,
} from '@/firebase/services'

export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setGoals([])
      setLoading(false)
      return
    }

    setLoading(true)
    
    const unsubscribe = subscribeToGoals(user.uid, (data) => {
      setGoals(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const addGoal = async (goalData) => {
    if (!user) return null
    try {
      const id = await addGoalToFirebase(user.uid, goalData)
      return id
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const updateGoal = async (goalId, data) => {
    if (!user) return
    try {
      await updateGoalInFirebase(user.uid, goalId, data)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const deleteGoal = async (goalId) => {
    if (!user) return
    try {
      await deleteGoalFromFirebase(user.uid, goalId)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const addToGoal = async (goalId, amount) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return
    
    const newAmount = (goal.currentAmount || 0) + amount
    await updateGoal(goalId, { currentAmount: newAmount })
  }

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    addToGoal,
  }
}

export default useGoals
