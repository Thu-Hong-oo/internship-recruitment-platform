"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { useEmployerProfile } from "@/contexts/EmployerProfileContext";

interface VerificationContextType {
  refreshVerification: () => void;
  isRefreshing: boolean;
}

const VerificationContext = createContext<VerificationContextType | undefined>(
  undefined
);

export function VerificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshVerificationStatus } = useVerificationStatus();
  const { refreshProfile } = useEmployerProfile();

  const refreshVerification = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Refresh profile first, then verification status will update automatically
      await refreshProfile();
      await refreshVerificationStatus();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshVerificationStatus, refreshProfile]);

  return (
    <VerificationContext.Provider value={{ refreshVerification, isRefreshing }}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerificationContext() {
  const context = useContext(VerificationContext);
  if (context === undefined) {
    throw new Error(
      "useVerificationContext must be used within a VerificationProvider"
    );
  }
  return context;
}

