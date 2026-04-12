import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet, PiggyBank, Building2, Banknote, CreditCard, Home, Car,
  TrendingUp, TrendingDown, Plus, Pencil, Trash2, Check,
  Loader2, BarChart3, ChevronDown, ChevronUp, X, ChevronRight,
  Shield, Zap, AlertTriangle, Sparkles, CalendarDays, Users, Clock,
  Target, PiggyBank as PiggyBankIcon, Bell, Flag, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import Toast, { useToast } from '@/components/Toast'
import { useAccounts, useDebts, useLentMoney, useCryptoPortfolio, useGoals, useMonthlyChecklist } from '@/hooks'
import { useFinance } from '@/contexts/FinanceContext'
import { useAuth } from '@/contexts/AuthContext'

const accountTypes = [
  { id: 'checking', icon: Wallet, label: 'บัญชีกระแส', color: 'from-primary to-primary-600', bg: 'bg-primary-50 text-primary' },
  { id: 'savings', icon: PiggyBank, label: 'เงินออม', color: 'from-secondary to-teal-400', bg: 'bg-secondary-50 text-secondary' },
  { id: 'investment', icon: TrendingUp, label: 'การลงทุน', color: 'from-accent to-accent-600', bg: 'bg-accent-50 text-accent' },
  { id: 'fixed_deposit', icon: Building2, label: 'ฝากประจำ', color: 'from-purple-400 to-purple-600', bg: 'bg-purple-50 text-purple-500' },
  { id: 'cash', icon: Banknote, label: 'เงินสด', color: 'from-warning to-warning-600', bg: 'bg-warning-50 text-warning' },
  { id: 'other', icon: BarChart3, label: 'อื่นๆ', color: 'from-slate-400 to-slate-500', bg: 'bg-slate-100 text-slate-500' },
]

const debtTypeIcons = {
  credit_card: CreditCard,
  home: Home,
  car: Car,
  education: Building2,
  other: Banknote,
}

function AccountIcon({ type }) {
  const t = accountTypes.find(a => a.id === type) || accountTypes[5]
  const Icon = t.icon
  return (
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shrink-0 shadow-md`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
  )
}

function EmergencyBadge({ months }) {
  if (months >= 6) return <Badge variant="success" className="text-xs">ดีมาก ✓</Badge>
  if (months >= 3) return <Badge variant="warning" className="text-xs">พอใช้</Badge>
  return <Badge variant="error" className="text-xs">ควรเพิ่ม</Badge>
}

function DtiBadge({ dti }) {
  if (dti <= 20) return <Badge variant="success" className="text-xs">ดีมาก</Badge>
  if (dti <= 36) return <Badge variant="warning" className="text-xs">ปกติ</Badge>
  return <Badge variant="error" className="text-xs">สูงเกินไป</Badge>
}

export default function FinancialStatus() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { cashFlow, fixedExpenses } = useFinance()
  const { accounts, loading: accountsLoading, addAccount, updateAccount, deleteAccount, totalBalance } = useAccounts()
  const { debts, loading: debtsLoading, totals: debtTotals } = useDebts()
  const { pending: lentPending, paid: lentPaid, totalPending: lentTotal, loading: lentLoading, addItem: addLent, updateItem: updateLent, removeItem: removeLent } = useLentMoney()
  const { totalValue: cryptoTotal, loading: cryptoLoading, priceLoading: cryptoPriceLoading, totalPnl: cryptoPnl } = useCryptoPortfolio()
  const { goals, loading: goalsLoading, addToGoal } = useGoals()
  const { items: checklistItems } = useMonthlyChecklist()
  const { toast, showToast, hideToast } = useToast()

  // Emergency fund target — stored as months (min 3, default 6)
  const EMERGENCY_KEY = user ? `lumina_emergency_months_${user.uid}` : null
  const [emergencyMonthsTarget, setEmergencyMonthsTarget] = useState(6)

  useEffect(() => {
    if (!EMERGENCY_KEY) return
    const raw = localStorage.getItem(EMERGENCY_KEY)
    const val = raw ? parseInt(raw, 10) : 6
    setEmergencyMonthsTarget(Math.max(3, val))
  }, [EMERGENCY_KEY])

  const adjustEmergencyMonths = (delta) => {
    setEmergencyMonthsTarget(prev => {
      const next = Math.max(3, prev + delta)
      if (EMERGENCY_KEY) localStorage.setItem(EMERGENCY_KEY, next.toString())
      return next
    })
  }

  // Open savings allocate dialog with smart suggestions
  const openAllocateDialog = () => {
    const savingsAmt = cf.savingsAllocation || 0
    const activeGoals = goals.filter(g => (g.currentAmount || 0) < (g.targetAmount || 0))
    if (activeGoals.length === 0) { setAllocations({}); setShowAllocateDialog(true); return }
    // Auto-suggest: proportional to remaining amount
    const totalRemaining = activeGoals.reduce((s, g) => s + Math.max((g.targetAmount || 0) - (g.currentAmount || 0), 0), 0)
    const suggested = {}
    activeGoals.forEach(g => {
      const remaining = Math.max((g.targetAmount || 0) - (g.currentAmount || 0), 0)
      const share = totalRemaining > 0 ? Math.floor((remaining / totalRemaining) * savingsAmt) : 0
      suggested[g.id] = share
    })
    setAllocations(suggested)
    setShowAllocateDialog(true)
  }

  const handleAllocate = async () => {
    setAllocating(true)
    try {
      const entries = Object.entries(allocations).filter(([, amt]) => parseFloat(amt) > 0)
      await Promise.all(entries.map(([id, amt]) => addToGoal(id, parseFloat(amt))))
      setShowAllocateDialog(false)
      showToast(`จัดสรรเงินออมเข้า ${entries.length} เป้าหมายสำเร็จ!`)
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setAllocating(false)
    }
  }


  const [showAccountDialog, setShowAccountDialog] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [expandDebts, setExpandDebts] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // Lent money state
  const [showLentDialog, setShowLentDialog] = useState(false)
  const [editingLent, setEditingLent] = useState(null)
  const [lentSubmitting, setLentSubmitting] = useState(false)
  const [confirmDeleteLentId, setConfirmDeleteLentId] = useState(null)
  const [expandLentPaid, setExpandLentPaid] = useState(false)
  const [lentForm, setLentForm] = useState({ friendName: '', amount: '', description: '', lentDate: '', dueDate: '', accountId: null })
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [paymentItem, setPaymentItem] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentSubmitting, setPaymentSubmitting] = useState(false)

  const [form, setForm] = useState({
    type: 'checking', name: '', balance: '', note: '', purpose: 'general',
  })

  // Savings allocation state
  const [showAllocateDialog, setShowAllocateDialog] = useState(false)
  const [allocations, setAllocations] = useState({}) // { [goalId]: amount }
  const [allocating, setAllocating] = useState(false)

  const loading = accountsLoading || debtsLoading || lentLoading || cryptoLoading || goalsLoading
  const totalDebt = debtTotals.debt || 0
  const cf = cashFlow || {}

  const openAdd = () => {
    setEditingAccount(null)
    setForm({ type: 'checking', name: '', balance: '', note: '', purpose: 'general' })
    setShowAccountDialog(true)
  }

  const openEdit = (account) => {
    setEditingAccount(account)
    setForm({
      type: account.type || 'checking',
      name: account.name || '',
      balance: account.balance?.toString() || '',
      note: account.note || '',
      purpose: account.purpose || 'general',
    })
    setShowAccountDialog(true)
  }

  const handleSubmit = async () => {
    if (!form.name || !form.balance) return
    setSubmitting(true)
    try {
      const data = { type: form.type, name: form.name, balance: parseFloat(form.balance), note: form.note, purpose: form.purpose }
      if (editingAccount) {
        await updateAccount(editingAccount.id, data)
      } else {
        await addAccount(data)
      }
      setShowAccountDialog(false)
      showToast(editingAccount ? 'อัปเดตบัญชีสำเร็จ!' : 'เพิ่มบัญชีสำเร็จ!')
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteAccount(id)
      setConfirmDeleteId(null)
      showToast('ลบบัญชีสำเร็จ')
    } catch {
      showToast('ลบบัญชีไม่สำเร็จ', 'error')
    }
  }

  const openAddLent = () => {
    setEditingLent(null)
    setLentForm({ friendName: '', amount: '', description: '', lentDate: new Date().toISOString().split('T')[0], dueDate: '', accountId: null })
    setShowLentDialog(true)
  }

  const openEditLent = (item) => {
    setEditingLent(item)
    setLentForm({
      friendName: item.friendName || '',
      amount: item.amount?.toString() || '',
      description: item.description || '',
      lentDate: item.lentDate || '',
      dueDate: item.dueDate || '',
      accountId: item.accountId || null,
    })
    setShowLentDialog(true)
  }

  const handleLentSubmit = async () => {
    if (!lentForm.friendName || !lentForm.amount) return
    setLentSubmitting(true)
    try {
      const amt = parseFloat(lentForm.amount)
      const data = {
        friendName: lentForm.friendName,
        amount: amt,
        description: lentForm.description,
        lentDate: lentForm.lentDate,
        dueDate: lentForm.dueDate,
        accountId: lentForm.accountId || null,
        status: editingLent ? editingLent.status : 'pending',
      }
      if (editingLent) {
        // Reverse old account deduction, apply new one
        const oldAcc = editingLent.accountId ? accounts.find(a => a.id === editingLent.accountId) : null
        const newAcc = lentForm.accountId ? accounts.find(a => a.id === lentForm.accountId) : null
        await updateLent(editingLent.id, data)
        if (oldAcc && oldAcc.id !== lentForm.accountId) {
          // Refund old account
          await updateAccount(oldAcc.id, { balance: (oldAcc.balance || 0) + (editingLent.amount || 0) })
        }
        if (newAcc) {
          const refund = (oldAcc?.id === newAcc.id) ? (editingLent.amount || 0) : 0
          await updateAccount(newAcc.id, { balance: (newAcc.balance || 0) + refund - amt })
        }
        showToast('อัปเดตสำเร็จ!')
      } else {
        await addLent(data)
        if (lentForm.accountId) {
          const acc = accounts.find(a => a.id === lentForm.accountId)
          if (acc) await updateAccount(acc.id, { balance: (acc.balance || 0) - amt })
        }
        showToast('บันทึกเรียบร้อย!')
      }
      setShowLentDialog(false)
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setLentSubmitting(false)
    }
  }

  const openPaymentDialog = (item) => {
    setPaymentItem(item)
    setPaymentAmount('')
    setShowPaymentDialog(true)
  }

  const handleReceivePayment = async () => {
    if (!paymentItem || !paymentAmount) return
    const received = parseFloat(paymentAmount)
    if (isNaN(received) || received <= 0) return
    setPaymentSubmitting(true)
    try {
      const newPaid = (paymentItem.paidAmount || 0) + received
      const remaining = (paymentItem.amount || 0) - newPaid
      const newStatus = remaining <= 0 ? 'paid' : 'pending'
      await updateLent(paymentItem.id, {
        ...paymentItem,
        paidAmount: newPaid,
        status: newStatus,
      })
      setShowPaymentDialog(false)
      if (newStatus === 'paid') {
        showToast('ได้รับเงินคืนครบแล้ว!')
      } else {
        showToast(`รับ ฿${received.toLocaleString()} · ค้างอีก ฿${Math.max(remaining, 0).toLocaleString()}`)
      }
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setPaymentSubmitting(false)
    }
  }

  const handleDeleteLent = async (id) => {
    try {
      await removeLent(id)
      setConfirmDeleteLentId(null)
      showToast('ลบแล้ว')
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    }
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
      <TopBar title="สถานะการเงิน" onClose={() => navigate(-1)} back={true} showProfile={false} />
      <main className="max-w-lg mx-auto px-5 page-top pb-32 space-y-5">

        {/* Financial Summary Hero */}
        {(() => {
          const totalAssets = totalBalance + cryptoTotal + lentTotal
          const netAfterDebt = totalAssets - (cf.monthlyDebtPayment || 0)

          return (
            <Card className="overflow-hidden border-0 shadow-xl">
              {/* Assets section */}
              <div className="bg-gradient-to-br from-primary via-accent to-secondary p-5 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-white/70 uppercase tracking-wider">สินทรัพย์รวม</p>
                  {cryptoPriceLoading && <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded-full">กำลังอัปเดต</span>}
                </div>
                <p className="text-3xl font-headline font-extrabold mb-4 text-white">
                  ฿{totalAssets.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                      <span className="text-xs text-white/80">บัญชีทั้งหมด</span>
                    </div>
                    <span className="text-sm font-semibold text-white">฿{totalBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-300/80" />
                      <span className="text-xs text-white/80 flex items-center gap-1">
                        คริปโต
                        {cryptoPriceLoading && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-white">฿{cryptoTotal.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                  </div>
                  {lentTotal > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                        <span className="text-xs text-white/80">ลูกหนี้ (รอรับคืน)</span>
                      </div>
                      <span className="text-sm font-semibold text-white">฿{lentTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {(cf.monthlyDebtPayment || 0) > 0 && (
                    <>
                      <div className="flex items-center justify-between opacity-60">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-300" />
                          <span className="text-xs text-white/80">ผ่อนหนี้/เดือน</span>
                        </div>
                        <span className="text-sm font-semibold text-white">-฿{(cf.monthlyDebtPayment || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-white/20 pt-1.5">
                        <span className="text-xs text-white/90 font-medium">สุทธิหลังผ่อน</span>
                        <span className="text-sm font-bold text-white">฿{netAfterDebt.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>


              {/* Free money strip */}
              {cf.hasSalary && (
                <div className="bg-white px-5 py-3 flex items-center justify-between border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${(cf.remainingFree || 0) >= 0 ? 'bg-secondary' : 'bg-error'}`} />
                    <span className="text-xs text-text-tertiary">ยอดเงินที่ใช้ได้เดือนนี้</span>
                  </div>
                  <span className={`text-sm font-bold ${(cf.remainingFree || 0) >= 0 ? 'text-secondary' : 'text-error'}`}>
                    ฿{(cf.remainingFree || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </Card>
          )
        })()}

        {/* Setup prompt if no salary */}
        {!cf.hasSalary && (
          <Card
            className="border-dashed border-2 border-primary/30 bg-primary-50/30 cursor-pointer"
            onClick={() => navigate('/fixed-expenses')}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text-primary">ตั้งค่าเงินเดือนและรายจ่ายประจำ</p>
                <p className="text-xs text-text-tertiary mt-0.5">เพื่อให้ลูมิน่าคำนวณงบต่อวันและแนะนำการออมได้</p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary" />
            </CardContent>
          </Card>
        )}

        {/* Smart Risk Alert */}
        {cf.hasSalary && cf.spendingTier !== 'safe' && (() => {
          const tierConfig = {
            drawing_savings: {
              bg: 'bg-warning-50 border-warning/30',
              icon: <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />,
              title: 'กำลังดึงเงินออมมาใช้',
              detail: `ใช้เกินงบ ฿${(cf.overSpend || 0).toLocaleString()} · ดึงจากเงินออม ฿${(cf.drawFromSavings || 0).toLocaleString()}`,
              risks: [
                'เงินออมที่ตั้งไว้ถูกใช้ไปก่อนกำหนด',
                'เป้าหมายการออมระยะยาวอาจล่าช้า',
              ],
              tips: [
                `ลดรายจ่ายผันแปร ฿${Math.ceil((cf.overSpend || 0) / Math.max(cf.daysRemaining || 1, 1)).toLocaleString()}/วันใน ${cf.daysRemaining} วันที่เหลือ`,
                'หารายได้เสริมเพื่อชดเชยส่วนที่ขาด',
                'ทบทวนรายจ่ายคงที่ว่าลดได้ไหม',
              ],
              color: 'text-warning',
            },
            drawing_emergency: {
              bg: 'bg-error-50 border-error/30',
              icon: <AlertTriangle className="w-5 h-5 text-error shrink-0 mt-0.5" />,
              title: 'กำลังใช้เงินฉุกเฉิน',
              detail: `ดึงเงินฉุกเฉิน ฿${(cf.drawFromEmergency || 0).toLocaleString()} · เงินออมหมดแล้ว`,
              risks: [
                'เงินสำรองฉุกเฉินลดลง หากเกิดเหตุไม่คาดฝันจะไม่มีเงินรองรับ',
                'วงจรหนี้อาจเกิดขึ้นหากยังใช้เกินต่อเนื่อง',
              ],
              tips: [
                'หยุดรายจ่ายที่ไม่จำเป็นทันที',
                `ต้องลดรายจ่ายวันละ ฿${Math.ceil((cf.overSpend || 0) / Math.max(cf.daysRemaining || 1, 1)).toLocaleString()} เพื่อหยุดดึงเงินฉุกเฉิน`,
                'วางแผนเติมทุนฉุกเฉินเดือนหน้าเป็นอันดับแรก',
              ],
              color: 'text-error',
            },
            critical: {
              bg: 'bg-red-50 border-red-300',
              icon: <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />,
              title: 'รายจ่ายเกินรายได้ทั้งหมด',
              detail: `ใช้เกิน ฿${(cf.overSpend || 0).toLocaleString()} · เกินเงินเดือน ${((cf.overSpend || 0) / (cf.monthlySalary || 1) * 100).toFixed(0)}%`,
              risks: [
                'หนี้สินอาจเพิ่มขึ้นเร็วมาก',
                'ทุนฉุกเฉินและเงินออมจะถูกใช้หมดในไม่ช้า',
              ],
              tips: [
                'ต้องตรวจสอบรายจ่ายทุกรายการทันที',
                'พิจารณายกเลิก subscription และรายจ่ายที่ไม่จำเป็น',
                'ปรึกษาแผนปรับโครงสร้างรายจ่ายกับ AI ผู้ช่วย',
              ],
              color: 'text-red-600',
            },
          }
          const cfg = tierConfig[cf.spendingTier]
          if (!cfg) return null
          return (
            <Card className={`border ${cfg.bg} overflow-hidden`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  {cfg.icon}
                  <div className="flex-1">
                    <p className={`font-bold text-sm ${cfg.color}`}>{cfg.title}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{cfg.detail}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-1.5">ความเสี่ยง</p>
                    <ul className="space-y-1">
                      {cfg.risks.map((r, i) => (
                        <li key={i} className="text-xs text-text-tertiary flex items-start gap-1.5">
                          <span className="text-error mt-0.5 shrink-0">•</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-secondary mb-1.5">คำแนะนำ</p>
                    <ul className="space-y-1">
                      {cfg.tips.map((t, i) => (
                        <li key={i} className="text-xs text-text-tertiary flex items-start gap-1.5">
                          <span className="text-secondary mt-0.5 shrink-0">→</span>{t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => navigate('/assistant')}
                    className={`w-full text-xs font-semibold py-2 rounded-xl border ${cfg.bg} ${cfg.color} hover:opacity-80 transition-opacity`}
                  >
                    ปรึกษา AI ผู้ช่วยเพิ่มเติม →
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {/* Cash Flow Card */}
        {cf.hasSalary && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-text-tertiary uppercase tracking-wider">กระแสเงินเดือนนี้</p>
                <button
                  onClick={() => navigate('/fixed-expenses')}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <Pencil className="w-3 h-3" />
                  จัดการรายจ่ายประจำ
                </button>
              </div>

              {/* Salary row */}
              <div className="space-y-2.5 mb-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-sm text-text-secondary">เงินเดือน</span>
                  </div>
                  <span className="font-semibold text-secondary">+฿{(cf.monthlySalary || 0).toLocaleString()}</span>
                </div>

                {/* Fixed expenses — non-savings only */}
                {fixedExpenses?.filter(e => e.category !== 'savings').map(e => (
                  <div key={e.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-error/60" />
                      <span className="text-sm text-text-tertiary">{e.name}</span>
                    </div>
                    <span className="text-sm text-error">-฿{(e.amount || 0).toLocaleString()}</span>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-2 border-t border-border-subtle">
                  <span className="text-sm font-medium text-text-secondary">ยอดเงินที่ใช้ได้</span>
                  <span className={`font-bold ${(cf.freeMoney || 0) >= 0 ? 'text-text-primary' : 'text-error'}`}>
                    ฿{(cf.freeMoney || 0).toLocaleString()}
                  </span>
                </div>

                {/* Savings allocation — shown separately, not deducted from free money */}
                {(cf.savingsAllocation || 0) > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-secondary" />
                      <span className="text-sm text-text-tertiary">ออมรายเดือน (แยก)</span>
                    </div>
                    <span className="text-sm text-secondary">฿{(cf.savingsAllocation || 0).toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <span className="text-sm text-text-secondary">ใช้ไปแล้ว (ผันแปร)</span>
                  </div>
                  <span className="text-sm text-warning">-฿{(cf.thisMonthExpense || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Remaining */}
              {(() => {
                const tier = cf.spendingTier
                const remaining = cf.remainingFree || 0
                const isSafe = tier === 'safe'
                const isDrawSavings = tier === 'drawing_savings'
                const isDrawEmergency = tier === 'drawing_emergency'
                const isCritical = tier === 'critical'
                return (
                  <div className={`rounded-2xl p-4 ${isSafe ? 'bg-secondary-50' : isDrawSavings ? 'bg-warning-50' : 'bg-error-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-text-secondary">
                        {isSafe ? 'คงเหลือ' : isDrawSavings ? 'เกินงบ — ดึงเงินออม' : isDrawEmergency ? 'วิกฤต — ดึงทุนฉุกเฉิน' : 'วิกฤต — เกินรายได้'}
                      </span>
                      <span className={`text-2xl font-headline font-extrabold ${isSafe ? 'text-secondary' : isDrawSavings ? 'text-warning' : 'text-error'}`}>
                        {isSafe ? '' : '-'}฿{Math.abs(remaining).toLocaleString()}
                      </span>
                    </div>
                    {isSafe && (cf.daysRemaining || 0) > 0 && remaining > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <CalendarDays className="w-4 h-4 text-text-tertiary" />
                        <span className="text-sm text-text-secondary">
                          งบต่อวัน <span className="font-bold text-text-primary">฿{(cf.dailyBudget || 0).toLocaleString()}</span>
                          <span className="text-text-tertiary"> (เหลือ {cf.daysRemaining} วัน)</span>
                        </span>
                      </div>
                    )}
                    {isDrawSavings && (
                      <p className="text-xs text-warning mt-1">
                        ดึงเงินออม ฿{(cf.drawFromSavings || 0).toLocaleString()} · คงเหลือ ฿{Math.max(0, (cf.savingsBalance || 0) - (cf.drawFromSavings || 0)).toLocaleString()}
                      </p>
                    )}
                    {isDrawEmergency && (
                      <p className="text-xs text-error mt-1">
                        ดึงทุนฉุกเฉิน ฿{(cf.drawFromEmergency || 0).toLocaleString()} · คงเหลือ ฿{Math.max(0, (cf.emergencyBalance || 0) - (cf.drawFromEmergency || 0)).toLocaleString()}
                      </p>
                    )}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        )}

        {/* Monthly Savings Card */}
        {cf.hasSalary && (() => {
          const savingsAmt = cf.savingsAllocation || 0
          const savingsPct = cf.monthlySalary > 0 ? (savingsAmt / cf.monthlySalary) * 100 : 0
          const recommended = Math.round((cf.monthlySalary || 0) * 0.2)
          const activeGoals = goals.filter(g => (g.currentAmount || 0) < (g.targetAmount || 0))

          return (
            <Card className="overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-secondary to-teal-400" />
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <PiggyBankIcon className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-bold text-text-primary">การออมรายเดือน</span>
                  </div>
                  {savingsAmt > 0 && (
                    <Badge variant={savingsPct >= 20 ? 'success' : savingsPct >= 10 ? 'warning' : 'error'} className="text-xs">
                      {savingsPct.toFixed(0)}% ของเงินเดือน
                    </Badge>
                  )}
                </div>

                {savingsAmt === 0 ? (
                  /* No savings set — show recommendation */
                  <div className="space-y-3">
                    <div className="bg-secondary-50 rounded-xl p-4">
                      <p className="text-xs text-text-tertiary mb-1">แนะนำออมเดือนละ (กฎ 20%)</p>
                      <p className="text-2xl font-headline font-extrabold text-secondary">
                        ฿{recommended.toLocaleString()}
                      </p>
                      <p className="text-xs text-text-tertiary mt-1">
                        จาก ฿{(cf.monthlySalary || 0).toLocaleString()} × 20%
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[10, 20, 30].map(pct => (
                        <div key={pct} className="bg-surface-100 rounded-xl p-2.5">
                          <p className="text-[10px] text-text-tertiary">{pct}%</p>
                          <p className="text-sm font-bold text-text-primary">
                            ฿{Math.round((cf.monthlySalary || 0) * pct / 100).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-secondary text-secondary hover:bg-secondary-50"
                      onClick={() => navigate('/fixed-expenses')}
                    >
                      <Plus className="w-4 h-4" />
                      ตั้งยอดออมในรายจ่ายประจำ
                    </Button>
                  </div>
                ) : (
                  /* Savings set — show allocation */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-text-tertiary mb-0.5">ออมรายเดือน</p>
                        <p className="text-2xl font-headline font-extrabold text-secondary">
                          ฿{savingsAmt.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-tertiary mb-0.5">เหลือใช้จ่าย</p>
                        <p className="text-lg font-bold text-text-primary">
                          ฿{(cf.freeMoney || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Salary bar: fixed | savings | free */}
                    <div className="space-y-1">
                      <div className="flex h-3 rounded-full overflow-hidden bg-surface-100">
                        {/* Fixed (non-savings) */}
                        <div
                          className="bg-error/60"
                          style={{ width: `${Math.min(((cf.spendableFixed || 0) / cf.monthlySalary) * 100, 100)}%` }}
                        />
                        {/* Savings */}
                        <div
                          className="bg-secondary"
                          style={{ width: `${Math.min((savingsAmt / cf.monthlySalary) * 100, 100)}%` }}
                        />
                        {/* Spendable (free money) */}
                        <div className="bg-primary/40 flex-1" />
                      </div>
                      <div className="flex justify-between text-[10px] text-text-tertiary">
                        <span>ค่าใช้จ่ายคงที่</span>
                        <span className="text-secondary font-medium">ออม {savingsPct.toFixed(0)}%</span>
                        <span>ยอดเงินที่ใช้ได้</span>
                      </div>
                    </div>

                    {activeGoals.length > 0 ? (
                      <Button
                        className="w-full bg-secondary hover:bg-secondary-600"
                        onClick={openAllocateDialog}
                      >
                        <Flag className="w-4 h-4" />
                        จัดสรรเข้าเป้าหมาย ({activeGoals.length} รายการ)
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={() => navigate('/goals')}>
                        <Plus className="w-4 h-4" />
                        ตั้งเป้าหมายการออม
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })()}

        {cf.hasSalary && (() => {
          // Savings rate (based on adjusted free money after debt payments)
          const savingsRate = cf.monthlySalary > 0
            ? Math.max(0, cf.remainingFree || 0) / cf.monthlySalary * 100
            : 0
          const plannedRate = cf.monthlySalary > 0
            ? Math.max(0, cf.freeMoney || 0) / cf.monthlySalary * 100
            : 0

          // Emergency fund
          const emergencyBalance = cf.emergencyBalance || 0
          const savingsBalance = cf.savingsBalance != null ? cf.savingsBalance : accounts
            .filter(a => ['savings','checking','cash','fixed_deposit'].includes(a.type))
            .reduce((s, a) => s + (a.balance || 0), 0)
          // Use emergency-tagged balance if any accounts have purpose=emergency; else fall back to savings
          const hasEmergencyAccounts = accounts.some(a => a.purpose === 'emergency')
          const emergencyDisplayBalance = hasEmergencyAccounts ? emergencyBalance : savingsBalance
          // Base = salary (proxy for monthly expenses); target = user-selected months × base
          const monthlyBase = cf.monthlySalary || 0
          const target = monthlyBase * emergencyMonthsTarget
          const emergencyPct = target > 0 ? Math.min(emergencyDisplayBalance / target * 100, 100) : 0
          const shortfall = Math.max(target - emergencyDisplayBalance, 0)
          const monthsToFill = (cf.freeMoney || 0) > 0 && shortfall > 0
            ? Math.ceil(shortfall / cf.freeMoney) : 0

          // Upcoming bills (next 14 days) — exclude items already done in checklist
          const today = new Date().getDate()
          const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
          const doneFixedIds = new Set(
            checklistItems
              .filter(i => i.status === 'done' && i.fixedExpenseId)
              .map(i => i.fixedExpenseId)
          )
          const upcoming = (fixedExpenses || [])
            .filter(e => !doneFixedIds.has(e.id))
            .map(e => {
              let daysUntil = (e.dueDay || 1) - today
              if (daysUntil < 0) daysUntil += daysInMonth
              return { ...e, daysUntil }
            })
            .filter(e => e.daysUntil <= 14)
            .sort((a, b) => a.daysUntil - b.daysUntil)

          return (
            <>
              {/* Savings Rate + DTI */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <TrendingUp className="w-4 h-4 text-secondary" />
                      <span className="text-xs font-medium text-text-secondary">อัตราการออม</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-3xl font-headline font-extrabold text-text-primary">
                        {savingsRate.toFixed(0)}
                      </span>
                      <span className="text-sm text-text-tertiary ml-1">%</span>
                    </div>
                    <Progress
                      value={Math.min(savingsRate, 100)}
                      className="h-1.5 mb-2"
                      indicatorClassName={savingsRate >= 20 ? 'bg-secondary' : savingsRate >= 10 ? 'bg-warning' : 'bg-error'}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-text-tertiary">เป้า ≥20%</span>
                      <Badge variant={savingsRate >= 20 ? 'success' : savingsRate >= 10 ? 'warning' : 'error'} className="text-xs">
                        {savingsRate >= 20 ? 'ดีมาก' : savingsRate >= 10 ? 'พอใช้' : 'ควรเพิ่ม'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Zap className="w-4 h-4 text-warning" />
                      <span className="text-xs font-medium text-text-secondary">ภาระต่อรายได้</span>
                    </div>
                    <div className="mb-2">
                      <span className="text-3xl font-headline font-extrabold text-text-primary">
                        {(cf.dti || 0).toFixed(0)}
                      </span>
                      <span className="text-sm text-text-tertiary ml-1">%</span>
                    </div>
                    <Progress
                      value={Math.min(cf.dti || 0, 100)}
                      className="h-1.5 mb-2"
                      indicatorClassName={(cf.dti || 0) > 36 ? 'bg-error' : (cf.dti || 0) > 20 ? 'bg-warning' : 'bg-secondary'}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-text-tertiary">เป้า &lt;36%</span>
                      <DtiBadge dti={cf.dti || 0} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Emergency Fund Management */}
              <Card className="overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-secondary to-teal-400" />
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-secondary" />
                      <span className="text-sm font-bold text-text-primary">ทุนฉุกเฉิน</span>
                    </div>
                    <EmergencyBadge months={cf.emergencyMonths || 0} />
                  </div>

                  {/* Current vs Target */}
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-xs text-text-tertiary mb-0.5">
                        {hasEmergencyAccounts ? 'ทุนฉุกเฉิน' : 'เงินออม'}
                      </p>
                      <p className="text-2xl font-headline font-extrabold text-text-primary">
                        ฿{emergencyDisplayBalance.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-tertiary mb-0.5">เป้าหมาย ({emergencyMonthsTarget} เดือน)</p>
                      <p className="text-lg font-bold text-text-secondary">฿{target.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Month selector */}
                  <div className="flex items-center justify-between bg-surface-50 rounded-xl px-3 py-2 mb-3">
                    <span className="text-xs text-text-secondary">เป้าหมายกี่เดือน?</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adjustEmergencyMonths(-1)}
                        disabled={emergencyMonthsTarget <= 3}
                        className="w-7 h-7 rounded-lg bg-white border border-border flex items-center justify-center text-text-primary font-bold disabled:opacity-30 hover:border-primary/40 transition-colors"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold text-text-primary w-16 text-center">
                        {emergencyMonthsTarget} เดือน
                      </span>
                      <button
                        onClick={() => adjustEmergencyMonths(1)}
                        className="w-7 h-7 rounded-lg bg-white border border-border flex items-center justify-center text-text-primary font-bold hover:border-primary/40 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <Progress
                    value={emergencyPct}
                    className="h-2.5 mb-3"
                    indicatorClassName={emergencyPct >= 100 ? 'bg-secondary' : emergencyPct >= 50 ? 'bg-warning' : 'bg-error'}
                  />

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-surface-100 rounded-xl p-2.5">
                      <p className="text-[10px] text-text-tertiary mb-0.5">ครอบคลุม</p>
                      <p className="text-sm font-bold text-text-primary">{(cf.emergencyMonths || 0).toFixed(1)} เดือน</p>
                    </div>
                    <div className="bg-surface-100 rounded-xl p-2.5">
                      <p className="text-[10px] text-text-tertiary mb-0.5">ขาดอีก</p>
                      <p className="text-sm font-bold text-error">
                        {shortfall > 0 ? `฿${shortfall.toLocaleString()}` : '✓ ครบ'}
                      </p>
                    </div>
                    <div className="bg-surface-100 rounded-xl p-2.5">
                      <p className="text-[10px] text-text-tertiary mb-0.5">เติมเต็มใน</p>
                      <p className="text-sm font-bold text-text-primary">
                        {shortfall <= 0 ? '✓' : monthsToFill > 0 ? `${monthsToFill} เดือน` : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goal Progress */}
              {goals.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-headline font-bold text-text-primary">ความคืบหน้าเป้าหมาย</h2>
                    <button
                      onClick={() => navigate('/goals')}
                      className="text-xs text-primary flex items-center gap-1 hover:underline"
                    >
                      ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      {goals.slice(0, 3).map(goal => {
                        const pct = goal.targetAmount > 0
                          ? Math.min((goal.currentAmount || 0) / goal.targetAmount * 100, 100)
                          : 0
                        const remaining = Math.max((goal.targetAmount || 0) - (goal.currentAmount || 0), 0)
                        const monthsLeft = (cf.freeMoney || 0) > 0 && remaining > 0
                          ? Math.ceil(remaining / cf.freeMoney) : null
                        return (
                          <div key={goal.id}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <Flag className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="text-sm font-semibold text-text-primary truncate">{goal.name}</span>
                              </div>
                              <div className="text-right ml-2 shrink-0">
                                <span className="text-xs font-bold text-text-primary">{pct.toFixed(0)}%</span>
                                {pct < 100 && (
                                  <p className="text-[10px] text-text-tertiary">฿{remaining.toLocaleString()} อีก</p>
                                )}
                              </div>
                            </div>
                            <Progress
                              value={pct}
                              className="h-1.5"
                              indicatorClassName={pct >= 100 ? 'bg-secondary' : 'bg-gradient-to-r from-primary to-accent'}
                            />
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-text-tertiary">฿{(goal.currentAmount || 0).toLocaleString()}</span>
                              <span className="text-[10px] text-text-tertiary">
                                {monthsLeft ? `ถึงเป้าใน ~${monthsLeft} เดือน` : `฿${(goal.targetAmount || 0).toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Checklist progress */}
              {checklistItems.length > 0 && (() => {
                const done = checklistItems.filter(i => i.status === 'done').length
                const total = checklistItems.length
                const pct = Math.round(done / total * 100)
                return (
                  <button
                    className="w-full text-left"
                    onClick={() => navigate('/checklist')}
                  >
                    <Card className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className={`h-1 bg-gradient-to-r ${done === total ? 'from-secondary to-teal-400' : 'from-primary via-accent to-secondary'}`} />
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`w-4 h-4 ${done === total ? 'text-secondary' : 'text-primary'}`} />
                            <span className="text-sm font-bold text-text-primary">Checklist เดือนนี้</span>
                          </div>
                          <span className={`text-xs font-semibold ${done === total ? 'text-secondary' : 'text-text-tertiary'}`}>
                            {done}/{total} · {pct}%
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          className="h-1.5"
                          indicatorClassName={done === total ? 'bg-secondary' : 'bg-gradient-to-r from-primary to-accent'}
                        />
                      </CardContent>
                    </Card>
                  </button>
                )
              })()}

              {/* Upcoming Bills */}
              {upcoming.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-4 h-4 text-warning" />
                    <h2 className="font-headline font-bold text-text-primary">รายจ่ายที่กำลังจะถึง</h2>
                  </div>
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      {upcoming.map(e => (
                        <div key={e.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              e.daysUntil === 0 ? 'bg-error-50' :
                              e.daysUntil <= 3 ? 'bg-warning-50' : 'bg-surface-100'
                            }`}>
                              <CalendarDays className={`w-4 h-4 ${
                                e.daysUntil === 0 ? 'text-error' :
                                e.daysUntil <= 3 ? 'text-warning' : 'text-text-tertiary'
                              }`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{e.name}</p>
                              <p className={`text-xs ${
                                e.daysUntil === 0 ? 'text-error font-medium' :
                                e.daysUntil <= 3 ? 'text-warning font-medium' : 'text-text-tertiary'
                              }`}>
                                {e.daysUntil === 0 ? 'วันนี้!' :
                                 e.daysUntil === 1 ? 'พรุ่งนี้' :
                                 `อีก ${e.daysUntil} วัน`}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-text-primary">
                            ฿{(e.amount || 0).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )
        })()}

        {/* Accounts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline font-bold text-text-primary">บัญชีและสินทรัพย์</h2>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" />
              เพิ่มบัญชี
            </Button>
          </div>

          {accounts.length === 0 ? (
            <Card className="border-dashed border-2 border-border hover:border-primary/30 transition-all cursor-pointer" onClick={openAdd}>
              <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-text-tertiary" />
                </div>
                <p className="font-semibold text-sm text-text-primary">ยังไม่มีบัญชี</p>
                <p className="text-xs text-text-tertiary">เพิ่มบัญชีเพื่อคำนวณทุนฉุกเฉิน</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => {
                const typeInfo = accountTypes.find(t => t.id === account.type) || accountTypes[5]
                return (
                  <Card key={account.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                    <div className={`h-1 bg-gradient-to-r ${typeInfo.color}`} />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <AccountIcon type={account.type} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-sm text-text-primary truncate">{account.name}</p>
                            {account.purpose && account.purpose !== 'general' && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                                account.purpose === 'emergency'
                                  ? 'bg-error-50 text-error'
                                  : 'bg-secondary-50 text-secondary'
                              }`}>
                                {account.purpose === 'emergency' ? 'ฉุกเฉิน' : 'ออม'}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-tertiary">{typeInfo.label}{account.note ? ` · ${account.note}` : ''}</p>
                        </div>
                        <p className="text-xl font-headline font-extrabold text-text-primary">
                          ฿{(account.balance || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(account)}>
                          <Pencil className="w-3.5 h-3.5" />แก้ไข
                        </Button>
                        {confirmDeleteId === account.id ? (
                          <div className="flex gap-1">
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(account.id)}>
                              <Check className="w-3.5 h-3.5" />ยืนยัน
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteId(null)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="text-error hover:text-error hover:border-error/30 hover:bg-error-50/30" onClick={() => setConfirmDeleteId(account.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              <div className="flex justify-between items-center px-1 py-2 border-t border-border-subtle">
                <span className="text-sm font-medium text-text-tertiary">รวมสินทรัพย์</span>
                <span className="text-xl font-headline font-extrabold text-secondary">฿{totalBalance.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Crypto shortcut */}
        <Card
          className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/crypto')}
        >
          <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-600" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white text-xs font-extrabold">₿</span>
              </div>
              <div>
                <p className="font-semibold text-sm text-text-primary">พอร์ตคริปโต</p>
                <p className={`text-xs ${cryptoPnl != null ? (cryptoPnl >= 0 ? 'text-secondary' : 'text-error') : 'text-text-tertiary'}`}>
                  {cryptoPriceLoading ? 'กำลังดึงราคา...' :
                   cryptoPnl != null ? `P&L ${cryptoPnl >= 0 ? '+' : ''}฿${Math.abs(cryptoPnl).toLocaleString('th-TH', { maximumFractionDigits: 0 })}` :
                   'ดูพอร์ตและราคาเรียลไทม์'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-text-primary">
                ฿{cryptoTotal.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
              </p>
              <ChevronRight className="w-4 h-4 text-text-tertiary" />
            </div>
          </CardContent>
        </Card>

        {/* Debts — monthly view */}
        <div>
          <button className="flex items-center justify-between w-full mb-3" onClick={() => setExpandDebts(!expandDebts)}>
            <h2 className="font-headline font-bold text-text-primary">หนี้สิน</h2>
            <div className="flex items-center gap-2">
              <Badge variant="error" className="text-xs">{debts.length} รายการ</Badge>
              {expandDebts ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
            </div>
          </button>

          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-text-tertiary mb-0.5">ผ่อนต่อเดือนรวม</p>
                  <p className="text-2xl font-headline font-extrabold text-error">
                    ฿{(cf.monthlyDebtPayment || 0).toLocaleString()}<span className="text-sm font-normal text-text-tertiary">/เดือน</span>
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/debt')}>
                  จัดการหนี้ <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {expandDebts && debts.length > 0 && (
                <div className="mt-3 space-y-3 pt-3 border-t border-border-subtle">
                  {debts.map((debt) => {
                    const Icon = debtTypeIcons[debt.type] || CreditCard
                    // Estimated payoff months
                    const r = (debt.interestRate || 0) / 100 / 12
                    const pmt = debt.minPayment || 0
                    const bal = debt.balance || 0
                    let monthsLeft = 0
                    if (pmt > 0) {
                      if (r > 0 && pmt > r * bal) {
                        monthsLeft = Math.ceil(-Math.log(1 - (r * bal) / pmt) / Math.log(1 + r))
                      } else if (r === 0) {
                        monthsLeft = Math.ceil(bal / pmt)
                      }
                    }
                    const payoffDate = monthsLeft > 0
                      ? new Date(Date.now() + monthsLeft * 30 * 24 * 60 * 60 * 1000)
                          .toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })
                      : null

                    return (
                      <div key={debt.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-error-50 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-error" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <p className="text-sm font-semibold text-text-primary truncate">{debt.name}</p>
                            <p className="text-sm font-bold text-text-primary ml-2">฿{(debt.minPayment || 0).toLocaleString()}/เดือน</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-text-tertiary">
                            <span>คงเหลือ ฿{bal.toLocaleString()}</span>
                            {payoffDate && <span>· ปลดหนี้ประมาณ {payoffDate}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {expandDebts && debts.length === 0 && (
                <div className="mt-3 pt-3 border-t border-border-subtle text-center py-3">
                  <Check className="w-7 h-7 text-secondary mx-auto mb-1" />
                  <p className="text-sm text-text-secondary">ไม่มีหนี้สิน 🎉</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lent Money — เพื่อนยืมเงิน */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline font-bold text-text-primary">เพื่อนยืมเงิน</h2>
            <Button size="sm" onClick={openAddLent}>
              <Plus className="w-4 h-4" />
              บันทึก
            </Button>
          </div>

          {lentPending.length === 0 && lentPaid.length === 0 ? (
            <Card className="border-dashed border-2 border-border hover:border-primary/30 transition-all cursor-pointer" onClick={openAddLent}>
              <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-surface-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-text-tertiary" />
                </div>
                <p className="font-semibold text-sm text-text-primary">ยังไม่มีรายการ</p>
                <p className="text-xs text-text-tertiary">บันทึกเงินที่ให้เพื่อนยืม</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Summary */}
              {lentTotal > 0 && (
                <Card className="overflow-hidden border-0 shadow-sm bg-gradient-to-r from-accent-50 to-white">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-text-tertiary mb-0.5">รอรับเงินคืนรวม</p>
                      <p className="text-2xl font-headline font-extrabold text-accent">฿{lentTotal.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pending items */}
              {lentPending.map((item) => {
                const paidAmt = item.paidAmount || 0
                const remaining = Math.max((item.amount || 0) - paidAmt, 0)
                const hasPartial = paidAmt > 0
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-accent to-purple-400" />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm text-text-primary">{item.friendName}</p>
                            <div className="text-right">
                              <p className="text-lg font-bold text-accent">฿{remaining.toLocaleString()}</p>
                              {hasPartial && (
                                <p className="text-[10px] text-text-tertiary">ยืมทั้งหมด ฿{(item.amount || 0).toLocaleString()} · รับแล้ว ฿{paidAmt.toLocaleString()}</p>
                              )}
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-xs text-text-tertiary mt-0.5">{item.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary flex-wrap">
                            {item.lentDate && <span>ยืมวันที่ {new Date(item.lentDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>}
                            {item.dueDate && <span>· คืนภายใน {new Date(item.dueDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>}
                            {item.accountId && (() => {
                              const acc = accounts.find(a => a.id === item.accountId)
                              return acc ? <span className="text-primary">· จาก {acc.name}</span> : null
                            })()}
                          </div>
                          {hasPartial && (
                            <div className="mt-2">
                              <Progress value={(paidAmt / (item.amount || 1)) * 100} className="h-1.5" indicatorClassName="bg-gradient-to-r from-accent to-secondary" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 text-secondary hover:text-secondary hover:border-secondary/30 hover:bg-secondary-50/30" onClick={() => openPaymentDialog(item)}>
                          <Banknote className="w-3.5 h-3.5" />รับเงิน
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditLent(item)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        {confirmDeleteLentId === item.id ? (
                          <div className="flex gap-1">
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteLent(item.id)}>ลบ</Button>
                            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteLentId(null)}><X className="w-3.5 h-3.5" /></Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="text-error hover:text-error hover:border-error/30 hover:bg-error-50/30" onClick={() => setConfirmDeleteLentId(item.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Paid items (collapsible) */}
              {lentPaid.length > 0 && (
                <button
                  className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors w-full"
                  onClick={() => setExpandLentPaid(!expandLentPaid)}
                >
                  {expandLentPaid ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  ได้รับคืนแล้ว ({lentPaid.length} รายการ)
                </button>
              )}

              {expandLentPaid && lentPaid.map((item) => (
                <Card key={item.id} className="overflow-hidden opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center shrink-0">
                        <Check className="w-5 h-5 text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-text-primary">{item.friendName}</p>
                        {item.description && <p className="text-xs text-text-tertiary">{item.description}</p>}
                      </div>
                      <p className="text-base font-bold text-text-tertiary line-through">฿{(item.amount || 0).toLocaleString()}</p>
                      <Button variant="outline" size="sm" className="text-error hover:text-error" onClick={() => handleDeleteLent(item.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </main>
      <BottomNav />
      <Toast toast={toast} onHide={hideToast} />

      {/* Savings Allocation Dialog */}
      <Dialog open={showAllocateDialog} onOpenChange={setShowAllocateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">จัดสรรเงินออม</DialogTitle>
            <DialogDescription>
              แบ่ง ฿{(cf.savingsAllocation || 0).toLocaleString()} เข้าเป้าหมายที่ต้องการ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {goals.filter(g => (g.currentAmount || 0) < (g.targetAmount || 0)).length === 0 ? (
              <div className="text-center py-6">
                <Flag className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
                <p className="text-sm text-text-secondary">ยังไม่มีเป้าหมายที่ยังไม่บรรลุ</p>
                <Button variant="outline" className="mt-3" onClick={() => { setShowAllocateDialog(false); navigate('/goals') }}>
                  ไปตั้งเป้าหมาย
                </Button>
              </div>
            ) : (
              <>
                {/* Per-goal inputs */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {goals.filter(g => (g.currentAmount || 0) < (g.targetAmount || 0)).map(goal => {
                    const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount || 0) / goal.targetAmount * 100, 100) : 0
                    const remaining = Math.max((goal.targetAmount || 0) - (goal.currentAmount || 0), 0)
                    return (
                      <div key={goal.id} className="bg-surface-100 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-text-primary truncate">{goal.name}</p>
                            <p className="text-xs text-text-tertiary">
                              ฿{(goal.currentAmount || 0).toLocaleString()} / ฿{(goal.targetAmount || 0).toLocaleString()} · เหลือ ฿{remaining.toLocaleString()}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-text-tertiary ml-2">{pct.toFixed(0)}%</span>
                        </div>
                        <Progress value={pct} className="h-1 mb-3" indicatorClassName="bg-gradient-to-r from-primary to-accent" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-tertiary">฿</span>
                          <Input
                            type="number"
                            value={allocations[goal.id] || ''}
                            onChange={e => setAllocations(prev => ({ ...prev, [goal.id]: e.target.value }))}
                            placeholder="0"
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Total check */}
                {(() => {
                  const total = Object.values(allocations).reduce((s, v) => s + (parseFloat(v) || 0), 0)
                  const budget = cf.savingsAllocation || 0
                  const over = total > budget
                  return (
                    <div className={`flex justify-between items-center px-3 py-2 rounded-xl ${over ? 'bg-error-50' : 'bg-secondary-50'}`}>
                      <span className="text-xs text-text-secondary">จัดสรรรวม</span>
                      <span className={`text-sm font-bold ${over ? 'text-error' : 'text-secondary'}`}>
                        ฿{total.toLocaleString()} / ฿{budget.toLocaleString()}
                        {over && ' (เกิน!)'}
                      </span>
                    </div>
                  )
                })()}

                <Button
                  className="w-full"
                  onClick={handleAllocate}
                  disabled={allocating || Object.values(allocations).every(v => !(parseFloat(v) > 0))}
                >
                  {allocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {allocating ? 'กำลังจัดสรร...' : 'ยืนยันจัดสรรเงินออม'}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">รับเงินคืน</DialogTitle>
            <DialogDescription>
              {paymentItem && (() => {
                const remaining = Math.max((paymentItem.amount || 0) - (paymentItem.paidAmount || 0), 0)
                return `${paymentItem.friendName} ค้างชำระ ฿${remaining.toLocaleString()}`
              })()}
            </DialogDescription>
          </DialogHeader>
          {paymentItem && (
            <div className="space-y-4 mt-2">
              {/* Outstanding breakdown */}
              <div className="bg-surface-100 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-text-secondary">
                  <span>ยืมทั้งหมด</span>
                  <span>฿{(paymentItem.amount || 0).toLocaleString()}</span>
                </div>
                {(paymentItem.paidAmount || 0) > 0 && (
                  <div className="flex justify-between text-secondary">
                    <span>รับแล้ว</span>
                    <span>-฿{(paymentItem.paidAmount || 0).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-text-primary pt-1 border-t border-border-subtle">
                  <span>ค้างชำระ</span>
                  <span>฿{Math.max((paymentItem.amount || 0) - (paymentItem.paidAmount || 0), 0).toLocaleString()}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">รับเงินมาเท่าไหร่? (฿)</label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder={`สูงสุด ฿${Math.max((paymentItem.amount || 0) - (paymentItem.paidAmount || 0), 0).toLocaleString()}`}
                  autoFocus
                />
                {paymentAmount && (
                  <p className="text-xs text-text-tertiary mt-1.5">
                    {(() => {
                      const r = parseFloat(paymentAmount) || 0
                      const remaining = Math.max((paymentItem.amount || 0) - (paymentItem.paidAmount || 0) - r, 0)
                      return remaining <= 0
                        ? 'ได้รับครบแล้ว — จะปิดรายการนี้'
                        : `จะยังค้างอีก ฿${remaining.toLocaleString()}`
                    })()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    const remaining = Math.max((paymentItem.amount || 0) - (paymentItem.paidAmount || 0), 0)
                    setPaymentAmount(remaining.toString())
                  }}
                >
                  รับครบทั้งหมด
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleReceivePayment}
                  disabled={!paymentAmount || paymentSubmitting}
                >
                  {paymentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  ยืนยัน
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit Lent Money Dialog */}
      <Dialog open={showLentDialog} onOpenChange={setShowLentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {editingLent ? 'แก้ไขรายการยืมเงิน' : 'บันทึกเงินที่ให้ยืม'}
            </DialogTitle>
            <DialogDescription>บันทึกเพื่อติดตามว่าใครยืมเงินไปเท่าไหร่</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">ชื่อเพื่อน / ผู้ยืม</label>
              <Input
                value={lentForm.friendName}
                onChange={e => setLentForm({ ...lentForm, friendName: e.target.value })}
                placeholder="เช่น น้องแป้ง, เพื่อนร่วมงาน"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">จำนวนเงิน (฿)</label>
              <Input
                type="number"
                value={lentForm.amount}
                onChange={e => setLentForm({ ...lentForm, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">รายละเอียด (ไม่บังคับ)</label>
              <Input
                value={lentForm.description}
                onChange={e => setLentForm({ ...lentForm, description: e.target.value })}
                placeholder="เช่น ยืมไปซื้อของ, ค่าอาหาร"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">วันที่ยืม</label>
                <Input
                  type="date"
                  value={lentForm.lentDate}
                  onChange={e => setLentForm({ ...lentForm, lentDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">กำหนดคืน (ถ้ามี)</label>
                <Input
                  type="date"
                  value={lentForm.dueDate}
                  onChange={e => setLentForm({ ...lentForm, dueDate: e.target.value })}
                />
              </div>
            </div>
            {accounts.length > 0 && (
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">ให้ยืมจากบัญชี (ไม่บังคับ)</label>
                <div className="flex flex-wrap gap-2">
                  {accounts.map(acc => {
                    const selected = lentForm.accountId === acc.id
                    const typeInfo = accountTypes.find(t => t.id === acc.type) || accountTypes[5]
                    const Icon = typeInfo.icon
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setLentForm({ ...lentForm, accountId: selected ? null : acc.id })}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                          selected
                            ? 'bg-primary-50 border-primary/40 text-primary shadow-sm scale-[1.03]'
                            : 'bg-surface-100 border-transparent text-text-secondary hover:border-primary/20'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="max-w-[80px] truncate">{acc.name}</span>
                        <span className="opacity-60">฿{(acc.balance || 0).toLocaleString()}</span>
                      </button>
                    )
                  })}
                </div>
                {lentForm.accountId && (() => {
                  const acc = accounts.find(a => a.id === lentForm.accountId)
                  const amt = parseFloat(lentForm.amount) || 0
                  if (!acc || !amt) return null
                  return (
                    <p className="text-xs text-text-tertiary mt-2">
                      คงเหลือหลังให้ยืม: ฿{Math.max(0, (acc.balance || 0) - amt).toLocaleString()}
                    </p>
                  )
                })()}
              </div>
            )}
            <Button
              className="w-full"
              onClick={handleLentSubmit}
              disabled={!lentForm.friendName || !lentForm.amount || lentSubmitting}
            >
              {lentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {lentSubmitting ? 'กำลังบันทึก...' : editingLent ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Account Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {editingAccount ? 'แก้ไขบัญชี' : 'เพิ่มบัญชีใหม่'}
            </DialogTitle>
            <DialogDescription>{editingAccount ? 'อัปเดตข้อมูลบัญชี' : 'บันทึกบัญชีและยอดเงิน'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">ประเภทบัญชี</label>
              <div className="grid grid-cols-3 gap-2">
                {accountTypes.map(type => {
                  const Icon = type.icon
                  return (
                    <button key={type.id} onClick={() => setForm({ ...form, type: type.id })}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${form.type === type.id ? 'border-primary bg-primary-50' : 'border-transparent bg-surface-100 hover:border-primary/30'}`}>
                      <Icon className={`w-5 h-5 ${form.type === type.id ? 'text-primary' : 'text-text-secondary'}`} />
                      <span className="text-[10px] text-center leading-tight">{type.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">ชื่อบัญชี</label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="เช่น บัญชีออมทรัพย์ K-Bank" />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">ยอดเงิน (฿)</label>
              <Input type="number" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">หมายเหตุ (ไม่บังคับ)</label>
              <Input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="เช่น ดอกเบี้ย 1.5%/ปี" />
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">วัตถุประสงค์</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'general', label: 'ทั่วไป', desc: 'นับเป็นเงินใช้จ่าย', color: 'text-text-secondary' },
                  { id: 'savings', label: 'เงินออม', desc: 'ไม่นับเป็นยอดเงินที่ใช้ได้', color: 'text-secondary' },
                  { id: 'emergency', label: 'ฉุกเฉิน', desc: 'ทุนฉุกเฉินโดยเฉพาะ', color: 'text-error' },
                ].map(p => (
                  <button key={p.id} onClick={() => setForm({ ...form, purpose: p.id })}
                    className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-0.5 transition-all text-center ${form.purpose === p.id ? 'border-primary bg-primary-50' : 'border-transparent bg-surface-100 hover:border-primary/30'}`}>
                    <span className={`text-xs font-semibold ${form.purpose === p.id ? 'text-primary' : p.color}`}>{p.label}</span>
                    <span className="text-[9px] text-text-tertiary leading-tight">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={!form.name || !form.balance || submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingAccount ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {submitting ? 'กำลังบันทึก...' : editingAccount ? 'บันทึกการแก้ไข' : 'เพิ่มบัญชี'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
