import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Bell,
  CheckCircle2,
  CreditCard,
  PiggyBank,
  Target,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'

const notificationTypes = [
  {
    id: 'expense_alert',
    icon: CreditCard,
    title: 'แจ้งเตือนค่าใช้จ่าย',
    description: 'แจ้งเตือนเมื่อมีรายการใหม่',
    color: 'text-error',
    bgColor: 'bg-error-50'
  },
  {
    id: 'budget_warning',
    icon: AlertTriangle,
    title: 'เตือนใกล้ใช้งบ',
    description: 'แจ้งเตือนเมื่อใช้งบเกิน 80%',
    color: 'text-warning',
    bgColor: 'bg-warning-50'
  },
  {
    id: 'goal_progress',
    icon: Target,
    title: 'ความคืบหน้าเป้าหมาย',
    description: 'แจ้งเตือนเมื่อเป้าหมายมีความคืบหน้า',
    color: 'text-primary',
    bgColor: 'bg-primary-50'
  },
  {
    id: 'savings_tip',
    icon: PiggyBank,
    title: 'เคล็ดลับการออม',
    description: 'รับคำแนะนำการออมจากลูมิน่า',
    color: 'text-secondary',
    bgColor: 'bg-secondary-50'
  },
  {
    id: 'weekly_summary',
    icon: TrendingUp,
    title: 'สรุปรายสัปดาห์',
    description: 'สรุปการใช้จ่ายประจำสัปดาห์',
    color: 'text-accent',
    bgColor: 'bg-accent-50'
  },
]

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(
    notificationTypes.reduce((acc, item) => ({ ...acc, [item.id]: true }), {})
  )
  const [saved, setSaved] = useState(false)

  const toggleNotification = (id) => {
    setNotifications(prev => ({ ...prev, [id]: !prev[id] }))
    setSaved(false)
  }

  const handleSave = () => {
    localStorage.setItem('notification_settings', JSON.stringify(notifications))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const activeCount = Object.values(notifications).filter(Boolean).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="การแจ้งเตือน" onClose={() => navigate('/profile')} />
      
      <main className="max-w-lg mx-auto px-5 pt-24 pb-32">
        
        {/* Summary Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary-50 to-white border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-headline font-bold text-text-primary">การแจ้งเตือน</h3>
                <p className="text-sm text-text-secondary">
                  เปิด {activeCount} จาก {notificationTypes.length} รายการ
                </p>
              </div>
              <Badge variant={activeCount > 0 ? 'success' : 'secondary'} className="text-xs">
                {activeCount > 0 ? 'เปิด' : 'ปิด'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notification List */}
        <div className="space-y-3 mb-6">
          {notificationTypes.map(({ id, icon: Icon, title, description, color, bgColor }) => (
            <Card 
              key={id}
              className={`cursor-pointer transition-all ${notifications[id] ? 'border-primary/30' : 'opacity-60'}`}
              onClick={() => toggleNotification(id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary">{title}</p>
                    <p className="text-xs text-text-tertiary">{description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    notifications[id] 
                      ? 'bg-primary border-primary' 
                      : 'border-border'
                  }`}>
                    {notifications[id] && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          className={`w-full h-12 ${saved ? 'bg-secondary' : 'bg-gradient-to-r from-primary to-accent'} border-0`}
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              บันทึกแล้ว!
            </>
          ) : (
            <>
              <Bell className="w-5 h-5 mr-2" />
              บันทึกการตั้งค่า
            </>
          )}
        </Button>

      </main>
      <BottomNav />
    </div>
  )
}
