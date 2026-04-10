import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, LogOut, ChevronRight,
  Settings, Bell, Shield, HelpCircle,
  Loader2, Moon, FileText, Calendar, ReceiptText, Target
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useFinance } from '@/contexts/FinanceContext'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

const menuItems = [
  { icon: User,        label: 'โปรไฟล์',         sublabel: 'จัดการข้อมูลส่วนตัว',   color: 'text-primary',        bgColor: 'bg-primary-50',    path: '/profile/edit' },
  { icon: Bell,        label: 'การแจ้งเตือน',     sublabel: 'ตั้งค่าการแจ้งเตือน',   color: 'text-warning',        bgColor: 'bg-warning-50',    path: '/profile/notifications' },
  { icon: Moon,        label: 'ตั้งค่า',           sublabel: 'ธีมและการแสดงผล',       color: 'text-accent',         bgColor: 'bg-accent-50',     path: '/profile/settings' },
  { icon: Shield,      label: 'ความปลอดภัย',      sublabel: 'รหัสผ่านและ 2FA',       color: 'text-secondary',      bgColor: 'bg-secondary-50',  path: '/profile/security' },
  { icon: HelpCircle,  label: 'ช่วยเหลือ',        sublabel: 'FAQ และติดต่อเรา',      color: 'text-primary',        bgColor: 'bg-primary-50',    path: '/profile/help' },
  { icon: FileText,    label: 'เงื่อนไขการใช้',   sublabel: 'ข้อกำหนดการใช้งาน',    color: 'text-text-secondary', bgColor: 'bg-surface-200',   path: '/profile/terms' },
]

export default function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const finance = useFinance()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const memberMonths = finance?.user?.memberSince
    ? Math.max(1, (() => {
        const d = new Date(finance.user.memberSince)
        const n = new Date()
        return (n.getFullYear() - d.getFullYear()) * 12 + (n.getMonth() - d.getMonth())
      })())
    : 0

  const stats = [
    { icon: Calendar,    value: memberMonths,                           label: 'เดือน',     color: 'text-primary' },
    { icon: ReceiptText, value: finance?.stats?.totalTransactions || 0, label: 'รายการ',   color: 'text-accent' },
    { icon: Target,      value: finance?.stats?.activeGoals || 0,       label: 'เป้าหมาย', color: 'text-secondary' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="โปรไฟล์" onClose={() => navigate('/')} />

      <main className="max-w-lg mx-auto px-5 pt-24 pb-32 space-y-4">

        {/* Profile hero card */}
        <Card className="overflow-hidden border-0 shadow-lg">
          {/* Gradient banner — avatar anchored here */}
          <div className="h-24 bg-gradient-to-r from-primary via-accent to-purple-400 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent)]" />
            {/* Avatar: half outside banner bottom */}
            <div className="absolute -bottom-10 left-5 w-20 h-20 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>

          <CardContent className="px-5 pb-5 pt-14">
            {/* Edit button — top right */}
            <div className="flex justify-end -mt-8 mb-3">
              <button
                onClick={() => navigate('/profile/edit')}
                className="px-3 py-1.5 rounded-full border border-border text-xs font-medium text-text-secondary hover:bg-surface-100 transition-colors"
              >
                แก้ไขโปรไฟล์
              </button>
            </div>

            {/* Name & email */}
            <h2 className="text-lg font-headline font-bold text-text-primary leading-tight">
              {user?.displayName || 'ผู้ใช้'}
            </h2>
            <p className="text-sm text-text-tertiary flex items-center gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              {user?.email || 'ไม่มีอีเมล'}
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {stats.map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="bg-surface-50 rounded-2xl p-3 text-center">
                  <Icon className={`w-4 h-4 ${color} mx-auto mb-1.5`} />
                  <p className={`text-xl font-headline font-extrabold ${color}`}>{value}</p>
                  <p className="text-[10px] text-text-tertiary mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Menu */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {menuItems.map(({ icon: Icon, label, sublabel, color, bgColor, path }, idx) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-surface-50 active:bg-surface-100 transition-colors ${
                  idx < menuItems.length - 1 ? 'border-b border-border/60' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: '18px', height: '18px' }} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{label}</p>
                  <p className="text-xs text-text-tertiary truncate">{sublabel}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* App version */}
        <div className="flex items-center justify-center gap-2 py-1">
          <img src="/favicon.svg" className="w-5 h-5 opacity-50" alt="Lumina" />
          <p className="text-xs text-text-tertiary">Lumina Finance · v1.0.0</p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-error/25 text-error hover:bg-error-50 hover:border-error/40 transition-all disabled:opacity-50 font-semibold text-sm"
        >
          {isLoggingOut
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <LogOut className="w-4 h-4" />
          }
          ออกจากระบบ
        </button>

      </main>
      <BottomNav />
    </div>
  )
}
