"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";

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

  const refreshVerification = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshVerificationStatus();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshVerificationStatus]);

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

