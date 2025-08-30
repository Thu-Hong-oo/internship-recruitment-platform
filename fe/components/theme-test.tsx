"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeTest() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-50 bg-card border border-border rounded-lg p-4 shadow-lg">
      <div className="text-sm mb-2">
        <strong>Current Theme:</strong> {theme}
      </div>
      <div className="space-x-2">
        <Button
          size="sm"
          onClick={() => setTheme("light")}
          variant={theme === "light" ? "default" : "outline"}
        >
          Light
        </Button>
        <Button
          size="sm"
          onClick={() => setTheme("dark")}
          variant={theme === "dark" ? "default" : "outline"}
        >
          Dark
        </Button>
        <Button
          size="sm"
          onClick={() => setTheme("system")}
          variant={theme === "system" ? "default" : "outline"}
        >
          System
        </Button>
      </div>
    </div>
  );
}
