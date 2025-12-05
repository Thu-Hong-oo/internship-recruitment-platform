"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getToken } from "@/lib/userStorage";
import { getEmployerProfile } from "@/lib/api";

interface EmployerProfile {
  _id?: string;
  user?: {
    fullName?: string;
    avatar?: string;
    email?: string;
  };
  company?: any;
  businessInfo?: any;
  legalRepresentative?: any;
  contact?: any;
  position?: any;
  stats?: any;
  status?: "draft" | "pending" | "verified" | "rejected" | "suspended";
  verification?: any;
  companyMembers?: any;
  documents?: any[];
  completion?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface EmployerProfileContextType {
  profile: EmployerProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  isRefreshing: boolean;
}

const EmployerProfileContext = createContext<EmployerProfileContextType | undefined>(
  undefined
);

export function EmployerProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập");
        return;
      }

      const result = await getEmployerProfile(token);
      const profileData = result?.data || result?.profile || null;

      if (profileData) {
        setProfile(profileData);
      } else {
        setError("Không thể tải thông tin profile");
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tải profile");
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile(true);
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile(false);
  }, [fetchProfile]);

  return (
    <EmployerProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        refreshProfile,
        isRefreshing,
      }}
    >
      {children}
    </EmployerProfileContext.Provider>
  );
}

export function useEmployerProfile() {
  const context = useContext(EmployerProfileContext);
  if (context === undefined) {
    throw new Error(
      "useEmployerProfile must be used within an EmployerProfileProvider"
    );
  }
  return context;
}

