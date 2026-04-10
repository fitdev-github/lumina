import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UtensilsCrossed, Car, Receipt, ShoppingBag, Zap, Heart,
  Briefcase, Gift, Home, MoreHorizontal,
  Check, Loader2, ChevronDown, ChevronUp,
  Wallet, Building2, PiggyBank, CreditCard, Banknote
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import TopBar from '@/components/TopBar'
import { useTransactions, useAccounts } from '@/hooks'

const accountTypeIcon = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  investment: Building2,
  cash: Banknote,
}

const purposeColor = {
  emergency: 'text-error',
  savings: 'text-secondary',
  general: 'text-text-secondary',
}

const expenseCategories = [
  { id: 'food', icon: UtensilsCrossed, label: 'อาหาร', color: 'bg-warning-50 text-warning border-warning/30' },
  { id: 'transport', icon: Car, label: 'เดินทาง', color: 'bg-primary-50 text-primary border-primary/30' },
  { id: 'shopping', icon: ShoppingBag, label: 'ช้อปปิ้ง', color: 'bg-pink-50 text-pink-500 border-pink-200' },
  { id: 'bills', icon: Receipt, label: 'บิล', color: 'bg-accent-50 text-accent border-accent/30' },
  { id: 'utilities', icon: Zap, label: 'สาธารณูปโภค', color: 'bg-secondary-50 text-secondary border-secondary/30' },
  { id: 'health', icon: Heart, label: 'สุขภาพ', color: 'bg-red-50 text-red-500 border-red-200' },
  { id: 'home', icon: Home, label: 'บ้าน', color: 'bg-orange-50 text-orange-500 border-orange-200' },
  { id: 'other', icon: MoreHorizontal, label: 'อื่นๆ', color: 'bg-surface-100 text-text-secondary border-border' },
]

const incomeCategories = [
  { id: 'salary', icon: Briefcase, label: 'เงินเดือน', color: 'bg-secondary-50 text-secondary border-secondary/30' },
  { id: 'freelance', icon: Zap, label: 'ฟรีแลนซ์', color: 'bg-primary-50 text-primary border-primary/30' },
  { id: 'bonus', icon: Gift, label: 'โบนัส', color: 'bg-accent-50 text-accent border-accent/30' },
  { id: 'investment', icon: Receipt, label: 'ลงทุน', color: 'bg-warning-50 text-warning border-warning/30' },
  { id: 'other', icon: MoreHorizontal, label: 'อื่นๆ', color: 'bg-surface-100 text-text-secondary border-border' },
]

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000]

export default function AddTransaction() {
  const navigate = useNavigate()
  const { addTransaction } = useTransactions()
  const { accounts, updateAccount } = useAccounts()
  const amountRef = useRef(null)

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('food')
  const [note, setNote] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [accountId, setAccountId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const categories = type === 'expense' ? expenseCategories : incomeCategories

  // เมื่อเปลี่ยน type ให้ reset category เป็น default
  useEffect(() => {
    setCategory(type === 'expense' ? 'food' : 'salary')
  }, [type])

  // focus amount เมื่อโหลดหน้า
  useEffect(() => {
    setTimeout(() => amountRef.current?.focus(), 100)
  }, [])

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setSubmitting(true)
    try {
      const amt = parseFloat(amount)
      await addTransaction({
        type,
        category,
        amount: amt,
        note: note.trim(),
        date: new Date().toISOString(),
        accountId: accountId || null,
      })
      if (accountId) {
        const acc = accounts.find(a => a.id === accountId)
        if (acc) {
          const newBalance = type === 'expense'
            ? (acc.balance || 0) - amt
            : (acc.balance || 0) + amt
          await updateAccount(accountId, { balance: newBalance })
        }
      }
      setDone(true)
      setTimeout(() => navigate('/'), 700)
    } catch (err) {
      console.error(err)
      setSubmitting(false)
    }
  }

  const isExpense = type === 'expense'
  const selectedCat = categories.find(c => c.id === category)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar title="เพิ่มรายการ" onClose={() => navigate(-1)} back={true} showProfile={false} />

      <main className="flex-1 max-w-lg mx-auto w-full px-5 page-top pb-28 flex flex-col">

        {/* Type Toggle */}
        <div className="flex rounded-2xl bg-surface-100 p-1 mb-6 mt-4">
          <button
            onClick={() => setType('expense')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              isExpense
                ? 'bg-white shadow text-error'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            − รายจ่าย
          </button>
          <button
            onClick={() => setType('income')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              !isExpense
                ? 'bg-white shadow text-secondary'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            + รายรับ
          </button>
        </div>

        {/* Amount Input */}
        <div className="text-center mb-6">
          <p className="text-xs text-text-tertiary mb-2 uppercase tracking-widest">จำนวนเงิน</p>
          <div className="flex items-center justify-center gap-1">
            <span className={`text-5xl font-headline font-black ${isExpense ? 'text-error' : 'text-secondary'}`}>
              ฿
            </span>
            <input
              ref={amountRef}
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="0"
              className="w-48 bg-transparent border-none text-center text-5xl font-headline font-black focus:ring-0 outline-none placeholder:text-surface-200 text-text-primary tracking-tight"
            />
          </div>

          {/* Quick amounts */}
          <div className="flex justify-center gap-2 mt-3 flex-wrap">
            {QUICK_AMOUNTS.map(v => (
              <button
                key={v}
                onClick={() => setAmount(v.toString())}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  amount === v.toString()
                    ? isExpense
                      ? 'bg-error text-white border-error'
                      : 'bg-secondary text-white border-secondary'
                    : 'bg-white text-text-secondary border-border hover:border-primary/30'
                }`}
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="mb-5">
          <p className="text-xs text-text-tertiary mb-3 uppercase tracking-widest">หมวดหมู่</p>
          <div className="flex flex-wrap gap-2">
            {categories.map(({ id, icon: Icon, label, color }) => (
              <button
                key={id}
                onClick={() => setCategory(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                  category === id
                    ? color + ' shadow-sm scale-[1.04]'
                    : 'bg-white text-text-tertiary border-border hover:border-primary/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Account selector */}
        {accounts.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-text-tertiary mb-3 uppercase tracking-widest">
              {isExpense ? 'ตัดจากบัญชี' : 'เข้าบัญชี'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {/* ไม่ระบุ option */}
              <button
                onClick={() => setAccountId(null)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  accountId === null
                    ? 'bg-surface-200 border-border text-text-primary shadow-sm'
                    : 'bg-white border-border text-text-tertiary hover:border-primary/20'
                }`}
              >
                ไม่ระบุ
              </button>
              {accounts.map(acc => {
                const Icon = accountTypeIcon[acc.type] || Wallet
                const selected = accountId === acc.id
                const purposeCol = purposeColor[acc.purpose] || purposeColor.general
                return (
                  <button
                    key={acc.id}
                    onClick={() => setAccountId(selected ? null : acc.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      selected
                        ? isExpense
                          ? 'bg-error-50 border-error/40 text-error shadow-sm scale-[1.03]'
                          : 'bg-secondary-50 border-secondary/40 text-secondary shadow-sm scale-[1.03]'
                        : 'bg-white border-border text-text-secondary hover:border-primary/20'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${selected ? '' : purposeCol}`} />
                    <span className="max-w-[90px] truncate">{acc.name}</span>
                    <span className={`opacity-60 ${selected ? '' : 'text-text-tertiary'}`}>
                      ฿{(acc.balance || 0).toLocaleString()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Note (collapsible) */}
        <div className="mb-6">
          <button
            onClick={() => setShowNote(!showNote)}
            className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            {showNote ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {note ? `หมายเหตุ: ${note}` : 'เพิ่มหมายเหตุ (ไม่บังคับ)'}
          </button>
          {showNote && (
            <input
              autoFocus
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="เช่น ข้าวกลางวันกับเพื่อน"
              className="mt-2 w-full px-4 py-2.5 rounded-xl border border-border bg-surface-50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          )}
        </div>

        {/* วันที่ */}
        <p className="text-xs text-text-tertiary text-center mb-6">
          {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

      </main>

      {/* Submit — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pt-3 bg-white border-t border-surface-100" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={!amount || parseFloat(amount) <= 0 || submitting || done}
            className={`w-full h-14 text-base font-bold rounded-2xl border-0 transition-all ${
              done
                ? 'bg-secondary'
                : isExpense
                  ? 'bg-error hover:bg-error-600 shadow-lg shadow-error/25'
                  : 'bg-secondary hover:bg-secondary-600 shadow-lg shadow-secondary/25'
            } disabled:opacity-40`}
          >
            {done ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                บันทึกแล้ว!
              </>
            ) : submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isExpense ? '− บันทึกรายจ่าย' : '+ บันทึกรายรับ'}
                {amount && parseFloat(amount) > 0 && (
                  <span className="ml-2 opacity-80">฿{parseFloat(amount).toLocaleString()}</span>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
