import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from 'firebase/auth'
import { User, Mail, Phone, Calendar, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/contexts/AuthContext'
import { getUser, updateUser } from '@/firebase/services'

export default function ProfileEdit() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [status, setStatus] = useState(null) // 'success' | 'error'
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    birthday: ''
  })

  // โหลดข้อมูลจาก Firestore
  useEffect(() => {
    if (!user) return
    getUser(user.uid)
      .then(profile => {
        if (profile) {
          setFormData(prev => ({
            ...prev,
            displayName: user.displayName || prev.displayName,
            phone: profile.phone || '',
            birthday: profile.birthday || ''
          }))
        }
      })
      .catch(console.error)
      .finally(() => setLoadingProfile(false))
  }, [user])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setStatus(null)
  }

  const handleSave = async () => {
    if (!formData.displayName.trim()) return
    setLoading(true)
    setStatus(null)
    try {
      // อัปเดต Firebase Auth displayName
      await updateProfile(user, { displayName: formData.displayName.trim() })

      // อัปเดต Firestore
      await updateUser(user.uid, {
        displayName: formData.displayName.trim(),
        phone: formData.phone,
        birthday: formData.birthday
      })

      setStatus('success')
      setTimeout(() => navigate('/profile'), 1200)
    } catch (err) {
      console.error('Update error:', err)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="แก้ไขโปรไฟล์" onClose={() => navigate('/profile')} back={true} showProfile={false} />

      <main className="max-w-lg mx-auto px-5 page-top pb-32">

        {/* Avatar */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold text-white shadow-lg mx-auto">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full rounded-2xl object-cover" />
            ) : (
              formData.displayName?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          {user?.photoURL && (
            <p className="text-xs text-text-tertiary mt-2">รูปโปรไฟล์จาก Google Account</p>
          )}
        </div>

        {/* Status Banner */}
        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary-50 border border-secondary/30 mb-4">
            <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
            <p className="text-sm font-medium text-secondary">บันทึกสำเร็จ! กำลังกลับ...</p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-error-50 border border-error/30 mb-4">
            <AlertCircle className="w-5 h-5 text-error shrink-0" />
            <p className="text-sm font-medium text-error">เกิดข้อผิดพลาด กรุณาลองใหม่</p>
          </div>
        )}

        {/* Form */}
        <Card className="mb-6">
          <CardContent className="p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <User className="w-4 h-4" /> ชื่อ
              </label>
              <Input
                value={formData.displayName}
                onChange={e => handleChange('displayName', e.target.value)}
                placeholder="ชื่อของคุณ"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> อีเมล
              </label>
              <Input
                value={formData.email}
                disabled
                className="bg-surface-100 cursor-not-allowed opacity-60"
              />
              <p className="text-xs text-text-tertiary mt-1">ไม่สามารถเปลี่ยนอีเมลได้</p>
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" /> เบอร์โทรศัพท์
              </label>
              <Input
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="081-234-5678"
                type="tel"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> วันเกิด
              </label>
              <Input
                value={formData.birthday}
                onChange={e => handleChange('birthday', e.target.value)}
                type="date"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={loading || !formData.displayName.trim() || status === 'success'}
          className="w-full h-12 bg-gradient-to-r from-primary to-accent border-0"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : status === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mr-2" />
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          {loading ? 'กำลังบันทึก...' : status === 'success' ? 'บันทึกแล้ว!' : 'บันทึก'}
        </Button>
      </main>
      <BottomNav />
    </div>
  )
}
