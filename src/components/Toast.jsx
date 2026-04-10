import { useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

export function useToast() {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success', duration = 2500) => {
    setToast({ message, type, id: Date.now() })
    setTimeout(() => setToast(null), duration)
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  return { toast, showToast, hideToast }
}

export default function Toast({ toast, onHide }) {
  if (!toast) return null

  const isSuccess = toast.type === 'success'
  const Icon = isSuccess ? CheckCircle2 : AlertCircle

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium text-white animate-in slide-in-from-bottom-4 fade-in duration-200 ${
        isSuccess ? 'bg-secondary' : 'bg-error'
      }`}
      style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{toast.message}</span>
      <button onClick={onHide} className="ml-1 opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
