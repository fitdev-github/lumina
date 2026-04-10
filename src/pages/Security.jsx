import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield, Lock, Smartphone, CheckCircle2, AlertTriangle, Key,
  Loader2, Send, X
} from 'lucide-react'
import { sendPasswordResetEmail, deleteUser, reauthenticateWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '@/firebase/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/contexts/AuthContext'

export default function Security() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [passwordSent, setPasswordSent] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const providers = user?.providerData || []
  const googleConnected = providers.some(p => p.providerId === 'google.com')
  const emailConnected = providers.some(p => p.providerId === 'password')

  const handleSendPasswordReset = async () => {
    if (!user?.email) return
    setPasswordLoading(true)
    setPasswordError('')
    try {
      await sendPasswordResetEmail(auth, user.email)
      setPasswordSent(true)
    } catch (err) {
      console.error(err)
      setPasswordError('ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      // Re-authenticate before deleting (required by Firebase)
      if (googleConnected) {
        const provider = new GoogleAuthProvider()
        await reauthenticateWithPopup(user, provider)
      }
      await deleteUser(user)
      navigate('/login')
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setDeleteError('ยกเลิกการยืนยันตัวตน')
      } else {
        setDeleteError('ลบบัญชีไม่สำเร็จ กรุณาลองใหม่')
      }
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-50 to-white">
      <TopBar title="ความปลอดภัย" onClose={() => navigate('/profile')} back={true} showProfile={false} />

      <main className="max-w-lg mx-auto px-5 page-top pb-32">

        {/* Security Status */}
        <Card className="mb-6 bg-gradient-to-r from-secondary-50 to-white border-secondary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-secondary-600 flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-headline font-bold text-text-primary">สถานะความปลอดภัย</h3>
                  <Badge variant="success" className="text-xs">ปลอดภัย</Badge>
                </div>
                <p className="text-sm text-text-secondary">
                  เข้าสู่ระบบด้วย {googleConnected ? 'Google Account' : 'Email'} • {user?.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Reset */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text-primary">รีเซ็ตรหัสผ่าน</p>
                <p className="text-xs text-text-tertiary">
                  {googleConnected && !emailConnected
                    ? 'บัญชีนี้ใช้ Google Sign-In ไม่มีรหัสผ่านแยก'
                    : `ส่งลิงก์รีเซ็ตไปที่ ${user?.email}`}
                </p>
              </div>
            </div>

            {googleConnected && !emailConnected ? (
              <div className="p-3 rounded-xl bg-surface-100 text-xs text-text-tertiary">
                คุณเข้าสู่ระบบผ่าน Google Account ซึ่งจัดการรหัสผ่านโดย Google โดยตรง
              </div>
            ) : passwordSent ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary-50 border border-secondary/30">
                <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />
                <p className="text-sm text-secondary">ส่งอีเมลรีเซ็ตแล้ว! กรุณาตรวจสอบอีเมลของคุณ</p>
              </div>
            ) : (
              <>
                {passwordError && (
                  <p className="text-xs text-error mb-2">{passwordError}</p>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSendPasswordReset}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  ส่งอีเมลรีเซ็ตรหัสผ่าน
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* 2FA Toggle */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary-50 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">ยืนยันตัวตน 2 ขั้นตอน</p>
                  <p className="text-xs text-text-tertiary">
                    {twoFactorEnabled ? 'เปิดใช้งานอยู่' : 'เพิ่มความปลอดภัยด้วย 2FA (เร็วๆ นี้)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={twoFactorEnabled ? 'success' : 'secondary'} className="text-xs">
                  {twoFactorEnabled ? 'เปิด' : 'ปิด'}
                </Badge>
                <button
                  onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${twoFactorEnabled ? 'bg-secondary' : 'bg-surface-200'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text-primary">เซสชันที่ใช้งานอยู่</p>
                <p className="text-xs text-text-tertiary">อุปกรณ์ปัจจุบัน • เพิ่งใช้งาน</p>
              </div>
              <Badge variant="default" className="text-xs">1 อุปกรณ์</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-error/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-error-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-error mb-1">โซนอันตราย</p>
                <p className="text-xs text-text-tertiary mb-3">
                  การลบบัญชีไม่สามารถย้อนกลับได้ ข้อมูลทั้งหมดจะถูกลบถาวร
                </p>

                {!showDeleteConfirm ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-error border-error/30 hover:bg-error-50 hover:border-error"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    ลบบัญชี
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-error">ยืนยันการลบบัญชี?</p>
                    <p className="text-xs text-text-tertiary">คุณจะต้องยืนยันตัวตนผ่าน Google อีกครั้ง</p>
                    {deleteError && (
                      <p className="text-xs text-error">{deleteError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-error hover:bg-error-600 border-0"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        {deleteLoading ? 'กำลังลบ...' : 'ยืนยันลบ'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteError('') }}
                        disabled={deleteLoading}
                      >
                        <X className="w-4 h-4 mr-1" />
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </main>
      <BottomNav />
    </div>
  )
}
