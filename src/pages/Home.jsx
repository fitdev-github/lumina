import { useNavigate } from 'react-router-dom'
import { 
  Sparkles, 
  TrendingUp, 
  Plus, 
  Wallet,
  Target,
  MessageCircle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  PiggyBank,
  CreditCard,
  Receipt,
  Loader2,
  RefreshCw,
  UtensilsCrossed,
  Car,
  Zap,
  Heart,
  ShoppingBag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import BottomNav from '@/components/BottomNav'
import { useTransactions } from '@/hooks/useTransactions'
import { useGoals } from '@/hooks/useGoals'
import { useAccounts } from '@/hooks/useAccounts'
import { useAuth } from '@/contexts/AuthContext'
import { useAIInsights } from '@/contexts/AIInsightsContext'
import { useFinance } from '@/contexts/FinanceContext'
import { useMonthlyChecklist } from '@/hooks'

const categoryIcons = {
  // English IDs (saved by AddTransaction)
  'food': UtensilsCrossed,
  'transport': Car,
  'bills': Receipt,
  'shopping': ShoppingBag,
  'utilities': Zap,
  'health': Heart,
  'home': Receipt,
  'salary': Wallet,
  'freelance': Zap,
  'bonus': Sparkles,
  'investment': TrendingUp,
  // Thai fallbacks (legacy)
  'อาหาร': UtensilsCrossed,
  'เดินทาง': Car,
  'บิล': Receipt,
  'ช้อปปิ้ง': ShoppingBag,
  'สาธารณูปโภค': Zap,
  'สุขภาพ': Heart,
  'รายได้': TrendingUp,
  'เงินเดือน': Wallet,
  'โบนัส': Sparkles,
  'อื่นๆ': CreditCard,
  'income': TrendingUp,
  'other': CreditCard,
}

const categoryLabels = {
  'food': 'อาหาร',
  'transport': 'เดินทาง',
  'bills': 'บิล',
  'shopping': 'ช้อปปิ้ง',
  'utilities': 'สาธารณูปโภค',
  'health': 'สุขภาพ',
  'home': 'บ้าน',
  'salary': 'เงินเดือน',
  'freelance': 'ฟรีแลนซ์',
  'bonus': 'โบนัส',
  'investment': 'ลงทุน',
  'income': 'รายรับ',
  'other': 'อื่นๆ',
}

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { transactions, loading: txLoading, totals } = useTransactions()
  const { goals, loading: goalsLoading } = useGoals()
  const { insights, loading: insightsLoading, refreshing, refreshInsights } = useAIInsights()
  const { cashFlow } = useFinance()
  const { totalBalance } = useAccounts()
  const { doneCount, totalCount, items: checklistItems } = useMonthlyChecklist()

  const loading = txLoading || goalsLoading

  const recentTransactions = transactions.slice(0, 5).map(t => ({
    id: t.id,
    category: t.category || 'อื่นๆ',
    merchant: t.note || categoryLabels[t.category] || t.category || 'รายการ',
    amount: t.type === 'income' ? t.amount : -Math.abs(t.amount),
    time: t.date
      ? new Date(t.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
      : t.createdAt?.toDate?.()?.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) || 'ไม่ระบุ',
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border-subtle safe-area-top">
        <div className="px-5 py-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-tertiary">สวัสดีค่ะ</p>
              <h1 className="text-xl font-headline font-bold text-text-primary">
                {user?.displayName?.split(' ')[0] || 'คุณ'} 👋
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/assistant')}
                className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary hover:bg-primary-100 transition-colors relative"
              >
                <MessageCircle className="w-5 h-5" />
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-secondary rounded-full animate-pulse" />
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold"
              >
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 pb-28 pt-4 space-y-5">
        
        {/* Balance Hero */}
        {cashFlow?.hasSalary ? (
          // Salary mode: show remaining free money + daily budget
          <Card
            className={`border-0 overflow-hidden relative cursor-pointer ${cashFlow.remainingFree >= 0 ? 'bg-gradient-to-br from-primary via-primary-600 to-accent' : 'bg-gradient-to-br from-error via-red-600 to-pink-500'} text-white`}
            onClick={() => navigate('/financial-status')}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between mb-1">
                <p className="text-white/80 text-sm">ยอดเงินที่ใช้ได้คงเหลือเดือนนี้</p>
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {cashFlow.daysRemaining} วันที่เหลือ
                </Badge>
              </div>
              <h2 className="text-4xl font-headline font-extrabold tracking-tight mb-1">
                {cashFlow.remainingFree < 0 ? '-' : ''}฿{Math.abs(cashFlow.remainingFree).toLocaleString()}
              </h2>
              {cashFlow.dailyBudget > 0 && (
                <p className="text-white/90 text-sm mb-4">
                  ใช้ได้วันละ <span className="font-bold">฿{cashFlow.dailyBudget.toLocaleString()}</span>
                </p>
              )}
              <Progress
                value={cashFlow.freeMoney > 0 ? Math.min((cashFlow.thisMonthExpense / cashFlow.freeMoney) * 100, 100) : 0}
                className="h-1.5 bg-white/20 mb-4"
                indicatorClassName="bg-white"
              />
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span>อิสระ ฿{(cashFlow.freeMoney || 0).toLocaleString()}</span>
                <span className="text-white/40">·</span>
                <span>ใช้ไป ฿{(cashFlow.thisMonthExpense || 0).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        ) : (
          // No salary set: show total account balance
          <Card
            className="bg-gradient-to-br from-primary via-primary-600 to-accent text-white border-0 overflow-hidden relative cursor-pointer"
            onClick={() => navigate('/financial-status')}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-white/80 text-sm mb-1">
                {totalBalance > 0 ? 'ยอดรวมในบัญชี' : 'รายรับ-รายจ่ายสุทธิ'}
              </p>
              <h2 className="text-4xl font-headline font-extrabold tracking-tight mb-4">
                ฿{(totalBalance > 0 ? totalBalance : totals.balance).toLocaleString()}
              </h2>
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>รายได้เดือนนี้ ฿{(cashFlow?.thisMonthExpense != null ? totals.income : 0).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-white/60 text-xs mt-3">
                ตั้งค่าเงินเดือนเพื่อดูงบรายวัน →
              </p>
            </CardContent>
          </Card>
        )}

        {/* Monthly Checklist Card */}
        {totalCount > 0 && (
          <Card
            className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/checklist')}
          >
            <div className={`h-1 bg-gradient-to-r ${doneCount === totalCount ? 'from-secondary to-teal-400' : 'from-primary via-accent to-secondary'}`} />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${doneCount === totalCount ? 'text-secondary' : 'text-primary'}`} />
                  <span className="text-sm font-bold text-text-primary">รายการเดือนนี้</span>
                </div>
                <div className="flex items-center gap-2">
                  {doneCount < totalCount && (
                    <Badge variant="warning" className="text-xs">
                      เหลือ {totalCount - doneCount} รายการ
                    </Badge>
                  )}
                  {doneCount === totalCount && (
                    <Badge variant="success" className="text-xs">ครบแล้ว ✓</Badge>
                  )}
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                </div>
              </div>
              <Progress
                value={totalCount > 0 ? doneCount / totalCount * 100 : 0}
                className="h-2 mb-2"
                indicatorClassName={doneCount === totalCount ? 'bg-secondary' : 'bg-gradient-to-r from-primary to-accent'}
              />
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>ทำแล้ว {doneCount}/{totalCount} รายการ</span>
                <span>{totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button 
            onClick={() => navigate('/add', { state: { type: 'income' } })}
            className="h-auto py-4 flex-col gap-2 bg-white border border-border shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-xs font-semibold text-text-primary">รายรับ</span>
          </Button>
          <Button 
            onClick={() => navigate('/add', { state: { type: 'expense' } })}
            variant="outline" 
            className="h-auto py-4 flex-col gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-error-50 flex items-center justify-center">
              <Plus className="w-5 h-5 text-error" />
            </div>
            <span className="text-xs font-semibold text-text-primary">รายจ่าย</span>
          </Button>
          <Button 
            onClick={() => navigate('/goals')}
            variant="outline" 
            className="h-auto py-4 flex-col gap-2 shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-text-primary">เป้าหมาย</span>
          </Button>
        </div>

        {/* AI Insights Card - NEW! */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-headline font-bold text-text-primary">ลูมิน่าบอก</h2>
            </div>
            <button 
              onClick={refreshInsights}
              disabled={refreshing}
              className={`p-2 rounded-lg hover:bg-surface-100 transition-all ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4 text-text-tertiary" />
            </button>
          </div>
          
          {insightsLoading ? (
            <Card className="bg-gradient-to-r from-primary-50 to-accent-50/30">
              <CardContent className="p-6 flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-text-secondary">กำลังวิเคราะห์...</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gradient-to-r from-primary-50 via-white to-accent-50/30 border border-primary/20 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-accent to-secondary" />
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-primary font-semibold text-sm mb-1">
                      {insights.greeting}
                    </p>
                    <p className="text-text-primary text-[15px] leading-relaxed">
                      {insights.mainInsight}
                    </p>
                  </div>
                </div>

                {insights.highlight && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-secondary-50 to-transparent mb-4">
                    <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                    <p className="text-sm text-text-primary font-medium">{insights.highlight}</p>
                  </div>
                )}

                {insights.recommendations && insights.recommendations.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-text-tertiary font-medium">💡 คำแนะนำจากลูมิน่า:</p>
                    {insights.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                        <p className="text-sm text-text-secondary">{rec}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/assistant')}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    ถามลูมิน่าเพิ่ม
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-primary to-accent border-0"
                    onClick={() => navigate('/assistant')}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    คุยกับลูมิน่า
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Goals Section */}
        {goals.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-bold text-text-primary">เป้าหมายของคุณ</h2>
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/goals')}>
                ดูทั้งหมด
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-4 space-y-4">
                {goals.slice(0, 2).map((goal) => {
                  const pct = Math.round((goal.currentAmount / goal.targetAmount) * 100)
                  return (
                    <div key={goal.id} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm text-text-primary">{goal.name}</span>
                          <span className="text-sm font-bold text-primary">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" indicatorClassName="bg-gradient-to-r from-primary to-accent" />
                        <p className="text-xs text-text-tertiary mt-1">
                          {goal.currentAmount?.toLocaleString()} / {goal.targetAmount?.toLocaleString()} บาท
                        </p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Recent Transactions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-headline font-bold text-text-primary">รายการล่าสุด</h2>
            {transactions.length > 0 && (
              <Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate('/transactions')}>
                ดูทั้งหมด
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          
          {recentTransactions.length > 0 ? (
            <Card>
              <CardContent className="p-0 divide-y divide-border-subtle">
                {recentTransactions.map((tx) => {
                  const Icon = categoryIcons[tx.category] || CreditCard
                  return (
                    <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-surface-50 transition-colors">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.amount > 0 ? 'bg-secondary-50' : 'bg-surface-200'
                      }`}>
                        <Icon className={`w-5 h-5 ${tx.amount > 0 ? 'text-secondary' : 'text-text-secondary'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-text-primary">{tx.merchant}</p>
                        <p className="text-xs text-text-tertiary">{tx.time}</p>
                      </div>
                      <span className={`font-bold text-sm ${tx.amount > 0 ? 'text-secondary' : 'text-text-primary'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} ฿
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2 border-border">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-7 h-7 text-text-tertiary" />
                </div>
                <p className="font-semibold text-text-primary mb-2">ยังไม่มีรายการ</p>
                <p className="text-sm text-text-tertiary mb-4">เพิ่มรายการแรกเพื่อเริ่มติดตามการเงินของคุณ</p>
                <Button onClick={() => navigate('/add')}>
                  <Plus className="w-4 h-4" />
                  เพิ่มรายการ
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

      </main>
      <BottomNav />
    </div>
  )
}
