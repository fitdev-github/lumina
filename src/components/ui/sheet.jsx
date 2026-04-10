import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const Sheet = ({ open, onClose, children }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex justify-end">
        {children}
      </div>
    </div>
  )
}

const SheetContent = React.forwardRef(({ className, children, side = "right", onClose, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative h-full w-full max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-300",
      className
    )}
    {...props}
  >
    <button
      onClick={onClose}
      className="absolute right-4 top-4 rounded-lg p-1 text-text-tertiary hover:text-text-primary hover:bg-surface-100 transition-colors z-10"
    >
      <X className="h-5 w-5" />
      <span className="sr-only">Close</span>
    </button>
    <div className="p-6 pt-14">
      {children}
    </div>
  </div>
))
Sheet.Content = SheetContent

const SheetHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-2", className)} {...props} />
)
Sheet.Header = SheetHeader

const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-headline font-bold", className)}
    {...props}
  />
))
Sheet.Title = SheetTitle

const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
))
Sheet.Description = SheetDescription

export { Sheet }
