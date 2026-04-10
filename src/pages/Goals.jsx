import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flag, Plus, Plane, Car, TrendingUp, Check, Send, Sparkles, Target, ChevronRight, Trophy, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import Toast, { useToast } from '@/components/Toast'
import { useGoals } from '@/hooks'

const goalIcons = ['🏥', '✈️', '🚗', '🏠', '💻', '📱', '🎓', '💍', '🎁', '💰']
const goalGradients = [
  'from-primary to-accent',
  'from-secondary to-secondary-600',
  'from-warning to-warning-400',
  'from-pink-400 to-pink-500',
  'from-purple-400 to-purple-500',
]

export default function Goals() {
  const navigate = useNavigate()
  const { goals: firebaseGoals, loading, addGoal, addToGoal, deleteGoal } = useGoals()
  const { toast, showToast, hideToast } = useToast()
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [showDialog, setShowDialog] = useState(false)
  const [showAddMoneyDialog, setShowAddMoneyDialog] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    icon: '💰',
    gradient: goalGradients[0],
    monthlyTarget: '',
  })

  const goals = firebaseGoals.length > 0 ? firebaseGoals : []
  
  const displayGoal = selectedGoal || goals[0]
  const displayGoals = goals.length > 0 ? goals : []

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount) return
    
    setSubmitting(true)
    try {
      const targetAmount = parseFloat(newGoal.targetAmount)
      const currentAmount = parseFloat(newGoal.currentAmount) || 0
      const monthlyTarget = parseFloat(newGoal.monthlyTarget) || Math.ceil(targetAmount / 12)
      
      await addGoal({
        name: newGoal.name,
        targetAmount,
        currentAmount,
        icon: newGoal.icon,
        gradient: newGoal.gradient,
        monthlyTarget,
        status: currentAmount >= targetAmount ? 'completed' : 
                (currentAmount / targetAmount) >= 0.5 ? 'on_track' : 'behind',
        aiTip: 'เริ่มต้นการออมวันนี้ อะไรก็เป็นไปได้! 🌟',
      })
      
      setShowDialog(false)
      setNewGoal({
        name: '',
        targetAmount: '',
        currentAmount: '',
        icon: '💰',
        gradient: goalGradients[0],
        monthlyTarget: '',
      })
      showToast('สร้างเป้าหมายสำเร็จ! 🎯')
    } catch (err) {
      console.error('Failed to create goal:', err)
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGoal = async (id) => {
    try {
      await deleteGoal(id)
      if (selectedGoal?.id === id) setSelectedGoal(null)
      setConfirmDeleteId(null)
      showToast('ลบเป้าหมายสำเร็จ')
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    }
  }

  const handleAddMoney = async () => {
    if (!addAmount || !displayGoal) return

    setSubmitting(true)
    try {
      await addToGoal(displayGoal.id, parseFloat(addAmount))
      setShowAddMoneyDialog(false)
      setAddAmount('')
      showToast(`เพิ่มเงิน ฿${parseFloat(addAmount).toLocaleString()} สำเร็จ! 💪`)
    } catch (err) {
      console.error('Failed to add money:', err)
      showToast('เกิดข้อผิดพลาด กรุณาลองใหม่', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (goal) => {
    if (!goal) return null
    const pct = goal.targetAmount ? (goal.currentAmount / goal.targetAmount) * 100 : 0
    if (pct >= 100) return <Badge variant="success" className="text-xs">✓ สำเร็จ!</Badge>
    if (pct >= 50) return <Badge variant="success" className="text-xs">✓ ตรงเวลา</Badge>
    return <Badge variant="warning" className="text-xs">⚠️ ต้องเร่ง</Badge>
  }

  const getAiTip = (goal) => {
    if (!goal) return ''
    const pct = goal.targetAmount ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0
    if (pct >= 100) return 'ยินดีด้วย! คุณบรรลุเป้าหมายแล้ว! 🎉'
    if (pct >= 75) return 'ใกล้ถึงแล้ว! อีกนิดเดียวเท่านั้น! 💪'
    if (pct >= 50) return 'คุณอยู่ในเส้นทางที่ดี! ทำต่อไปนะ!'
    if (pct >= 25) return 'เริ่มต้นที่ดี! ทุกบาทมีความหมายค่ะ'
    return 'ทุกการออมเริ่มจากก้าวแรก มาเริ่มกันเถอะ!'
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
      <TopBar title="เป้าหมาย" onClose={() => navigate(-1)} back={true} showProfile={false} />
      <main className="max-w-lg mx-auto px-5 page-top pb-32">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-secondary/25">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-headline text-2xl font-bold text-text-primary">เป้าหมายของคุณ</h1>
          <p className="text-text-secondary text-sm mt-1">ทำให้ความฝันเป็นจริง 💪</p>
        </div>

        {/* Selected Goal Card */}
        {displayGoal && (
          <Card className="mb-6 overflow-hidden border-0 shadow-lg">
            <div className={`h-2 bg-gradient-to-r ${displayGoal.gradient || 'from-primary to-accent'}`} />
            <CardContent className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${displayGoal.gradient || 'from-primary to-accent'} flex items-center justify-center text-2xl shadow-lg`}>
                  {displayGoal.icon || '💰'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-headline text-xl font-bold text-text-primary">{displayGoal.name}</h2>
                    {getStatusBadge(displayGoal)}
                  </div>
                  <p className="text-3xl font-headline font-extrabold text-text-primary">
                    {(displayGoal.currentAmount || 0).toLocaleString()} 
                    <span className="text-lg text-text-tertiary font-medium"> / {(displayGoal.targetAmount || 0).toLocaleString()} ฿</span>
                  </p>
                </div>
              </div>
              
              <Progress 
                value={displayGoal.targetAmount ? (displayGoal.currentAmount / displayGoal.targetAmount) * 100 : 0} 
                className="h-3 mb-4" 
                indicatorClassName={`bg-gradient-to-r ${displayGoal.gradient || 'from-primary to-accent'}`} 
              />
              
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="text-text-tertiary">ความคืบหน้า</span>
                <span className="font-bold text-text-primary">
                  {displayGoal.targetAmount ? Math.round((displayGoal.currentAmount / displayGoal.targetAmount) * 100) : 0}%
                </span>
              </div>

              {/* AI Tip */}
              <div className={`p-4 rounded-xl bg-gradient-to-r from-primary-50/50 to-accent-50/30 border border-primary/20`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">ลูมิน่าบอก</p>
                    <p className="text-sm text-text-primary leading-relaxed">{getAiTip(displayGoal)}</p>
                  </div>
                </div>
              </div>

              <Button 
                className={`w-full mt-4 bg-gradient-to-r ${displayGoal.gradient || 'from-primary to-accent'} border-0 shadow-lg`}
                onClick={() => setShowAddMoneyDialog(true)}
              >
                <Send className="w-4 h-4" />
                เพิ่มเงิน {(displayGoal.monthlyTarget || 0).toLocaleString()} ฿
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {displayGoals.length === 0 && (
          <Card className="mb-6 p-8 text-center border-0 shadow-md">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-headline font-bold text-lg text-text-primary mb-2">ยังไม่มีเป้าหมาย</h3>
            <p className="text-text-secondary text-sm mb-4">เริ่มตั้งเป้าหมายแรกของคุณวันนี้</p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4" />
              สร้างเป้าหมายแรก
            </Button>
          </Card>
        )}

        {/* Goal List */}
        {displayGoals.length > 0 && (
          <div className="mb-6">
            <h3 className="font-headline font-bold text-text-primary mb-3">เป้าหมายทั้งหมด ({displayGoals.length})</h3>
            <div className="space-y-3">
              {displayGoals.map((goal) => {
                const pct = goal.targetAmount ? Math.round((goal.currentAmount / goal.targetAmount) * 100) : 0
                return (
                  <Card
                    key={goal.id}
                    className={`transition-all duration-200 hover:shadow-md ${selectedGoal?.id === goal.id ? 'ring-2 ring-primary/30' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3" onClick={() => setSelectedGoal(goal)}>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${goal.gradient || 'from-primary to-accent'} flex items-center justify-center text-lg shadow-sm shrink-0`}>
                          {goal.icon || '💰'}
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-text-primary">{goal.name}</span>
                            <span className={`text-sm font-bold ${pct >= 50 ? 'text-secondary' : 'text-warning'}`}>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5 mt-2" indicatorClassName={`bg-gradient-to-r ${goal.gradient || 'from-primary to-accent'}`} />
                        </div>
                      </div>
                      {confirmDeleteId === goal.id ? (
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" className="flex-1 h-8 bg-error hover:bg-error-600 border-0 text-xs" onClick={() => handleDeleteGoal(goal.id)}>
                            ยืนยันลบ
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => setConfirmDeleteId(null)}>
                            ยกเลิก
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(goal.id) }}
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-error hover:bg-error-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Add New Goal */}
        <Card 
          className="border-dashed border-2 border-border hover:border-primary/30 hover:bg-primary-50/20 transition-all duration-300 cursor-pointer group"
          onClick={() => setShowDialog(true)}
        >
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mb-3 group-hover:bg-primary-50 group-hover:scale-110 transition-all duration-300">
              <Plus className="w-6 h-6 text-text-tertiary group-hover:text-primary transition-colors" />
            </div>
            <h4 className="font-headline font-bold text-text-primary mb-1">สร้างเป้าหมายใหม่</h4>
            <p className="text-text-tertiary text-sm">คุณใฝ่ฝันอะไร? ลูมิน่าช่วยวางแผนให้</p>
          </CardContent>
        </Card>

        {/* Motivational Footer */}
        <Card className="mt-6 p-5 bg-gradient-to-r from-secondary-50 to-white border-secondary/20">
          <CardContent className="p-0 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-600 flex items-center justify-center shrink-0 shadow-lg shadow-secondary/25">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-secondary text-sm mb-0.5">ดีไม่ดี คุณทำได้!</p>
              <p className="text-xs text-text-secondary leading-relaxed">
                เฉลี่ยแล้วคนที่ตั้งเป้าหมายจะประสบความสำเร็จมากกว่า 65%
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
      <Toast toast={toast} onHide={hideToast} />

      {/* Create Goal Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">สร้างเป้าหมายใหม่</DialogTitle>
            <DialogDescription>กำหนดเป้าหมายการออมของคุณ</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">ชื่อเป้าหมาย</label>
              <Input
                value={newGoal.name}
                onChange={e => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="เช่น กองเงินฉุกเฉิน, เที่ยวญี่ปุ่น"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">จำนวนเป้าหมาย (฿)</label>
                <Input
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={e => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">เงินที่มีอยู่ (฿)</label>
                <Input
                  type="number"
                  value={newGoal.currentAmount}
                  onChange={e => setNewGoal({ ...newGoal, currentAmount: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">ออมต่อเดือน (฿)</label>
              <Input
                type="number"
                value={newGoal.monthlyTarget}
                onChange={e => setNewGoal({ ...newGoal, monthlyTarget: e.target.value })}
                placeholder="จะคำนวณอัตโนมัติถ้าไม่ใส่"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">เลือกไอคอน</label>
              <div className="flex flex-wrap gap-2">
                {goalIcons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => setNewGoal({ ...newGoal, icon })}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      newGoal.icon === icon 
                        ? 'bg-primary text-white scale-110' 
                        : 'bg-surface-100 hover:bg-primary-50'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-2 block">เลือกสี</label>
              <div className="flex flex-wrap gap-2">
                {goalGradients.map(gradient => (
                  <button
                    key={gradient}
                    onClick={() => setNewGoal({ ...newGoal, gradient })}
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} transition-all ${
                      newGoal.gradient === gradient ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            <Button 
              className="w-full" 
              onClick={handleCreateGoal}
              disabled={!newGoal.name || !newGoal.targetAmount || submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {submitting ? 'กำลังสร้าง...' : 'สร้างเป้าหมาย'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Money Dialog */}
      <Dialog open={showAddMoneyDialog} onOpenChange={setShowAddMoneyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">เพิ่มเงินเข้าเป้าหมาย</DialogTitle>
            <DialogDescription>
              {displayGoal?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="text-center mb-6">
              <span className="text-4xl">{displayGoal?.icon}</span>
              <p className="text-text-secondary text-sm mt-1">เพิ่มเงินได้เลย</p>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-4xl font-headline font-extrabold text-secondary">฿</span>
              <Input
                type="number"
                value={addAmount}
                onChange={e => setAddAmount(e.target.value)}
                placeholder="0"
                className="text-center text-2xl font-bold h-14"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[1000, 2000, 5000].map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setAddAmount(amount.toString())}
                >
                  {amount.toLocaleString()} ฿
                </Button>
              ))}
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-secondary to-secondary-600 border-0" 
              onClick={handleAddMoney}
              disabled={!addAmount || submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? 'กำลังบันทึก...' : 'เพิ่มเงิน'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
