import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/80 focus-visible:ring-primary focus-visible:ring-offset-2 border border-primary shadow-sm hover:shadow-md active:shadow-sm transition-all duration-200 [&:hover]:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 focus-visible:ring-destructive focus-visible:ring-offset-2 border border-destructive shadow-sm hover:shadow-md active:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        outline:
          "border border-border bg-background text-foreground hover:bg-accent hover:border-primary hover:text-foreground active:bg-accent/90 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:border-border",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground active:bg-secondary/70 active:text-secondary-foreground focus-visible:ring-secondary focus-visible:ring-offset-2 border border-border shadow-sm hover:shadow-md active:shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed [&:hover]:text-secondary-foreground",
        ghost: "text-foreground/80 hover:bg-accent hover:text-foreground active:bg-accent/90 active:text-foreground focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent [&:hover]:text-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/90 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
