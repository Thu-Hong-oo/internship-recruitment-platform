"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { jobsAPI, api } from "@/lib/api";
import type { ApplyToJobRequest } from "@/lib/api/types";

interface ResumeOption {
  id: string;
  label: string;
  isCurrent?: boolean;
}

interface ApplyJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobTitle?: string;
  onSuccess?: () => void;
}

export function ApplyJobModal({
  open,
  onOpenChange,
  jobId,
  jobTitle,
  onSuccess,
}: ApplyJobModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeOptions, setResumeOptions] = useState<ResumeOption[]>([]);
  const [showResumeSelect, setShowResumeSelect] = useState(false);
  const [selectedResume, setSelectedResume] = useState<ResumeOption | null>(null);
  const [formData, setFormData] = useState<ApplyToJobRequest>({
    coverLetter: "",
    resumeId: "current",
    additionalInfo: {
      availableStartDate: "",
      expectedSalary: undefined,
      noticePeriod: "",
    },
  });

  // Load resumes when modal opens
  useEffect(() => {
    if (open) {
      loadResumes();
      setShowResumeSelect(false);
    } else {
      // Reset when modal closes
      setShowResumeSelect(false);
      setSelectedResume(null);
    }
  }, [open]);

  const loadResumes = async () => {
    try {
      setLoadingResumes(true);
      const resumesRes = await api.candidateCV.getResumesAll();

      if (resumesRes?.success && resumesRes.data) {
        const options: ResumeOption[] = [];
        
        // Get current CV - current doesn't have _id, it's identified by "current"
        const current = (resumesRes.data as any).current;
        let currentOption: ResumeOption | null = null;
        
        if (current && (current.url || current.filename)) {
          currentOption = {
            id: "current",
            label: current.displayName || current.filename || "CV hiện tại",
            isCurrent: true,
          };
          options.push(currentOption);
        }

        // Add history CVs - these have _id
        const history = (resumesRes.data as any).history ?? [];
        history.forEach((cv: any) => {
          if (cv._id) {
            options.push({
              id: cv._id,
              label: cv.displayName || cv.filename || "CV không tên",
            });
          }
        });

        setResumeOptions(options);
        
        // Set default to current CV if available
        if (currentOption) {
          setSelectedResume(currentOption);
          setFormData((prev) => ({ ...prev, resumeId: "current" }));
        } else if (options.length > 0) {
          // If no current, use first available CV from history
          setSelectedResume(options[0]);
          setFormData((prev) => ({ ...prev, resumeId: options[0].id }));
        }
      }
    } catch (err: any) {
      console.error("Failed to load resumes:", err);
      // Don't show error, just use "current" as fallback
      const fallbackOption = { id: "current", label: "CV hiện tại", isCurrent: true };
      setResumeOptions([fallbackOption]);
      setSelectedResume(fallbackOption);
      setFormData((prev) => ({ ...prev, resumeId: "current" }));
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleResumeChange = (resumeId: string) => {
    const selected = resumeOptions.find((opt) => opt.id === resumeId);
    if (selected) {
      setSelectedResume(selected);
      setFormData((prev) => ({ ...prev, resumeId: selected.id }));
      setShowResumeSelect(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Clean up form data - remove empty fields
      const cleanedData: ApplyToJobRequest = {
        coverLetter: formData.coverLetter?.trim() || undefined,
        resumeId: formData.resumeId || "current", // Default to "current" if not set
        additionalInfo: formData.additionalInfo
          ? {
              availableStartDate:
                formData.additionalInfo.availableStartDate || undefined,
              expectedSalary:
                formData.additionalInfo.expectedSalary || undefined,
              noticePeriod:
                formData.additionalInfo.noticePeriod?.trim() || undefined,
            }
          : undefined,
      };

      // Remove additionalInfo if all fields are empty
      if (
        cleanedData.additionalInfo &&
        !cleanedData.additionalInfo.availableStartDate &&
        !cleanedData.additionalInfo.expectedSalary &&
        !cleanedData.additionalInfo.noticePeriod
      ) {
        delete cleanedData.additionalInfo;
      }

      const response = await jobsAPI.applyToJob(jobId, cleanedData);

      if (response.success) {
        onSuccess?.();
        onOpenChange(false);
        // Reset form
        setFormData({
          coverLetter: "",
          resumeId: "current",
          additionalInfo: {
            availableStartDate: "",
            expectedSalary: undefined,
            noticePeriod: "",
          },
        });
        setShowResumeSelect(false);
        // Reset selected resume will be handled by useEffect when modal closes
      } else {
        setError(response.message || response.error || "Không thể ứng tuyển");
      }
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi ứng tuyển");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ứng tuyển công việc</DialogTitle>
          <DialogDescription>
            {jobTitle && (
              <span className="font-medium text-foreground">{jobTitle}</span>
            )}
            <br />
            Vui lòng điền thông tin để hoàn tất đơn ứng tuyển
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resume Selection */}
          <div className="space-y-2">
            <Label>
              CV sử dụng <span className="text-muted-foreground">*</span>
            </Label>
            {loadingResumes ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải danh sách CV...
              </div>
            ) : showResumeSelect ? (
              <div className="space-y-2">
                <Select
                  value={formData.resumeId || "current"}
                  onValueChange={handleResumeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn CV" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumeOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.isCurrent && "⭐ "}
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResumeSelect(false)}
                  className="text-xs"
                >
                  Hủy
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                  {selectedResume ? (
                    <span className="flex items-center gap-2">
                      {selectedResume.isCurrent && "⭐ "}
                      {selectedResume.label}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">CV hiện tại</span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowResumeSelect(true)}
                  disabled={resumeOptions.length <= 1}
                >
                  Đổi CV
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {showResumeSelect
                ? "Chọn CV bạn muốn sử dụng để ứng tuyển"
                : "CV hiện tại sẽ được sử dụng. Bấm 'Đổi CV' để chọn CV khác"}
            </p>
          </div>

          {/* Cover Letter */}
          <div className="space-y-2">
            <Label htmlFor="coverLetter">
              Thư xin việc <span className="text-muted-foreground">(Tùy chọn)</span>
            </Label>
            <Textarea
              id="coverLetter"
              placeholder="Viết thư xin việc của bạn tại đây..."
              value={formData.coverLetter || ""}
              onChange={(e) =>
                setFormData({ ...formData, coverLetter: e.target.value })
              }
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Thư xin việc giúp bạn thể hiện sự quan tâm và phù hợp với vị trí
            </p>
          </div>

          {/* Additional Info Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium">Thông tin bổ sung</h3>

            {/* Available Start Date */}
            <div className="space-y-2">
              <Label htmlFor="availableStartDate">
                Ngày có thể bắt đầu làm việc{" "}
                <span className="text-muted-foreground">(Tùy chọn)</span>
              </Label>
              <Input
                id="availableStartDate"
                type="date"
                value={formData.additionalInfo?.availableStartDate || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    additionalInfo: {
                      ...formData.additionalInfo,
                      availableStartDate: e.target.value,
                    },
                  })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Expected Salary */}
            <div className="space-y-2">
              <Label htmlFor="expectedSalary">
                Mức lương mong muốn (VND){" "}
                <span className="text-muted-foreground">(Tùy chọn)</span>
              </Label>
              <Input
                id="expectedSalary"
                type="number"
                placeholder="Ví dụ: 15000000"
                value={formData.additionalInfo?.expectedSalary || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    additionalInfo: {
                      ...formData.additionalInfo,
                      expectedSalary: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    },
                  })
                }
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                Nhập số tiền mong muốn (không cần dấu phẩy hoặc chấm)
              </p>
            </div>

            {/* Notice Period */}
            <div className="space-y-2">
              <Label htmlFor="noticePeriod">
                Thời gian báo trước{" "}
                <span className="text-muted-foreground">(Tùy chọn)</span>
              </Label>
              <Input
                id="noticePeriod"
                type="text"
                placeholder="Ví dụ: 1 tháng, 2 tuần..."
                value={formData.additionalInfo?.noticePeriod || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    additionalInfo: {
                      ...formData.additionalInfo,
                      noticePeriod: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Gửi đơn ứng tuyển"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

