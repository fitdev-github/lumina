import { TrendingUp, TrendingDown, Plus, ArrowRightLeft, FileText, HeadphonesIcon, CreditCard, Home, PiggyBank, TrendingUp as ChartIcon, Wallet, Sparkles, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

export default function Dashboard() {
  const accounts = [
    { label: 'บัญชีกระแส', value: '฿240,000', icon: Wallet, color: 'text-primary' },
    { label: 'เงินออม', value: '฿850,000', icon: PiggyBank, color: 'text-secondary' },
    { label: 'การลงทุน', value: '฿330,500', icon: ChartIcon, color: 'text-accent' },
    { label: 'เงินสด', value: '฿0', icon: Wallet, color: 'text-text-tertiary' },
  ]

  const spendingCategories = [
    { label: 'อาหารและเครื่องดื่ม', spent: '฿14,000', budget: '฿12,000', pct: 85, isOver: true },
    { label: 'การเดินทาง', spent: '฿4,200', budget: '฿8,000', pct: 52, isOver: false },
    { label: 'ไลฟ์สไตล์', spent: '฿18,500', budget: '฿25,000', pct: 74, isOver: false },
  ]

  const debts = [
    { icon: CreditCard, name: 'บัตรเครดิตแพลทินัม', sub: 'ครบกำหนด 5 วัน', amount: '฿42,300', color: 'bg-primary-50 text-primary' },
    { icon: Home, name: 'สินเชื่อบ้าน', sub: 'ดอกเบี้ยคงที่ 2.4%', amount: '฿4.2M', color: 'bg-accent-50 text-accent' },
  ]

  const quickActions = [
    { icon: Plus, label: 'เพิ่มรายการ', color: 'bg-primary-50 text-primary', hover: 'hover:bg-primary-100' },
    { icon: ArrowRightLeft, label: 'โอนเงิน', color: 'bg-accent-50 text-accent', hover: 'hover:bg-accent-100' },
    { icon: FileText, label: 'ดูรายงาน', color: 'bg-secondary-50 text-secondary', hover: 'hover:bg-secondary-100' },
    { icon: HeadphonesIcon, label: 'ติดต่อสอบถาม', color: 'bg-warning-50 text-warning', hover: 'hover:bg-warning-100' },
  ]

  return (
    <div className="bg-gradient-to-br from-surface via-surface-50 to-white min-h-screen">
      <TopBar />
      <main className="page-top pb-32 px-5 max-w-7xl mx-auto space-y-6">
        
        {/* AI Insights Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary-50/50 via-white to-accent-50/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <Badge variant="gradient">ข้อเสนอแนะอัจฉริยะ</Badge>
                </div>
                <p className="text-lg md:text-xl font-headline font-bold text-text-primary leading-relaxed">
                  คุณใช้จ่ายไป <span className="text-primary">40% กับอาหาร</span> เดือนนี้
                  ลองลดการใช้ <span className="italic text-text-secondary">Grab</span> เพื่อประหยัดได้{' '}
                  <Badge variant="success" className="text-base px-3 py-1">฿1,500</Badge>
                </p>
              </div>
              <Button className="shrink-0">
                <Sparkles className="w-4 h-4" />
                ดูรายจ่าย
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2 p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary via-accent to-transparent rounded-full blur-3xl" />
            </div>
            <CardContent className="p-0 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">ยอดรวม</span>
                <Badge variant="success" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12.4%
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-headline font-extrabold mt-2 tracking-tight text-text-primary">
                ฿1,420,500<span className="text-2xl text-text-tertiary font-medium">.00</span>
              </h1>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                {accounts.map(({ label, value, icon: Icon, color }) => (
                  <div 
                    key={label} 
                    className="p-4 rounded-xl bg-surface-100 border border-transparent hover:border-primary/10 hover:bg-primary-50/30 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span className="text-xs text-text-tertiary font-medium">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Savings Goal Card */}
          <Card className="p-6">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center">
                  <span className="text-xl">🏠</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-text-primary">กองทุนบ้านในฝัน</h3>
                  <p className="text-xs text-text-tertiary">เป้าหมาย: ฿5,000,000</p>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-4xl font-headline font-extrabold text-text-primary">17%</span>
                  <Badge variant="default">฿850,000</Badge>
                </div>
                <Progress value={17} className="h-3" indicatorClassName="bg-gradient-to-r from-primary to-accent" />
              </div>
              
              <Button variant="outline" className="w-full mt-5">
                <Settings className="w-4 h-4" />
                ออมอัตโนมัติ
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Spending & Debts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Spending Velocity */}
          <Card className="lg:col-span-3 p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-headline font-bold text-text-primary">ความเร็วรายเดือน</h3>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-text-tertiary">ใช้ไป</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-300" />
                    <span className="text-text-tertiary">งบ</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-5">
                {spendingCategories.map(({ label, spent, budget, pct, isOver }) => (
                  <div key={label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-text-primary">{label}</span>
                      <span className="text-text-tertiary">{spent} / {budget}</span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={pct} 
                        className="h-2.5" 
                        indicatorClassName={isOver ? "bg-gradient-to-r from-error to-warning" : "bg-gradient-to-r from-primary to-accent"} 
                      />
                      {isOver && (
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-error flex items-center justify-center shadow-sm">
                          <TrendingDown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Debts Card */}
          <Card className="lg:col-span-2 p-6">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-error-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-error" />
                </div>
                <h3 className="font-headline font-bold text-text-primary">หนี้สิน</h3>
              </div>
              
              <div className="space-y-3">
                {debts.map(({ icon: Icon, name, sub, amount, color }) => (
                  <div 
                    key={name} 
                    className="p-4 rounded-xl bg-surface-100 hover:bg-surface-200 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{name}</p>
                          <p className="text-xs text-text-tertiary">{sub}</p>
                        </div>
                      </div>
                      <span className="font-bold text-text-primary group-hover:text-primary transition-colors">{amount}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-5 pt-5 border-t border-border-subtle">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-tertiary">รวมหนี้</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-headline font-extrabold text-error">฿4,242,300</span>
                    <TrendingDown className="w-5 h-5 text-error" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-secondary-50 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-secondary" />
              </div>
              <h3 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">การทำงานด่วน</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map(({ icon: Icon, label, color, hover }) => (
                <Button
                  key={label}
                  variant="ghost"
                  className={`h-auto flex-col py-4 px-3 ${hover} transition-all duration-200`}
                >
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-text-primary">{label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  )
}
