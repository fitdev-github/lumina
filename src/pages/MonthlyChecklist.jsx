import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check, X, Loader2, Wallet, PiggyBank, Car, Home,
  Shield, Tv, Zap, CreditCard, DollarSign, Banknote,
  TrendingUp, Building2, BarChart3, ChevronRight, RefreshCw,
  AlertCircle, CheckCircle2, Clock, ArrowDownCircle, ArrowUpCircle,
  ToggleLeft, ToggleRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import Toast, { useToast } from '@/components/Toast'
import { useMonthlyChecklist } from '@/hooks'
import { useAccounts } from '@/hooks'

const CATEGORY_ICONS = {
  salary: Wallet,
  savings: PiggyBank,
  car: Car,
  rent: Home,
  insurance: Shield,
  subscription: Tv,
  utility: Zap,
  loan: CreditCard,
  other: DollarSign,
}

const CATEGORY_COLORS = {
  salary: 'from-secondary to-teal-400',
  savings: 'from-secondary to-teal-400',
  car: 'from-primary to-accent',
  rent: 'from-blue-400 to-blue-600',
  insurance: 'from-accent to-purple-400',
  subscription: 'from-pink-400 to-pink-500',
  utility: 'from-yellow-400 to-yellow-500',
  loan: 'from-error to-pink-400',
  other: 'from-slate-400 to-slate-500',
}

const ACCOUNT_TYPE_ICONS = {
  checking: Wallet,
  savings: PiggyBank,
  investment: TrendingUp,
  fixed_deposit: Building2,
  cash: Banknote,
  other: BarChart3,
}

const thMonths = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

export default function MonthlyChecklist() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()
  const { items, loading, doneCount, totalCount, currentMonth, checkItem, uncheckItem } = useMonthlyChecklist()
  const { accounts, updateAccount } = useAccounts()

  const [confirmItem, setConfirmItem] = useState(null) // item being confirmed
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [updateBalance, setUpdateBalance] = useState(true)

  // Parse month label
  const [year, mon] = currentMonth.split('-')
  const monthLabel = `${thMonths[parseInt(mon) - 1]} ${parseInt(year) + 543}`

  const today = new Date().getDate()

  const openConfirm = (item) => {
    if (item.status === 'done') {
      uncheckItem(item.id)
      showToast('ยกเลิกการทำเครื่องหมายแล้ว')
      return
    }
    if (!updateBalance) {
      // Mark done immediately without touching balances
      checkItem(item.id, { accountId: null })
      showToast(`✓ ${item.name} — บันทึกแล้ว`)
      return
    }
    setConfirmItem(item)
    setSelectedAccountId(accounts[0]?.id || '')
  }

  const handleConfirm = async () => {
    if (!confirmItem) return
    setSubmitting(true)
    try {
      const account = accounts.find(a => a.id === selectedAccountId)
      if (account && selectedAccountId) {
        const delta = confirmItem.type === 'income' || confirmItem.type === 'savings'
          ? confirmItem.amount
          : -confirmItem.amount
        await updateAccount(account.id, { balance: (account.balance || 0) + delta })
      }
      await checkItem(confirmItem.id, { accountId: selectedAccountId || null })
      setConfirmItem(null)
      showToast(`✓ ${confirmItem.name} — บันทึกแล้ว`)
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const income = items.filter(i => i.type === 'income')
  const savings = items.filter(i => i.type === 'savings')
  const expenses = items.filter(i => i.type === 'expense')

  const totalIncome = income.reduce((s, i) => s + (i.amount || 0), 0)
  const totalExpenses = expenses.reduce((s, i) => s + (i.amount || 0), 0)
  const totalSavings = savings.reduce((s, i) => s + (i.amount || 0), 0)
  const pct = totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0

  const ItemRow = ({ item }) => {
    const Icon = CATEGORY_ICONS[item.category] || DollarSign
    const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
    const done = item.status === 'done'
    const isOverdue = !done && item.dueDay < today && item.type !== 'income'
    const isDueToday = !done && item.dueDay === today

    return (
      <button
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
          done ? 'bg-surface-50 opacity-60' : 'bg-white hover:bg-surface-50 active:scale-[0.99]'
        }`}
        onClick={() => openConfirm(item)}
      >
        {/* Checkbox */}
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          done ? 'bg-secondary border-secondary' : 'border-border'
        }`}>
          {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </div>

        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 text-left min-w-0">
          <p className={`text-sm font-semibold ${done ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
            {item.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {item.dueDay && (
              <span className={`text-xs ${
                isOverdue ? 'text-error font-medium' :
                isDueToday ? 'text-warning font-medium' :
                'text-text-tertiary'
              }`}>
                {item.type === 'income' ? 'รับวันที่' : 'วันที่'} {item.dueDay}
                {isOverdue && ' · เลยกำหนด'}
                {isDueToday && ' · วันนี้'}
              </span>
            )}
            {done && item.accountId && (() => {
              const acc = accounts.find(a => a.id === item.accountId)
              return acc ? <span className="text-xs text-text-tertiary">· {acc.name}</span> : null
            })()}
          </div>
        </div>

        {/* Amount */}
        <p className={`text-sm font-bold shrink-0 ${
          item.type === 'income' ? 'text-secondary' :
          item.type === 'savings' ? 'text-secondary' :
          'text-error'
        }`}>
          {item.type === 'income' || item.type === 'savings' ? '+' : '-'}฿{(item.amount || 0).toLocaleString()}
        </p>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title={`รายการเดือน ${monthLabel}`} onClose={() => navigate(-1)} back={true} showProfile={false} />

      <main className="max-w-lg mx-auto px-5 pt-24 pb-32 space-y-5">

        {/* Progress hero */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">ความคืบหน้า</p>
                <p className="text-3xl font-headline font-extrabold text-text-primary">
                  {doneCount}<span className="text-lg text-text-tertiary font-normal">/{totalCount} รายการ</span>
                </p>
              </div>
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle cx="32" cy="32" r="26" fill="none" stroke="url(#pg)" strokeWidth="8"
                    strokeDasharray={`${pct * 1.633} 163.3`} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-text-primary">{pct}%</span>
              </div>
            </div>

            <Progress value={pct} className="h-2 mb-3" indicatorClassName="bg-gradient-to-r from-secondary to-teal-400" />

            {/* Balance update toggle */}
            <button
              onClick={() => setUpdateBalance(v => !v)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl mb-3 transition-colors ${
                updateBalance ? 'bg-primary-50' : 'bg-surface-100'
              }`}
            >
              <span className="text-xs font-medium text-text-secondary">อัปเดตยอดบัญชีอัตโนมัติ</span>
              {updateBalance
                ? <ToggleRight className="w-5 h-5 text-primary" />
                : <ToggleLeft className="w-5 h-5 text-text-tertiary" />
              }
            </button>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-secondary-50 rounded-xl p-2.5">
                <p className="text-[10px] text-text-tertiary mb-0.5">รายรับ</p>
                <p className="text-sm font-bold text-secondary">฿{totalIncome.toLocaleString()}</p>
              </div>
              <div className="bg-surface-100 rounded-xl p-2.5">
                <p className="text-[10px] text-text-tertiary mb-0.5">ออมเงิน</p>
                <p className="text-sm font-bold text-teal-600">฿{totalSavings.toLocaleString()}</p>
              </div>
              <div className="bg-error-50 rounded-xl p-2.5">
                <p className="text-[10px] text-text-tertiary mb-0.5">รายจ่าย</p>
                <p className="text-sm font-bold text-error">฿{totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income section */}
        {income.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <ArrowDownCircle className="w-4 h-4 text-secondary" />
              <h2 className="text-sm font-bold text-text-primary">รายรับ</h2>
            </div>
            <Card>
              <CardContent className="p-2 space-y-1">
                {income.map(item => <ItemRow key={item.id} item={item} />)}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Savings section */}
        {savings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <PiggyBank className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold text-text-primary">ออมเงิน</h2>
            </div>
            <Card>
              <CardContent className="p-2 space-y-1">
                {savings.map(item => <ItemRow key={item.id} item={item} />)}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Expenses section */}
        {expenses.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-1">
              <ArrowUpCircle className="w-4 h-4 text-error" />
              <h2 className="text-sm font-bold text-text-primary">รายจ่ายคงที่</h2>
            </div>
            <Card>
              <CardContent className="p-2 space-y-1">
                {[...expenses]
                  .sort((a, b) => {
                    // Overdue first, then by dueDay
                    const aOver = a.status !== 'done' && a.dueDay < today
                    const bOver = b.status !== 'done' && b.dueDay < today
                    if (aOver && !bOver) return -1
                    if (!aOver && bOver) return 1
                    return a.dueDay - b.dueDay
                  })
                  .map(item => <ItemRow key={item.id} item={item} />)}
              </CardContent>
            </Card>
          </div>
        )}

        {totalCount === 0 && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="font-semibold text-text-primary mb-1">ยังไม่มีรายการ</p>
              <p className="text-sm text-text-tertiary">ตั้งเงินเดือนและรายจ่ายประจำก่อนนะครับ</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/fixed-expenses')}>
                ไปตั้งค่า <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}

      </main>
      <BottomNav />
      <Toast toast={toast} onHide={hideToast} />

      {/* Confirm Dialog */}
      <Dialog open={!!confirmItem} onOpenChange={() => setConfirmItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {confirmItem?.type === 'income' ? 'รับเงินเดือนแล้ว' :
               confirmItem?.type === 'savings' ? 'โอนเงินออมแล้ว' :
               'ชำระเรียบร้อย'}
            </DialogTitle>
            <DialogDescription>
              {confirmItem?.name} · ฿{(confirmItem?.amount || 0).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {confirmItem && (
            <div className="space-y-4 mt-2">
              {accounts.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-text-primary mb-2">
                    {confirmItem.type === 'income' ? 'เข้าบัญชีไหน?' :
                     confirmItem.type === 'savings' ? 'โอนเข้าบัญชีไหน?' :
                     'หักจากบัญชีไหน?'}
                  </p>
                  <div className="space-y-2">
                    {accounts.map(acc => {
                      const Icon = ACCOUNT_TYPE_ICONS[acc.type] || Wallet
                      return (
                        <button
                          key={acc.id}
                          onClick={() => setSelectedAccountId(acc.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            selectedAccountId === acc.id
                              ? 'border-primary bg-primary-50'
                              : 'border-transparent bg-surface-100 hover:border-primary/30'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${selectedAccountId === acc.id ? 'text-primary' : 'text-text-secondary'}`} />
                          <span className="flex-1 text-left text-sm font-medium text-text-primary">{acc.name}</span>
                          <span className="text-xs text-text-tertiary">฿{(acc.balance || 0).toLocaleString()}</span>
                          {selectedAccountId === acc.id && (
                            <span className={`text-xs font-bold ${
                              confirmItem.type === 'income' || confirmItem.type === 'savings'
                                ? 'text-secondary' : 'text-error'
                            }`}>
                              → ฿{(
                                (acc.balance || 0) +
                                (confirmItem.type === 'income' || confirmItem.type === 'savings'
                                  ? confirmItem.amount
                                  : -confirmItem.amount)
                              ).toLocaleString()}
                            </span>
                          )}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setSelectedAccountId('')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        selectedAccountId === ''
                          ? 'border-primary bg-primary-50'
                          : 'border-transparent bg-surface-100 hover:border-primary/30'
                      }`}
                    >
                      <X className="w-4 h-4 text-text-tertiary" />
                      <span className="text-sm text-text-tertiary">ไม่อัปเดตยอดบัญชี</span>
                    </button>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleConfirm}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {submitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
