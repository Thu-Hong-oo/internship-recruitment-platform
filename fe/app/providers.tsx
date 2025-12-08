"use client";

import type React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/useAuth";
import { SavedJobsProvider } from "@/contexts/SavedJobsContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <SavedJobsProvider>{children}</SavedJobsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
