import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const DialogContext = React.createContext(null)

const Dialog = ({ open = false, onOpenChange, children }) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = React.forwardRef(({ children, asChild, ...props }, ref) => {
  const context = React.useContext(DialogContext)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => context?.onOpenChange?.(!context.open)
    })
  }
  
  return (
    <button ref={ref} onClick={() => context?.onOpenChange?.(!context.open)} {...props}>
      {children}
    </button>
  )
})

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const context = React.useContext(DialogContext)
  const open = context?.open
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-[100]">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => context?.onOpenChange?.(false)}
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="min-h-full flex items-center justify-center p-4">
          <div 
            ref={ref}
            className={cn(
              "relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 fade-in-0",
              className
            )}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            <button
              onClick={() => context?.onOpenChange?.(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-100 transition-colors z-10"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
})

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)} {...props} />
)

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-headline font-bold text-text-primary", className)}
    {...props}
  />
))

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
))

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)} {...props} />
)

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger }
