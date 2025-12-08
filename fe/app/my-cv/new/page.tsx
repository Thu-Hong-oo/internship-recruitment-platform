"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles } from "lucide-react";
import CVEditor from "../../../components/cv/CVEditor";
import { type CVData, sampleCVs } from "../../../lib/mocks/cvSamples";
import { templateLayouts } from "../../../lib/mocks/templateLayouts";
import { candidateService } from "../../../lib/api/services/candidate.service";
import PageLayout from "@/components/layout/PageLayout";

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
      // jobTitle: personalInfo.jobTitle || "",
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

const getEmptyCVData = (templateKey: string): CVData => {
  const templateNum = TEMPLATE_ID_MAP[templateKey] || 1;
  return {
    ...sampleCVs[0],
    templateId: templateNum,
    personal: {
      name: "",
      email: "",
      phone: "",
      address: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    languages: [],
    certifications: [],
  };
};

export default function Page() {
  const params = useSearchParams();
  const router = useRouter();
  const templateKey = params.get("template") || "modern";
  const resumeIdParam = params.get("resumeId");

  const [templateMap, setTemplateMap] = useState<Record<string, string>>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [data, setData] = useState<CVData | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(resumeIdParam);
  const [templateConfig, setTemplateConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMap = async () => {
      try {
        const res = await candidateService.getTemplateResumeMap();
        if (res.success && res.data?.map) {
          setTemplateMap(res.data.map);
        }
      } catch (err) {
        console.error("Không thể tải template resume map:", err);
      } finally {
        setMapLoaded(true);
      }
    };
    fetchMap();
  }, []);

  // Chuẩn bị template config từ templateLayouts (client-side)
  useEffect(() => {
    const templateNum = TEMPLATE_ID_MAP[templateKey] || 1;
    const layout = templateLayouts[templateNum];
    if (layout) {
      setTemplateConfig({
        id: templateKey,
        name: templateKey === "modern" ? "Modern" : "Minimal",
        customization: {
          colors: {
            primary: layout.colors.primary,
            secondary: layout.colors.secondary,
            accent: layout.colors.primary,
          },
          fonts: {
            heading: layout.fonts.heading,
            body: layout.fonts.body,
          },
        },
        renderLayout: {
          page: layout.page,
          sections: layout.sections.map((s) => ({
            type: s.type,
            x: s.x,
            y: s.y,
            width: s.width,
            height: s.height,
          })),
        },
      });
    }
  }, [templateKey]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!mapLoaded) return;

      try {
        setLoading(true);
        setError(null);

        const mappedId = templateMap[templateKey];
        const targetResumeId = resumeIdParam || mappedId || null;

        if (targetResumeId) {
          const res = await candidateService.getResumeById(targetResumeId);
          if (!res.success || !res.data) {
            throw new Error("Không thể tải CV từ ResumeBuilder");
          }
          if (!isMounted) return;
          setResumeId(res.data.resumeId);
          setData(normalizeContentToCVData(res.data.content, templateKey));

          if (!resumeIdParam) {
            const qs = new URLSearchParams(Array.from(params.entries()));
            qs.set("resumeId", res.data.resumeId);
            router.replace(`/my-cv/new?${qs.toString()}`);
          }
          return;
        }

        // Chưa có resumeId -> tạo mới từ template
        const createRes = await candidateService.createCVFromTemplate(
          templateKey,
          true
        );
        if (!createRes.success || !createRes.data?.resume?._id) {
          throw new Error("Không thể tạo CV từ template");
        }

        const newId = createRes.data.resume._id;
        if (!isMounted) return;
        setResumeId(newId);
        setData(normalizeContentToCVData(createRes.data.resume.content, templateKey));
         setTemplateMap((prev) => ({
            ...prev,
            [templateKey]: newId,
          }));

        // Cập nhật URL để lưu resumeId
        const qs = new URLSearchParams(Array.from(params.entries()));
        qs.set("resumeId", newId);
        router.replace(`/my-cv/new?${qs.toString()}`);
      } catch (e: any) {
        console.error("Error loading CV editor data:", e);
        if (!isMounted) return;
        setError(e?.message || "Không thể tải dữ liệu CV");
        setData(getEmptyCVData(templateKey));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateKey, resumeIdParam, mapLoaded, templateMap]);

  const renderContent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground text-sm">
              Đang tải không gian chỉnh sửa CV sang trọng cho bạn...
            </p>
          </div>
        </div>
      );
    }

    if (error && !data) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <p className="text-red-600 mb-2 font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Thử tải lại trang
            </button>
          </div>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Không có dữ liệu CV</p>
        </div>
      );
    }

    return (
      <div className="bg-gradient-to-b from-slate-50 via-white to-white py-10">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Studio chỉnh sửa CV cao cấp
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900">
                  Tùy chỉnh CV theo phong cách của bạn
                </h1>
                <p className="mt-2 text-sm lg:text-base text-slate-600 max-w-2xl">
                  Chỉnh sửa nội dung, thay đổi thứ tự các mục và xem trước tức
                  thì để đảm bảo CV của bạn luôn nổi bật và chuyên nghiệp.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm text-sm text-slate-500">
              <p className="font-medium text-slate-900">Mẹo nhỏ</p>
              <p className="text-xs mt-1">
                Nhấn trực tiếp vào từng mục trong CV để chỉnh sửa nhanh, giữ{" "}
                <span className="font-semibold">Ctrl/Cmd + Z</span> để hoàn tác.
              </p>
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-xl border border-slate-100 p-3 sm:p-4 lg:p-6 xl:p-8">
            <div className="mx-auto w-full max-w-5xl">
              <CVEditor
                data={data}
                onChange={setData}
                templateId={templateKey}
                templateConfig={templateConfig}
                resumeId={resumeId || undefined}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }, [data, error, loading, resumeId, templateConfig, templateKey]);

  return <PageLayout>{renderContent}</PageLayout>;
}
