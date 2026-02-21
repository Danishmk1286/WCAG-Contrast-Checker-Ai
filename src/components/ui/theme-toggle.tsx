import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/ui/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const handleToggle = () => {
    if (typeof window === "undefined") return
    
    // Get the current effective theme (what's actually applied to the DOM)
    const root = window.document.documentElement
    const isDark = root.classList.contains("dark")
    
    // Toggle to the opposite of current effective theme
    setTheme(isDark ? "light" : "dark")
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-disabled:pointer-events-none aria-disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent rounded-md h-9 w-9 relative text-foreground hover:text-primary"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}