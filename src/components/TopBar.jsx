import { useNavigate } from 'react-router-dom'
import { Bell, Sparkles, User, ArrowLeft, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from '@/contexts/AuthContext'

export default function TopBar({ title = 'ลูมิน่า', onClose, showProfile = true, back = false }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <header className={cn(
      "fixed z-50 bg-white/80 backdrop-blur-xl border-b border-border-subtle transition-all duration-300",
      onClose ? "top-0 w-full" : "top-0 w-full"
    )}>
      <div className="flex justify-between items-center px-5 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {onClose ? (
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-all duration-200"
            >
              {back ? (
                <ArrowLeft className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
          ) : null}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary font-headline tracking-tight">{title}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-primary-50 transition-all duration-200">
            <Bell className="w-5 h-5" />
          </button>
          
          {showProfile && (
            <button 
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-white shadow-sm hover:ring-primary/30 transition-all"
            >
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Profile'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
