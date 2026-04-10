import { createContext, useContext, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { useTransactions } from '@/hooks/useTransactions'
import { useGoals } from '@/hooks/useGoals'
import { useDebts } from '@/hooks/useDebts'
import { useAccounts } from '@/hooks/useAccounts'
import { useFixedExpenses } from '@/hooks/useFixedExpenses'

const FinanceContext = createContext(null)

export function FinanceProvider({ children }) {
  const { user } = useAuth()
  const { transactions, loading: transactionsLoading, totals, byCategory } = useTransactions()
  const { goals, loading: goalsLoading } = useGoals()
  const { debts, loading: debtsLoading, totals: debtTotals } = useDebts()
  const { accounts, loading: accountsLoading, totalBalance } = useAccounts()
  const { fixedExpenses, monthlySalary, totalFixed, freeMoney, loading: fixedLoading } = useFixedExpenses()

  const financeContext = useMemo(() => {
    if (!user) return null

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const thisMonthTransactions = transactions.filter(t => {
      if (!t.date) return false
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    
    const monthlyIncome = thisMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const monthlyExpense = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)
    
    const monthlyExpenseByCategory = thisMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const cat = t.category || 'อื่นๆ'
        acc[cat] = (acc[cat] || 0) + Math.abs(t.amount || 0)
        return acc
      }, {})
    
    const savingsRate = monthlyIncome > 0 
      ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 
      : 0
    
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      percent: goal.targetAmount > 0 
        ? (goal.currentAmount / goal.targetAmount) * 100 
        : 0
    }))
    
    const recentTransactions = transactions.slice(0, 10).map(t => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      note: t.note,
      date: t.date
    }))
    
    const memberSince = user.metadata?.creationTime 
      ? new Date(user.metadata.creationTime).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
      : 'ไม่ระบุ'

    const netWorth = totalBalance

    return {
      user: {
        id: user.uid,
        name: user.displayName?.split(' ')[0] || 'เพื่อน',
        fullName: user.displayName || 'ผู้ใช้',
        email: user.email,
        photoURL: user.photoURL,
        memberSince
      },
      summary: {
        totalIncome: totals.income,
        totalExpense: totals.expense,
        balance: totals.balance,
        savingsRate
      },
      thisMonth: {
        income: monthlyIncome,
        expense: monthlyExpense,
        expenseByCategory: monthlyExpenseByCategory,
        transactionCount: thisMonthTransactions.length
      },
      totals,
      byCategory,
      goals: goalsWithProgress,
      debts,
      debtSummary: {
        totalDebt: debtTotals.debt,
        minPayment: debtTotals.minPayment,
        debtCount: debts.length,
        avgInterest: debts.length > 0 
          ? debts.reduce((sum, d) => sum + (d.interestRate || 0), 0) / debts.length 
          : 0
      },
      accounts,
      accountSummary: {
        totalBalance,
        accountCount: accounts.length,
        netWorth,
      },
      fixedExpenses,
      cashFlow: (() => {
        const now = new Date()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const dayOfMonth = now.getDate()
        const daysRemaining = daysInMonth - dayOfMonth
        const thisMonthExpense = transactions
          .filter(t => {
            if (t.type !== 'expense') return false
            const d = new Date(t.date || '')
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          })
          .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

        // Separate savings/emergency allocations from spendable fixed expenses
        const savingsAllocation = fixedExpenses
          .filter(e => e.category === 'savings')
          .reduce((sum, e) => sum + (e.amount || 0), 0)
        // spendableFixed = fixed expenses excluding savings allocation
        // freeMoney from useFixedExpenses already deducts ALL fixed (including savings)
        // so add savingsAllocation back to get true spendable budget
        const spendableFixed = totalFixed - savingsAllocation
        const spendableFreeMoney = monthlySalary - spendableFixed

        const monthlyDebtPayment = debts.reduce((sum, d) => sum + (d.minPayment || 0), 0)

        const remainingFree = spendableFreeMoney - thisMonthExpense
        const dailyBudget = daysRemaining > 0 ? Math.floor(remainingFree / daysRemaining) : 0

        // Purpose-based balance separation
        // savings: purpose==='savings' or (no purpose + type in savings/fixed_deposit) — backward compat
        const savingsBalance = accounts
          .filter(a => a.purpose
            ? a.purpose === 'savings'
            : ['savings', 'fixed_deposit'].includes(a.type))
          .reduce((sum, a) => sum + (a.balance || 0), 0)
        // emergency: purpose==='emergency' only (explicit tag required)
        const emergencyBalance = accounts
          .filter(a => a.purpose === 'emergency')
          .reduce((sum, a) => sum + (a.balance || 0), 0)
        // protected = savings + emergency
        const protectedBalance = savingsBalance + emergencyBalance

        // DTI = spendable fixed (excluding savings) / salary
        const dti = monthlySalary > 0 ? (spendableFixed / monthlySalary) * 100 : 0
        const avgDailyExpense = dayOfMonth > 0 ? thisMonthExpense / dayOfMonth : 0
        const emergencyMonths = (avgDailyExpense * 30 + monthlyDebtPayment) > 0
          ? protectedBalance / (avgDailyExpense * 30 + monthlyDebtPayment) : 0

        // Tiered spending model
        // Tier 1: within spendableFreeMoney → safe
        // Tier 2: over spendableFreeMoney, drawing from savings → drawing_savings
        // Tier 3: savings exhausted, drawing from emergency → drawing_emergency
        // Tier 4: exceeds entire income → critical
        const overSpend = Math.max(0, thisMonthExpense - spendableFreeMoney)
        const drawFromSavings = Math.min(overSpend, savingsBalance)
        const drawFromEmergency = Math.max(0, overSpend - savingsBalance)
        let spendingTier = 'safe'
        if (thisMonthExpense > monthlySalary) spendingTier = 'critical'
        else if (drawFromEmergency > 0) spendingTier = 'drawing_emergency'
        else if (drawFromSavings > 0) spendingTier = 'drawing_savings'

        // Net asset position: total assets minus monthly debt commitment
        const netAfterDebt = totalBalance - monthlyDebtPayment

        return {
          monthlySalary, totalFixed, spendableFixed, savingsAllocation,
          freeMoney: spendableFreeMoney,
          thisMonthExpense, remainingFree, dailyBudget, daysRemaining,
          dti, emergencyMonths, monthlyDebtPayment,
          savingsBalance, emergencyBalance, protectedBalance,
          overSpend, drawFromSavings, drawFromEmergency, spendingTier,
          netAfterDebt,
          hasSalary: monthlySalary > 0,
        }
      })(),
      recentTransactions,
      stats: {
        totalTransactions: transactions.length,
        activeGoals: goals.filter(g => g.currentAmount < g.targetAmount).length,
        completedGoals: goals.filter(g => g.currentAmount >= g.targetAmount).length,
        hasDebts: debts.length > 0,
        hasGoals: goals.length > 0
      }
    }
  }, [user, transactions, goals, debts, accounts, totals, byCategory, debtTotals, totalBalance, fixedExpenses, monthlySalary, totalFixed, freeMoney])

  const loading = transactionsLoading || goalsLoading || debtsLoading || accountsLoading || fixedLoading

  const value = {
    ...financeContext,
    loading,
    isAuthenticated: !!user
  }

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider')
  }
  return context
}

export default FinanceContext
