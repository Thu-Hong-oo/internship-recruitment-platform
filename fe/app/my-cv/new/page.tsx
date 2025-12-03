/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, FileText, Download } from "lucide-react";
import CVEditor from "../../../components/cv/CVEditor";
import { type CVData } from "../../../lib/mocks/cvSamples";
import { api } from "../../../lib/api";
import { templateLayouts } from "../../../lib/mocks/templateLayouts";
import PageLayout from "@/components/layout/page-layout";

// Convert ResumeBuilder content format sang CVData format
function convertResumeToCVData(
  resumeData: any,
  templateId: string | null
): CVData {
  const content = resumeData.content || {};
  const personalInfo = content.personalInfo || {};

  // Convert templateId: string -> number (hoặc giữ string nếu CVEditor hỗ trợ)
  // Tạm thời dùng 1 làm default, hoặc có thể map string sang number
  const templateIdNum = templateId ? parseInt(templateId) || 1 : 1;

  return {
    personal: {
      name: personalInfo.fullName || "",
      email: personalInfo.email || "",
      phone: personalInfo.phone || "",
      address:
        typeof personalInfo.address === "string"
          ? personalInfo.address
          : personalInfo.address?.street || "",
      summary: content.summary || personalInfo.bio || "",
      avatar: personalInfo.avatar || undefined,
    },
    experience: (content.experience || []).map((exp: any) => ({
      company: exp.company || exp.position || "",
      role: exp.position || exp.role || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      description: exp.description || "",
    })),
    education: (content.education || []).map((edu: any) => ({
      school: edu.institution || edu.school || "",
      degree: edu.degree || "",
      startDate: edu.startYear || edu.startDate || "",
      endDate: edu.endYear || edu.endDate || "",
    })),
    skills: (content.skills?.technical || []).map((skill: any) =>
      typeof skill === "string" ? skill : skill.name || ""
    ),
    templateId: templateIdNum,
    projects: (content.projects || []).map((proj: any) => ({
      title: proj.title || "",
      description: proj.description || "",
    })),
    languages: (content.skills?.languages || []).map((lang: any) => ({
      name: typeof lang === "string" ? lang : lang.language || lang.name || "",
      level: lang.level || "",
    })),
    certifications: (content.certifications || []).map((cert: any) => ({
      name: cert.name || "",
      issuer: cert.issuer || "",
      year: cert.issueDate || cert.year || "",
    })),
  };
}

// Empty CVData
function getEmptyCVData(templateId: string | null = null): CVData {
  // Map templateId string sang number
  const templateIdMap: Record<string, number> = {
    modern: 1,
    minimal: 2,
  };
  const templateIdNum = templateId ? templateIdMap[templateId] || 1 : 1;
  return {
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
    templateId: templateIdNum,
    projects: [],
    languages: [],
    certifications: [],
  };
}

export default function Page() {
  const params = useSearchParams();
  const templateId = params.get("template") || "modern"; // String từ backend, default "modern"

  const [data, setData] = useState<CVData | null>(null);
  const [templateConfig, setTemplateConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCVData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Không cần gọi API getTemplateById, dùng templateLayouts từ frontend
        // Map templateId string sang templateId number để dùng với templateLayouts
        const templateIdMap: Record<string, number> = {
          modern: 1,
          minimal: 2,
        };
        const templateIdNum = templateIdMap[templateId] || 1;

        // Tạo templateConfig từ templateLayouts frontend
        const layout = templateLayouts[templateIdNum];
        if (layout) {
          setTemplateConfig({
            id: templateId,
            name: templateId === "modern" ? "Modern" : "Minimal",
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

        // Bước 2: Load dữ liệu CV từ profile (không cần ResumeBuilder)
        // Sử dụng getBuilderData để lấy data từ CandidateProfile
        try {
          const builderResponse = await api.candidateCV.getBuilderData();
          if (builderResponse.success && builderResponse.data) {
            // Convert builderData sang CVData format
            const builderData = builderResponse.data;
            const cvData: CVData = {
              personal: {
                name: builderData.personalInfo?.fullName || "",
                email: builderData.personalInfo?.email || "",
                phone: builderData.personalInfo?.phone || "",
                address: builderData.personalInfo?.address || "",
                summary: builderData.careerObjective || "",
                avatar: builderData.personalInfo?.avatar || undefined,
                jobTitle: builderData.personalInfo?.jobTitle || undefined,
                website: builderData.personalInfo?.website || undefined,
              } as any,
              experience: (builderData.experience || []).map((exp: any) => ({
                company: exp.company || "",
                role: exp.position || exp.role || "",
                startDate: exp.startDate || "",
                endDate: exp.endDate || "",
                description: exp.description || "",
              })),
              education: (builderData.education || []).map((edu: any) => ({
                school: edu.institution || edu.school || "",
                degree: edu.degree || "",
                startDate: edu.startYear || edu.startDate || "",
                endDate: edu.endYear || edu.endDate || "",
              })),
              skills: (builderData.skills?.technical || []).map((skill: any) =>
                typeof skill === "string" ? skill : skill.name || ""
              ),
              templateId: templateIdNum, // Map từ templateId string sang number
              projects: (builderData.projects || []).map((proj: any) => ({
                title: proj.title || "",
                description: proj.description || "",
                technologies: proj.technologies || [],
                startDate: proj.startDate || "",
                endDate: proj.endDate || "",
                status: proj.status || "completed",
                url: proj.url || null,
                github: proj.github || null,
                achievements: proj.achievements || [],
              })),
              languages: (builderData.languages || []).map((lang: any) => ({
                name:
                  typeof lang === "string"
                    ? lang
                    : lang.language || lang.name || "",
                level: lang.level || "",
              })),
              certifications: (builderData.certifications || []).map(
                (cert: any) => ({
                  name: cert.name || "",
                  issuer: cert.issuer || "",
                  year: cert.issueDate
                    ? cert.issueDate instanceof Date
                      ? cert.issueDate.getFullYear().toString()
                      : new Date(cert.issueDate).getFullYear().toString()
                    : cert.year || "",
                  issueDate: cert.issueDate || null,
                  expiryDate: cert.expiryDate || null,
                  credentialId: cert.credentialId || null,
                  url: cert.url || null,
                })
              ),
              awards: (builderData.awards || []).map((award: any) => ({
                title: award.title || "",
                issuer: award.issuer || "",
                year: award.date
                  ? award.date instanceof Date
                    ? award.date.getFullYear().toString()
                    : new Date(award.date).getFullYear().toString()
                  : award.year || "",
                date: award.date || null,
                description: award.description || "",
              })),
              hobbies: (builderData.hobbies || []).map((hobby: any) =>
                typeof hobby === "string" ? hobby : hobby
              ),
            } as any;
            setData(cvData);
          } else {
            // Nếu không có data, dùng empty data
            setData(getEmptyCVData(templateId));
          }
        } catch (profileError) {
          console.error("Error loading profile data:", profileError);
          // Nếu không load được profile data, dùng empty data
          setData(getEmptyCVData(templateId));
        }
      } catch (err: any) {
        console.error("Error loading CV data:", err);
        setError(err.message || "Có lỗi xảy ra khi tải dữ liệu CV");
        setData(getEmptyCVData(templateId));
      } finally {
        setLoading(false);
      }
    };

    loadCVData();
  }, [templateId]);

  return (
    <PageLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground text-sm">
              Đang tải không gian chỉnh sửa CV sang trọng cho bạn...
            </p>
          </div>
        </div>
      ) : error && !data ? (
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
      ) : !data ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Không có dữ liệu CV</p>
        </div>
      ) : (
        <div className="bg-gradient-to-b from-slate-50 via-white to-white py-10">
          <div className="max-w-7xl mx-auto px-4 space-y-8">
            {/* Header */}
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
                  <span className="font-semibold">Ctrl/Cmd + Z</span> để hoàn
                  tác.
                </p>
              </div>
            </div>

            {/* Editor container */}
            <div className="rounded-3xl bg-white shadow-xl border border-slate-100 p-3 sm:p-4 lg:p-6 xl:p-8">
              <div className="mx-auto w-full max-w-5xl">
                <CVEditor
                  data={data}
                  onChange={setData}
                  templateId={templateId}
                  templateConfig={templateConfig}
                  resumeId={null} // Chưa có resumeId, sẽ tạo mới khi bấm "Lưu"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
