"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { jobsAPI } from "@/lib/api";
import { CheckCircle2, Clock } from "lucide-react";

interface ApplyFormProps {
  jobId: string;
  deadline?: string;
  hasApplied?: boolean;
}

export function ApplyForm({ jobId, deadline, hasApplied: initialHasApplied = false }: ApplyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [hasApplied, setHasApplied] = useState(initialHasApplied);

  // Sync hasApplied state when prop changes
  useEffect(() => {
    setHasApplied(initialHasApplied);
  }, [initialHasApplied]);

  // Check if deadline has passed
  const isExpired = deadline ? new Date(deadline) < new Date() : false;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (hasApplied) return;

    try {
      setIsSubmitting(true);
      const res = await jobsAPI.apply(jobId, coverLetter);
      
      if ((res as any)?.success !== false) {
        toast({ description: 'Ứng tuyển thành công!', duration: 2000 });
        setCoverLetter(""); 
        setHasApplied(true); // Update state to show applied status
      } else {
        const errorMessage = (res as any)?.message || 'Ứng tuyển thất bại';
        toast({ description: errorMessage, duration: 2500 });
        
        // If error indicates already applied, update state
        if (errorMessage.includes("đã ứng tuyển") || errorMessage.includes("Bạn đã ứng tuyển")) {
          setHasApplied(true);
        }
      }
    } catch (e: any) {
      const errorMessage = e?.message || 'Ứng tuyển thất bại';
      toast({ description: errorMessage, duration: 2500 });
      
      // If error indicates already applied, update state
      if (errorMessage.includes("đã ứng tuyển") || errorMessage.includes("Bạn đã ứng tuyển")) {
        setHasApplied(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasApplied) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">Đã ứng tuyển</span>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-medium">Hết hạn ứng tuyển</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input 
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        placeholder="Lời nhắn (tuỳ chọn)" 
        className="w-56" 
        disabled={isSubmitting}
      />
      <Button className="font-medium" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Đang gửi...' : 'Ứng tuyển ngay'}
      </Button>
    </form>
  );
}