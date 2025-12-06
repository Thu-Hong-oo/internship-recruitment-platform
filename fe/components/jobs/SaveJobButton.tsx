"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { savedJobService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

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
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if job is saved on mount
  useEffect(() => {
    const checkSaved = async () => {
      if (!jobId) {
        setIsChecking(false);
        return;
      }

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          setIsChecking(false);
          return;
        }

        const response = await savedJobService.checkJobSaved(jobId);
        if (response.success) {
          setIsSaved(response.data.isSaved);
        }
      } catch (error) {
        console.error("Failed to check saved status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSaved();
  }, [jobId]);

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
        const response = await savedJobService.removeSavedJobByJobId(jobId);
        if (response.success) {
          setIsSaved(false);
          toast({
            title: "Đã bỏ lưu",
            description: "Việc làm đã được xóa khỏi danh sách đã lưu",
          });
        } else {
          throw new Error(response.message || "Không thể bỏ lưu việc làm");
        }
      } else {
        // Save job
        const response = await savedJobService.saveJob(jobId);
        if (response.success) {
          setIsSaved(true);
          toast({
            title: "Đã lưu việc làm",
            description: "Việc làm đã được thêm vào danh sách đã lưu",
          });
        } else {
          throw new Error(response.message || "Không thể lưu việc làm");
        }
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

  if (isChecking) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        {showText && "Đang kiểm tra..."}
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

