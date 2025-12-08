"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { savedJobService, type SavedJob } from "@/lib/api";

interface SavedJobsContextType {
  savedJobIds: Set<string>;
  savedJobs: SavedJob[];
  isLoading: boolean;
  isJobSaved: (jobId: string) => boolean;
  saveJob: (jobId: string) => Promise<void>;
  unsaveJob: (jobId: string) => Promise<void>;
  refreshSavedJobs: () => Promise<void>;
}

const SavedJobsContext = createContext<SavedJobsContextType | undefined>(undefined);

export function SavedJobsProvider({ children }: { children: React.ReactNode }) {
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("token");
  };

  // Load all saved jobs
  const refreshSavedJobs = useCallback(async () => {
    if (!isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await savedJobService.getSavedJobs({ limit: 1000 }); // Get all saved jobs
      
      if (response.success && response.data) {
        const jobs = response.data;
        setSavedJobs(jobs);
        // Create a Set of job IDs for fast lookup
        const ids = new Set(
          jobs
            .map((savedJob) => savedJob.jobId?._id || savedJob.jobId)
            .filter(Boolean)
        );
        setSavedJobIds(ids);
      }
    } catch (error) {
      console.error("Failed to load saved jobs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load saved jobs on mount and when token changes
  useEffect(() => {
    refreshSavedJobs();

    // Listen for login/logout events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        if (e.newValue) {
          refreshSavedJobs();
        } else {
          setSavedJobIds(new Set());
          setSavedJobs([]);
        }
      }
    };

    const handleLogin = () => {
      refreshSavedJobs();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("user-login", handleLogin);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("user-login", handleLogin);
    };
  }, [refreshSavedJobs]);

  // Check if a job is saved (local check, no API call)
  const isJobSaved = useCallback(
    (jobId: string) => {
      if (!jobId) return false;
      return savedJobIds.has(jobId);
    },
    [savedJobIds]
  );

  // Save a job
  const saveJob = useCallback(
    async (jobId: string) => {
      if (!isAuthenticated()) {
        throw new Error("Cần đăng nhập để lưu việc làm");
      }

      try {
        const response = await savedJobService.saveJob(jobId);
        if (response.success) {
          // Update local state immediately (optimistic update)
          setSavedJobIds((prev) => new Set([...prev, jobId]));
          
          // Refresh to get the full saved job object
          await refreshSavedJobs();
        } else {
          throw new Error(response.message || "Không thể lưu việc làm");
        }
      } catch (error) {
        // Revert optimistic update on error
        setSavedJobIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        throw error;
      }
    },
    [refreshSavedJobs]
  );

  // Unsave a job
  const unsaveJob = useCallback(
    async (jobId: string) => {
      if (!isAuthenticated()) {
        throw new Error("Cần đăng nhập để bỏ lưu việc làm");
      }

      try {
        const response = await savedJobService.removeSavedJobByJobId(jobId);
        if (response.success) {
          // Update local state immediately (optimistic update)
          setSavedJobIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
          setSavedJobs((prev) => prev.filter((job) => {
            const id = job.jobId?._id || job.jobId;
            return id !== jobId;
          }));
        } else {
          throw new Error(response.message || "Không thể bỏ lưu việc làm");
        }
      } catch (error) {
        // Revert optimistic update on error
        setSavedJobIds((prev) => new Set([...prev, jobId]));
        throw error;
      }
    },
    []
  );

  return (
    <SavedJobsContext.Provider
      value={{
        savedJobIds,
        savedJobs,
        isLoading,
        isJobSaved,
        saveJob,
        unsaveJob,
        refreshSavedJobs,
      }}
    >
      {children}
    </SavedJobsContext.Provider>
  );
}

export function useSavedJobs() {
  const context = useContext(SavedJobsContext);
  if (context === undefined) {
    throw new Error("useSavedJobs must be used within a SavedJobsProvider");
  }
  return context;
}

