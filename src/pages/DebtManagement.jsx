import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Car, Home, GraduationCap, DollarSign, Percent,
  Sparkles, MessageCircle, Check, ArrowRight, Plus, Target,
  Loader2, CalendarDays, Pencil, Trash2, TrendingDown, PartyPopper,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import Toast, { useToast } from '@/components/Toast'
import { useDebts } from '@/hooks'

const debtTypes = [
  { id: 'credit_card', icon: CreditCard, label: 'บัตรเครดิต',    color: 'from-error to-pink-400' },
  { id: 'car',         icon: Car,         label: 'สินเชื่อรถ',   color: 'from-primary to-accent' },
  { id: 'home',        icon: Home,        label: 'สินเชื่อบ้าน', color: 'from-secondary to-teal-400' },
  { id: 'education',   icon: GraduationCap, label: 'กยศ./การศึกษา', color: 'from-purple-400 to-purple-500' },
  { id: 'other',       icon: DollarSign,  label: 'อื่นๆ',        color: 'from-warning to-yellow-400' },
]

const emptyForm = { type: 'credit_card', name: '', balance: '', minPayment: '', interestRate: '' }

function calcPayoff(balance, minPayment, interestRate) {
  const r = (interestRate || 0) / 100 / 12
  const pmt = minPayment || 0
  const bal = balance || 0
  if (pmt <= 0) return null
  if (r > 0) {
    if (pmt <= r * bal) return null // payment can't cover interest
    return Math.ceil(-Math.log(1 - (r * bal) / pmt) / Math.log(1 + r))
  }
  return Math.ceil(bal / pmt)
}

export default function DebtManagement() {
  const navigate = useNavigate()
  const { debts, loading, addDebt, updateDebt, makePayment, deleteDebt } = useDebts()
  const { toast, showToast, hideToast } = useToast()

  const [showAddDialog, setShowAddDialog]   = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPayDialog, setShowPayDialog]   = useState(false)
  const [selectedDebt, setSelectedDebt]     = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [submitting, setSubmitting]         = useState(false)
  const [payAmount, setPayAmount]           = useState('')
  const [form, setForm]                     = useState(emptyForm)

  const activeDebts = debts.filter(d => !d.isPaidOff)
  const paidDebts   = debts.filter(d => d.isPaidOff)

  const totalDebt        = activeDebts.reduce((s, d) => s + (d.balance || 0), 0)
  const monthlyPayment   = activeDebts.reduce((s, d) => s + (d.minPayment || 0), 0)
  const avgRate          = activeDebts.length
    ? (activeDebts.reduce((s, d) => s + (d.interestRate || 0), 0) / activeDebts.length).toFixed(1)
    : 0

  // Debt Avalanche target
  const avalancheTarget = activeDebts.length
    ? [...activeDebts].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0))[0]
    : null

  const openPay = (debt) => {
    setSelectedDebt(debt)
    setPayAmount(debt.minPayment?.toString() || '')
    setShowPayDialog(true)
  }

  const openEdit = (debt) => {
    setSelectedDebt(debt)
    setForm({
      type: debt.type || 'other',
      name: debt.name || '',
      balance: debt.balance?.toString() || '',
      minPayment: debt.minPayment?.toString() || '',
      interestRate: debt.interestRate?.toString() || '',
    })
    setShowEditDialog(true)
  }

  const handleAdd = async () => {
    if (!form.name || !form.balance) return
    setSubmitting(true)
    try {
      const selectedType = debtTypes.find(t => t.id === form.type)
      await addDebt({
        type: form.type,
        name: form.name,
        balance: parseFloat(form.balance),
        minPayment: parseFloat(form.minPayment) || parseFloat(form.balance) * 0.05,
        interestRate: parseFloat(form.interestRate) || 0,
        gradient: selectedType?.color || 'from-primary to-accent',
        priority: debts.length + 1,
      })
      setShowAddDialog(false)
      setForm(emptyForm)
      showToast('เพิ่มหนี้สำเร็จ!')
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedDebt || !form.name || !form.balance) return
    setSubmitting(true)
    try {
      await updateDebt(selectedDebt.id, {
        name: form.name,
        balance: parseFloat(form.balance),
        minPayment: parseFloat(form.minPayment) || 0,
        interestRate: parseFloat(form.interestRate) || 0,
      })
      setShowEditDialog(false)
      showToast('อัปเดตหนี้สำเร็จ')
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePay = async () => {
    if (!payAmount || !selectedDebt) return
    setSubmitting(true)
    try {
      const result = await makePayment(selectedDebt.id, parseFloat(payAmount))
      setShowPayDialog(false)
      setPayAmount('')
      if (result?.isPaidOff) {
        showToast(`🎉 ปลดหนี้ "${selectedDebt.name}" สำเร็จแล้ว!`)
      } else {
        showToast(`บันทึกชำระ ฿${parseFloat(payAmount).toLocaleString()} สำเร็จ!`)
      }
      setSelectedDebt(null)
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteDebt(id)
      setConfirmDeleteId(null)
      showToast('ลบหนี้สำเร็จ')
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    }
  }

  const getDebtIcon  = (debt) => debtTypes.find(t => t.id === debt.type)?.icon || CreditCard
  const getDebtColor = (debt) => debt.gradient || 'from-primary to-accent'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const DebtForm = ({ onSubmit, submitLabel }) => (
    <div className="space-y-4 mt-4">
      <div>
        <label className="text-sm font-medium text-text-primary mb-2 block">ประเภทหนี้</label>
        <div className="grid grid-cols-3 gap-2">
          {debtTypes.map(type => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setForm(f => ({ ...f, type: type.id }))}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                  form.type === type.id ? 'border-primary bg-primary-50' : 'border-transparent bg-surface-100 hover:border-primary/30'
                }`}
              >
                <Icon className={`w-5 h-5 ${form.type === type.id ? 'text-primary' : 'text-text-secondary'}`} />
                <span className="text-[10px] text-center leading-tight">{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-text-primary mb-1 block">ชื่อหนี้</label>
        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="เช่น บัตรเครดิต K-Bank" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-text-primary mb-1 block">ยอดหนี้ (฿)</label>
          <Input type="number" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} placeholder="45000" />
        </div>
        <div>
          <label className="text-sm font-medium text-text-primary mb-1 block">ชำระขั้นต่ำ/เดือน</label>
          <Input type="number" value={form.minPayment} onChange={e => setForm(f => ({ ...f, minPayment: e.target.value }))} placeholder="1500" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-text-primary mb-1 block">ดอกเบี้ย (%/ปี)</label>
        <Input type="number" value={form.interestRate} onChange={e => setForm(f => ({ ...f, interestRate: e.target.value }))} placeholder="18.5" />
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={!form.name || !form.balance || submitting}>
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        {submitting ? 'กำลังบันทึก...' : submitLabel}
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="หนี้สิน" onClose={() => navigate(-1)} back showProfile={false} />
      <main className="max-w-lg mx-auto px-5 pt-24 pb-32 space-y-5">

        {/* Summary card */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-error via-pink-400 to-warning" />
          <CardContent className="p-5">
            <p className="text-text-tertiary text-xs mb-1">ยอดหนี้รวม</p>
            <h2 className="text-3xl font-headline font-extrabold text-text-primary mb-4">
              ฿{totalDebt.toLocaleString()}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface-50">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-error" />
                  <span className="text-xs text-text-tertiary">จ่าย/เดือน</span>
                </div>
                <p className="text-base font-bold text-text-primary">฿{monthlyPayment.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Percent className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs text-text-tertiary">ดอกเบี้ยเฉลี่ย</span>
                </div>
                <p className="text-base font-bold text-text-primary">{avgRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debt Avalanche insight */}
        {avalancheTarget && (() => {
          const months = calcPayoff(avalancheTarget.balance, avalancheTarget.minPayment, avalancheTarget.interestRate)
          const payoffDate = months
            ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000)
                .toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
            : null
          return (
            <Card className="bg-gradient-to-r from-primary-50/50 to-accent-50/30 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <Badge variant="default" className="mb-1 text-xs">💡 Debt Avalanche</Badge>
                    <p className="text-sm text-text-primary leading-relaxed">
                      โฟกัสที่ <span className="font-semibold">{avalancheTarget.name}</span> ก่อน
                      (ดอกเบี้ย {avalancheTarget.interestRate || 0}%/ปี)
                    </p>
                  </div>
                </div>
                {payoffDate && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 mb-3 text-xs text-text-secondary">
                    <CalendarDays className="w-3.5 h-3.5 text-primary shrink-0" />
                    จ่ายขั้นต่ำ <span className="font-semibold mx-1">฿{(avalancheTarget.minPayment||0).toLocaleString()}/เดือน</span>
                    ปลดหนี้นี้ประมาณ <span className="font-semibold ml-1">{payoffDate}</span> ({months} เดือน)
                  </div>
                )}
                <Button className="bg-secondary hover:bg-secondary-600 w-full border-0 h-9 text-sm" onClick={() => navigate('/assistant')}>
                  <MessageCircle className="w-4 h-4" />
                  ถามลูมิน่าเรื่องแผนปลดหนี้
                </Button>
              </CardContent>
            </Card>
          )
        })()}

        {/* Active debts */}
        {activeDebts.length === 0 ? (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-secondary-50 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-secondary" />
              </div>
              <h3 className="font-headline font-bold text-text-primary mb-1">ไม่มีหนี้สิน</h3>
              <p className="text-text-secondary text-sm mb-4">ยอดเยี่ยม! คุณไม่มีหนี้ที่ต้องกังวล</p>
              <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4" /> เพิ่มหนี้ (ถ้ามี)
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-headline font-bold text-text-primary">รายการหนี้ ({activeDebts.length})</h3>
            </div>
            {activeDebts.map((debt, idx) => {
              const Icon = getDebtIcon(debt)
              const color = getDebtColor(debt)
              const paidPct = debt.originalBalance > 0
                ? Math.round(((debt.originalBalance - debt.balance) / debt.originalBalance) * 100)
                : 0
              const months = calcPayoff(debt.balance, debt.minPayment, debt.interestRate)

              return (
                <Card key={debt.id} className="overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${color}`} />
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-sm`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-sm text-text-primary">{debt.name}</span>
                          <span className="text-xs text-text-tertiary">#{idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-text-tertiary">
                          <span>ดอกเบี้ย {debt.interestRate || 0}%</span>
                          <span>ขั้นต่ำ ฿{(debt.minPayment || 0).toLocaleString()}</span>
                          {months && <span>~{months} เดือน</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mb-2">
                      <p className="text-xl font-headline font-extrabold text-text-primary">
                        ฿{(debt.balance || 0).toLocaleString()}
                      </p>
                      {debt.originalBalance > 0 && (
                        <span className="text-xs text-secondary font-medium">ชำระแล้ว {paidPct}%</span>
                      )}
                    </div>

                    {debt.originalBalance > 0 && (
                      <Progress
                        value={paidPct}
                        className="h-1.5 mb-3"
                        indicatorClassName="bg-gradient-to-r from-secondary to-teal-400"
                      />
                    )}

                    <div className="flex gap-2">
                      <Button className="flex-1 h-8 text-xs" onClick={() => openPay(debt)}>
                        <DollarSign className="w-3.5 h-3.5" /> บันทึกจ่าย
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(debt)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {confirmDeleteId === debt.id ? (
                        <>
                          <Button size="sm" className="h-8 bg-error hover:bg-error-600 border-0 text-xs" onClick={() => handleDelete(debt.id)}>
                            ยืนยัน
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setConfirmDeleteId(null)}>
                            ยกเลิก
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-error hover:bg-error-50 hover:border-error/30" onClick={() => setConfirmDeleteId(debt.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Paid off debts */}
        {paidDebts.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-headline font-bold text-secondary px-1 flex items-center gap-2">
              <PartyPopper className="w-4 h-4" /> ปลดหนี้แล้ว ({paidDebts.length})
            </h3>
            {paidDebts.map(debt => {
              const Icon = getDebtIcon(debt)
              return (
                <Card key={debt.id} className="opacity-70">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary-50 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-secondary" style={{ width: 18, height: 18 }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary line-through">{debt.name}</p>
                      <p className="text-xs text-secondary">ปลดหนี้สำเร็จ 🎉</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-7 text-xs text-error hover:bg-error-50" onClick={() => handleDelete(debt.id)}>
                      ลบ
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Add button */}
        {activeDebts.length > 0 && (
          <Card
            className="border-dashed border-2 border-border hover:border-primary/30 hover:bg-primary-50/20 transition-all cursor-pointer group"
            onClick={() => { setForm(emptyForm); setShowAddDialog(true) }}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                  <Plus className="w-4.5 h-4.5 text-text-tertiary group-hover:text-primary transition-colors" style={{ width: 18, height: 18 }} />
                </div>
                <p className="font-semibold text-sm text-text-primary">เพิ่มหนี้ใหม่</p>
              </div>
              <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        )}

        {/* Motivation */}
        <Card className="bg-gradient-to-r from-secondary-50/50 to-white border-secondary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-teal-400 flex items-center justify-center shrink-0 shadow-sm">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-secondary text-sm">อย่าท้อนะ!</p>
              <p className="text-xs text-text-secondary">การมีแผนและทำตามแผน คือก้าวที่สำคัญที่สุด 💪</p>
            </div>
          </CardContent>
        </Card>

      </main>
      <BottomNav />
      <Toast toast={toast} onHide={hideToast} />

      {/* Add dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">เพิ่มหนี้ใหม่</DialogTitle>
            <DialogDescription>บันทึกยอดหนี้และข้อมูลการผ่อน</DialogDescription>
          </DialogHeader>
          <DebtForm onSubmit={handleAdd} submitLabel="เพิ่มหนี้" />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">แก้ไขหนี้</DialogTitle>
            <DialogDescription>{selectedDebt?.name}</DialogDescription>
          </DialogHeader>
          <DebtForm onSubmit={handleEdit} submitLabel="บันทึกการแก้ไข" />
        </DialogContent>
      </Dialog>

      {/* Pay dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">บันทึกการผ่อนชำระ</DialogTitle>
            <DialogDescription>{selectedDebt?.name}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="text-center">
              <p className="text-3xl font-headline font-extrabold text-error">
                ฿{(selectedDebt?.balance || 0).toLocaleString()}
              </p>
              <p className="text-text-tertiary text-sm">ยอดหนี้คงเหลือ</p>
            </div>
            {selectedDebt?.originalBalance > 0 && (
              <div>
                <div className="flex justify-between text-xs text-text-tertiary mb-1">
                  <span>ชำระแล้ว</span>
                  <span>{Math.round(((selectedDebt.originalBalance - selectedDebt.balance) / selectedDebt.originalBalance) * 100)}%</span>
                </div>
                <Progress
                  value={Math.round(((selectedDebt.originalBalance - selectedDebt.balance) / selectedDebt.originalBalance) * 100)}
                  className="h-2"
                  indicatorClassName="bg-gradient-to-r from-secondary to-teal-400"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-text-primary">฿</span>
              <Input
                type="number"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder="0"
                className="text-center text-lg font-bold h-12"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1000, 5000, selectedDebt?.minPayment || 1500].map(amount => (
                <Button key={amount} variant="outline" size="sm" onClick={() => setPayAmount(amount.toString())}>
                  ฿{amount.toLocaleString()}
                </Button>
              ))}
            </div>
            {payAmount && parseFloat(payAmount) >= (selectedDebt?.balance || 0) && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary-50 text-secondary text-sm">
                <PartyPopper className="w-4 h-4 shrink-0" />
                จำนวนนี้จะปลดหนี้ "{selectedDebt?.name}" ได้เลย!
              </div>
            )}
            <Button
              className="w-full bg-gradient-to-r from-secondary to-teal-400 border-0"
              onClick={handlePay}
              disabled={!payAmount || submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการจ่าย'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
