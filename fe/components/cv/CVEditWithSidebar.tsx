"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import {
  Palette,
  Plus,
  Layout,
  FileText,
  Lightbulb,
  Library,
  Type,
  MoveUp,
  MoveDown,
  Trash2,
  Copy,
} from "lucide-react";
import LivePreview from "./LivePreview";
import type { CVData } from "@/lib/mocks/cvSamples";
import { templateLayouts } from "@/lib/mocks/templateLayouts";
import { useCvEditorState } from "@/hooks/useCvEditorState";
import { useToast } from "@/hooks/use-toast";

interface CVEditWithSidebarProps {
  initialData: CVData;
  pdfUrl?: string | null; // PDF URL to render (if available)
  onSave?: (data: CVData) => Promise<void>;
  onExport?: () => Promise<void>;
  suggestions?: Array<{
    section?: string;
    issue?: string;
    suggestion?: string;
    severity?: "high" | "medium" | "low";
  }>;
}

type SidebarSection = "design" | "add" | "layout" | "template" | "suggestions" | "library";

export default function CVEditWithSidebar({
  initialData,
  pdfUrl,
  onSave,
  onExport,
  suggestions = [],
}: CVEditWithSidebarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SidebarSection>("design");
  const [cvData, setCvData] = useState<CVData>(initialData);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  const state = useCvEditorState(cvData);
  const layout = useMemo(() => templateLayouts[cvData.templateId] || templateLayouts[1], [cvData.templateId]);

  // Update CV data when state changes
  useEffect(() => {
    setCvData(state.cvData);
    setHasUnsavedChanges(true);
  }, [state.cvData]);

  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      setSaving(true);
      await onSave(cvData);
      setHasUnsavedChanges(false);
      toast({
        title: "Đã lưu",
        description: "CV đã được lưu thành công.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể lưu CV. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!onExport) return;
    
    try {
      setExporting(true);
      await onExport();
      toast({
        title: "Đã xuất PDF",
        description: "CV đã được xuất thành công.",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể xuất PDF. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const sidebarItems = [
    { id: "design" as SidebarSection, label: "Thiết kế & Font", icon: Palette },
    { id: "add" as SidebarSection, label: "Thêm mục", icon: Plus },
    { id: "layout" as SidebarSection, label: "Bố cục", icon: Layout },
    { id: "template" as SidebarSection, label: "Đổi mẫu CV", icon: FileText },
    { id: "suggestions" as SidebarSection, label: "Gợi ý viết CV", icon: Lightbulb, badge: suggestions.length },
    { id: "library" as SidebarSection, label: "Thư viện CV", icon: Library },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Công cụ chỉnh sửa</h2>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md transform scale-[1.02]"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-600 dark:text-gray-400"}`} />
                  <span className="flex-1 text-left font-semibold text-sm">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isActive ? "bg-white/30 text-white" : "bg-red-500 text-white"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* Sidebar Content - TopCV Style */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-5">
            {activeSection === "design" && (
              <DesignPanel cvData={cvData} onChange={(data) => setCvData(data)} />
            )}
            {activeSection === "add" && (
              <AddSectionPanel state={state} />
            )}
            {activeSection === "suggestions" && (
              <SuggestionsPanel suggestions={suggestions} />
            )}
            {activeSection === "layout" && (
              <LayoutPanel />
            )}
            {activeSection === "template" && (
              <TemplatePanel cvData={cvData} onChange={(data) => setCvData(data)} />
            )}
            {activeSection === "library" && (
              <LibraryPanel />
            )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content - TopCV Style */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Header - TopCV Style */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium">Quay lại</span>
                </button>
                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Chỉnh sửa CV với gợi ý
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Xem gợi ý cải thiện và chỉnh sửa trực tiếp trên CV
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={saving || !hasUnsavedChanges}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Lưu CV
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={exporting}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Xuất PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
            {hasUnsavedChanges && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Có thay đổi chưa lưu
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CV Preview */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-8">
          <div className="max-w-4xl mx-auto">
            {/* If PDF URL available, render PDF as HTML (preserves layout) */}
            {pdfUrl ? (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <PDFToHTMLRenderer
                  pdfUrl={pdfUrl}
                  editable={true}
                  onTextChange={(pageIndex, textIndex, newText) => {
                    // Handle text changes from PDF rendering
                    setHasUnsavedChanges(true);
                  }}
                />
              </div>
            ) : (
              /* Fallback to LivePreview if no PDF */
              <LivePreview
                data={state.cvData}
                layout={layout}
                containerRef={() => {}}
                editable={true}
                onChangeText={(path, value) => {
                  state.updateCvText(path, value);
                  setCvData(state.cvData);
                  setHasUnsavedChanges(true);
                }}
                onFocusField={(fp) => state.setEditingField(fp)}
                onBlurField={() => {
                  setCvData(state.cvData);
                  state.setEditingField(null);
                }}
                editingField={state.editingField}
                onAddItem={(section, index) => {
                  state.addItem(section, index);
                  setCvData(state.cvData);
                  setHasUnsavedChanges(true);
                }}
                onDeleteItem={(section, index) => {
                  state.deleteItem(section, index);
                  setCvData(state.cvData);
                  setHasUnsavedChanges(true);
                }}
                onDuplicateItem={(section, index) => {
                  state.duplicateItem(section, index);
                  setCvData(state.cvData);
                  setHasUnsavedChanges(true);
                }}
                onMoveItemUp={(section, index) => {
                  state.moveItemUp(section, index);
                  setCvData(state.cvData);
                  setHasUnsavedChanges(true);
                }}
                onMoveItemDown={(section, index) => {
                  state.moveItemDown(section, index);
                  setCvData(state.cvData);
                  setHasUnsavedChanges(true);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Design Panel Component
function DesignPanel({ cvData, onChange }: { cvData: CVData; onChange: (data: CVData) => void }) {
  const [fontSize, setFontSize] = useState(1.0);
  const [lineSpacing, setLineSpacing] = useState(1.2);
  const [themeColor, setThemeColor] = useState("#22c55e");

  const fonts = ["Roboto", "Inter", "Open Sans", "Lato", "Montserrat"];
  const colors = [
    { name: "Xanh lá", value: "#22c55e" },
    { name: "Đen", value: "#000000" },
    { name: "Xanh dương", value: "#2563eb" },
    { name: "Đỏ", value: "#dc2626" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          FONT CHỮ
        </label>
        <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          CỠ CHỮ
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Nhỏ</span>
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.1"
            value={fontSize}
            onChange={(e) => setFontSize(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-gray-500">Siêu lớn</span>
        </div>
        <p className="text-xs text-center text-gray-500 mt-1">Trung bình</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          KHOẢNG CÁCH DÒNG
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">1.0</span>
          <input
            type="range"
            min="1.0"
            max="2.0"
            step="0.1"
            value={lineSpacing}
            onChange={(e) => setLineSpacing(parseFloat(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs text-gray-500">2.0</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          MÀU CHỦ ĐỀ
        </label>
        <div className="grid grid-cols-4 gap-2 mb-2">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => setThemeColor(color.value)}
              className={`w-10 h-10 rounded-full border-2 ${
                themeColor === color.value ? "border-gray-900" : "border-gray-300"
              }`}
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
        <input
          type="color"
          value={themeColor}
          onChange={(e) => setThemeColor(e.target.value)}
          className="w-full h-10 rounded-lg"
        />
      </div>
    </div>
  );
}

// Add Section Panel
function AddSectionPanel({ state }: { state: any }) {
  const sections = [
    { id: "education", label: "Học vấn" },
    { id: "experience", label: "Kinh nghiệm" },
    { id: "skills", label: "Kỹ năng" },
    { id: "projects", label: "Dự án" },
    { id: "certifications", label: "Chứng chỉ" },
    { id: "awards", label: "Giải thưởng" },
  ];

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Thêm mục vào CV
      </p>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => {
            state.addItem(section.id, -1);
          }}
          className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          + {section.label}
        </button>
      ))}
    </div>
  );
}

// Suggestions Panel
function SuggestionsPanel({ suggestions }: { suggestions: any[] }) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Chưa có gợi ý nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => (
        <Card key={index} className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs ${
                suggestion.severity === "high" ? "bg-red-100 text-red-700" :
                suggestion.severity === "medium" ? "bg-amber-100 text-amber-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {suggestion.severity === "high" ? "Cao" : suggestion.severity === "medium" ? "Trung bình" : "Thấp"}
              </span>
              {suggestion.section || "Gợi ý"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {suggestion.issue}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              💡 {suggestion.suggestion}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Layout Panel
function LayoutPanel() {
  return (
    <div className="text-center py-8 text-gray-500">
      <Layout className="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p>Tính năng đang phát triển</p>
    </div>
  );
}

// Template Panel
function TemplatePanel({ cvData, onChange }: { cvData: CVData; onChange: (data: CVData) => void }) {
  const templates = [
    { id: 1, name: "Modern" },
    { id: 2, name: "Classic" },
  ];

  return (
    <div className="space-y-2">
      {templates.map((template) => (
        <button
          key={template.id}
          onClick={() => onChange({ ...cvData, templateId: template.id })}
          className={`w-full text-left px-4 py-3 rounded-lg border-2 ${
            cvData.templateId === template.id
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <p className="font-medium">{template.name}</p>
        </button>
      ))}
    </div>
  );
}

// Library Panel
function LibraryPanel() {
  return (
    <div className="text-center py-8 text-gray-500">
      <Library className="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p>Tính năng đang phát triển</p>
    </div>
  );
}

