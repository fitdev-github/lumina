import * as React from "react"
import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary-50 text-primary border border-primary-100",
        secondary: "bg-secondary-50 text-secondary border border-secondary-100",
        success: "bg-secondary-50 text-secondary border border-secondary-100",
        warning: "bg-warning-50 text-warning border border-warning-100",
        error: "bg-error-50 text-error border border-error-100",
        outline: "border border-border text-text-secondary",
        subtle: "bg-surface-100 text-text-tertiary",
        gradient: "bg-gradient-to-r from-primary to-accent text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
