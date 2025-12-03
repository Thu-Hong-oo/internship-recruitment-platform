import { useMemo, useRef, useState } from "react";
import { Download, Loader2, Save } from "lucide-react";
import type { CVData } from "../../lib/mocks/cvSamples";
import { templateLayouts } from "../../lib/mocks/templateLayouts";
import LivePreview from "./LivePreview";
import { usePdfExport } from "../../hooks/usePdfExport";
import { useCvEditorState } from "../../hooks/useCvEditorState";
import { candidateService } from "../../lib/api/services/candidate.service";

type Props = {
  data: CVData;
  onChange: (next: CVData) => void;
  templateId?: string; // Template ID từ frontend (ví dụ: "modern", "minimal")
  templateConfig?: {
    id?: string; // Template ID từ backend (ví dụ: "modern")
    name?: string;
    style?: string;
    customization?: {
      colors?: { primary: string; secondary: string; accent: string };
      fonts?: { heading: string; body: string };
    };
    renderLayout?: {
      page: {
        width: number;
        height: number;
        padding: number;
        backgroundColor?: string;
      };
      sections: Array<{
        type: string;
        x: number;
        y: number;
        width: number;
        height: number;
        order?: number;
      }>;
    } | null;
  } | null;
  resumeId?: string | null; // ResumeBuilder ID nếu đã có (để update thay vì create mới)
};

export default function CVEditor({
  data,
  onChange,
  templateId,
  templateConfig,
  resumeId,
}: Props) {
  // Ưu tiên dùng layout từ templateConfig, fallback về templateLayouts
  const layout = useMemo(() => {
    if (templateConfig?.renderLayout) {
      // Convert renderLayout từ API sang format của templateLayouts
      return {
        page: templateConfig.renderLayout.page,
        sections: templateConfig.renderLayout.sections.map((s: any) => ({
          type: s.type,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
        })),
        colors: templateConfig.customization?.colors || {
          primary: "#2563eb",
          secondary: "#64748b",
        },
        fonts: templateConfig.customization?.fonts || {
          heading: "Inter",
          body: "Inter",
        },
      };
    }
    return templateLayouts[data.templateId];
  }, [data.templateId, templateConfig]);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const { exportElementToPdf } = usePdfExport();
  const [inlineEditing] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const state = useCvEditorState(data);

  // Convert CVData sang format backend cần
  const convertCVDataToBuilderFormat = (cvData: CVData) => {
    return {
      personalInfo: {
        fullName: cvData.personal.name || "",
        email: cvData.personal.email || "",
        phone: cvData.personal.phone || "",
        address: cvData.personal.address || null,
        avatar: (cvData.personal as any).avatar || null,
        website: (cvData.personal as any).website || "",
        linkedin: (cvData.personal as any).linkedin || "",
        github: (cvData.personal as any).github || "",
        jobTitle: (cvData.personal as any).jobTitle || "",
      },
      careerObjective: cvData.personal.summary || "",
      experience: cvData.experience.map((exp) => ({
        company: exp.company || "",
        position: exp.role || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "",
        description: exp.description || "",
        type: "fulltime", // Default type, backend sẽ filter theo type
      })),
      education: cvData.education.map((edu) => ({
        institution: edu.school || "",
        degree: edu.degree || "",
        startYear: edu.startDate || "",
        endYear: edu.endDate || "",
        type: "university", // Default type, backend sẽ filter theo type
      })),
      skills: {
        technical: cvData.skills.map((skill: string | any) => {
          // Backend mong đợi object với name field
          if (typeof skill === "string") {
            return { name: skill, level: "intermediate" };
          }
          return {
            name: (skill as any).name || skill,
            level: (skill as any).level || "intermediate",
          };
        }),
        soft: [],
        languages: (cvData.languages || []).map((lang) => ({
          name: lang.name || "",
          level: lang.level || "",
        })),
      },
      projects: (cvData.projects || []).map((proj) => ({
        title: proj.title || "",
        description: proj.description || "",
        technologies: (proj as any).technologies || [],
        startDate: (proj as any).startDate || "",
        endDate: (proj as any).endDate || "",
        status: (proj as any).status || "completed",
        url: (proj as any).url || null,
        github: (proj as any).github || null,
        achievements: (proj as any).achievements || [],
      })),
      certifications: (cvData.certifications || []).map((cert) => {
        // Backend mong đợi issueDate và expiryDate, không phải year
        const year = cert.year || "";
        const issueDate = year ? `${year}-01-01` : null;
        return {
          name: cert.name || "",
          issuer: cert.issuer || "",
          issueDate: issueDate,
          expiryDate: null,
          credentialId: null,
          url: null,
        };
      }),
      awards: ((cvData as any).awards || []).map((award: any) => {
        // Backend mong đợi date, không phải year
        const year = award.year || "";
        const date = year ? `${year}-01-01` : null;
        return {
          title: award.title || "",
          issuer: award.issuer || "",
          date: date,
          description: award.description || "",
        };
      }),
      hobbies: ((cvData as any).hobbies || []).map((hobby: any) =>
        typeof hobby === "string" ? hobby : hobby
      ),
      references: ((cvData as any).references || []).map((ref: any) => ({
        name: ref.name || "",
        position: ref.position || "",
        contact: ref.contact || "",
      })),
    };
  };

  // Handle save CV builder data
  const handleSave = async () => {
    try {
      setSaving(true);
      // Đảm bảo lấy data mới nhất từ state
      const currentCvData = state.cvData;
      console.log("📊 Current CV Data before convert:", {
        education: currentCvData.education,
        experience: currentCvData.experience,
        projects: currentCvData.projects,
        certifications: currentCvData.certifications,
        awards: (currentCvData as any).awards,
        hobbies: (currentCvData as any).hobbies,
        personal: currentCvData.personal,
      });
      const builderData = convertCVDataToBuilderFormat(currentCvData);
      console.log(
        "📤 Sending data to backend:",
        JSON.stringify(builderData, null, 2)
      );

      // Nếu chưa có resumeId và có templateId, tạo ResumeBuilder mới từ template
      if (!resumeId && templateId) {
        console.log("🆕 Creating new ResumeBuilder from template:", templateId);
        const createResponse = await candidateService.createCVFromTemplate(
          templateId,
          true // setAsDefault = true
        );

        if (!createResponse.success) {
          throw new Error("Không thể tạo CV từ template");
        }

        console.log("✅ ResumeBuilder created:", createResponse.data);
      }

      // Cập nhật dữ liệu CV builder (lưu vào CandidateProfile)
      const response = await candidateService.updateBuilderData(builderData);

      if (response.success) {
        setHasUnsavedChanges(false);
        alert("Đã lưu thành công!");
      } else {
        throw new Error("Lưu thất bại");
      }
    } catch (error) {
      console.error("Error saving CV:", error);
      alert("Không thể lưu CV. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  // Handle avatar upload
  const handleAvatarChange = async (file: File) => {
    try {
      setUploadingAvatar(true);

      // 1. Upload avatar lên server
      const uploadResponse = await candidateService.uploadAvatar(file);

      if (!uploadResponse.success || !uploadResponse.data?.avatar?.url) {
        throw new Error("Upload avatar thất bại");
      }

      const avatarUrl = uploadResponse.data.avatar.url;

      // 2. Update CV data với avatar URL
      const updatedData = {
        ...state.cvData,
        personal: {
          ...state.cvData.personal,
          avatar: avatarUrl,
        } as any,
      };

      // 3. Update state
      state.updateField("personal", updatedData.personal);

      // 4. Update CV builder data trên server (avatar upload cần save ngay)
      await candidateService.updateBuilderData({
        personalInfo: {
          avatar: avatarUrl,
        },
      });

      // 5. Notify parent component
      onChange(updatedData);
      setHasUnsavedChanges(false); // Avatar đã được save
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Không thể upload avatar. Vui lòng thử lại.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/40 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:shadow dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            onClick={async () => {
              setExporting(true);
              if (previewRef.current) {
                await exportElementToPdf(previewRef.current, "cv.pdf");
              }
              setExporting(false);
            }}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{exporting ? "Đang xuất..." : "Xuất PDF"}</span>
          </button>
        </div>
        <p
          className={`mt-3 text-right text-xs font-medium ${
            hasUnsavedChanges
              ? "text-amber-600 dark:text-amber-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {hasUnsavedChanges
            ? "Có thay đổi chưa lưu"
            : "Mọi thay đổi đã được đồng bộ"}
        </p>
      </div>

      <div className="relative rounded-[40px] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-2xl ring-1 ring-black/5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/80">
        <div className="mx-auto w-full max-w-[880px]">
          <LivePreview
            data={state.cvData}
            layout={layout}
            templateId={templateConfig?.id} // Truyền template ID để map với renderer
            containerRef={(el) => (previewRef.current = el)}
            editable={inlineEditing && !exporting}
            onChangeText={(path, value) => {
              state.updateCvText(path, value);
              onChange(state.cvData);
              setHasUnsavedChanges(true);
            }}
            onFocusField={(fp) => state.setEditingField(fp)}
            onBlurField={() => {
              onChange(state.cvData);
              state.setEditingField(null);
            }}
            editingField={state.editingField}
            onAddItem={(section, index) => {
              state.addItem(section, index);
              onChange(state.cvData);
              setHasUnsavedChanges(true);
            }}
            onDeleteItem={(section, index) => {
              state.deleteItem(section, index);
              onChange(state.cvData);
              setHasUnsavedChanges(true);
            }}
            onDuplicateItem={(section, index) => {
              state.duplicateItem(section, index);
              onChange(state.cvData);
              setHasUnsavedChanges(true);
            }}
            onMoveItemUp={(section, index) => {
              state.moveItemUp(section, index);
              onChange(state.cvData);
              setHasUnsavedChanges(true);
            }}
            onMoveItemDown={(section, index) => {
              state.moveItemDown(section, index);
              onChange(state.cvData);
              setHasUnsavedChanges(true);
            }}
            onUpdateSectionTitle={(section, newTitle) => {
              state.updateSectionTitle(section, newTitle);
              onChange(state.cvData);
              setHasUnsavedChanges(true);
            }}
            getSectionTitle={state.getSectionTitle}
            onAvatarChange={handleAvatarChange}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-[40px] ring-1 ring-white/60 dark:ring-white/10" />
      </div>
    </div>
  );
}
