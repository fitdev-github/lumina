import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, ShoppingBag, UtensilsCrossed, Zap, AlertTriangle, CalendarDays, Sparkles, Check, Settings, ArrowRight, Plus, Loader2, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { useTransactions } from '@/hooks'

const categoryConfig = {
  food: { icon: UtensilsCrossed, label: 'อาหาร', gradient: 'from-warning to-warning-400', iconBg: 'bg-warning-50 text-warning' },
  transport: { icon: Car, label: 'เดินทาง', gradient: 'from-primary to-accent', iconBg: 'bg-primary-50 text-primary' },
  bills: { icon: ShoppingBag, label: 'บิล', gradient: 'from-accent to-purple-400', iconBg: 'bg-accent-50 text-accent' },
  shopping: { icon: ShoppingBag, label: 'ช้อปปิ้ง', gradient: 'from-primary to-primary-600', iconBg: 'bg-primary-50 text-primary' },
  utilities: { icon: Zap, label: 'สาธารณูปโภค', gradient: 'from-secondary to-secondary-600', iconBg: 'bg-secondary-50 text-secondary' },
  health: { icon: UtensilsCrossed, label: 'สุขภาพ', gradient: 'from-red-400 to-red-500', iconBg: 'bg-red-50 text-red-500' },
}

const DEFAULT_BUDGETS = {
  food: 4500,
  transport: 3000,
  utilities: 2000,
  shopping: 5000,
  bills: 2500,
  health: 1500,
}

export default function BudgetTracking() {
  const navigate = useNavigate()
  const { transactions, loading } = useTransactions()
  const [showDialog, setShowDialog] = useState(false)
  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem('lumina_budgets')
      return saved ? JSON.parse(saved) : DEFAULT_BUDGETS
    } catch {
      return DEFAULT_BUDGETS
    }
  })

  const [newBudget, setNewBudget] = useState({
    category: 'food',
    amount: '',
  })

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const monthlyExpenses = useMemo(() => {
    return transactions.filter(t => {
      if (t.type !== 'expense') return false
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
  }, [transactions, currentMonth, currentYear])

  const byCategory = useMemo(() => {
    const grouped = monthlyExpenses.reduce((acc, t) => {
      const cat = t.category || 'other'
      if (!acc[cat]) acc[cat] = 0
      acc[cat] += Math.abs(t.amount || 0)
      return acc
    }, {})

    return Object.entries(grouped).map(([category, spent]) => {
      const config = categoryConfig[category] || { icon: ShoppingBag, label: category, gradient: 'from-primary to-accent', iconBg: 'bg-primary-50 text-primary' }
      return {
        id: category,
        spent,
        ...config,
      }
    })
  }, [monthlyExpenses])

  const saveBudget = () => {
    if (!newBudget.amount) return
    const updated = { ...budgets, [newBudget.category]: parseFloat(newBudget.amount) }
    setBudgets(updated)
    localStorage.setItem('lumina_budgets', JSON.stringify(updated))
    setNewBudget({ category: 'food', amount: '' })
    setShowDialog(false)
  }

  const totalBudget = Object.values(budgets).reduce((sum, val) => sum + val, 0)
  const totalSpent = byCategory.reduce((sum, cat) => sum + cat.spent, 0)
  const remaining = totalBudget - totalSpent
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  const aiInsight = useMemo(() => {
    if (totalSpent === 0) {
      return {
        badge: 'เริ่มต้น',
        message: 'เริ่มบันทึกรายจ่ายวันนี้ เพื่อให้ลูมิน่าช่วยวิเคราะห์ให้ค่ะ 😊',
        savings: 0,
      }
    }
    
    const avgDaily = totalSpent / new Date().getDate()
    const projectedMonthly = avgDaily * 30
    const diff = totalBudget - projectedMonthly
    
    if (diff > 0) {
      return {
        badge: 'ทำได้ดี!',
        message: `ถ้ารักษาการใช้จ่ายแบบนี้ จะประหยัดได้ ฿${Math.round(diff).toLocaleString()} ค่ะ 😊`,
        savings: Math.round(diff),
      }
    } else {
      return {
        badge: 'ระวังนะคะ',
        message: `คาดว่าจะเกินงบ ฿${Math.abs(Math.round(diff)).toLocaleString()} ลองลดค่าใช้จ่ายบางอย่างนะคะ`,
        savings: 0,
      }
    }
  }, [totalSpent, totalBudget])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="งบประมาณ" onClose={() => navigate(-1)} back={true} showProfile={false} />
      <main className="max-w-lg mx-auto px-5 pt-24 pb-32">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3 shadow-lg shadow-primary/25">
            <CalendarDays className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-headline text-2xl font-bold text-text-primary">งบประมาณเดือนนี้</h1>
          <p className="text-text-secondary text-sm mt-1">บริหารเงินอย่างชาญฉลาด 💡</p>
        </div>

        {/* Overall Status Card */}
        <Card className="mb-6 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary via-primary-600 to-accent text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm mb-1">ใช้ไปแล้ว</p>
                <h2 className="text-3xl font-headline font-extrabold">
                  {totalSpent.toLocaleString()} <span className="text-lg text-white/70 font-medium">/ {totalBudget.toLocaleString()} ฿</span>
                </h2>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-sm">เหลือ</p>
                <p className={`text-2xl font-headline font-bold ${remaining >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {remaining >= 0 ? remaining.toLocaleString() : Math.abs(remaining).toLocaleString()} ฿
                </p>
              </div>
            </div>
            <Progress value={Math.min(overallPct, 100)} className="h-3 bg-white/20" indicatorClassName="bg-white" />
            <p className="text-sm text-white/80 mt-3">
              {Math.max(0, 100 - overallPct)}% ของงบยังเหลือใช้ • ผ่านไปแล้ว {new Date().getDate()} วัน
            </p>
          </CardContent>
        </Card>

        {/* AI Insight */}
        <Card className="mb-6 bg-gradient-to-r from-secondary-50/50 to-white border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-secondary-600 flex items-center justify-center shrink-0 shadow-md shadow-secondary/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="success" className="text-xs">{aiInsight.badge}</Badge>
                </div>
                <p className="text-sm text-text-primary leading-relaxed">
                  {aiInsight.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Categories */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline font-bold text-text-primary">หมวดหมู่</h3>
            <Button variant="ghost" size="sm" className="text-primary" onClick={() => setShowDialog(true)}>
              <Settings className="w-4 h-4 mr-1" />
              ตั้งค่า
            </Button>
          </div>
          
          {byCategory.length === 0 ? (
            <Card className="p-6 text-center border-0 shadow-md">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-headline font-bold text-text-primary mb-2">ยังไม่มีรายจ่ายเดือนนี้</h3>
              <p className="text-text-secondary text-sm">เริ่มบันทึกรายจ่ายเพื่อติดตามงบประมาณ</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {byCategory.map(({ id, icon: Icon, label, spent, gradient, iconBg }) => {
                const budget = budgets[id] || 500
                const pct = Math.round((spent / budget) * 100)
                const isOver = pct >= 100
                const isWarning = pct >= 80 && pct < 100
                
                return (
                  <Card 
                    key={id} 
                    className={`transition-all duration-200 ${isWarning ? 'border-warning/30' : ''} ${isOver ? 'border-error/30' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-text-primary">{label}</span>
                            </div>
                            {isOver && (
                              <Badge variant="error" className="text-[10px]">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                เกินงบ!
                              </Badge>
                            )}
                            {isWarning && !isOver && (
                              <Badge variant="warning" className="text-[10px]">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                ใกล้ถึงขีดจำกัด
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className={`font-bold ${isOver ? 'text-error' : 'text-text-primary'}`}>
                              {spent.toLocaleString()} ฿
                            </span>
                            <span className="text-text-tertiary">/ {budget.toLocaleString()} ฿</span>
                          </div>
                          
                          <Progress 
                            value={Math.min(pct, 100)} 
                            className="h-2" 
                            indicatorClassName={`bg-gradient-to-r ${gradient} ${isWarning ? 'animate-pulse' : ''}`} 
                          />
                          
                          {isWarning && !isOver && (
                            <p className="text-xs text-warning mt-2">
                              เหลือ {(budget - spent).toLocaleString()} ฿ ({Math.round((budget - spent) / Math.max(1, 30 - new Date().getDate()))} ฿/วัน)
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Tips Section */}
        <Card className="border-dashed border-2 border-border">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-text-primary">ต้องการปรับงบไหม?</p>
                <p className="text-xs text-text-tertiary">ลูมิน่าช่วยวิเคราะห์ให้อัตโนมัติ</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-primary">
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>

        {/* Motivational Message */}
        <Card className="mt-6 p-5 bg-gradient-to-r from-primary-50/50 to-white border-primary/20">
          <CardContent className="p-0 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-primary text-sm mb-0.5">ทำได้ดีมาก!</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                {totalSpent > 0
                  ? `คุณใช้ไปแล้ว ${overallPct}% ของงบเดือนนี้ • อัปเดตงบได้ที่ปุ่มตั้งค่า 💪`
                  : `เริ่มบันทึกรายจ่ายวันนี้ เพื่อติดตามความสำเร็จของคุณ 💪`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <BottomNav />

      {/* Settings Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">ตั้งค่างบประมาณ</DialogTitle>
            <DialogDescription>กำหนดงบประมาณรายเดือนสำหรับแต่ละหมวดหมู่</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">หมวดหมู่</label>
              <select
                value={newBudget.category}
                onChange={e => setNewBudget({ ...newBudget, category: e.target.value })}
                className="w-full p-3 rounded-lg border border-border bg-white text-text-primary"
              >
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">งบประมาณ (฿)</label>
              <Input
                type="number"
                value={newBudget.amount}
                onChange={e => setNewBudget({ ...newBudget, amount: e.target.value })}
                placeholder={DEFAULT_BUDGETS[newBudget.category]?.toString() || '500'}
              />
            </div>

            <p className="text-xs text-text-tertiary">
              💡 งบประมาณปัจจุบัน: ฿{(budgets[newBudget.category] || 500).toLocaleString()}
            </p>

            <Button className="w-full" onClick={saveBudget} disabled={!newBudget.amount}>
              บันทึก
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
