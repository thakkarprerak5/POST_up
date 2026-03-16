"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render nothing meaningful until mounted
  useEffect(() => setMounted(true), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-lg hover:bg-secondary/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Toggle theme"
        >
          {/* Sun icon — visible in light, hidden in dark */}
          <Sun
            className="h-5 w-5 rotate-0 scale-100 transition-all duration-500 ease-in-out dark:-rotate-90 dark:scale-0"
            strokeWidth={1.8}
          />
          {/* Moon icon — visible in dark, hidden in light */}
          <Moon
            className="absolute h-5 w-5 rotate-90 scale-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100"
            strokeWidth={1.8}
          />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-[160px] rounded-xl border border-border/60 bg-popover/95 p-1.5 shadow-xl shadow-black/10 premium-backdrop-blur"
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            {themes.map(({ value, label, icon: Icon }) => {
              const isActive = mounted && theme === value;

              return (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setTheme(value)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200 focus:bg-accent/50 data-[highlighted]:bg-accent/50"
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                  <span
                    className={`flex-1 transition-colors duration-200 ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 25,
                      }}
                    >
                      <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
                    </motion.div>
                  )}
                </DropdownMenuItem>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
