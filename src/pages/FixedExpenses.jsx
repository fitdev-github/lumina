import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Car, Home, Shield, Tv, Zap, CreditCard, DollarSign, PiggyBank,
  Plus, Pencil, Trash2, Check, X, Loader2, Wallet, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import Toast, { useToast } from '@/components/Toast'
import { useFixedExpenses } from '@/hooks'

const expenseCategories = [
  { id: 'savings', icon: PiggyBank, label: 'ออมเงิน', color: 'from-secondary to-teal-400', isSavings: true },
  { id: 'car', icon: Car, label: 'ผ่อนรถ', color: 'from-primary to-accent' },
  { id: 'rent', icon: Home, label: 'ค่าเช่า/ผ่อนบ้าน', color: 'from-blue-400 to-blue-600' },
  { id: 'insurance', icon: Shield, label: 'ประกัน', color: 'from-accent to-purple-400' },
  { id: 'subscription', icon: Tv, label: 'ค่าสมาชิก', color: 'from-pink-400 to-pink-500' },
  { id: 'utility', icon: Zap, label: 'ค่าสาธารณูปโภค', color: 'from-warning to-warning-400' },
  { id: 'loan', icon: CreditCard, label: 'สินเชื่อ/กู้', color: 'from-error to-pink-400' },
  { id: 'other', icon: DollarSign, label: 'อื่นๆ', color: 'from-slate-400 to-slate-500' },
]

const dueDays = Array.from({ length: 31 }, (_, i) => i + 1)

export default function FixedExpenses() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()
  const {
    fixedExpenses, monthlySalary, totalFixed, freeMoney,
    loading, saveSalary, addExpense, updateExpense, removeExpense,
  } = useFixedExpenses()

  const [salaryInput, setSalaryInput] = useState('')
  const [editingSalary, setEditingSalary] = useState(false)

  // Sync salaryInput when monthlySalary loads from Firestore
  useEffect(() => {
    if (monthlySalary > 0) setSalaryInput(monthlySalary.toString())
  }, [monthlySalary])
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    name: '',
    amount: '',
    dueDay: 1,
    category: 'other',
  })

  const openAdd = () => {
    setEditingId(null)
    setForm({ name: '', amount: '', dueDay: 1, category: 'other' })
    setShowDialog(true)
  }

  const openEdit = (expense) => {
    setEditingId(expense.id)
    setForm({
      name: expense.name || '',
      amount: expense.amount?.toString() || '',
      dueDay: expense.dueDay || 1,
      category: expense.category || 'other',
    })
    setShowDialog(true)
  }

  const handleSaveSalary = async () => {
    setSubmitting(true)
    try {
      await saveSalary(salaryInput)
      setEditingSalary(false)
      showToast('บันทึกเงินเดือนสำเร็จ!')
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.name || !form.amount) return
    setSubmitting(true)
    try {
      const data = {
        name: form.name,
        amount: parseFloat(form.amount),
        dueDay: parseInt(form.dueDay),
        category: form.category,
      }
      if (editingId) {
        await updateExpense(editingId, data)
        showToast('อัปเดตสำเร็จ!')
      } else {
        await addExpense(data)
        showToast('เพิ่มรายจ่ายประจำสำเร็จ!')
      }
      setShowDialog(false)
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await removeExpense(id)
      setConfirmDeleteId(null)
      showToast('ลบแล้ว')
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    }
  }

  const getCategoryInfo = (id) =>
    expenseCategories.find(c => c.id === id) || expenseCategories[expenseCategories.length - 1]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="รายจ่ายประจำ" onClose={() => navigate(-1)} back={true} showProfile={false} />

      <main className="max-w-lg mx-auto px-5 pt-24 pb-32 space-y-5">

        {/* Salary Card */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="h-1.5 bg-gradient-to-r from-secondary to-teal-400" />
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-secondary-50 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-text-tertiary uppercase tracking-wider">เงินเดือน (ต่อเดือน)</p>
                {!editingSalary ? (
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-headline font-extrabold text-text-primary">
                      {monthlySalary > 0 ? `฿${monthlySalary.toLocaleString()}` : 'ยังไม่ได้ตั้ง'}
                    </p>
                    <button
                      onClick={() => { setSalaryInput(monthlySalary.toString()); setEditingSalary(true) }}
                      className="p-1 rounded-lg hover:bg-surface-100 text-text-tertiary hover:text-primary transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-text-tertiary">฿</span>
                    <Input
                      type="number"
                      value={salaryInput}
                      onChange={e => setSalaryInput(e.target.value)}
                      placeholder="35000"
                      className="h-9 text-lg font-bold"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveSalary}
                      disabled={submitting}
                      className="p-1.5 rounded-lg bg-secondary text-white hover:bg-secondary-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingSalary(false)}
                      className="p-1.5 rounded-lg bg-surface-100 text-text-tertiary transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {monthlySalary > 0 && (
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border-subtle">
                <div className="text-center">
                  <p className="text-xs text-text-tertiary mb-1">รายจ่ายคงที่</p>
                  <p className="text-lg font-bold text-error">-฿{totalFixed.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-text-tertiary mb-1">เงินอิสระ</p>
                  <p className={`text-lg font-bold ${freeMoney >= 0 ? 'text-secondary' : 'text-error'}`}>
                    ฿{freeMoney.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fixed Expenses List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline font-bold text-text-primary">รายจ่ายคงที่ทุกเดือน</h2>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" />
              เพิ่ม
            </Button>
          </div>

          {fixedExpenses.length === 0 ? (
            <Card
              className="border-dashed border-2 border-border hover:border-primary/30 transition-all cursor-pointer"
              onClick={openAdd}
            >
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-text-tertiary" />
                </div>
                <p className="font-semibold text-text-primary mb-1">เพิ่มรายจ่ายประจำ</p>
                <p className="text-sm text-text-tertiary">เช่น ผ่อนรถ ค่าเช่า ประกัน</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {fixedExpenses.map((expense) => {
                const cat = getCategoryInfo(expense.category)
                const CatIcon = cat.icon
                return (
                  <Card key={expense.id} className="overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${cat.color}`} />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shrink-0 shadow-sm`}>
                          <CatIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-text-primary">{expense.name}</p>
                          <p className="text-xs text-text-tertiary">ทุกวันที่ {expense.dueDay} ของเดือน</p>
                        </div>
                        <p className="text-lg font-bold text-text-primary mr-2">
                          ฿{(expense.amount || 0).toLocaleString()}
                        </p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(expense)}
                            className="p-1.5 rounded-lg hover:bg-surface-100 text-text-tertiary hover:text-primary transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {confirmDeleteId === expense.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="px-2 py-1 text-xs bg-error text-white rounded-lg"
                              >
                                ลบ
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-xs bg-surface-100 text-text-tertiary rounded-lg"
                              >
                                ยกเลิก
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(expense.id)}
                              className="p-1.5 rounded-lg hover:bg-error-50 text-text-tertiary hover:text-error transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Total row */}
              <div className="flex justify-between items-center px-1 py-2 border-t border-border-subtle">
                <span className="text-sm font-medium text-text-tertiary">รวมรายจ่ายคงที่/เดือน</span>
                <span className="text-xl font-headline font-extrabold text-error">
                  ฿{totalFixed.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Summary tip */}
        {monthlySalary > 0 && fixedExpenses.length > 0 && (
          <Card className="bg-gradient-to-r from-primary-50 to-white border-primary/20">
            <CardContent className="p-4">
              <p className="text-xs text-text-tertiary mb-2">สรุปงบต้นเดือน</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">เงินเดือน</span>
                  <span className="font-semibold text-secondary">+฿{monthlySalary.toLocaleString()}</span>
                </div>
                {fixedExpenses.map(e => (
                  <div key={e.id} className="flex justify-between text-text-tertiary">
                    <span>{e.name}</span>
                    <span>-฿{(e.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 border-t border-border-subtle font-bold">
                  <span className="text-text-primary">เงินอิสระ</span>
                  <span className={freeMoney >= 0 ? 'text-secondary' : 'text-error'}>
                    ฿{freeMoney.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </main>
      <BottomNav />
      <Toast toast={toast} onHide={hideToast} />

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {editingId ? 'แก้ไขรายจ่ายประจำ' : 'เพิ่มรายจ่ายประจำ'}
            </DialogTitle>
            <DialogDescription>รายจ่ายที่เกิดซ้ำทุกเดือน</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Category */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">ประเภท</label>
              <div className="grid grid-cols-4 gap-2">
                {expenseCategories.map(cat => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setForm({ ...form, category: cat.id })}
                      className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                        form.category === cat.id
                          ? 'border-primary bg-primary-50'
                          : 'border-transparent bg-surface-100 hover:border-primary/30'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${form.category === cat.id ? 'text-primary' : 'text-text-secondary'}`} />
                      <span className="text-[9px] text-center leading-tight">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">ชื่อรายการ</label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="เช่น ผ่อนรถ Toyota, ค่าเช่าห้อง"
              />
            </div>

            {/* Amount + Due day */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">จำนวน (฿)</label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="8500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">วันที่จ่าย</label>
                <select
                  value={form.dueDay}
                  onChange={e => setForm({ ...form, dueDay: parseInt(e.target.value) })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-white text-sm"
                >
                  {dueDays.map(d => (
                    <option key={d} value={d}>วันที่ {d}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!form.name || !form.amount || submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มรายจ่าย'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
