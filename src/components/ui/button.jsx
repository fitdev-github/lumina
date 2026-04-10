import * as React from "react"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-primary-600",
        destructive: "bg-error text-white shadow-sm hover:bg-error-600",
        outline: "border border-border bg-white hover:bg-surface-100 hover:border-border-dark",
        secondary: "bg-surface-200 text-text-primary hover:bg-surface-300",
        ghost: "hover:bg-surface-100 hover:text-text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-secondary text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-secondary-600",
        gradient: "bg-gradient-to-br from-primary via-primary-600 to-accent text-white shadow-lg shadow-primary/25 hover:shadow-primary/30 hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, loading, children, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
