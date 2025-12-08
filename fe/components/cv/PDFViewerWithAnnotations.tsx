"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check,
  X,
  Lightbulb,
  Save,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Dynamic import for react-pdf to avoid SSR issues
// Only import on client-side to prevent canvas module issues
const Document = dynamic(
  () => {
    if (typeof window === "undefined") {
      return Promise.resolve(() => null);
    }
    return import("react-pdf").then((mod) => mod.Document);
  },
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Đang tải PDF viewer...</p>
        </div>
      </div>
    ),
  }
);

const Page = dynamic(
  () => {
    if (typeof window === "undefined") {
      return Promise.resolve(() => null);
    }
    return import("react-pdf").then((mod) => mod.Page);
  },
  { ssr: false }
);

// Set up PDF.js worker (client-side only)
if (typeof window !== "undefined") {
  import("react-pdf").then((mod) => {
    const pdfjs = mod.pdfjs;
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }).catch((err) => {
    console.warn("Failed to load react-pdf:", err);
  });
}

interface Annotation {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  type: "suggestion" | "edit";
  severity?: "high" | "medium" | "low";
  suggestion?: string;
  issue?: string;
  evidence?: string;
  originalText?: string;
  editedText?: string;
  isEditing?: boolean;
}

interface PDFViewerWithAnnotationsProps {
  pdfUrl: string;
  suggestions?: Array<{
    section?: string;
    issue?: string;
    suggestion?: string;
    severity?: "high" | "medium" | "low";
    evidence?: string;
    lineNumber?: number;
    startIndex?: number;
    endIndex?: number;
    text?: string;
  }>;
  onSave?: (annotations: Annotation[]) => Promise<void>;
  onExport?: (annotations: Annotation[]) => Promise<void>;
  targetJobId?: string;
}

export default function PDFViewerWithAnnotations({
  pdfUrl,
  suggestions = [],
  onSave,
  onExport,
  targetJobId,
}: PDFViewerWithAnnotationsProps) {
  const { toast } = useToast();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Convert suggestions to annotations (mock coordinates for now)
  useEffect(() => {
    if (suggestions.length > 0 && numPages > 0) {
      const newAnnotations: Annotation[] = suggestions.map((suggestion, index) => {
        // Mock coordinates - in production, these should come from backend
        // Backend should use Gemini Vision API to detect actual box positions
        const mockX = 50 + (index % 3) * 200;
        const mockY = 100 + Math.floor(index / 3) * 150;
        
        return {
          id: `annotation-${index}`,
          x: mockX,
          y: mockY,
          width: 300,
          height: 80,
          page: 1, // Default to first page
          type: "suggestion",
          severity: suggestion.severity || "medium",
          suggestion: suggestion.suggestion,
          issue: suggestion.issue,
          evidence: suggestion.evidence,
          originalText: suggestion.text,
        };
      });
      setAnnotations(newAnnotations);
    }
  }, [suggestions, numPages]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(3, prev + 0.2));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.2));
  };

  const startEditing = (annotation: Annotation) => {
    setEditingAnnotation(annotation.id);
    setEditText(annotation.originalText || annotation.editedText || "");
  };

  const cancelEditing = () => {
    setEditingAnnotation(null);
    setEditText("");
  };

  const saveEdit = (annotationId: string) => {
    setAnnotations((prev) =>
      prev.map((ann) =>
        ann.id === annotationId
          ? { ...ann, editedText: editText, isEditing: false }
          : ann
      )
    );
    setEditingAnnotation(null);
    setEditText("");
    toast({
      title: "Đã lưu chỉnh sửa",
      description: "Thay đổi đã được lưu. Nhấn 'Lưu CV' để xuất file mới.",
    });
  };

  const handleSave = async () => {
    if (onSave) {
      try {
        await onSave(annotations);
        toast({
          title: "Đã lưu",
          description: "CV đã được lưu thành công.",
        });
      } catch (error) {
        toast({
          title: "Lỗi",
          description: "Không thể lưu CV. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    }
  };

  const handleExport = async () => {
    if (onExport) {
      try {
        await onExport(annotations);
      } catch (error: any) {
        toast({
          title: "Lỗi",
          description: error?.message || "Không thể xuất CV. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 border-red-300 text-red-700";
      case "medium":
        return "bg-amber-100 border-amber-300 text-amber-700";
      case "low":
        return "bg-blue-100 border-blue-300 text-blue-700";
      default:
        return "bg-gray-100 border-gray-300 text-gray-700";
    }
  };

  const getSeverityLabel = (severity?: string) => {
    switch (severity) {
      case "high":
        return "Ưu tiên cao";
      case "medium":
        return "Ưu tiên trung bình";
      case "low":
        return "Ưu tiên thấp";
      default:
        return "Gợi ý";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Trang {pageNumber} / {numPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Lưu CV
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Xuất PDF
          </Button>
        </div>
      </div>

      {/* PDF Viewer with Annotations */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-4 relative"
      >
        <div className="flex justify-center">
          <div className="relative" style={{ position: "relative" }}>
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Đang tải PDF...</p>
                  </div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-12">
                  <div className="text-center text-red-600">
                    <p className="font-semibold">Lỗi tải PDF</p>
                    <p className="text-sm mt-2">Không thể tải file PDF. Vui lòng thử lại.</p>
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </Document>

            {/* Annotations Overlay */}
            {annotations
              .filter((ann) => ann.page === pageNumber)
              .map((annotation) => {
                const isEditing = editingAnnotation === annotation.id;
                return (
                  <div
                    key={annotation.id}
                    className="absolute border-2 border-dashed rounded-lg p-2 pointer-events-auto"
                    style={{
                      left: `${annotation.x}px`,
                      top: `${annotation.y}px`,
                      width: `${annotation.width}px`,
                      minHeight: `${annotation.height}px`,
                      borderColor:
                        annotation.severity === "high"
                          ? "#ef4444"
                          : annotation.severity === "medium"
                          ? "#f59e0b"
                          : "#3b82f6",
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      zIndex: 10,
                    }}
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[60px] text-sm"
                          placeholder="Nhập nội dung mới..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(annotation.id)}
                            className="flex-1"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Lưu
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            className="flex-1"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Hủy
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            className={`${getSeverityColor(
                              annotation.severity
                            )} text-xs`}
                          >
                            {getSeverityLabel(annotation.severity)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEditing(annotation)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>

                        {annotation.issue && (
                          <p className="text-xs font-semibold text-red-600">
                            ⚠️ {annotation.issue}
                          </p>
                        )}

                        {annotation.originalText && (
                          <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="font-semibold">Hiện tại:</span>{" "}
                            {annotation.originalText}
                          </p>
                        )}

                        {annotation.editedText && (
                          <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">
                            <span className="font-semibold">Đã chỉnh sửa:</span>{" "}
                            {annotation.editedText}
                          </p>
                        )}

                        {annotation.suggestion && (
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="flex items-start gap-1 mb-1">
                              <Lightbulb className="h-3 w-3 text-blue-600 mt-0.5" />
                              <p className="text-xs font-semibold text-blue-900">
                                Gợi ý:
                              </p>
                            </div>
                            <p className="text-xs text-blue-700">
                              {annotation.suggestion}
                            </p>
                          </div>
                        )}

                        {annotation.evidence && (
                          <p className="text-xs text-gray-500 italic">
                            💡 {annotation.evidence}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Suggestions Sidebar */}
      {annotations.length > 0 && (
        <div className="border-t bg-white p-4 max-h-48 overflow-y-auto">
          <h3 className="font-semibold text-sm mb-2">Gợi ý cải thiện ({annotations.length})</h3>
          <div className="space-y-2">
            {annotations
              .filter((ann) => ann.page === pageNumber)
              .map((annotation) => (
                <div
                  key={annotation.id}
                  className="text-xs p-2 rounded border bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    // Scroll to annotation
                    const element = document.querySelector(
                      `[data-annotation-id="${annotation.id}"]`
                    );
                    element?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={`${getSeverityColor(
                        annotation.severity
                      )} text-xs`}
                    >
                      {getSeverityLabel(annotation.severity)}
                    </Badge>
                    {annotation.issue && (
                      <span className="text-red-600 font-semibold">
                        {annotation.issue}
                      </span>
                    )}
                  </div>
                  {annotation.suggestion && (
                    <p className="text-gray-700">{annotation.suggestion}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

