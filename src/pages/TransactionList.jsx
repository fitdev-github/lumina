import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  UtensilsCrossed,
  Car,
  Zap,
  Heart,
  ShoppingBag,
  Receipt,
  CreditCard,
  ChevronDown,
  Trash2,
  Wallet,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { useTransactions } from '@/hooks/useTransactions'

const categoryConfig = {
  // English IDs (from AddTransaction)
  food: { icon: UtensilsCrossed, color: 'text-warning', bgColor: 'bg-warning-50' },
  transport: { icon: Car, color: 'text-primary', bgColor: 'bg-primary-50' },
  bills: { icon: Receipt, color: 'text-accent', bgColor: 'bg-accent-50' },
  shopping: { icon: ShoppingBag, color: 'text-primary', bgColor: 'bg-primary-50' },
  utilities: { icon: Zap, color: 'text-secondary', bgColor: 'bg-secondary-50' },
  health: { icon: Heart, color: 'text-error', bgColor: 'bg-error-50' },
  home: { icon: Wallet, color: 'text-orange-500', bgColor: 'bg-orange-50' },
  salary: { icon: Wallet, color: 'text-secondary', bgColor: 'bg-secondary-50' },
  freelance: { icon: Zap, color: 'text-primary', bgColor: 'bg-primary-50' },
  bonus: { icon: Sparkles, color: 'text-accent', bgColor: 'bg-accent-50' },
  investment: { icon: TrendingUp, color: 'text-warning', bgColor: 'bg-warning-50' },
  other: { icon: CreditCard, color: 'text-text-secondary', bgColor: 'bg-surface-200' },
  // Thai labels (legacy)
  'อาหาร': { icon: UtensilsCrossed, color: 'text-warning', bgColor: 'bg-warning-50' },
  'เดินทาง': { icon: Car, color: 'text-primary', bgColor: 'bg-primary-50' },
  'บิล': { icon: Receipt, color: 'text-accent', bgColor: 'bg-accent-50' },
  'ช้อปปิ้ง': { icon: ShoppingBag, color: 'text-primary', bgColor: 'bg-primary-50' },
  'สาธารณูปโภค': { icon: Zap, color: 'text-secondary', bgColor: 'bg-secondary-50' },
  'สุขภาพ': { icon: Heart, color: 'text-error', bgColor: 'bg-error-50' },
  'รายได้': { icon: TrendingUp, color: 'text-secondary', bgColor: 'bg-secondary-50' },
  'เงินเดือน': { icon: Wallet, color: 'text-secondary', bgColor: 'bg-secondary-50' },
  'โบนัส': { icon: Sparkles, color: 'text-secondary', bgColor: 'bg-secondary-50' },
  'อื่นๆ': { icon: CreditCard, color: 'text-text-secondary', bgColor: 'bg-surface-200' },
}

const monthNames = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
]

export default function TransactionList() {
  const navigate = useNavigate()
  const { transactions, loading, deleteTransaction, totals } = useTransactions()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [expandedMonth, setExpandedMonth] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = !searchQuery || 
        (t.note || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.category || '').toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = filterType === 'all' || t.type === filterType
      
      if (filterMonth === 'all') return matchesSearch && matchesType
      
      const txDate = new Date(t.date || t.createdAt)
      const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`
      return matchesSearch && matchesType && txMonth === filterMonth
    })
  }, [transactions, searchQuery, filterType, filterMonth])

  const groupedByMonth = useMemo(() => {
    const groups = {}
    filteredTransactions.forEach(t => {
      const date = new Date(t.date || t.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!groups[key]) {
        groups[key] = {
          transactions: [],
          totalIncome: 0,
          totalExpense: 0
        }
      }
      groups[key].transactions.push(t)
      if (t.type === 'income') {
        groups[key].totalIncome += t.amount || 0
      } else {
        groups[key].totalExpense += Math.abs(t.amount || 0)
      }
    })
    
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]) => {
        const [year, month] = key.split('-')
        return {
          key,
          year: parseInt(year),
          month: parseInt(month),
          label: `${monthNames[parseInt(month) - 1]} ${parseInt(year) + 543}`,
          ...data
        }
      })
  }, [filteredTransactions])

  const availableMonths = useMemo(() => {
    const months = new Set()
    transactions.forEach(t => {
      const date = new Date(t.date || t.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months.add(key)
    })
    return Array.from(months).sort().reverse()
  }, [transactions])

  const handleDelete = async (id) => {
    await deleteTransaction(id)
    setConfirmDeleteId(null)
  }

  const formatAmount = (amount, type) => {
    const prefix = type === 'income' ? '+' : '-'
    return `${prefix}฿${Math.abs(amount).toLocaleString()}`
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="รายการทั้งหมด" onClose={() => navigate(-1)} back={true} showProfile={false} />
      
      <main className="max-w-lg mx-auto px-5 pt-24 pb-32">
        
        {/* Summary Card */}
        <Card className="mb-4 bg-gradient-to-br from-primary to-accent text-white border-0 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/80 text-sm">ยอดรวมทั้งหมด</p>
              <Badge className="bg-white/20 text-white border-0">
                {filteredTransactions.length} รายการ
              </Badge>
            </div>
            <p className="text-3xl font-headline font-bold mb-3">
              ฿{totals.balance.toLocaleString()}
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">รายได้ ฿{totals.income.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">รายจ่าย ฿{totals.expense.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Filter */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <Input
              placeholder="ค้นหารายการ..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-border bg-white text-sm"
            >
              <option value="all">ทุกประเภท</option>
              <option value="income">รายรับ</option>
              <option value="expense">รายจ่าย</option>
            </select>
            
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-border bg-white text-sm"
            >
              <option value="all">ทุกเดือน</option>
              {availableMonths.map(month => {
                const [year, m] = month.split('-')
                return (
                  <option key={month} value={month}>
                    {monthNames[parseInt(m) - 1]} {parseInt(year) + 543}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Transaction List by Month */}
        {groupedByMonth.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-text-secondary mb-2">ไม่พบรายการ</p>
            <p className="text-text-tertiary text-sm">ลองเปลี่ยนตัวกรองหรือค้นหาใหม่</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupedByMonth.map(group => (
              <div key={group.key}>
                {/* Month Header */}
                <button
                  onClick={() => setExpandedMonth(expandedMonth === group.key ? null : group.key)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white shadow-sm mb-2"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-text-primary">{group.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-text-tertiary">
                        <span className="text-secondary">+{group.totalIncome.toLocaleString()}</span>
                        {' / '}
                        <span className="text-error">-{group.totalExpense.toLocaleString()}</span>
                      </p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-text-tertiary transition-transform ${expandedMonth === group.key ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Transactions */}
                {expandedMonth === group.key && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    {group.transactions.map(tx => {
                      const config = categoryConfig[tx.category] || categoryConfig['อื่นๆ']
                      const Icon = config.icon
                      return (
                        <Card key={tx.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-text-primary truncate">
                                  {tx.note || tx.category || 'รายการ'}
                                </p>
                                <p className="text-xs text-text-tertiary">
                                  {tx.category} • {formatDate(tx.date || tx.createdAt)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className={`font-bold ${tx.type === 'income' ? 'text-secondary' : 'text-text-primary'}`}>
                                  {formatAmount(tx.amount, tx.type)}
                                </p>
                                {confirmDeleteId === tx.id ? (
                                  <div className="flex gap-1 mt-1">
                                    <button
                                      onClick={() => handleDelete(tx.id)}
                                      className="text-xs text-white bg-error rounded px-1.5 py-0.5"
                                    >
                                      ยืนยัน
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="text-xs text-text-tertiary hover:text-text-primary"
                                    >
                                      ยกเลิก
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId(tx.id)}
                                    className="text-xs text-error hover:underline mt-1"
                                  >
                                    ลบ
                                  </button>
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
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
