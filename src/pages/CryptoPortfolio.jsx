import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Pencil, Trash2, Check, X, Loader2,
  RefreshCw, TrendingUp, TrendingDown, Bitcoin,
  ChevronDown, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import Toast, { useToast } from '@/components/Toast'
import { useCryptoPortfolio } from '@/hooks'
import { COIN_LIST } from '@/services/cryptoService'
import { invalidateCache } from '@/services/cryptoService'

function PnlBadge({ value, pct }) {
  if (value == null) return null
  const pos = value >= 0
  return (
    <div className={`flex items-center gap-1 text-xs font-semibold ${pos ? 'text-secondary' : 'text-error'}`}>
      {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pos ? '+' : ''}{value.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
      {pct != null && <span className="text-[10px] opacity-70">({pos ? '+' : ''}{pct.toFixed(1)}%)</span>}
    </div>
  )
}

function CoinIcon({ coin }) {
  if (!coin) return (
    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
      <Bitcoin className="w-5 h-5 text-slate-400" />
    </div>
  )
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${coin.color} flex items-center justify-center shrink-0 shadow-sm`}>
      <span className="text-white text-[10px] font-extrabold leading-none">{coin.symbol.slice(0, 3)}</span>
    </div>
  )
}

export default function CryptoPortfolio() {
  const navigate = useNavigate()
  const { toast, showToast, hideToast } = useToast()
  const {
    holdings, loading, priceLoading, priceError, lastUpdated,
    totalValue, totalCost, totalPnl,
    refreshPrices, addHolding, updateHolding, removeHolding,
  } = useCryptoPortfolio()

  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [coinSearch, setCoinSearch] = useState('')
  const [showCoinDropdown, setShowCoinDropdown] = useState(false)

  const [form, setForm] = useState({
    symbol: '',
    amount: '',
    avgCost: '',
    note: '',
  })

  const openAdd = () => {
    setEditingId(null)
    setForm({ symbol: '', amount: '', avgCost: '', note: '' })
    setCoinSearch('')
    setShowDialog(true)
  }

  const openEdit = (h) => {
    setEditingId(h.id)
    setForm({
      symbol: h.symbol,
      amount: h.amount?.toString() || '',
      avgCost: h.avgCost?.toString() || '',
      note: h.note || '',
    })
    setCoinSearch(h.symbol)
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    if (!form.symbol || !form.amount) return
    setSubmitting(true)
    try {
      const data = {
        symbol: form.symbol,
        amount: parseFloat(form.amount),
        avgCost: parseFloat(form.avgCost) || 0,
        note: form.note,
      }
      if (editingId) {
        await updateHolding(editingId, data)
        showToast('อัปเดตสำเร็จ!')
      } else {
        await addHolding(data)
        showToast('เพิ่มเหรียญสำเร็จ!')
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
      await removeHolding(id)
      setConfirmDeleteId(null)
      showToast('ลบแล้ว')
    } catch {
      showToast('เกิดข้อผิดพลาด', 'error')
    }
  }

  const handleRefresh = () => {
    invalidateCache()
    refreshPrices()
    showToast('กำลังอัปเดตราคา...')
  }

  const filteredCoins = COIN_LIST.filter(c =>
    c.symbol.toLowerCase().includes(coinSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(coinSearch.toLowerCase())
  )

  const totalPnlPct = totalCost > 0 && totalPnl != null ? (totalPnl / totalCost) * 100 : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="พอร์ตคริปโต" onClose={() => navigate(-1)} back={true} showProfile={false} />

      <main className="max-w-lg mx-auto px-5 page-top pb-32 space-y-5">

        {/* Hero */}
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-5 text-white">
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs text-white/70 uppercase tracking-wider">มูลค่าพอร์ตรวม</p>
              <button
                onClick={handleRefresh}
                disabled={priceLoading}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-white/80 ${priceLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-3xl font-headline font-extrabold text-white mb-1">
              ฿{totalValue.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
            </p>
            {totalPnl != null && (
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${totalPnl >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {totalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {totalPnl >= 0 ? '+' : ''}฿{Math.abs(totalPnl).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                {totalPnlPct != null && (
                  <span className="text-xs opacity-80">({totalPnl >= 0 ? '+' : ''}{totalPnlPct.toFixed(1)}%)</span>
                )}
              </div>
            )}
            {lastUpdated && (
              <p className="text-[10px] text-white/50 mt-2">
                อัปเดต {lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} · ราคาจาก CoinGecko
              </p>
            )}
          </div>

          {priceError && (
            <div className="px-5 py-3 bg-error-50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-error shrink-0" />
              <p className="text-xs text-error">{priceError}</p>
            </div>
          )}
        </Card>

        {/* Holdings list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline font-bold text-text-primary">เหรียญที่ถืออยู่</h2>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" />
              เพิ่มเหรียญ
            </Button>
          </div>

          {holdings.length === 0 ? (
            <Card className="border-dashed border-2 border-border hover:border-primary/30 transition-all cursor-pointer" onClick={openAdd}>
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
                  <Bitcoin className="w-7 h-7 text-text-tertiary" />
                </div>
                <p className="font-semibold text-text-primary mb-1">เพิ่มเหรียญที่ถือ</p>
                <p className="text-sm text-text-tertiary">BTC, ETH, KUB และอื่นๆ บน Bitkub</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {holdings.map((h) => (
                <Card key={h.id} className="overflow-hidden">
                  <div className={`h-1 bg-gradient-to-r ${h.coin?.color || 'from-slate-400 to-slate-500'}`} />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CoinIcon coin={h.coin} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-text-primary">{h.symbol}</span>
                            <span className="text-xs text-text-tertiary ml-1.5">{h.coin?.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-text-primary">
                              ฿{h.currentValue != null
                                ? h.currentValue.toLocaleString('th-TH', { maximumFractionDigits: 0 })
                                : (h.costBasis).toLocaleString('th-TH', { maximumFractionDigits: 0 })
                              }
                            </p>
                            <PnlBadge value={h.pnl} pct={h.pnlPct} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="text-xs text-text-tertiary space-y-0.5">
                            <p>ถือ {h.amount} {h.symbol}</p>
                            {h.currentPrice != null && (
                              <div className="flex items-center gap-1.5">
                                <span>฿{h.currentPrice.toLocaleString('th-TH', { maximumFractionDigits: 2 })}</span>
                                {h.change24h != null && (
                                  <span className={`text-[10px] font-semibold ${h.change24h >= 0 ? 'text-secondary' : 'text-error'}`}>
                                    {h.change24h >= 0 ? '▲' : '▼'}{Math.abs(h.change24h).toFixed(2)}%
                                  </span>
                                )}
                              </div>
                            )}
                            {h.avgCost > 0 && (
                              <p>ต้นทุน ฿{h.avgCost.toLocaleString('th-TH', { maximumFractionDigits: 2 })}/เหรียญ</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEdit(h)}
                              className="p-1.5 rounded-lg hover:bg-surface-100 text-text-tertiary hover:text-primary transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteId === h.id ? (
                              <>
                                <button onClick={() => handleDelete(h.id)} className="px-2 py-1 text-xs bg-error text-white rounded-lg">ลบ</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs bg-surface-100 text-text-tertiary rounded-lg">ยกเลิก</button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(h.id)}
                                className="p-1.5 rounded-lg hover:bg-error-50 text-text-tertiary hover:text-error transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {h.note && <p className="text-xs text-text-tertiary mt-1 italic">{h.note}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Cost summary */}
              <div className="flex justify-between items-center px-1 py-2 border-t border-border-subtle">
                <span className="text-sm text-text-tertiary">ต้นทุนรวม</span>
                <span className="text-sm font-semibold text-text-secondary">฿{totalCost.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          )}
        </div>

      </main>
      <BottomNav />
      <Toast toast={toast} onHide={hideToast} />

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {editingId ? 'แก้ไขเหรียญ' : 'เพิ่มเหรียญที่ถือ'}
            </DialogTitle>
            <DialogDescription>บันทึกจำนวนและต้นทุนเฉลี่ย</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Coin search */}
            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">เลือกเหรียญ</label>
              <div className="relative">
                <Input
                  value={coinSearch}
                  onChange={e => { setCoinSearch(e.target.value); setShowCoinDropdown(true) }}
                  onFocus={() => setShowCoinDropdown(true)}
                  placeholder="ค้นหา เช่น BTC, ETH, KUB"
                  className="pr-8"
                />
                <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 text-text-tertiary pointer-events-none" />
                {showCoinDropdown && filteredCoins.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredCoins.map(coin => (
                      <button
                        key={coin.symbol}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface-100 transition-colors text-left"
                        onClick={() => {
                          setForm({ ...form, symbol: coin.symbol })
                          setCoinSearch(coin.symbol)
                          setShowCoinDropdown(false)
                        }}
                      >
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${coin.color} flex items-center justify-center shrink-0`}>
                          <span className="text-white text-[9px] font-extrabold">{coin.symbol.slice(0, 3)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{coin.symbol}</p>
                          <p className="text-xs text-text-tertiary">{coin.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.symbol && (
                <p className="text-xs text-secondary mt-1">เลือก: {form.symbol}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">จำนวนเหรียญ</label>
                <Input
                  type="number"
                  step="any"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text-primary mb-1 block">ต้นทุนเฉลี่ย (฿)</label>
                <Input
                  type="number"
                  step="any"
                  value={form.avgCost}
                  onChange={e => setForm({ ...form, avgCost: e.target.value })}
                  placeholder="ราคาซื้อเฉลี่ย"
                />
              </div>
            </div>

            {form.amount && form.avgCost && (
              <div className="bg-surface-100 rounded-xl p-3 text-sm flex justify-between">
                <span className="text-text-tertiary">ต้นทุนรวม</span>
                <span className="font-semibold text-text-primary">
                  ฿{(parseFloat(form.amount) * parseFloat(form.avgCost)).toLocaleString('th-TH', { maximumFractionDigits: 0 })}
                </span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-text-primary mb-1 block">หมายเหตุ (ไม่บังคับ)</label>
              <Input
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                placeholder="เช่น ถือระยะยาว, DCA"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={!form.symbol || !form.amount || submitting}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {submitting ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มเหรียญ'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
