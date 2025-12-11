"use client";

import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
  Edit3,
} from "lucide-react";
import Link from "next/link";
import { api, type CandidateProfile } from "@/lib/api";
import { apiClient } from "@/lib/api/client";
import PageLayout from "@/components/layout/PageLayout";
import UploadCVModal from "@/components/cv/UploadCVModal";
import CVAnalysisModal from "@/components/cv/CVAnalysisModal";
import CVPreview from "@/components/cv/CVPreview";
import type { CVData } from "@/lib/mocks/cvSamples";
import { candidateService } from "@/lib/api/services/candidate.service";

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

const folderPalettes = {
  current: {
    back: ["oklch(0.70 0.18 190)", "oklch(0.54 0.11 185)"],
    front: ["oklch(0.66 0.16 188)", "oklch(0.52 0.09 182)"],
    highlight: "oklch(0.96 0.03 200 / 0.35)",
    cloud: "oklch(0.99 0 0)",
    text: "oklch(0.40 0.02 200)",
  },
  history: {
    back: ["oklch(0.86 0.07 188)", "oklch(0.72 0.05 184)"],
    front: ["oklch(0.82 0.05 186)", "oklch(0.70 0.04 182)"],
    highlight: "oklch(0.97 0.02 200 / 0.28)",
    cloud: "oklch(1 0 0)",
    text: "oklch(0.46 0.01 200)",
  },
  upload: {
    back: ["oklch(0.74 0.16 190)", "oklch(0.60 0.10 186)"],
    front: ["oklch(0.70 0.14 188)", "oklch(0.56 0.09 182)"],
    highlight: "oklch(0.96 0.03 200 / 0.32)",
    cloud: "oklch(0.99 0 0)",
    text: "oklch(0.42 0.02 200)",
  },
} as const;

type FolderVariant = keyof typeof folderPalettes;

const sanitizeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "");

function FolderGraphic({
  variant = "history",
  size = 120,
  className = "",
}: {
  variant?: FolderVariant;
  size?: number;
  className?: string;
}) {
  const palette = folderPalettes[variant];
  const rawId = sanitizeId(useId());
  const height = (size * 100) / 120;

  return (
    <svg
      viewBox="0 0 120 100"
      width={size}
      height={height}
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${rawId}-back`} x1="0" y1="18" x2="120" y2="104">
          <stop offset="0%" stopColor={palette.back[0]} />
          <stop offset="100%" stopColor={palette.back[1]} />
        </linearGradient>
        <linearGradient id={`${rawId}-front`} x1="0" y1="34" x2="120" y2="96">
          <stop offset="0%" stopColor={palette.front[0]} />
          <stop offset="100%" stopColor={palette.front[1]} />
        </linearGradient>
      </defs>

      <path
        d="M8 30c0-6.627 5.373-12 12-12h24l8 9h56c6.627 0 12 5.373 12 12v42c0 6.627-5.373 12-12 12H12c-6.627 0-12-5.373-12-12V30z"
        fill={`url(#${rawId}-back)`}
      />
      <path
        d="M12 40c0-5.523 4.477-10 10-10h86c5.523 0 10 4.477 10 10v32c0 7.18-5.82 13-13 13H23c-7.18 0-13-5.82-13-13z"
        fill={`url(#${rawId}-front)`}
      />
      <path
        d="M22 45a4 4 0 0 1 4-4h68a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z"
        fill={palette.highlight}
      />
      <path
        d="M74 58a8 8 0 0 0-7.47-7.98 10.5 10.5 0 0 0-20.79 3.01 6.5 6.5 0 0 0 .74 12.97H74a6 6 0 0 0 0-12z"
        fill={palette.cloud}
        opacity={0.9}
      />
      <text
        x="60"
        y="66"
        textAnchor="middle"
        fontSize="16"
        fontWeight={700}
        fill={palette.text}
        style={{ letterSpacing: "0.04em" }}
      >
        CV
      </text>
    </svg>
  );
}

export default function CVManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameScope, setRenameScope] = useState<"current" | "history">(
    "current"
  );
  const [renameIndex, setRenameIndex] = useState<number | undefined>(undefined);
  const [renameValue, setRenameValue] = useState("");
  const [confirmSetId, setConfirmSetId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisCvId, setAnalysisCvId] = useState<string | undefined>(
    undefined
  );
  const [onlineCvs, setOnlineCvs] = useState<
    Array<{ templateId: string; resumeId: string; templateName: string }>
  >([]);
  const [cvDataMap, setCvDataMap] = useState<Record<string, CVData>>({});
  const [loadingOnlineCvs, setLoadingOnlineCvs] = useState(false);

  const primaryColor = "oklch(0.65 0.18 195)";
  const primaryGradient = `linear-gradient(135deg, ${primaryColor} 0%, oklch(0.78 0.09 210) 55%, oklch(0.9 0.04 195) 100%)`;
  const cardAuraGradient =
    "radial-gradient(circle at top, oklch(0.65 0.18 195 / 0.4) 0%, transparent 65%)";
  const glassSurfaceGradient =
    "linear-gradient(140deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)";
  const highlightOverlay =
    "linear-gradient(135deg, oklch(0.65 0.18 195 / 0.12) 0%, transparent 70%)";
  const subtleOverlay =
    "linear-gradient(135deg, oklch(0.65 0.18 195 / 0.08) 0%, transparent 70%)";
  const emptyOverlay =
    "linear-gradient(135deg, oklch(0.65 0.18 195 / 0.1) 0%, transparent 70%)";

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/login");
      return;
    }

    void loadProfile();
  }, [router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRes, resumesRes] = await Promise.all([
        api.candidateCV.getProfile(),
        api.candidateCV.getResumesAll(),
      ]);

      if (profileRes.success) {
        let merged = profileRes.data;
        if (resumesRes?.success && resumesRes.data) {
          const current = (resumesRes.data as any).current ?? resumesRes.data;
          const history = (resumesRes.data as any).history ?? [];
          merged = {
            ...profileRes.data,
            resume: {
              ...(profileRes.data as any).resume,
              current: current || (profileRes.data as any)?.resume?.current,
              history:
                history || (profileRes.data as any)?.resume?.history || [],
            },
          } as CandidateProfile;
        }
        setProfile(merged);
      } else {
        setError("Không thể tải thông tin profile");
      }

      // Load CV online (ResumeBuilder CVs)
      await loadOnlineCvs();
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Không thể tải thông tin profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const loadOnlineCvs = async () => {
    try {
      setLoadingOnlineCvs(true);
      const templateMapRes = await api.candidateCV.getTemplateResumeMap();
      if (templateMapRes?.success && templateMapRes.data?.map) {
        const map = templateMapRes.data.map;
        const templatesRes = await api.candidateCV.getTemplates();

        const cvList: Array<{
          templateId: string;
          resumeId: string;
          templateName: string;
        }> = [];

        if (templatesRes?.success && templatesRes.data?.templates) {
          const templateNameMap: Record<string, string> = {};
          templatesRes.data.templates.forEach((t: any) => {
            templateNameMap[t.id] = t.name || t.id;
          });

          Object.entries(map).forEach(([templateId, resumeId]) => {
            cvList.push({
              templateId,
              resumeId: resumeId as string,
              templateName: templateNameMap[templateId] || templateId,
            });
          });
        } else {
          Object.entries(map).forEach(([templateId, resumeId]) => {
            cvList.push({
              templateId,
              resumeId: resumeId as string,
              templateName: templateId,
            });
          });
        }

        setOnlineCvs(cvList);

        // Fetch CV data cho preview
        const cvDataPromises = cvList.map(async (cv) => {
          try {
            const resumeRes = await candidateService.getResumeById(cv.resumeId);
            if (resumeRes?.success && resumeRes.data?.content) {
              const cvData = normalizeContentToCVData(
                resumeRes.data.content,
                cv.templateId
              );
              return { resumeId: cv.resumeId, cvData };
            }
          } catch (error) {
            console.error(`Failed to load CV data for ${cv.resumeId}:`, error);
          }
          return null;
        });

        const results = await Promise.all(cvDataPromises);
        const newCvDataMap: Record<string, CVData> = {};
        results.forEach((result) => {
          if (result) {
            newCvDataMap[result.resumeId] = result.cvData;
          }
        });
        setCvDataMap(newCvDataMap);
      }
    } catch (error) {
      console.error("Error loading online CVs:", error);
    } finally {
      setLoadingOnlineCvs(false);
    }
  };

  const handleDeleteCV = async (cvId: string) => {
    try {
      setError(null);
      await api.candidateCV.deleteCV(cvId);
      setSuccess("Xóa CV thành công!");
      toast({ description: "Đã xóa CV", duration: 2000 });
      await loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi xóa CV");
    }
  };

  const handleViewCurrentCV = async () => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("Không tìm thấy token xác thực");
        return;
      }

      const url = `${apiClient.getBaseURL()}/candidates/me/resume/view`;
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
      setShowPreview(true);
    } catch (e: any) {
      setError(e?.message || "Không thể xem CV hiện tại");
    }
  };

  const handleViewHistoryCV = async (cvIndex: number) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("Không tìm thấy token xác thực");
        return;
      }

      const cvId = (profile as any)?.resume?.history?.[cvIndex]?._id;
      if (!cvId) {
        setError("Không tìm thấy CV trong lịch sử");
        return;
      }

      const url = `${apiClient.getBaseURL()}/candidates/me/resume/view/${cvId}`;
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
      setShowPreview(true);
    } catch (e: any) {
      setError(e?.message || "Không thể xem CV lịch sử");
    }
  };

  const closePreview = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setShowPreview(false);
    setPreviewUrl(null);
  };

  const getCurrentHistoryIndex = () => {
    if (
      !profile?.resume?.current?.url ||
      !Array.isArray(profile?.resume?.history)
    )
      return -1;
    return profile.resume.history.findIndex(
      (h: any) => h.url === (profile as any)?.resume?.current?.url
    );
  };

  const handleSetCurrent = async (cvId: string) => {
    try {
      setError(null);
      await api.candidateCV.setCurrent(cvId);
      toast({ description: "Đã đặt làm CV hiện tại", duration: 2000 });
      await loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi đặt CV hiện tại");
    }
  };

  const openRename = (
    scope: "current" | "history",
    index?: number,
    currentName?: string
  ) => {
    setRenameScope(scope);
    setRenameIndex(index);
    setRenameValue(currentName || "");
    setRenameOpen(true);
  };

  const submitRename = async () => {
    try {
      // Convert scope + index to id format
      let cvId: string;
      if (renameScope === "current") {
        cvId = profile?.resume?.current?._id?.toString() || "current";
      } else if (renameIndex !== undefined && profile?.resume?.history?.[renameIndex]) {
        cvId = profile.resume.history[renameIndex]._id?.toString() || "";
      } else {
        throw new Error("Không tìm thấy CV để đổi tên");
      }

      await api.candidateCV.renameCV({
        id: cvId,
        displayName: renameValue.trim(),
      });
      setSuccess("Đổi tên CV thành công!");
      setRenameOpen(false);
      await loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi đổi tên CV");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Không xác định";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,oklch(0.94_0.03_210)_0%,white_70%)]">
        <div className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,oklch(0.65_0.18_195/.25),transparent_65%)] blur-3xl animate-glow-pulse" />
        <div className="pointer-events-none absolute right-[-100px] bottom-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,oklch(0.78_0.09_210/.2),transparent_70%)] blur-3xl animate-float-soft" />
        <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 px-10 py-12 text-center shadow-[0_25px_60px_rgba(20,50,120,0.14)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.85_0.05_195/.05)_100%)]" />
          <div className="relative flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[oklch(0.65_0.18_195)]" />
            <span className="text-base font-medium text-gray-600">
              Đang tải thông tin CV...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const hasCurrentCV = Boolean(profile?.resume?.current?.filename);
  const hasHistoryCV = Boolean(
    profile?.resume?.history && profile.resume.history.length > 0
  );
  const currentUpdatedAt =
    (profile?.resume?.current as any)?.uploadedAt ??
    (profile?.resume?.current as any)?.uploadDate ??
    (profile?.resume?.current as any)?.updatedAt ??
    "";

  return (
    <PageLayout>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,oklch(0.96_0.03_210)_0%,white_30%)] pb-20">
        <div className="pointer-events-none absolute -left-32 top-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,oklch(0.65_0.18_195/.25),transparent_70%)] blur-3xl animate-glow-pulse" />
        <div className="pointer-events-none absolute right-[-120px] top-80 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0.72_0.12_210/.22),transparent_75%)] blur-3xl animate-float-soft" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-20">
          <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/60 shadow-[0_30px_80px_rgba(15,45,95,0.15)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,oklch(0.65_0.18_195/.12)_0%,oklch(0.84_0.05_205/.05)_100%)]" />
            <div className="relative flex flex-col gap-6 p-8 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg animate-glow-pulse"
                  style={{ background: primaryGradient }}
                >
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="space-y-3">
                  <Badge className="border-none bg-[oklch(0.65_0.18_195/.15)] text-[oklch(0.45_0.05_200)] shadow-none">
                    Trung tâm CV InternBridge
                  </Badge>
                  <div>
                    <h1 className="text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                      Nâng tầm CV của bạn với trải nghiệm hiện đại
                    </h1>
                    <p className="mt-3 max-w-xl text-sm text-slate-600 md:text-base">
                      Quản lý toàn bộ phiên bản CV, xem trước tức thì và giữ lại
                      những lần cập nhật quan trọng.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  onClick={() => router.push("/my-cv/templates")}
                  className="group relative overflow-hidden rounded-2xl px-6 py-3 font-semibold text-white shadow-[0_18px_45px_rgba(16,60,120,0.35)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(16,60,120,0.45)]"
                  style={{ background: primaryGradient }}
                >
                  <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <Sparkles className="mr-2 h-5 w-5" />
                  Tạo CV với InternBridge
                </Button>

                <Button
                  onClick={() => setShowUploadModal(true)}
                  variant="outline"
                  className="rounded-2xl border-slate-200 bg-white/70 px-6 py-3 font-semibold text-slate-700 backdrop-blur-lg transition-colors duration-300 hover:border-[oklch(0.65_0.18_195)] hover:text-[oklch(0.65_0.18_195)]"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Tải CV mới
                </Button>

                {hasCurrentCV && (
                  <>
                    <Button
                      onClick={handleViewCurrentCV}
                      variant="outline"
                      className="rounded-2xl border-slate-200 bg-white/70 px-6 py-3 font-semibold text-slate-700 backdrop-blur-lg transition-colors duration-300 hover:border-[oklch(0.65_0.18_195)] hover:text-[oklch(0.65_0.18_195)]"
                    >
                      <Eye className="mr-2 h-5 w-5" />
                      Xem CV hiện tại
                    </Button>
                    <Button
                      onClick={() => {
                        setAnalysisCvId((profile?.resume?.current as any)?._id);
                        setShowAnalysisModal(true);
                      }}
                      className="group relative overflow-hidden rounded-2xl px-6 py-3 font-semibold text-white shadow-[0_18px_45px_rgba(16,60,120,0.35)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(16,60,120,0.45)]"
                      style={{ background: primaryGradient }}
                    >
                      <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      <Sparkles className="mr-2 h-5 w-5" />
                      Phân tích CV
                    </Button>
                    <Button
                      onClick={() => {
                        router.push(`/cv-edit?cvId=current`);
                      }}
                      variant="outline"
                      className="group relative overflow-hidden rounded-2xl px-6 py-3 font-semibold border-2 border-[oklch(0.65_0.18_195)] text-[oklch(0.65_0.18_195)] bg-white/60 transition-all duration-500 hover:bg-[oklch(0.65_0.18_195)] hover:text-white"
                    >
                      <Edit3 className="mr-2 h-5 w-5" />
                      Chỉnh sửa với gợi ý
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-10">
            {error && (
              <Alert className="relative overflow-hidden rounded-2xl border border-red-200/60 bg-gradient-to-r from-red-50/90 via-white to-pink-50/90 shadow-lg backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0)_80%)]" />
                <div className="relative flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 text-red-500" />
                  <AlertDescription className="text-sm font-medium text-red-600">
                    {error}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {success && (
              <Alert className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/90 text-emerald-800 shadow-lg backdrop-blur-xl">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0)_80%)]" />
                <div className="relative flex items-start gap-3">
                  <CheckCircle className="mt-1 h-5 w-5 text-emerald-500" />
                  <AlertDescription className="text-sm font-semibold">
                    {success}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            {success && setTimeout(() => setSuccess(null), 2000) && null}

            {/* Section 1: CV Online (ResumeBuilder CVs) - Ưu tiên */}
            {onlineCvs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      CV Online
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Các CV đã tạo với InternBridge CV Builder
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/my-cv/templates")}
                    variant="outline"
                    className="rounded-xl border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-lg transition-colors duration-300 hover:border-[oklch(0.65_0.18_195)] hover:text-[oklch(0.65_0.18_195)]"
                  >
                    Tạo CV mới
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {loadingOnlineCvs ? (
                    <div className="col-span-full text-center py-8 text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Đang tải CV online...
                    </div>
                  ) : (
                    onlineCvs.map((cv) => {
                      const cvData = cvDataMap[cv.resumeId];
                      const hasPreview = !!cvData;

                      return (
                        <Link
                          key={cv.resumeId}
                          href={`/my-cv/new?template=${cv.templateId}&resumeId=${cv.resumeId}`}
                          className="block group"
                        >
                          <div
                            className="rounded-lg border border-slate-200/60 bg-white/80 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/40"
                            style={{
                              background:
                                "linear-gradient(135deg, oklch(0.60 0.12 195 / 0.05) 0%, transparent 70%)",
                            }}
                          >
                            {/* Preview CV */}
                            {hasPreview ? (
                              <div className="relative w-full aspect-[3/4] bg-muted/40 overflow-hidden">
                                <div className="w-full h-full overflow-hidden bg-white relative">
                                  <CVPreview
                                    data={cvData}
                                    templateId={cv.templateId}
                                  />
                                </div>
                                {/* Badge trên preview */}
                                <div className="absolute top-3 left-3">
                                  <Badge className="bg-emerald-600/90 text-white border-none px-2.5 py-1 text-[11px] font-medium backdrop-blur">
                                    CV của bạn
                                  </Badge>
                                </div>
                              </div>
                            ) : (
                              <div className="relative w-full aspect-[3/4] bg-muted/40 flex items-center justify-center">
                                <div className="text-center">
                                  <FileText
                                    className="w-12 h-12 mx-auto mb-2 text-slate-400"
                                    style={{ color: primaryColor }}
                                  />
                                  <p className="text-sm text-slate-500">
                                    {cv.templateName}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Info below preview */}
                            <div className="p-4">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm text-slate-900 truncate">
                                    {cv.templateName}
                                  </div>
                                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 mt-1">
                                    InternBridge · CV Builder
                                  </p>
                                </div>
                                <Badge
                                  className="border-none flex-shrink-0"
                                  style={{
                                    background: `oklch(0.60 0.12 195 / 0.15)`,
                                    color: primaryColor,
                                  }}
                                >
                                  Online
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Section 2: CV Tải lên (Uploaded CVs) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    CV Tải Lên
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Các CV đã tải lên từ máy tính của bạn
                  </p>
                </div>
                <Button
                  onClick={() => setShowUploadModal(true)}
                  variant="outline"
                  className="rounded-xl border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 backdrop-blur-lg transition-colors duration-300 hover:border-[oklch(0.65_0.18_195)] hover:text-[oklch(0.65_0.18_195)]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tải CV mới
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {hasCurrentCV && profile?.resume?.current?.filename && (
                  <div
                    className="group relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-6 shadow-[0_22px_60px_rgba(15,45,95,0.12)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_32px_75px_rgba(15,45,95,0.18)]"
                    style={{ background: glassSurfaceGradient }}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{ background: highlightOverlay }}
                    />
                    <span
                      className="pointer-events-none absolute -top-32 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full blur-3xl opacity-40"
                      style={{ background: cardAuraGradient }}
                    />
                    <span className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 text-white shadow-[0_8px_22px_rgba(255,188,30,0.45)]">
                      <span
                        className="absolute inset-0 rounded-full bg-amber-300/60 blur-md animate-ping"
                        aria-hidden="true"
                      />
                      <Star className="relative h-4 w-4 fill-white" />
                    </span>
                    <div className="relative flex flex-col items-center gap-4 text-center">
                      <FolderGraphic
                        variant="current"
                        size={96}
                        className="drop-shadow-[0_12px_28px_rgba(16,60,120,0.28)]"
                      />
                      <Badge className="border-none bg-[oklch(0.65_0.18_195/.18)] text-[oklch(0.45_0.05_200)] shadow-none">
                        CV hiện tại
                      </Badge>
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">
                        {(profile as any)?.resume?.current?.displayName ||
                          profile?.resume?.current?.filename}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        Cập nhật {formatDate(currentUpdatedAt)}
                      </p>

                      <div className="flex w-full flex-col gap-2">
                        <Button
                          onClick={handleViewCurrentCV}
                          className="w-full rounded-xl bg-[#007b91] text-white shadow-inner shadow-[oklch(0.65_0.18_195/.35)] transition-all duration-300 hover:bg-[oklch(0.65_0.18_195)]"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Xem trong trang
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              openRename(
                                "current",
                                undefined,
                                (profile as any)?.resume?.current
                                  ?.displayName ||
                                  profile?.resume?.current?.filename
                              )
                            }
                            variant="outline"
                            className="flex-1 rounded-xl border-slate-200 bg-white/60 text-sm font-medium text-slate-600 transition-colors duration-300 hover:border-[oklch(0.65_0.18_195)] hover:text-[oklch(0.65_0.18_195)]"
                          >
                            Đổi tên
                          </Button>
                          <Button
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem("token");
                                if (!token) {
                                  setError("Không tìm thấy token xác thực");
                                  return;
                                }
                                const endpoint = `${apiClient.getBaseURL()}/candidates/me/resume/view`;
                                const res = await fetch(endpoint, {
                                  method: "GET",
                                  headers: { Authorization: `Bearer ${token}` },
                                });
                                if (!res.ok) {
                                  const txt = await res.text();
                                  throw new Error(`${res.status} ${txt}`);
                                }
                                const blob = await res.blob();
                                const objectUrl = URL.createObjectURL(blob);
                                window.open(objectUrl, "_blank");
                              } catch (e: any) {
                                setError(
                                  e?.message || "Không thể mở CV hiện tại"
                                );
                              }
                            }}
                            variant="outline"
                            className="flex-1 rounded-xl border-slate-200 bg-white/60 text-sm font-medium text-slate-600 transition-colors duration-300 hover:border-[oklch(0.65_0.18_195)] hover:text-[oklch(0.65_0.18_195)]"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Mở tab mới
                          </Button>
                          <Button
                            onClick={() => setDeleteId("current")}
                            variant="outline"
                            className="flex-1 rounded-xl border-red-200 bg-red-50/60 text-sm font-medium text-red-600 transition-colors duration-300 hover:border-red-400 hover:bg-red-100"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {profile?.resume?.history?.map((cv, index) => {
                  const uploadedAt =
                    (cv as any)?.uploadedAt ?? (cv as any)?.uploadDate ?? "";
                  return (
                    <div
                      key={index}
                      className="group relative overflow-hidden rounded-3xl border border-white/45 bg-white/65 p-6 shadow-[0_20px_55px_rgba(15,45,95,0.1)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_30px_70px_rgba(15,45,95,0.16)]"
                      style={{ background: glassSurfaceGradient }}
                    >
                      <button
                        type="button"
                        onClick={() => setConfirmSetId((cv as any)?._id)}
                        title="Đặt làm CV hiện tại"
                        aria-label="Đặt làm CV hiện tại"
                        className="absolute right-5 top-5 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-amber-400 shadow ring-1 ring-slate-200 transition hover:scale-105 active:scale-95"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      <span
                        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                        style={{ background: subtleOverlay }}
                      />
                      <span
                        className="pointer-events-none absolute -top-28 left-1/2 h-44 w-44 -translate-x-1/2 rounded-full blur-3xl opacity-30"
                        style={{ background: cardAuraGradient }}
                      />
                      <div className="relative flex flex-col items-center gap-4 text-center">
                        <FolderGraphic
                          variant="current"
                          size={92}
                          className="drop-shadow-[0_10px_24px_rgba(16,60,120,0.18)]"
                        />
                        {/* <Badge variant="outline" className="border-[oklch(0.65_0.18_195/.3)] bg-white/70 text-[oklch(0.65_0.18_195)]">
                      CV lịch sử
                    </Badge> */}
                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">
                          {(cv as any).displayName || cv.filename}
                        </h3>
                        <p className="text-xs font-medium text-slate-500">
                          Cập nhật {formatDate(uploadedAt)}
                        </p>

                        <div className="flex w-full flex-col gap-2">
                          <Button
                            onClick={() => handleViewHistoryCV(index)}
                            className="w-full rounded-xl text-white shadow-[0_12px_28px_rgba(16,60,120,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(16,60,120,0.3)]"
                            style={{ background: primaryGradient }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Xem nhanh
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              onClick={async () => {
                                try {
                                  const token = localStorage.getItem("token");
                                  if (!token) {
                                    setError("Không tìm thấy token xác thực");
                                    return;
                                  }
                                  const cvId = (cv as any)._id;
                                  if (!cvId) {
                                    setError("Không tìm thấy ID của CV");
                                    return;
                                  }
                                  const endpoint = `${apiClient.getBaseURL()}/candidates/me/resume/view/${cvId}`;
                                  const res = await fetch(endpoint, {
                                    method: "GET",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  });
                                  if (!res.ok) {
                                    const txt = await res.text();
                                    throw new Error(`${res.status} ${txt}`);
                                  }
                                  const blob = await res.blob();
                                  const objectUrl = URL.createObjectURL(blob);
                                  window.open(objectUrl, "_blank");
                                } catch (e: any) {
                                  setError(e?.message || "Không thể tải CV");
                                }
                              }}
                              variant="outline"
                              className="flex-1 rounded-xl border-slate-200 bg-white/60 text-sm font-medium text-slate-600 transition-colors duration-300 hover:border-[oklch(0.65_0.18_195)] hover:text-[oklch(0.65_0.18_195)]"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              Tải về
                            </Button>
                            <Button
                              onClick={() => setDeleteId((cv as any)?._id)}
                              variant="outline"
                              className="flex-1 rounded-xl border-red-200 bg-red-50/60 text-sm font-medium text-red-600 transition-colors duration-300 hover:border-red-400 hover:bg-red-100"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!hasCurrentCV && !hasHistoryCV && (
                  <div className="relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-white/70 p-8 text-center shadow-[0_18px_45px_rgba(15,45,95,0.08)] backdrop-blur-xl transition-all duration-500 hover:border-[oklch(0.65_0.18_195)] hover:shadow-[0_24px_60px_rgba(15,45,95,0.12)]">
                    <span
                      className="pointer-events-none absolute inset-0"
                      style={{ background: emptyOverlay }}
                    />
                    <div
                      className="relative flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg"
                      style={{ background: primaryGradient }}
                    >
                      <Plus className="h-7 w-7" />
                    </div>
                    <div className="relative space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Tải CV đầu tiên của bạn
                      </h3>
                      <p className="text-sm text-slate-500">
                        Hỗ trợ PDF, DOC, DOCX (tối đa 10MB). Biến trang cá nhân
                        trở nên chuyên nghiệp hơn.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowUploadModal(true)}
                      className="group relative overflow-hidden rounded-xl px-5 py-2.5 font-semibold text-white shadow-[0_18px_45px_rgba(16,60,120,0.35)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(16,60,120,0.45)]"
                      style={{ background: primaryGradient }}
                    >
                      <span className="absolute inset-0 bg-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      Chọn file
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showPreview && previewUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="relative flex h-full max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/30 bg-white/90 shadow-[0_40px_90px_rgba(15,45,95,0.18)] backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-white/40 bg-white/70 px-6 py-4 backdrop-blur-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg"
                    style={{ background: primaryGradient }}
                  >
                    <Eye className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Xem trước CV
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kiểm tra nội dung trước khi gửi đi
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={closePreview}
                  className="rounded-xl border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-300 hover:border-[oklch(0.65_0.18_195)] hover:text-[oklch(0.65_0.18_195)]"
                >
                  <X className="mr-2 h-4 w-4" />
                  Đóng
                </Button>
              </div>
              <div className="flex-1 bg-slate-100">
                <iframe
                  src={previewUrl}
                  title="CV Preview"
                  className="h-full w-full border-0"
                />
              </div>
              <div className="flex items-center justify-between border-t border-white/40 bg-white/80 px-6 py-4 backdrop-blur-lg">
                <p className="text-xs font-medium text-slate-500">
                  Hãy chắc chắn rằng CV của bạn cập nhật những thành tựu mới
                  nhất.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(previewUrl, "_blank")}
                    className="rounded-xl border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-300 hover:border-[oklch(0.65_0.18_195)] hover:text-[oklch(0.65_0.18_195)]"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Mở tab mới
                  </Button>
                  <Button
                    onClick={closePreview}
                    size="sm"
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(16,60,120,0.3)] transition-transform duration-300 hover:-translate-y-0.5"
                    style={{ background: primaryGradient }}
                  >
                    Xong
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <AlertDialog
          open={deleteId !== null}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa CV?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này sẽ xóa CV khỏi lịch sử. Không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteId !== null) {
                    handleDeleteCV(deleteId);
                    setDeleteId(null);
                  }
                }}
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={confirmSetId !== null}
          onOpenChange={(open) => !open && setConfirmSetId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Đặt làm CV hiện tại?</AlertDialogTitle>
              <AlertDialogDescription>
                CV này sẽ thay thế CV hiện tại của bạn.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmSetId !== null) {
                    handleSetCurrent(confirmSetId);
                    setConfirmSetId(null);
                  }
                }}
              >
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đổi tên CV</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Nhập tên hiển thị"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button onClick={submitRename} disabled={!renameValue.trim()}>
                Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload CV Modal */}
        <UploadCVModal
          open={showUploadModal}
          onOpenChange={setShowUploadModal}
          onSuccess={() => {
            loadProfile();
            toast({
              description: "CV đã được tải lên thành công!",
              duration: 3000,
            });
          }}
        />

        {/* CV Analysis Modal */}
        <CVAnalysisModal
          open={showAnalysisModal}
          onOpenChange={setShowAnalysisModal}
          cvId={analysisCvId}
        />
      </div>
    </PageLayout>
  );
}
