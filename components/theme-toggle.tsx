"use client";

import { Button } from "@/components/ui/button";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";

const applyTheme = (theme: "dark" | "light") => {
  document.documentElement.classList.toggle("dark", theme === "dark");

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Keep the visual theme for this visit when storage is blocked.
  }
};

const ThemeToggle = () => {
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    applyTheme(isDark ? "light" : "dark");
  };

  return (
    <Button type="button" variant="outline" size="icon-sm" onClick={toggleTheme}>
      <Sun className="hidden dark:block" aria-hidden />
      <Moon className="dark:hidden" aria-hidden />
      <span className="sr-only dark:hidden">Switch to dark mode</span>
      <span className="sr-only hidden dark:block">Switch to light mode</span>
    </Button>
  );
};

export { ThemeToggle };
