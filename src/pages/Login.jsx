import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2, ShieldCheck, TrendingUp, Bot } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { signInWithGoogle, isAuthenticated, loading, error } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // While Firebase resolves auth state, show spinner (prevents login flash)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1a0533] via-[#2d0f5c] to-[#1a0533]">
        <Loader2 className="w-10 h-10 animate-spin text-white/60" />
      </div>
    )
  }

  // Declarative redirect — works on every render, no timing issues
  if (isAuthenticated) return <Navigate to="/" replace />

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      // onAuthStateChanged will set isAuthenticated → Navigate above fires
    } catch {
      // error already set in AuthContext
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1a0533] via-[#2d0f5c] to-[#1a0533] relative overflow-hidden">

      {/* Ambient glows */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-primary/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[120px] right-[-60px] w-64 h-64 bg-accent/20 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[200px] left-[-40px] w-48 h-48 bg-secondary/20 rounded-full blur-[70px] pointer-events-none" />

      {/* Top spacer */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">

        {/* Logo block */}
        <div className="flex flex-col items-center mb-12">
          <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary via-accent to-purple-400 flex items-center justify-center shadow-2xl shadow-primary/40 mb-5">
            <img src="/favicon.svg" className="w-14 h-14" alt="Lumina" />
          </div>
          <h1 className="text-white text-4xl font-extrabold tracking-tight mb-1" style={{ fontFamily: 'var(--font-headline, sans-serif)' }}>
            Lumina
          </h1>
          <p className="text-purple-300 text-sm font-medium tracking-widest uppercase">Finance</p>
        </div>

        {/* Tagline */}
        <div className="text-center mb-10">
          <p className="text-white text-xl font-bold mb-2">วางแผนการเงิน</p>
          <p className="text-purple-300 text-sm leading-relaxed">ให้ AI ช่วยดูแลเงินของคุณ<br/>ง่าย ครบ ในที่เดียว</p>
        </div>

        {/* Feature pills */}
        <div className="flex gap-2 flex-wrap justify-center mb-10">
          {[
            { icon: TrendingUp, label: 'ติดตามรายรับ-จ่าย' },
            { icon: ShieldCheck, label: 'ทุนฉุกเฉิน' },
            { icon: Bot, label: 'AI แนะนำ' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10">
              <Icon className="w-3.5 h-3.5 text-purple-300" />
              <span className="text-xs text-purple-100 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom card */}
      <div className="px-5 pb-10 pt-6 bg-white rounded-t-3xl shadow-2xl">

        <div className="max-w-sm mx-auto">
          <p className="text-text-primary font-bold text-lg text-center mb-1">เริ่มต้นเลย</p>
          <p className="text-text-tertiary text-sm text-center mb-6">เข้าสู่ระบบเพื่อจัดการการเงินของคุณ</p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl border-2 border-border bg-white hover:bg-surface-50 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-semibold text-text-primary">เข้าสู่ระบบด้วย Google</span>
              </>
            )}
          </button>

          <p className="text-xs text-text-tertiary text-center mt-5 leading-relaxed">
            การเข้าสู่ระบบแสดงว่าคุณยอมรับ{' '}
            <a href="#" className="text-primary hover:underline">ข้อกำหนดการใช้งาน</a>
            {' และ '}
            <a href="#" className="text-primary hover:underline">นโยบายความเป็นส่วนตัว</a>
          </p>
        </div>
      </div>
    </div>
  )
}
