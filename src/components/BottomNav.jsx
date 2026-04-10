import { NavLink } from 'react-router-dom'
import { Home, Target, PlusCircle, BarChart3, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'หน้าแรก', exact: true },
  { to: '/goals', icon: Target, label: 'เป้าหมาย', exact: false },
  { to: '/add', icon: PlusCircle, label: '', exact: false, isCenter: true },
  { to: '/financial-status', icon: BarChart3, label: 'สถานะ', exact: false },
  { to: '/assistant', icon: Sparkles, label: 'AI', exact: false },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-border-subtle safe-area-bottom">
      <div className="flex items-center justify-around px-2 pb-6 pt-2 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label, exact, isCenter }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center transition-all duration-200",
                isCenter 
                  ? "relative -mt-8" 
                  : isActive 
                    ? "scale-110" 
                    : "text-text-tertiary hover:text-text-secondary"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isCenter ? (
                  <div className={cn(
                    "w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center shadow-lg shadow-primary/40 transition-all duration-200 hover:scale-105 active:scale-95",
                    isActive ? "ring-4 ring-primary/20" : ""
                  )}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200",
                      isActive 
                        ? "bg-primary-50 text-primary" 
                        : ""
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold mt-1 transition-colors",
                      isActive ? "text-primary" : ""
                    )}>
                      {label}
                    </span>
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
