/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CVEditor from "../../../components/cv/CVEditor";
import { type CVData } from "../../../lib/mocks/cvSamples";
import { api } from "../../../lib/api";

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
  const templateIdNum = templateId ? parseInt(templateId) || 1 : 1;
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

        // Bước 1: Load template config (bao gồm renderLayout)
        const templateResponse = await api.candidateCV.getTemplateById(
          templateId
        );
        if (!templateResponse.success || !templateResponse.data) {
          setError("Không tìm thấy template");
          setData(getEmptyCVData(templateId));
          return;
        }

        setTemplateConfig(templateResponse.data);

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
              templateId: 1, // Tạm thời, sẽ map từ templateId string
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
                    ? (cert.issueDate instanceof Date 
                        ? cert.issueDate.getFullYear().toString()
                        : new Date(cert.issueDate).getFullYear().toString())
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
                  ? (award.date instanceof Date
                      ? award.date.getFullYear().toString()
                      : new Date(award.date).getFullYear().toString())
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải CV...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Không có dữ liệu CV</p>
      </div>
    );
  }

  return (
    <CVEditor data={data} onChange={setData} templateConfig={templateConfig} />
  );
}
