import { useMemo, useRef, useState } from "react";
import type { CVData } from "../../lib/mocks/cvSamples";
import { templateLayouts } from "../../lib/mocks/templateLayouts";
import LivePreview from "./LivePreview";
import { usePdfExport } from "../../hooks/usePdfExport";
import { useCvEditorState } from "../../hooks/useCvEditorState";
import { candidateService } from "../../lib/api/services/candidate.service";

type Props = {
  data: CVData;
  onChange: (next: CVData) => void;
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
};

export default function CVEditor({ data, onChange, templateConfig }: Props) {
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-500">
          Font: {layout.fonts.heading}/{layout.fonts.body} • Màu:{" "}
          {layout.colors.primary}
          {hasUnsavedChanges && (
            <span className="ml-2 text-orange-600">• Có thay đổi chưa lưu</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={saving || !hasUnsavedChanges}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2"
            onClick={async () => {
              setExporting(true);
              if (previewRef.current) {
                await exportElementToPdf(previewRef.current, "cv.pdf");
              }
              setExporting(false);
            }}
          >
            Xuất PDF
          </button>
        </div>
      </div>
      <div>
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
    </div>
  );
}
