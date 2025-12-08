"use client";

import { useState, useEffect, useRef } from "react";
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
import { Loader2, Upload, FileText, Monitor } from "lucide-react";
import { jobsAPI, api, candidateService } from "@/lib/api";
import type { ApplyToJobRequest } from "@/lib/api/types";
import { exportCVOnlineToPDF, validateFile } from "@/utils/cvExport";
import type { CVData } from "@/lib/mocks/cvSamples";

const TEMPLATE_ID_MAP: Record<string, number> = {
  modern: 1,
  minimal: 2,
};

const normalizeContentToCVData = (
  content: any,
  templateKey: string
): CVData => {
  const templateNum = TEMPLATE_ID_MAP[templateKey] || 1;

  if (content?.personal && typeof content.personal === "object") {
    return {
      ...(content as CVData),
      templateId: content.templateId ?? templateNum,
    };
  }

  const personalInfo = content?.personalInfo || {};
  return {
    personal: {
      name: personalInfo.fullName || "",
      email: personalInfo.email || "",
      phone: personalInfo.phone || "",
      address:
        typeof personalInfo.address === "string"
          ? personalInfo.address
          : personalInfo.address?.street || "",
      summary: content?.summary || personalInfo.bio || "",
      avatar: personalInfo.avatar || undefined,
    },
    experience: (content?.experience || []).map((exp: any) => ({
      company: exp.company || "",
      role: exp.position || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      description: exp.description || "",
    })),
    education: (content?.education || []).map((edu: any) => ({
      school: edu.institution || edu.school || "",
      degree: edu.degree || "",
      startDate: edu.startYear || edu.startDate || "",
      endDate: edu.endYear || edu.endDate || "",
    })),
    skills: (content?.skills?.technical || []).map((skill: any) =>
      typeof skill === "string" ? skill : skill.name || ""
    ),
    templateId: templateNum,
    projects: (content?.projects || []).map((proj: any) => ({
      title: proj.title || "",
      description: proj.description || "",
    })),
    languages: (content?.skills?.languages || []).map((lang: any) => ({
      name: typeof lang === "string" ? lang : lang.language || lang.name || "",
      level: lang.level || "",
    })),
    certifications: (content?.certifications || []).map((cert: any) => ({
      name: cert.name || "",
      issuer: cert.issuer || "",
      year: cert.issueDate || cert.year || "",
    })),
  };
};

interface ResumeOption {
  id: string;
  label: string;
  type: "uploaded" | "online" | "file";
  isCurrent?: boolean;
  templateId?: string;
  resumeId?: string;
  templateName?: string;
  file?: File;
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
  const [selectedResume, setSelectedResume] = useState<ResumeOption | null>(
    null
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<ApplyToJobRequest>({
    coverLetter: "",
    resumeId: "current",
    additionalInfo: {
      availableStartDate: "",
      expectedSalary: undefined,
      noticePeriod: "",
    },
  });

  // Check if already applied and load resumes when modal opens
  useEffect(() => {
    if (open) {
      const checkAndLoad = async () => {
        const alreadyApplied = await checkAlreadyApplied();
        if (!alreadyApplied) {
          loadResumes();
        }
        setShowResumeSelect(false);
      };
      checkAndLoad();
    } else {
      // Reset when modal closes
      setShowResumeSelect(false);
      setSelectedResume(null);
      setUploadedFile(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const checkAlreadyApplied = async () => {
    try {
      const jobRes = await jobsAPI.getJobById(jobId);
      if (jobRes?.success && jobRes.data?.hasApplied) {
        setError("Bạn đã ứng tuyển cho công việc này");
        // Close modal immediately and trigger page reload
        onOpenChange(false);
        // Reload page to update button state
        setTimeout(() => {
          window.location.reload();
        }, 500);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to check application status:", err);
      return false;
    }
  };

  const loadResumes = async () => {
    try {
      setLoadingResumes(true);
      const options: ResumeOption[] = [];

      // Load uploaded CVs
      const resumesRes = await api.candidateCV.getResumesAll();
      if (resumesRes?.success && resumesRes.data) {
        const current = (resumesRes.data as any).current;
        let currentOption: ResumeOption | null = null;

        if (current && (current.url || current.filename)) {
          currentOption = {
            id: "current",
            label: current.displayName || current.filename || "CV hiện tại",
            type: "uploaded",
            isCurrent: true,
          };
          options.push(currentOption);
        }

        const history = (resumesRes.data as any).history ?? [];
        history.forEach((cv: any) => {
          if (cv._id) {
            options.push({
              id: cv._id,
              label: cv.displayName || cv.filename || "CV không tên",
              type: "uploaded",
            });
          }
        });
      }

      // Load online CVs
      try {
        const templateMapRes = await api.candidateCV.getTemplateResumeMap();
        if (templateMapRes?.success && templateMapRes.data?.map) {
          const map = templateMapRes.data.map;
          const templatesRes = await api.candidateCV.getTemplates();

          const templateNameMap: Record<string, string> = {};
          if (templatesRes?.success && templatesRes.data?.templates) {
            templatesRes.data.templates.forEach((t: any) => {
              templateNameMap[t.id] = t.name || t.id;
            });
          }

          Object.entries(map).forEach(([templateId, resumeId]) => {
            options.push({
              id: `online-${resumeId}`,
              label: `${templateNameMap[templateId] || templateId} (CV Online)`,
              type: "online",
              templateId,
              resumeId: resumeId as string,
              templateName: templateNameMap[templateId] || templateId,
            });
          });
        }
      } catch (err) {
        console.error("Failed to load online CVs:", err);
      }

      // Add file upload option
      options.push({
        id: "file-upload",
        label: "Tải CV từ máy",
        type: "file",
      });

      setResumeOptions(options);

      // Set default to current CV if available
      const currentOption = options.find((opt) => opt.isCurrent);
      if (currentOption) {
        setSelectedResume(currentOption);
        setFormData((prev) => ({ ...prev, resumeId: "current" }));
      } else if (options.length > 0) {
        const firstUploaded = options.find((opt) => opt.type === "uploaded");
        if (firstUploaded) {
          setSelectedResume(firstUploaded);
          setFormData((prev) => ({ ...prev, resumeId: firstUploaded.id }));
        }
      }
    } catch (err: any) {
      console.error("Failed to load resumes:", err);
      const fallbackOption: ResumeOption = {
        id: "current",
        label: "CV hiện tại",
        type: "uploaded",
        isCurrent: true,
      };
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
      if (selected.type === "file") {
        // Trigger file input
        fileInputRef.current?.click();
      } else {
        setFormData((prev) => ({ ...prev, resumeId: selected.id }));
        setShowResumeSelect(false);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || "File không hợp lệ");
      return;
    }

    setUploadedFile(file);
    setSelectedResume({
      id: "file-upload",
      label: file.name,
      type: "file",
      file,
    });
    setShowResumeSelect(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalResumeId = formData.resumeId || "current";

      // Xử lý file upload
      if (selectedResume?.type === "file" && selectedResume.file) {
        try {
          const formDataUpload = new FormData();
          formDataUpload.append("file", selectedResume.file);
          // Note: uploadCV sẽ tự động append "action": "upload"

          const uploadRes = await api.candidateCV.uploadCV(formDataUpload);
          if (uploadRes?.success) {
            // Sau khi upload, CV mới sẽ trở thành current
            finalResumeId = "current";
          } else {
            throw new Error("Không thể tải lên CV");
          }
        } catch (uploadErr: any) {
          setError(uploadErr?.message || "Không thể tải lên CV");
          setLoading(false);
          return;
        }
      }

      // Xử lý CV online - export PDF rồi upload
      if (
        selectedResume?.type === "online" &&
        selectedResume.resumeId &&
        selectedResume.templateId
      ) {
        try {
          // Fetch CV data
          const resumeRes = await candidateService.getResumeById(
            selectedResume.resumeId
          );
          if (!resumeRes?.success || !resumeRes.data?.content) {
            throw new Error("Không thể tải dữ liệu CV online");
          }

          // Normalize CV data
          const cvData = normalizeContentToCVData(
            resumeRes.data.content,
            selectedResume.templateId
          );

          // Export to PDF
          const pdfFile = await exportCVOnlineToPDF(
            cvData,
            selectedResume.templateId,
            `cv-${selectedResume.templateId}-${Date.now()}.pdf`
          );

          // Upload PDF
          const formDataUpload = new FormData();
          formDataUpload.append("file", pdfFile);
          // Note: uploadCV sẽ tự động append "action": "upload"

          const uploadRes = await api.candidateCV.uploadCV(formDataUpload);
          if (uploadRes?.success) {
            finalResumeId = "current";
          } else {
            throw new Error("Không thể tải lên CV đã export");
          }
        } catch (exportErr: any) {
          setError(
            exportErr?.message || "Không thể export và tải lên CV online"
          );
          setLoading(false);
          return;
        }
      }

      // Clean up form data - remove empty fields
      const cleanedData: ApplyToJobRequest = {
        coverLetter: formData.coverLetter?.trim() || undefined,
        resumeId: finalResumeId,
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
        setUploadedFile(null);
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
              <div className="space-y-3">
                <Select
                  value={selectedResume?.id || formData.resumeId || "current"}
                  onValueChange={handleResumeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn CV" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* CV Tải Lên */}
                    {resumeOptions.filter((opt) => opt.type === "uploaded")
                      .length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          📁 CV Tải Lên
                        </div>
                        {resumeOptions
                          .filter((opt) => opt.type === "uploaded")
                          .map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.isCurrent && "⭐ "}
                              {option.label}
                            </SelectItem>
                          ))}
                      </>
                    )}

                    {/* CV Online */}
                    {resumeOptions.filter((opt) => opt.type === "online")
                      .length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          💻 CV Online
                        </div>
                        {resumeOptions
                          .filter((opt) => opt.type === "online")
                          .map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                      </>
                    )}

                    {/* Tải CV từ máy */}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      📤 Tải CV từ máy
                    </div>
                    <SelectItem value="file-upload">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Chọn file từ máy tính
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {uploadedFile && (
                  <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                    <FileText className="w-4 h-4" />
                    <span className="flex-1 truncate">{uploadedFile.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setSelectedResume(null);
                        fileInputRef.current!.value = "";
                      }}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowResumeSelect(false);
                    setUploadedFile(null);
                    fileInputRef.current!.value = "";
                  }}
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
                      {selectedResume.type === "online" && (
                        <Monitor className="w-4 h-4 text-blue-500" />
                      )}
                      {selectedResume.type === "file" && (
                        <Upload className="w-4 h-4 text-green-500" />
                      )}
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
                  disabled={
                    resumeOptions.filter((opt) => opt.type !== "file").length <=
                    1
                  }
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
              Thư xin việc{" "}
              <span className="text-muted-foreground">(Tùy chọn)</span>
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
