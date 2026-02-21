import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    style={{
      contain: 'layout style',
      willChange: 'auto'
    }}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-3.5 w-full grow overflow-hidden rounded-full bg-muted/80 dark:bg-muted/60 border border-border/60" style={{ contain: 'layout style' }}>
      <SliderPrimitive.Range className="absolute h-full bg-primary rounded-full" style={{ willChange: 'transform' }} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className="block h-6 w-6 rounded-full border-2 border-primary bg-background shadow-md ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 slider-thumb-hover" 
      style={{
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        contain: 'layout style paint',
        position: 'relative',
        margin: 0,
        padding: 0
      }}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
