"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Brain,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  FileCheck,
  Zap,
  Eye,
} from "lucide-react";
import { api, type CVResponse } from "@/lib/api";

interface UploadCVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (response: CVResponse) => void;
}

interface ParsedData {
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
  };
  education?: {
    institution?: string;
    degree?: string;
    field?: string;
    graduationYear?: number;
    gpa?: number;
    gradeText?: string;
  };
  experience?: Array<{
    company?: string;
    position?: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }>;
  skills?: {
    technical?: string[];
    soft?: string[];
    languages?: string[];
  };
  certificates?: Array<{
    name?: string;
    issuer?: string;
    year?: number;
  }>;
  awards?: Array<{
    name?: string;
    year?: number;
    description?: string;
  }>;
}

interface ParsingResponse {
  extractedData: ParsedData;
  skills: string[];
  suggestions: string[];
  analyzedAt: string;
}

export default function UploadCVModal({
  open,
  onOpenChange,
  onSuccess,
}: UploadCVModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [uploadMode, setUploadMode] = useState<"upload" | "parse">("parse");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [parsingResponse, setParsingResponse] =
    useState<ParsingResponse | null>(null);
  const [showParsedResults, setShowParsedResults] = useState(false);
  const [lastResponse, setLastResponse] = useState<CVResponse | null>(null);

  const primaryColor = "oklch(0.65 0.18 195)";
  const primaryGradient = `linear-gradient(135deg, ${primaryColor} 0%, oklch(0.78 0.09 210) 55%, oklch(0.9 0.04 195) 100%)`;

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Chỉ hỗ trợ file PDF, DOC, DOCX, JPG, PNG");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Kích thước file không được vượt quá 10MB");
      return;
    }

    setSelectedFile(file);
    setDisplayName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
    setError(null);
    setSuccess(null);
    setParsedData(null);
    setParsingResponse(null);
    setShowParsedResults(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", selectedFile);
      if (displayName.trim()) {
        formData.append("displayName", displayName.trim());
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      let response: CVResponse;

      if (uploadMode === "parse") {
        response = await api.candidateCV.uploadAndParseCV(formData);
      } else {
        response = await api.candidateCV.uploadCV(formData);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setSuccess(
          uploadMode === "parse"
            ? "CV đã được tải lên và phân tích thành công!"
            : "CV đã được tải lên thành công!"
        );

        // Show parsed data if available
        if (uploadMode === "parse" && response.data.parsing?.extractedData) {
          setParsedData(response.data.parsing.extractedData);
          setParsingResponse({
            extractedData: response.data.parsing.extractedData,
            skills: response.data.parsing.skills || [],
            suggestions: response.data.parsing.suggestions || [],
            analyzedAt:
              response.data.parsing.analyzedAt || new Date().toISOString(),
          });
          setShowParsedResults(true);
          setLastResponse(response);
          // Không tự động đóng modal, chờ user bấm OK
        } else {
          // Chỉ tự động đóng nếu không có parsed data
          setTimeout(() => {
            handleClose();
            onSuccess?.(response);
          }, 2000);
        }
      } else {
        setError("Không thể tải lên CV, vui lòng thử lại");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Lỗi khi tải lên CV");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDisplayName("");
    setUploadMode("parse");
    setError(null);
    setSuccess(null);
    setParsedData(null);
    setParsingResponse(null);
    setShowParsedResults(false);
    setUploadProgress(0);
    setLastResponse(null);
    onOpenChange(false);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`${
          showParsedResults
            ? "max-w-[98vw] w-[98vw] h-[95vh] max-h-[95vh] !w-[98vw] !max-w-[98vw] !h-[95vh] !max-h-[95vh]"
            : "max-w-2xl w-[90vw] sm:w-full"
        } transition-all duration-300`}
        style={{
          ...(showParsedResults && {
            width: "98vw",
            maxWidth: "98vw",
            height: "95vh",
            maxHeight: "95vh",
          }),
        }}
      >
        {!showParsedResults && (
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{ background: primaryGradient }}
              >
                <Upload className="h-5 w-5" />
              </div>
              Tải lên CV mới
            </DialogTitle>
            <DialogDescription>
              Chọn file CV và quyết định có sử dụng AI để phân tích nội dung hay
              không
            </DialogDescription>
          </DialogHeader>
        )}

        <div
          className={`${
            showParsedResults
              ? "overflow-y-auto max-h-[calc(95vh-60px)] px-2 flex-1"
              : "space-y-6"
          }`}
        >
          {/* File Selection - Only show when not showing parsed results */}
          {!showParsedResults && (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cv-file" className="text-sm font-medium">
                    Chọn file CV
                  </Label>
                  <div className="mt-2">
                    <Input
                      ref={fileInputRef}
                      id="cv-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-20 border-2 border-dashed border-slate-300 hover:border-[oklch(0.65_0.18_195)] hover:bg-[oklch(0.65_0.18_195/0.05)]"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-6 w-6 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">
                          {selectedFile
                            ? "Chọn file khác"
                            : "Nhấp để chọn file"}
                        </span>
                        <span className="text-xs text-slate-400">
                          PDF, DOC, DOCX, JPG, PNG (tối đa 10MB)
                        </span>
                      </div>
                    </Button>
                  </div>
                </div>

                {selectedFile && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                        <FileText className="h-6 w-6 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        <FileCheck className="mr-1 h-3 w-3" />
                        Đã chọn
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Display Name */}
              {selectedFile && (
                <div className="space-y-2">
                  <Label htmlFor="display-name" className="text-sm font-medium">
                    Tên hiển thị (tuỳ chọn)
                  </Label>
                  <Input
                    id="display-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nhập tên hiển thị cho CV"
                    className="w-full"
                  />
                </div>
              )}

              {/* Upload Mode Selection */}
              {selectedFile && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Chế độ tải lên</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setUploadMode("parse")}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        uploadMode === "parse"
                          ? "border-[oklch(0.65_0.18_195)] bg-[oklch(0.65_0.18_195/0.05)]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            uploadMode === "parse"
                              ? "bg-[oklch(0.65_0.18_195)] text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Brain className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              Phân tích AI
                            </h3>
                            <Badge className="bg-purple-100 text-purple-700">
                              <Sparkles className="mr-1 h-3 w-3" />
                              Khuyến nghị
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mt-1">
                            Tự động trích xuất thông tin từ CV và điền vào
                            profile
                          </p>
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUploadMode("upload")}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                        uploadMode === "upload"
                          ? "border-[oklch(0.65_0.18_195)] bg-[oklch(0.65_0.18_195/0.05)]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            uploadMode === "upload"
                              ? "bg-[oklch(0.65_0.18_195)] text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">
                            Tải lên thường
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Chỉ tải lên file, không phân tích nội dung
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Error/Success Messages */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      {uploadMode === "parse"
                        ? "Đang phân tích CV..."
                        : "Đang tải lên..."}
                    </span>
                    <span className="text-slate-500">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </>
          )}

          {/* Parsed Results Preview */}
          {showParsedResults && parsedData && parsingResponse && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800 text-lg">
                  Thông tin đã được trích xuất từ CV
                </h3>
              </div>

              {/* Suggestions Section - Highlighted */}
              {parsingResponse.suggestions &&
                parsingResponse.suggestions.length > 0 && (
                  <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 p-4 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-800 text-lg">
                          💡 Lời khuyên từ AI
                        </h4>
                        <p className="text-sm text-amber-700">
                          Những gợi ý để cải thiện CV của bạn
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                      {parsingResponse.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-white/70 border border-amber-200"
                        >
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs font-bold mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-sm font-medium text-amber-800 leading-relaxed">
                            {suggestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Personal Information */}
                {parsedData.personalInfo && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <span className="text-sm font-bold text-blue-600">
                          👤
                        </span>
                      </div>
                      <h4 className="font-semibold text-blue-800">
                        Thông tin cá nhân
                      </h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {parsedData.personalInfo.fullName && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-700 min-w-[80px]">
                            Họ tên:
                          </span>
                          <span className="text-blue-900">
                            {parsedData.personalInfo.fullName}
                          </span>
                        </div>
                      )}
                      {parsedData.personalInfo.email && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-700 min-w-[80px]">
                            Email:
                          </span>
                          <span className="text-blue-900">
                            {parsedData.personalInfo.email}
                          </span>
                        </div>
                      )}
                      {parsedData.personalInfo.phone && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-700 min-w-[80px]">
                            SĐT:
                          </span>
                          <span className="text-blue-900">
                            {parsedData.personalInfo.phone}
                          </span>
                        </div>
                      )}
                      {parsedData.personalInfo.address && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-700 min-w-[80px]">
                            Địa chỉ:
                          </span>
                          <span className="text-blue-900">
                            {parsedData.personalInfo.address}
                          </span>
                        </div>
                      )}
                      {parsedData.personalInfo.dateOfBirth && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-blue-700 min-w-[80px]">
                            Ngày sinh:
                          </span>
                          <span className="text-blue-900">
                            {parsedData.personalInfo.dateOfBirth}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Education */}
                {parsedData.education && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                        <span className="text-sm font-bold text-purple-600">
                          🎓
                        </span>
                      </div>
                      <h4 className="font-semibold text-purple-800">Học vấn</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {parsedData.education.institution && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-purple-700 min-w-[80px]">
                            Trường:
                          </span>
                          <span className="text-purple-900">
                            {parsedData.education.institution}
                          </span>
                        </div>
                      )}
                      {parsedData.education.degree && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-purple-700 min-w-[80px]">
                            Bằng:
                          </span>
                          <span className="text-purple-900">
                            {parsedData.education.degree}
                          </span>
                        </div>
                      )}
                      {parsedData.education.field && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-purple-700 min-w-[80px]">
                            Chuyên ngành:
                          </span>
                          <span className="text-purple-900">
                            {parsedData.education.field}
                          </span>
                        </div>
                      )}
                      {parsedData.education.graduationYear && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-purple-700 min-w-[80px]">
                            Năm tốt nghiệp:
                          </span>
                          <span className="text-purple-900">
                            {parsedData.education.graduationYear}
                          </span>
                        </div>
                      )}
                      {(parsedData.education.gpa ||
                        parsedData.education.gradeText) && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-purple-700 min-w-[80px]">
                            Điểm:
                          </span>
                          <span className="text-purple-900">
                            {parsedData.education.gpa
                              ? `GPA: ${parsedData.education.gpa}`
                              : parsedData.education.gradeText}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Skills - From parsing response */}
                {(parsingResponse.skills &&
                  parsingResponse.skills.length > 0) ||
                parsedData.skills ? (
                  <div className="rounded-xl border border-green-200 bg-green-50/50 p-4 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                        <span className="text-sm font-bold text-green-600">
                          ⚡
                        </span>
                      </div>
                      <h4 className="font-semibold text-green-800">Kỹ năng</h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      {/* Skills from parsing response */}
                      {parsingResponse.skills &&
                        parsingResponse.skills.length > 0 && (
                          <div>
                            <span className="font-medium text-green-700 mb-2 block">
                              Kỹ năng được phát hiện:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {parsingResponse.skills.map((skill, index) => (
                                <Badge
                                  key={index}
                                  className="bg-green-100 text-green-700 text-xs border border-green-200"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Legacy skills structure */}
                      {parsedData.skills && (
                        <>
                          {parsedData.skills.technical &&
                            parsedData.skills.technical.length > 0 && (
                              <div>
                                <span className="font-medium text-green-700">
                                  Kỹ thuật:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {parsedData.skills.technical.map(
                                    (skill, index) => (
                                      <Badge
                                        key={index}
                                        className="bg-green-100 text-green-700 text-xs"
                                      >
                                        {skill}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {parsedData.skills.soft &&
                            parsedData.skills.soft.length > 0 && (
                              <div>
                                <span className="font-medium text-green-700">
                                  Mềm:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {parsedData.skills.soft.map(
                                    (skill, index) => (
                                      <Badge
                                        key={index}
                                        className="bg-green-100 text-green-700 text-xs"
                                      >
                                        {skill}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          {parsedData.skills.languages &&
                            parsedData.skills.languages.length > 0 && (
                              <div>
                                <span className="font-medium text-green-700">
                                  Ngoại ngữ:
                                </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {parsedData.skills.languages.map(
                                    (language, index) => (
                                      <Badge
                                        key={index}
                                        className="bg-green-100 text-green-700 text-xs"
                                      >
                                        {language}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Experience */}
                {parsedData.experience && parsedData.experience.length > 0 && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
                        <span className="text-sm font-bold text-orange-600">
                          💼
                        </span>
                      </div>
                      <h4 className="font-semibold text-orange-800">
                        Kinh nghiệm
                      </h4>
                    </div>
                    <div className="space-y-3 text-sm">
                      {parsedData.experience.slice(0, 3).map((exp, index) => (
                        <div
                          key={index}
                          className="border-l-2 border-orange-300 pl-3"
                        >
                          {exp.position && (
                            <div className="font-medium text-orange-900">
                              {exp.position}
                            </div>
                          )}
                          {exp.company && (
                            <div className="text-orange-700">{exp.company}</div>
                          )}
                          {exp.location && (
                            <div className="text-orange-600 text-xs">
                              {exp.location}
                            </div>
                          )}
                          {(exp.startDate || exp.endDate) && (
                            <div className="text-orange-600 text-xs">
                              {exp.startDate} - {exp.endDate || "Hiện tại"}
                            </div>
                          )}
                          {exp.description && (
                            <div className="text-orange-600 text-xs mt-1 line-clamp-2">
                              {exp.description}
                            </div>
                          )}
                        </div>
                      ))}
                      {parsedData.experience.length > 3 && (
                        <div className="text-xs text-orange-600">
                          +{parsedData.experience.length - 3} kinh nghiệm khác
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Certificates */}
                {parsedData.certificates &&
                  parsedData.certificates.length > 0 && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 min-h-[200px]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                          <span className="text-sm font-bold text-indigo-600">
                            🏆
                          </span>
                        </div>
                        <h4 className="font-semibold text-indigo-800">
                          Chứng chỉ
                        </h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        {parsedData.certificates
                          .slice(0, 3)
                          .map((cert, index) => (
                            <div
                              key={index}
                              className="border-l-2 border-indigo-300 pl-3"
                            >
                              {cert.name && (
                                <div className="font-medium text-indigo-900">
                                  {cert.name}
                                </div>
                              )}
                              {cert.issuer && (
                                <div className="text-indigo-700">
                                  {cert.issuer}
                                </div>
                              )}
                              {cert.year && (
                                <div className="text-indigo-600 text-xs">
                                  Năm: {cert.year}
                                </div>
                              )}
                            </div>
                          ))}
                        {parsedData.certificates.length > 3 && (
                          <div className="text-xs text-indigo-600">
                            +{parsedData.certificates.length - 3} chứng chỉ khác
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Awards */}
                {parsedData.awards && parsedData.awards.length > 0 && (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-4 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
                        <span className="text-sm font-bold text-yellow-600">
                          🥇
                        </span>
                      </div>
                      <h4 className="font-semibold text-yellow-800">
                        Giải thưởng
                      </h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      {parsedData.awards.slice(0, 3).map((award, index) => (
                        <div
                          key={index}
                          className="border-l-2 border-yellow-300 pl-3"
                        >
                          {award.name && (
                            <div className="font-medium text-yellow-900">
                              {award.name}
                            </div>
                          )}
                          {award.year && (
                            <div className="text-yellow-700 text-xs">
                              Năm: {award.year}
                            </div>
                          )}
                          {award.description && (
                            <div className="text-yellow-600 text-xs mt-1">
                              {award.description}
                            </div>
                          )}
                        </div>
                      ))}
                      {parsedData.awards.length > 3 && (
                        <div className="text-xs text-yellow-600">
                          +{parsedData.awards.length - 3} giải thưởng khác
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold text-slate-800 text-lg">
                    Tóm tắt phân tích
                  </h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {parsedData.personalInfo
                        ? Object.keys(parsedData.personalInfo).filter(
                            (key) =>
                              parsedData.personalInfo?.[
                                key as keyof typeof parsedData.personalInfo
                              ]
                          ).length
                        : 0}
                    </div>
                    <div className="text-xs text-slate-600">
                      Thông tin cá nhân
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {parsedData.education
                        ? Object.keys(parsedData.education).filter(
                            (key) =>
                              parsedData.education?.[
                                key as keyof typeof parsedData.education
                              ]
                          ).length
                        : 0}
                    </div>
                    <div className="text-xs text-slate-600">
                      Thông tin học vấn
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {parsedData.experience?.length || 0}
                    </div>
                    <div className="text-xs text-slate-600">Kinh nghiệm</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {parsingResponse.skills?.length ||
                        (parsedData.skills?.technical?.length || 0) +
                          (parsedData.skills?.soft?.length || 0) +
                          (parsedData.skills?.languages?.length || 0)}
                    </div>
                    <div className="text-xs text-slate-600">Kỹ năng</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {parsingResponse.suggestions?.length || 0}
                    </div>
                    <div className="text-xs text-slate-600">Lời khuyên</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {(parsedData.certificates?.length || 0) +
                        (parsedData.awards?.length || 0)}
                    </div>
                    <div className="text-xs text-slate-600">
                      Chứng chỉ & Giải thưởng
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-600 mb-3">
                  AI đã trích xuất thành công thông tin từ CV của bạn. Những
                  thông tin này sẽ được sử dụng để tự động điền vào profile của
                  bạn, giúp bạn tiết kiệm thời gian và đảm bảo tính chính xác.
                  {parsingResponse.suggestions &&
                    parsingResponse.suggestions.length > 0 && (
                      <span className="block mt-2 text-amber-700 font-medium">
                        💡 Đừng quên xem lại các lời khuyên từ AI ở trên để cải
                        thiện CV của bạn!
                      </span>
                    )}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      // Có thể mở modal chỉnh sửa hoặc xem chi tiết
                      console.log("Xem chi tiết parsed data:", parsedData);
                    }}
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Xem chi tiết
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      // Có thể mở modal chỉnh sửa
                      console.log("Chỉnh sửa parsed data:", parsedData);
                    }}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Chỉnh sửa
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs text-white"
                    style={{ background: primaryGradient }}
                    onClick={() => {
                      handleClose();
                      if (lastResponse) {
                        onSuccess?.(lastResponse);
                      }
                    }}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Xong
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {!showParsedResults && (
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="text-white shadow-lg"
              style={{ background: primaryGradient }}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadMode === "parse"
                    ? "Đang phân tích..."
                    : "Đang tải lên..."}
                </>
              ) : (
                <>
                  {uploadMode === "parse" ? (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      Tải lên & Phân tích
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Tải lên
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
