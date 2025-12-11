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
import { Loader2, Upload, FileText, Monitor } from "lucide-react";
import { jobsAPI, api, candidateService } from "@/lib/api";
import type { ApplyToJobRequest } from "@/lib/api/types";
import { exportCVOnlineToPDF, validateFile } from "@/utils/cvExport";
import type { CVData } from "@/lib/mocks/cvSamples";
import CVPreview from "@/components/cv/CVPreview";
import { apiClient } from "@/lib/api/client";

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
  const skillsRaw = content?.skills || [];
  const skillsFlattened: string[] = [];
  const addSkills = (arr: any[]) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((s) => {
      if (typeof s === "string") {
        skillsFlattened.push(s);
      } else if (s?.name) {
        skillsFlattened.push(s.name);
      }
    });
  };
  if (Array.isArray(skillsRaw)) {
    skillsRaw.forEach((item: any) => {
      addSkills(item?.technical || []);
      addSkills(item?.soft || []);
      addSkills(item?.languages || []);
    });
  } else if (skillsRaw) {
    addSkills(skillsRaw.technical || []);
    addSkills(skillsRaw.soft || []);
    addSkills(skillsRaw.languages || []);
  }

  return {
    personal: {
      name: personalInfo.fullName || "",
      email: personalInfo.email || "",
      phone: personalInfo.phone || "",
      address:
        typeof personalInfo.address === "string"
          ? personalInfo.address
          : personalInfo.address?.street || "",
      summary:
        content?.summary ||
        personalInfo.summary ||
        personalInfo.bio ||
        personalInfo.objective ||
        "",
      avatar: personalInfo.avatar || undefined,
      jobTitle:
        personalInfo.jobTitle ||
        personalInfo.position ||
        personalInfo.title ||
        personalInfo.targetRole ||
        "",
      website:
        personalInfo.website ||
        personalInfo.portfolio ||
        personalInfo.personalWebsite ||
        personalInfo.linkedin ||
        personalInfo.github ||
        personalInfo.link ||
        "",
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
    skills: skillsFlattened,
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
  const [selectedResume, setSelectedResume] = useState<ResumeOption | null>(
    null
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cvDataMap, setCvDataMap] = useState<Record<string, CVData>>({});
  const [loadingCVs, setLoadingCVs] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [formData, setFormData] = useState<ApplyToJobRequest>({
    coverLetter: "",
    resumeId: "current",
    additionalInfo: {
      availableStartDate: "",
      expectedSalary: undefined,
      noticePeriod: "",
    },
  });
  const primaryColor = "oklch(0.65 0.18 195)";

  // Check if already applied and load resumes when modal opens
  useEffect(() => {
    if (open) {
      const checkAndLoad = async () => {
        const alreadyApplied = await checkAlreadyApplied();
        if (!alreadyApplied) {
          loadResumes();
        }
      };
      checkAndLoad();
    } else {
      // Reset when modal closes
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
      const onlineCvEntries: Array<{ resumeId: string; templateId: string }> =
        [];

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
            onlineCvEntries.push({
              resumeId: resumeId as string,
              templateId,
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

      // Load CV data for online CVs to render preview
      if (onlineCvEntries.length > 0) {
        setLoadingCVs(true);
        try {
          const previewPromises = onlineCvEntries.map(
            async ({ resumeId, templateId }) => {
              try {
                const resumeRes = await candidateService.getResumeById(
                  resumeId
                );
                if (resumeRes?.success && resumeRes.data?.content) {
                  const cvData = normalizeContentToCVData(
                    resumeRes.data.content,
                    templateId
                  );
                  return { resumeId, cvData };
                }
              } catch (error) {
                console.error(
                  `Failed to load CV data for resume ${resumeId}`,
                  error
                );
              }
              return null;
            }
          );

          const results = await Promise.all(previewPromises);
          const newMap: Record<string, CVData> = {};
          results.forEach((result) => {
            if (result) {
              newMap[result.resumeId] = result.cvData;
            }
          });
          setCvDataMap(newMap);
        } finally {
          setLoadingCVs(false);
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

  const handleCardSelect = (option: ResumeOption) => {
    setSelectedResume(option);
    if (option.type === "file") {
      fileInputRef.current?.click();
    } else {
      setFormData((prev) => ({ ...prev, resumeId: option.id }));
    }
  };

  const handlePreviewUploaded = async (option: ResumeOption, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (option.type !== "uploaded") return;
    try {
      setPreviewLoading(true);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("Không tìm thấy token xác thực");
        return;
      }

      const url =
        option.id === "current"
          ? `${apiClient.getBaseURL()}/candidates/me/resume/view`
          : `${apiClient.getBaseURL()}/candidates/me/resume/view/${option.id}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${txt}`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPreviewUrl(objectUrl);
      setPreviewOpen(true);
    } catch (err: any) {
      setError(err?.message || "Không thể xem CV đã tải lên");
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewOpen(false);
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
    setError(null);
    setFormData((prev) => ({ ...prev, resumeId: "file-upload" }));
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
            
            // Trigger background matching scores calculation
            try {
              const { calculateMatchingScoresImmediate } = await import("@/lib/utils/backgroundMatching");
              calculateMatchingScoresImmediate().catch((err) => {
                console.warn("Failed to trigger matching scores calculation:", err);
              });
            } catch (err) {
              console.warn("Failed to load background matching utility:", err);
            }
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
            
            // Trigger background matching scores calculation after upload
            try {
              const { calculateMatchingScoresImmediate } = await import("@/lib/utils/backgroundMatching");
              calculateMatchingScoresImmediate().catch((err) => {
                console.warn("Failed to trigger matching scores calculation:", err);
              });
            } catch (err) {
              console.warn("Failed to load background matching utility:", err);
            }
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-4xl max-h-[90vh] overflow-y-auto">
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
            ) : (
              <div className="space-y-6">
                {/* Uploaded CVs */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-[0.12em]">
                    CV tải lên
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    {resumeOptions
                      .filter((opt) => opt.type === "uploaded")
                      .map((option) => {
                        const isSelected = selectedResume?.id === option.id;
                        return (
                          <div
                            key={option.id}
                            onClick={() => handleCardSelect(option)}
                            className={`group relative w-full rounded-xl border bg-white/90 text-left transition-all ${
                              isSelected
                                ? "border-[oklch(0.65_0.18_195)] shadow-lg shadow-[oklch(0.65_0.18_195/.2)]"
                                : "border-slate-200 hover:border-[oklch(0.65_0.18_195/.6)] hover:shadow"
                            }`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleCardSelect(option);
                              }
                            }}
                          >
                            <div className="p-4 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[oklch(0.65_0.18_195/.08)]">
                                <FileText
                                  className="w-5 h-5"
                                  style={{ color: primaryColor }}
                                />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                  {option.isCurrent && "⭐"}
                                  <span className="truncate">{option.label}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">CV đã tải lên</p>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handlePreviewUploaded(option, e)}
                                  disabled={previewLoading}
                                  className="h-8 px-3 text-xs"
                                >
                                  {previewLoading ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                                      Đang mở...
                                    </>
                                  ) : (
                                    "Xem trước"
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {/* Upload new CV card */}
                    <div className="relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white/70 p-6 text-center hover:border-[oklch(0.65_0.18_195)] hover:bg-white transition min-h-[150px]">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="w-6 h-6 text-[oklch(0.65_0.18_195)]" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Tải CV từ máy
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hỗ trợ PDF, DOC, DOCX (tối đa 10MB)
                        </p>
                      </div>
                      {uploadedFile && (
                        <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm w-full">
                          <FileText className="w-4 h-4" />
                          <span className="flex-1 truncate">{uploadedFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUploadedFile(null);
                              setSelectedResume(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CV Online */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-[0.12em]">
                    CV Online
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    {resumeOptions
                      .filter((opt) => opt.type === "online")
                      .map((option) => {
                        const isSelected = selectedResume?.id === option.id;
                        const cvData =
                          option.resumeId ? cvDataMap[option.resumeId] : undefined;
                        const hasPreview = !!cvData;

                        return (
                          <div
                            key={option.id}
                            onClick={() => handleCardSelect(option)}
                            className={`group relative w-full overflow-hidden rounded-xl border bg-white/90 text-left transition-all ${
                              isSelected
                                ? "border-[oklch(0.65_0.18_195)] shadow-lg shadow-[oklch(0.65_0.18_195/.2)]"
                                : "border-slate-200 hover:border-[oklch(0.65_0.18_195/.6)] hover:shadow"
                            }`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleCardSelect(option);
                              }
                            }}
                            style={{
                              background:
                                "linear-gradient(135deg, oklch(0.60 0.12 195 / 0.05) 0%, transparent 70%)",
                            }}
                          >
                            <div className="relative w-full aspect-[3/4] bg-muted/30 overflow-hidden">
                              {hasPreview ? (
                                <div className="w-full h-full bg-white">
                                  <CVPreview
                                    data={cvData}
                                    templateId={option.templateId || "modern"}
                                  />
                                  <div className="absolute top-3 left-3">
                                    <span className="rounded-full bg-emerald-600/90 px-2.5 py-1 text-[11px] font-medium text-white shadow">
                                      CV Online
                                    </span>
                                  </div>
                                </div>
                              ) : loadingCVs ? (
                                <div className="flex h-full items-center justify-center text-muted-foreground">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                              ) : (
                                <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                                  <Monitor className="w-6 h-6" />
                                  <span className="text-xs">Không xem trước</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3 space-y-1">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                {option.isCurrent && "⭐"}
                                <span className="truncate">{option.label}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">CV Online</p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Chọn CV để ứng tuyển hoặc tải lên CV mới ngay tại đây.
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

    {/* Preview modal for uploaded CVs */}
    <Dialog open={previewOpen} onOpenChange={(open) => !open && closePreview()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Xem trước CV đã tải lên</DialogTitle>
        </DialogHeader>
        {previewUrl ? (
          <div className="flex-1 h-full border rounded-lg overflow-hidden">
            <iframe
              src={previewUrl}
              title="Uploaded CV Preview"
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Đang tải CV...
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={closePreview} variant="outline">
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
