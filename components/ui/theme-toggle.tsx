"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show the theme toggle after component is mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, return a button with a fallback icon that will be replaced
  // after hydration to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant='ghost'
        size='icon'
        aria-label='Toggle theme'
        onClick={() => setTheme("dark")}
      >
        <div className='h-5 w-5' />
      </Button>
    );
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      aria-label='Toggle theme'
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className='h-5 w-5' />
      ) : (
        <Moon className='h-5 w-5' />
      )}
    </Button>
  );
}
