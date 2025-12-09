"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api, candidateService } from "@/lib/api";
import CVPreview from "@/components/cv/CVPreview";
import type { CVData } from "@/lib/mocks/cvSamples";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText } from "lucide-react";

type Template = {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
};

// Templates có sẵn ở frontend
const FRONTEND_TEMPLATES: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description:
      "Template hiện đại, chuyên nghiệp, phù hợp với hầu hết vị trí ứng tuyển.",
    // Ảnh nằm trong public/images/templates
    thumbnail: "/images/templates/modern-thumb.jpg",
  },
  {
    id: "minimal",
    name: "Minimal",
    description:
      "Template tối giản, tinh gọn, tập trung làm nổi bật nội dung CV.",
    thumbnail: "/images/templates/minimal-thumb.jpg",
  },
];

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

export default function TemplateGallery() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [templateResumeMap, setTemplateResumeMap] = useState<
    Record<string, string>
  >({});
  const [cvDataMap, setCvDataMap] = useState<Record<string, CVData>>({});
  const [loadingCVs, setLoadingCVs] = useState(false);
  const templates = FRONTEND_TEMPLATES;
  const primaryColor = "oklch(0.65 0.18 195)";

  // Load CV data for templates user has created
  useEffect(() => {
    const loadCVData = async () => {
      try {
        setLoadingCVs(true);
        const templateMapRes = await api.candidateCV.getTemplateResumeMap();
        if (templateMapRes?.success && templateMapRes.data?.map) {
          const map = templateMapRes.data.map;
          setTemplateResumeMap(map);

          // Fetch CV data for each template
          const cvDataPromises = Object.entries(map).map(
            async ([templateId, resumeId]) => {
              try {
                const resumeRes = await candidateService.getResumeById(
                  resumeId as string
                );
                if (resumeRes?.success && resumeRes.data?.content) {
                  const cvData = normalizeContentToCVData(
                    resumeRes.data.content,
                    templateId
                  );
                  return { templateId, resumeId: resumeId as string, cvData };
                }
              } catch (error) {
                console.error(
                  `Failed to load CV data for template ${templateId}:`,
                  error
                );
              }
              return null;
            }
          );

          const results = await Promise.all(cvDataPromises);
          const newCvDataMap: Record<string, CVData> = {};
          results.forEach((result) => {
            if (result) {
              newCvDataMap[result.templateId] = result.cvData;
            }
          });
          setCvDataMap(newCvDataMap);
        }
      } catch (error) {
        console.error("Error loading CV data:", error);
      } finally {
        setLoadingCVs(false);
      }
    };

    loadCVData();
  }, []);

  const handleUseTemplate = (templateIdOrUrl: string) => {
    // Nếu là URL đầy đủ (có resumeId), dùng trực tiếp
    if (templateIdOrUrl.startsWith("/my-cv/new")) {
      router.push(templateIdOrUrl);
    } else {
      // Chỉ redirect đến trang edit, không gọi API
      // API createCVFromTemplate sẽ được gọi khi user bấm "Lưu"
      router.push(`/my-cv/new?template=${templateIdOrUrl}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 space-y-3 text-center md:text-left">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          Bộ sưu tập template CV
        </p>
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
            Chọn template CV phù hợp phong cách của bạn
          </h1>
          <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
            Mỗi template được thiết kế tối ưu về bố cục, dễ đọc và dễ gây ấn
            tượng với nhà tuyển dụng. Bạn có thể thay đổi nội dung và xuất CV
            bất cứ lúc nào.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((t) => {
          const thumbnailUrl = t.thumbnail || "/placeholder.png";
          const resumeId = templateResumeMap[t.id];
          const cvData = cvDataMap[t.id];
          const hasPreview = !!cvData && !!resumeId;

          return (
            <div
              key={t.id}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300"
            >
              <div className="relative w-full aspect-[3/4] bg-muted/40 overflow-hidden">
                {hasPreview ? (
                  <div className="w-full h-full overflow-hidden bg-white relative">
                    <CVPreview data={cvData} templateId={t.id} />
                    {/* Badge trên preview */}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-emerald-600/90 text-white border-none px-2.5 py-1 text-[11px] font-medium backdrop-blur">
                        CV của bạn
                      </Badge>
                    </div>
                  </div>
                ) : loadingCVs ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : thumbnailUrl !== "/placeholder.png" ? (
                  <>
                    <Image
                      src={thumbnailUrl}
                      alt={t.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Overlay gradient */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Badge trên ảnh */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                        {t.id === "modern"
                          ? "Phong cách hiện đại"
                          : "Phong cách tối giản"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText
                      className="w-12 h-12 text-muted-foreground"
                      style={{ color: primaryColor }}
                    />
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm md:text-base">
                      {t.name} Template
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      InternBridge · CV Builder
                    </p>
                  </div>
                  <span className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] text-primary font-medium">
                    {t.id === "modern" ? "Đề xuất" : "Tối giản"}
                  </span>
                </div>

                {t.description && (
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">
                    {t.description}
                  </p>
                )}
                <button
                  onClick={() =>
                    handleUseTemplate(
                      hasPreview
                        ? `/my-cv/new?template=${t.id}&resumeId=${resumeId}`
                        : t.id
                    )
                  }
                  disabled={loading === t.id}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs md:text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading === t.id
                    ? "Đang chuyển..."
                    : hasPreview
                    ? "Chỉnh sửa CV"
                    : "Dùng template này"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
