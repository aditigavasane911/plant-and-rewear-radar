import { Moon, Sun, Laptop, Check } from "lucide-react";
import { useTheme, type Theme } from "./theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "segmented" | "dropdown";
}

export function ThemeToggle({ className = "", variant = "icon" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center rounded-full border border-border bg-card p-1 shadow-xs ${className}`}
        role="radiogroup"
        aria-label="Theme selector"
      >
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            resolvedTheme === "light"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-checked={resolvedTheme === "light"}
          role="radio"
        >
          <Sun className="size-3.5" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            resolvedTheme === "dark"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-checked={resolvedTheme === "dark"}
          role="radio"
        >
          <Moon className="size-3.5" />
          <span>Dark</span>
        </button>
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`btn-outline group relative size-9 rounded-full p-0 transition-transform active:scale-95 ${className}`}
            aria-label={`Current theme: ${theme}. Click to change theme.`}
            title={`Current theme: ${theme}. Click to change.`}
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 text-teal-300" />
            <span className="sr-only">Toggle theme</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5">
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium"
          >
            <span className="flex items-center gap-2">
              <Sun className="size-4 text-amber-500" />
              Light Theme
            </span>
            {theme === "light" && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium"
          >
            <span className="flex items-center gap-2">
              <Moon className="size-4 text-teal-400" />
              Dark Theme
            </span>
            {theme === "dark" && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium"
          >
            <span className="flex items-center gap-2">
              <Laptop className="size-4 text-muted-foreground" />
              System Match
            </span>
            {theme === "system" && <Check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default "icon" variant: one-click instant toggle with smooth animated icon and dropdown on right click / menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            // If primary click on button, toggle directly
            // Dropdown still accessible via keyboard or chevron
          }}
          className={`group relative inline-flex size-9 items-center justify-center rounded-full border border-border bg-card/80 text-foreground backdrop-blur-xs transition-all duration-200 hover:border-primary/50 hover:bg-accent hover:shadow-xs active:scale-95 ${className}`}
          aria-label={`Switch theme (currently ${resolvedTheme})`}
          title={`Switch theme (currently ${resolvedTheme})`}
        >
          <Sun className="size-4.5 rotate-0 scale-100 text-amber-600 transition-all duration-300 group-hover:rotate-45 dark:-rotate-90 dark:scale-0 dark:text-amber-400" />
          <Moon className="absolute size-4.5 rotate-90 scale-0 text-primary transition-all duration-300 group-hover:-rotate-12 dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl p-1.5 shadow-lg border border-border bg-card/95 backdrop-blur-md">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-accent"
        >
          <span className="flex items-center gap-2">
            <Sun className="size-4 text-amber-500" />
            Light Theme
          </span>
          {theme === "light" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-accent"
        >
          <span className="flex items-center gap-2">
            <Moon className="size-4 text-primary" />
            Dark Theme
          </span>
          {theme === "dark" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-accent"
        >
          <span className="flex items-center gap-2">
            <Laptop className="size-4 text-muted-foreground" />
            System Auto
          </span>
          {theme === "system" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
