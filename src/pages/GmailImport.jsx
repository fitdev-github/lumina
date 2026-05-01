import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mail, Loader2, CheckCircle2, AlertCircle, ChevronRight,
  UtensilsCrossed, Car, Receipt, ShoppingBag, Zap, Heart,
  Briefcase, Gift, Home, MoreHorizontal, Wallet, Building2,
  RefreshCw, ArrowLeft, Download, Check, X, Calendar,
  Building, ChevronDown, ChevronUp, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { syncGmailTransactions } from '@/modules/gmail/sync'
import { getImportedGmailIds, batchImportGmailTransactions } from '@/firebase/services'
import { BANK_LIST } from '@/modules/gmail/query'

const TIME_RANGES = [
  { value: '1m', label: '1 เดือน' },
  { value: '3m', label: '3 เดือน' },
  { value: '6m', label: '6 เดือน' },
  { value: '1y', label: '1 ปี' },
]

function getDefaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 3)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

// ── Category config (mirrors AddTransaction) ──────────────────────────────

const CATEGORIES = {
  expense: [
    { id: 'food',      icon: UtensilsCrossed, label: 'อาหาร',        color: 'bg-warning-50 text-warning border-warning/30' },
    { id: 'transport', icon: Car,             label: 'เดินทาง',       color: 'bg-primary-50 text-primary border-primary/30' },
    { id: 'shopping',  icon: ShoppingBag,     label: 'ช้อปปิ้ง',      color: 'bg-pink-50 text-pink-500 border-pink-200' },
    { id: 'bills',     icon: Receipt,         label: 'บิล',           color: 'bg-accent-50 text-accent border-accent/30' },
    { id: 'utilities', icon: Zap,             label: 'สาธารณูปโภค',   color: 'bg-secondary-50 text-secondary border-secondary/30' },
    { id: 'health',    icon: Heart,           label: 'สุขภาพ',        color: 'bg-red-50 text-red-500 border-red-200' },
    { id: 'home',      icon: Home,            label: 'บ้าน',          color: 'bg-orange-50 text-orange-500 border-orange-200' },
    { id: 'other',     icon: MoreHorizontal,  label: 'อื่นๆ',          color: 'bg-surface-100 text-text-secondary border-border' },
  ],
  income: [
    { id: 'salary',     icon: Briefcase,      label: 'เงินเดือน',    color: 'bg-secondary-50 text-secondary border-secondary/30' },
    { id: 'freelance',  icon: Zap,            label: 'ฟรีแลนซ์',      color: 'bg-primary-50 text-primary border-primary/30' },
    { id: 'bonus',      icon: Gift,           label: 'โบนัส',         color: 'bg-accent-50 text-accent border-accent/30' },
    { id: 'investment', icon: Building2,      label: 'ลงทุน',         color: 'bg-warning-50 text-warning border-warning/30' },
    { id: 'other',      icon: MoreHorizontal, label: 'อื่นๆ',          color: 'bg-surface-100 text-text-secondary border-border' },
  ],
}

const BANK_COLORS = {
  KBank:      'bg-green-50 text-green-700 border-green-200',
  SCB:        'bg-purple-50 text-purple-700 border-purple-200',
  KTB:        'bg-blue-50 text-blue-700 border-blue-200',
  BBL:        'bg-sky-50 text-sky-700 border-sky-200',
  PromptPay:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  TrueMoney:  'bg-orange-50 text-orange-700 border-orange-200',
  unknown:    'bg-surface-100 text-text-secondary border-border',
}

const CONFIDENCE_CONFIG = {
  high:   { label: 'แม่นยำ',       color: 'bg-secondary-50 text-secondary border-secondary/30' },
  medium: { label: 'โปรดตรวจสอบ',  color: 'bg-warning-50 text-warning border-warning/30' },
  low:    { label: 'ไม่แน่ใจ',      color: 'bg-error-50 text-error border-error/30' },
}

function formatAmount(n) {
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StepLoading({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-text-secondary font-medium">{message}</p>
    </div>
  )
}

function StepOptions({
  selectedBanks,
  onBankToggle,
  onSelectAllBanks,
  onDeselectAllBanks,
  dateRange,
  onDateRangeChange,
  timeRange,
  onTimeRangeChange,
  onConfirm,
  onBack,
  dateMode,
  onDateModeChange,
}) {
  const [showBanks, setShowBanks] = useState(true)

  const selectedBankNames = selectedBanks.map(id => {
    const bank = BANK_LIST.find(b => b.id === id)
    return bank?.name || id
  }).join(', ')

  const timeRangeLabel = dateMode === 'custom'
    ? `${dateRange.from} ถึง ${dateRange.to}`
    : TIME_RANGES.find(tr => tr.value === timeRange)?.label || timeRange

  const getDayCount = () => {
    if (dateMode === 'custom') {
      const from = new Date(dateRange.from)
      const to = new Date(dateRange.to)
      return Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1
    }
    switch (timeRange) {
      case '1m': return 30
      case '3m': return 90
      case '6m': return 180
      case '1y': return 365
      default: return 90
    }
  }

  const dayCount = getDayCount()

  return (
    <>
      {/* Summary Preview */}
      <Card className="border-primary/30 bg-primary-50/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">สรุปการค้นหา</h3>
              <div className="mt-2 space-y-1 text-sm text-text-secondary">
                <p>
                  <span className="text-text-tertiary">ธนาคาร:</span>{' '}
                  <span className="font-medium text-primary">
                    {selectedBanks.length > 0 ? selectedBankNames : 'ยังไม่เลือก'}
                  </span>
                </p>
                <p>
                  <span className="text-text-tertiary">ช่วงวันที่:</span>{' '}
                  <span className="font-medium text-primary">{timeRangeLabel}</span>
                  <span className="text-text-tertiary text-xs ml-1">(ประมาณ {dayCount} วัน)</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Range Section */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text-primary">ช่วงวันที่</h3>
            </div>
          </div>

          {/* Date Mode Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button
              onClick={() => onDateModeChange('preset')}
              className={`flex-1 px-3 py-2 text-sm transition-colors ${
                dateMode === 'preset'
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-secondary hover:bg-surface-50'
              }`}
            >
              เลือกเร็ว
            </button>
            <button
              onClick={() => onDateModeChange('custom')}
              className={`flex-1 px-3 py-2 text-sm transition-colors ${
                dateMode === 'custom'
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-secondary hover:bg-surface-50'
              }`}
            >
              กำหนดเอง
            </button>
          </div>

          {dateMode === 'preset' ? (
            <div className="flex flex-wrap gap-2">
              {TIME_RANGES.map(tr => (
                <button
                  key={tr.value}
                  onClick={() => onTimeRangeChange(tr.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === tr.value
                      ? 'bg-primary text-white'
                      : 'bg-surface-100 text-text-secondary border border-border hover:bg-surface-200'
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-text-tertiary mb-1 block">จากวันที่</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={e => onDateRangeChange('from', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-text-tertiary mb-1 block">ถึงวันที่</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={e => onDateRangeChange('to', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Selection Section */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-text-primary">เลือกธนาคาร</h3>
            </div>
            <button
              onClick={() => setShowBanks(v => !v)}
              className="p-1 hover:bg-surface-100 rounded"
            >
              {showBanks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onSelectAllBanks}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-50"
            >
              เลือกทั้งหมด
            </button>
            <button
              onClick={onDeselectAllBanks}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-50"
            >
              ยกเลิกทั้งหมด
            </button>
          </div>

          {showBanks && (
            <div className="grid grid-cols-2 gap-2">
              {BANK_LIST.map(bank => {
                const isSelected = selectedBanks.includes(bank.id)
                return (
                  <button
                    key={bank.id}
                    onClick={() => onBankToggle(bank.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                      isSelected
                        ? 'bg-primary-50 border-primary text-primary'
                        : 'bg-surface-50 border-border text-text-secondary hover:bg-surface-100'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    {bank.name}
                  </button>
                )
              })}
            </div>
          )}

          <p className="text-xs text-text-tertiary">
            เลือก {selectedBanks.length} ธนาคาร
          </p>
        </CardContent>
      </Card>

      {/* Warning */}
      {selectedBanks.length > 0 && dayCount > 90 && (
        <Card className="border-warning/30 bg-warning-50/30">
          <CardContent className="p-3">
            <p className="text-sm text-warning">
              ⚠️ การค้นหามากกว่า 90 วัน อาจใช้เวลานานและดึงข้อมูลหลายรายการ
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={onConfirm}
          disabled={selectedBanks.length === 0}
          className="w-full h-12 bg-gradient-to-r from-primary to-accent border-0"
        >
          <Mail className="w-5 h-5 mr-2" />
          เริ่มค้นหา
        </Button>
        <Button
          variant="outline"
          onClick={onBack}
          className="w-full h-12"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับ
        </Button>
      </div>
    </>
  )
}

function StepFetching({ progress, banks, dateMode, timeRange, dateRange }) {
  const percent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0
  
  const selectedBankNames = banks?.map(id => {
    const bank = BANK_LIST.find(b => b.id === id)
    return bank?.name || id
  }).join(', ') || 'ทุกธนาคาร'

  const dateInfo = dateMode === 'custom'
    ? `${dateRange.from} ถึง ${dateRange.to}`
    : timeRange === '1m' ? '1 เดือน'
    : timeRange === '3m' ? '3 เดือน'
    : timeRange === '6m' ? '6 เดือน'
    : '1 ปี'

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6 px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-text-primary">กำลังดึงอีเมล...</p>
        {progress.total > 0 && (
          <p className="text-sm text-text-tertiary mt-1">
            {progress.current} / {progress.total} รายการ
          </p>
        )}
      </div>
      <div className="w-full max-w-xs">
        <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-text-tertiary text-center mt-2">{percent}%</p>
      </div>
      <div className="text-xs text-text-tertiary text-center max-w-xs space-y-1">
        <p>ธนาคาร: {selectedBankNames}</p>
        <p>ช่วงวันที่: {dateInfo}</p>
      </div>
    </div>
  )
}

function TransactionReviewCard({ transaction, isSelected, isAlreadyImported, overrides, onToggle, onEdit }) {
  const [showCategories, setShowCategories] = useState(false)

  const t = { ...transaction, ...overrides }
  const catList = CATEGORIES[t.type] || CATEGORIES.expense
  const catConfig = catList.find(c => c.id === t.category) || catList[catList.length - 1]
  const CatIcon = catConfig.icon
  const bankColor = BANK_COLORS[t.bankName] || BANK_COLORS.unknown
  const conf = CONFIDENCE_CONFIG[t.confidence] || CONFIDENCE_CONFIG.medium
  const disabled = isAlreadyImported

  return (
    <Card className={`overflow-hidden transition-all ${disabled ? 'opacity-60' : ''} ${isSelected && !disabled ? 'border-primary shadow-md' : ''}`}>
      <CardContent className="p-0">
        {/* Header row */}
        <div className="flex items-start gap-3 p-3 pb-0">
          {/* Checkbox */}
          <button
            onClick={() => !disabled && onToggle(t.gmailMessageId)}
            disabled={disabled}
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
              disabled
                ? 'border-border bg-surface-100 cursor-not-allowed'
                : isSelected
                  ? 'bg-primary border-primary'
                  : 'border-border hover:border-primary/50'
            }`}
          >
            {(isSelected || disabled) && <Check className={`w-3 h-3 ${disabled ? 'text-text-tertiary' : 'text-white'}`} />}
          </button>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {t.bankName !== 'unknown' && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${bankColor}`}>
                  {t.bankName}
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${conf.color}`}>
                {conf.label}
              </span>
              {disabled && (
                <span className="text-xs px-2 py-0.5 rounded-full border bg-surface-100 text-text-tertiary border-border">
                  นำเข้าแล้ว
                </span>
              )}
            </div>

            {/* Type + Amount */}
            <div className="flex items-center gap-2 mb-2">
              {/* Type toggle */}
              <div className="flex rounded-lg overflow-hidden border border-border text-xs shrink-0">
                <button
                  disabled={disabled}
                  onClick={() => onEdit(t.gmailMessageId, 'type', 'expense')}
                  className={`px-2 py-1 transition-colors ${t.type === 'expense' ? 'bg-error text-white' : 'text-text-secondary hover:bg-surface-50'}`}
                >
                  รายจ่าย
                </button>
                <button
                  disabled={disabled}
                  onClick={() => onEdit(t.gmailMessageId, 'type', 'income')}
                  className={`px-2 py-1 transition-colors ${t.type === 'income' ? 'bg-secondary text-white' : 'text-text-secondary hover:bg-surface-50'}`}
                >
                  รายรับ
                </button>
              </div>

              {/* Amount (inline edit) */}
              <div className="flex items-center gap-1">
                <span className={`text-sm font-bold ${t.type === 'income' ? 'text-secondary' : 'text-error'}`}>
                  {t.type === 'income' ? '+' : '-'}
                </span>
                <input
                  type="number"
                  disabled={disabled}
                  value={t.amount}
                  onChange={e => onEdit(t.gmailMessageId, 'amount', parseFloat(e.target.value) || 0)}
                  className="w-28 text-sm font-bold bg-transparent border-b border-dashed border-border focus:outline-none focus:border-primary text-text-primary disabled:cursor-not-allowed"
                />
                <span className="text-xs text-text-tertiary">฿</span>
              </div>
            </div>

            {/* Category selector */}
            <div className="mb-2">
              <button
                disabled={disabled}
                onClick={() => !disabled && setShowCategories(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${catConfig.color}`}
              >
                <CatIcon className="w-3 h-3" />
                {catConfig.label}
                <ChevronRight className={`w-3 h-3 transition-transform ${showCategories ? 'rotate-90' : ''}`} />
              </button>

              {showCategories && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(CATEGORIES[t.type] || CATEGORIES.expense).map(cat => {
                    const CIcon = cat.icon
                    return (
                      <button
                        key={cat.id}
                        onClick={() => { onEdit(t.gmailMessageId, 'category', cat.id); setShowCategories(false) }}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all ${
                          t.category === cat.id ? cat.color + ' font-semibold' : 'border-border text-text-secondary hover:bg-surface-50'
                        }`}
                      >
                        <CIcon className="w-3 h-3" />
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-text-tertiary w-10">วันที่</span>
              <input
                type="date"
                disabled={disabled}
                value={t.date}
                onChange={e => onEdit(t.gmailMessageId, 'date', e.target.value)}
                className="text-xs text-text-secondary bg-transparent border-b border-dashed border-border focus:outline-none focus:border-primary disabled:cursor-not-allowed"
              />
            </div>

            {/* Note */}
            <div className="flex items-start gap-2">
              <span className="text-xs text-text-tertiary w-10 mt-0.5">โน้ต</span>
              <input
                type="text"
                disabled={disabled}
                value={t.note}
                onChange={e => onEdit(t.gmailMessageId, 'note', e.target.value)}
                className="flex-1 text-xs text-text-secondary bg-transparent border-b border-dashed border-border focus:outline-none focus:border-primary truncate disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <div className="px-4 pb-3" />
      </CardContent>
    </Card>
  )
}

function StepDone({ count, onViewTransactions, onHome }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-secondary-50 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-secondary" />
      </div>
      <div>
        <h2 className="text-xl font-headline font-bold text-text-primary">นำเข้าสำเร็จ!</h2>
        <p className="text-text-secondary mt-1">
          บันทึก <span className="font-bold text-secondary">{count} รายการ</span> เข้าระบบแล้ว
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onViewTransactions}
          className="w-full h-12 bg-gradient-to-r from-primary to-accent border-0"
        >
          ดูรายการธุรกรรม
        </Button>
        <Button
          variant="outline"
          onClick={onHome}
          className="w-full h-12"
        >
          กลับหน้าแรก
        </Button>
      </div>
    </div>
  )
}

function StepError({ message, onRetry, onBack }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-error-50 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-error" />
      </div>
      <div>
        <h2 className="text-xl font-headline font-bold text-text-primary">เกิดข้อผิดพลาด</h2>
        <p className="text-sm text-text-secondary mt-2 max-w-xs">{message}</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={onRetry}
          className="w-full h-12 bg-gradient-to-r from-primary to-accent border-0"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          ลองใหม่
        </Button>
        <Button variant="outline" onClick={onBack} className="w-full h-12">
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับ
        </Button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function GmailImport() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [step, setStep] = useState('intro')
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 })
  const [parsedTransactions, setParsedTransactions] = useState([])
  const [alreadyImportedIds, setAlreadyImportedIds] = useState(new Set())
  const [cappedAt, setCappedAt] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [editOverrides, setEditOverrides] = useState({})
  const [importCount, setImportCount] = useState(0)
  const [errorMessage, setErrorMessage] = useState(null)

  // Options state
  const [selectedBanks, setSelectedBanks] = useState(['scb'])
  const [dateMode, setDateMode] = useState('preset')
  const [timeRange, setTimeRange] = useState('3m')
  const [dateRange, setDateRange] = useState(getDefaultDateRange())

  // ── Options Handlers ────────────────────────────────────────────────────

  const handleBankToggle = useCallback((bankId) => {
    setSelectedBanks(prev => {
      if (prev.includes(bankId)) {
        return prev.filter(id => id !== bankId)
      }
      return [...prev, bankId]
    })
  }, [])

  const handleSelectAllBanks = useCallback(() => {
    setSelectedBanks(BANK_LIST.map(b => b.id))
  }, [])

  const handleDeselectAllBanks = useCallback(() => {
    setSelectedBanks([])
  }, [])

  const handleDateRangeChange = useCallback((field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleOptionsConfirm = useCallback(async () => {
    setStep('authenticating')
    setFetchProgress({ current: 0, total: 0 })
    setErrorMessage(null)

    try {
      const syncOptions = {
        onProgress: (current, total) =>
          setFetchProgress({ current, total }),
        getImportedIds: () => getImportedGmailIds(user.uid),
        banks: selectedBanks,
      }

      if (dateMode === 'custom') {
        syncOptions.fromDate = dateRange.from
        syncOptions.toDate = dateRange.to
      } else {
        syncOptions.timeRange = timeRange
      }

      const result = await syncGmailTransactions(syncOptions)

      setAlreadyImportedIds(result.alreadyImported)
      setParsedTransactions(result.transactions)
      setCappedAt(result.cappedAt)

      const newIds = new Set(
        result.transactions
          .filter(t => !result.alreadyImported.has(t.gmailMessageId))
          .map(t => t.gmailMessageId)
      )
      setSelectedIds(newIds)
      setEditOverrides({})
      setStep('review')
    } catch (err) {
      setErrorMessage(err.message || 'ไม่สามารถดึงข้อมูลจาก Gmail ได้')
      setStep('error')
    }
  }, [user, selectedBanks, dateMode, timeRange, dateRange])

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleConnect = useCallback(() => {
    setStep('options')
  }, [])

  const handleFetch = useCallback(async () => {
    setStep('fetching')
    setFetchProgress({ current: 0, total: 0 })
    try {
      const syncOptions = {
        onProgress: (current, total) =>
          setFetchProgress({ current, total }),
        getImportedIds: () => getImportedGmailIds(user.uid),
      }

      if (dateMode === 'custom') {
        syncOptions.fromDate = dateRange.from
        syncOptions.toDate = dateRange.to
      } else {
        syncOptions.timeRange = timeRange
      }

      syncOptions.banks = selectedBanks

      const result = await syncGmailTransactions(syncOptions)

      setAlreadyImportedIds(result.alreadyImported)
      setParsedTransactions(result.transactions)
      setCappedAt(result.cappedAt)

      const newIds = new Set(
        result.transactions
          .filter(t => !result.alreadyImported.has(t.gmailMessageId))
          .map(t => t.gmailMessageId)
      )
      setSelectedIds(newIds)
      setEditOverrides({})
      setStep('review')
    } catch (err) {
      setErrorMessage(err.message || 'ไม่สามารถดึงข้อมูลจาก Gmail ได้')
      setStep('error')
    }
  }, [user, selectedBanks, dateMode, timeRange, dateRange])

  const handleToggle = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    const newIds = parsedTransactions
      .filter(t => !alreadyImportedIds.has(t.gmailMessageId))
      .map(t => t.gmailMessageId)
    setSelectedIds(new Set(newIds))
  }, [parsedTransactions, alreadyImportedIds])

  const handleDeselectAll = useCallback(() => setSelectedIds(new Set()), [])

  const handleEdit = useCallback((gmailMessageId, field, value) => {
    setEditOverrides(prev => ({
      ...prev,
      [gmailMessageId]: { ...(prev[gmailMessageId] || {}), [field]: value },
    }))
  }, [])

  const handleImport = useCallback(async () => {
    if (selectedIds.size === 0) return
    setStep('importing')

    const items = parsedTransactions
      .filter(t => selectedIds.has(t.gmailMessageId))
      .map(t => {
        const overrides = editOverrides[t.gmailMessageId] || {}
        const merged = { ...t, ...overrides }
        return {
          transaction: {
            type: merged.type,
            amount: merged.amount,
            category: merged.category,
            note: merged.note,
            date: merged.date,
          },
          gmailMessageId: t.gmailMessageId,
          subject: t.rawSubject,
        }
      })

    try {
      await batchImportGmailTransactions(user.uid, items)
      setImportCount(items.length)
      setStep('done')
    } catch (err) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดระหว่างนำเข้า กรุณาลองใหม่')
      setStep('error')
    }
  }, [parsedTransactions, selectedIds, editOverrides, user])

  // ── Derived values ───────────────────────────────────────────────────────

  const newTransactions = parsedTransactions.filter(t => !alreadyImportedIds.has(t.gmailMessageId))
  const selectableCount = newTransactions.length
  const allSelected = selectableCount > 0 && selectableCount === selectedIds.size

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar
        title="นำเข้าจาก Gmail"
        onClose={() => navigate('/profile')}
        back={true}
        showProfile={false}
      />

      <main className="max-w-lg mx-auto px-5 page-top pb-32 space-y-4">

        {/* ── Intro ── */}
        {step === 'intro' && (
          <>
            <Card className="overflow-hidden border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-error-50 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-error" />
                  </div>
                  <div>
                    <h2 className="text-lg font-headline font-bold text-text-primary">
                      นำเข้าธุรกรรมจาก Gmail
                    </h2>
                    <p className="text-sm text-text-secondary mt-2">
                      ระบบจะค้นหาอีเมลแจ้งเตือนจากธนาคาร แล้ว parse ยอดเงินให้อัตโนมัติ
                    </p>
                  </div>

                  {/* Privacy note */}
                  <div className="bg-secondary-50 rounded-xl p-3 w-full text-left">
                    <p className="text-xs text-secondary font-semibold mb-1">ความเป็นส่วนตัว</p>
                    <ul className="text-xs text-text-secondary space-y-1">
                      <li>• อ่านอีเมลเท่านั้น — ไม่ส่ง ไม่ลบ ไม่แก้ไข</li>
                      <li>• ข้อมูลประมวลผลบน device ของคุณโดยตรง</li>
                      <li>• ใช้สิทธิ์ Gmail read-only เท่านั้น</li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleConnect}
                    className="w-full h-12 bg-gradient-to-r from-primary to-accent border-0 text-base"
                  >
                    <Filter className="w-5 h-5 mr-2" />
                    เลือกธนาคารและช่วงวันที่
                  </Button>

                  <p className="text-xs text-text-tertiary">
                    จะเปิด popup ให้เลือกบัญชี Google
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Options ── */}
        {step === 'options' && (
          <StepOptions
            selectedBanks={selectedBanks}
            onBankToggle={handleBankToggle}
            onSelectAllBanks={handleSelectAllBanks}
            onDeselectAllBanks={handleDeselectAllBanks}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            onConfirm={handleOptionsConfirm}
            onBack={() => setStep('intro')}
            dateMode={dateMode}
            onDateModeChange={setDateMode}
          />
        )}

        {/* ── Authenticating ── */}
        {step === 'authenticating' && <StepLoading message="กำลังเชื่อมต่อ Gmail..." />}

        {/* ── Fetching ── */}
        {step === 'fetching' && (
          <StepFetching
            progress={fetchProgress}
            banks={selectedBanks}
            dateMode={dateMode}
            timeRange={timeRange}
            dateRange={dateRange}
          />
        )}

        {/* ── Review ── */}
        {step === 'review' && (
          <>
            {/* Summary bar */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">
                      พบ {parsedTransactions.length} รายการ
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      ใหม่ {newTransactions.length} รายการ
                      {alreadyImportedIds.size > 0 && ` · นำเข้าแล้ว ${parsedTransactions.length - newTransactions.length} รายการ`}
                      {cappedAt && ` · แสดงสูงสุด ${cappedAt} รายการ`}
                    </p>
                  </div>
                  <Badge className="bg-primary-50 text-primary border-primary/30">
                    เลือก {selectedIds.size}
                  </Badge>
                </div>

                {/* Select all / deselect */}
                {selectableCount > 0 && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSelectAll}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        allSelected ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary hover:bg-surface-50'
                      }`}
                    >
                      เลือกทั้งหมด
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-50 transition-colors"
                    >
                      ยกเลิกทั้งหมด
                    </button>
                    <button
                      onClick={handleFetch}
                      className="ml-auto text-xs px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-surface-50 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      รีเฟรช
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Empty state */}
            {parsedTransactions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Mail className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                  <p className="font-semibold text-text-primary">ไม่พบอีเมลธนาคาร</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    ลองตรวจสอบว่าอีเมลแจ้งเตือนอยู่ใน Inbox ไม่ใช่ Spam
                  </p>
                </CardContent>
              </Card>
            )}

            {/* All already imported */}
            {parsedTransactions.length > 0 && newTransactions.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle2 className="w-10 h-10 text-secondary mx-auto mb-3" />
                  <p className="font-semibold text-text-primary">รายการทั้งหมดนำเข้าแล้ว</p>
                  <p className="text-sm text-text-tertiary mt-1">
                    ไม่มีรายการใหม่ที่ต้องนำเข้า
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Transaction cards */}
            {parsedTransactions.map(t => (
              <TransactionReviewCard
                key={t.gmailMessageId}
                transaction={t}
                isSelected={selectedIds.has(t.gmailMessageId)}
                isAlreadyImported={alreadyImportedIds.has(t.gmailMessageId)}
                overrides={editOverrides[t.gmailMessageId] || {}}
                onToggle={handleToggle}
                onEdit={handleEdit}
              />
            ))}

            {/* Sticky import button */}
            {selectedIds.size > 0 && (
              <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-gradient-to-t from-white via-white/95 to-transparent max-w-lg mx-auto">
                <Button
                  onClick={handleImport}
                  className="w-full h-14 bg-gradient-to-r from-primary to-accent border-0 text-base shadow-lg"
                >
                  <Download className="w-5 h-5 mr-2" />
                  นำเข้า {selectedIds.size} รายการ
                </Button>
              </div>
            )}
          </>
        )}

        {/* ── Importing ── */}
        {step === 'importing' && <StepLoading message="กำลังนำเข้ารายการ..." />}

        {/* ── Done ── */}
        {step === 'done' && (
          <StepDone
            count={importCount}
            onViewTransactions={() => navigate('/transactions')}
            onHome={() => navigate('/')}
          />
        )}

        {/* ── Error ── */}
        {step === 'error' && (
          <StepError
            message={errorMessage}
            onRetry={() => setStep('options')}
            onBack={() => setStep('intro')}
          />
        )}

      </main>
      <BottomNav />
    </div>
  )
}
