import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-50 transition-colors duration-200",
          className
        )}
        ref={ref}
        {...props}
        aria-invalid={props['aria-invalid'] || undefined}
        aria-describedby={props['aria-describedby'] || undefined}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
