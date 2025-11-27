"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { ApplyJobModal } from "./ApplyJobModal";

interface ApplyButtonProps {
  jobId: string;
  jobTitle?: string;
  className?: string;
  variant?: "default" | "outline";
  applied?: boolean; // External state to track if already applied
}

export function ApplyButton({
  jobId,
  jobTitle,
  className,
  variant = "default",
  applied: externalApplied,
}: ApplyButtonProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [applied, setApplied] = useState(externalApplied || false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    }
  }, []);

  // Update applied state when external prop changes
  useEffect(() => {
    if (externalApplied !== undefined) {
      setApplied(externalApplied);
    }
  }, [externalApplied]);

  const handleClick = () => {
    // Check authentication first
    if (!isAuthenticated) {
      router.push("/login?redirect=/jobs/" + jobId);
      return;
    }

    // Open modal
    setModalOpen(true);
  };

  const handleSuccess = () => {
    setApplied(true);
    // Refresh page to update stats
    router.refresh();
  };

  if (applied) {
    return (
      <Button variant="outline" disabled className={className}>
        <CheckCircle2 className="w-4 h-4 mr-2" />
        Đã ứng tuyển
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        className={className}
        variant={variant}
      >
        Ứng tuyển ngay
      </Button>
      <ApplyJobModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        jobId={jobId}
        jobTitle={jobTitle}
        onSuccess={handleSuccess}
      />
    </>
  );
}

