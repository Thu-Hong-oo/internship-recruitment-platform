"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useSavedJobs } from "@/contexts/SavedJobsContext";

interface SaveJobButtonProps {
  jobId: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
}

export function SaveJobButton({
  jobId,
  className,
  variant = "outline",
  size = "default",
  showText = true,
}: SaveJobButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isJobSaved, saveJob, unsaveJob, isLoading: contextLoading, savedJobIds } = useSavedJobs();
  const [isLoading, setIsLoading] = useState(false);

  // Check if job is saved (local check, no API call)
  const isSaved = isJobSaved(jobId);

  const handleToggleSave = async () => {
    // Check authentication
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      toast({
        title: "Cần đăng nhập",
        description: "Vui lòng đăng nhập để lưu việc làm",
        variant: "destructive",
      });
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsLoading(true);
    try {
      if (isSaved) {
        // Remove saved job
        await unsaveJob(jobId);
        toast({
          title: "Đã bỏ lưu",
          description: "Việc làm đã được xóa khỏi danh sách đã lưu",
        });
      } else {
        // Save job
        await saveJob(jobId);
        toast({
          title: "Đã lưu việc làm",
          description: "Việc làm đã được thêm vào danh sách đã lưu",
        });
      }
    } catch (error: any) {
      console.error("Error toggling save:", error);
      toast({
        title: "Lỗi",
        description: error?.message || "Đã xảy ra lỗi. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state only when context is initially loading (first time)
  // After that, we can show the button immediately since we have cached data
  if (contextLoading && savedJobIds.size === 0) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        {showText && "Đang tải..."}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleToggleSave}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          {showText && (isSaved ? "Đang bỏ lưu..." : "Đang lưu...")}
        </>
      ) : isSaved ? (
        <>
          <BookmarkCheck className="w-4 h-4 mr-2 fill-current" />
          {showText && "Đã lưu"}
        </>
      ) : (
        <>
          <Bookmark className="w-4 h-4 mr-2" />
          {showText && "Lưu việc làm"}
        </>
      )}
    </Button>
  );
}

