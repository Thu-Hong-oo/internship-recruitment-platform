"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Zap,
  TrendingUp,
  X,
  FileCheck,
  Edit3,
  MessageSquare,
  Target,
  Download,
} from "lucide-react";
import { aiService, candidateService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CVAnalysisPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // State variables
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [editableCVText, setEditableCVText] = useState("");
  const [improvements, setImprovements] = useState<any>(null);
  const [ragSuggestions, setRagSuggestions] = useState<any>(null);
  const [isAnalyzingImprovements, setIsAnalyzingImprovements] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [availableCVs, setAvailableCVs] = useState<Array<{
    id: string;
    label: string;
    url: string;
    filename: string;
    isCurrent?: boolean;
  }>>([]);
  const [selectedCVId, setSelectedCVId] = useState<string>("");
  const [loadingCVs, setLoadingCVs] = useState(false);
  const [cvFormData, setCvFormData] = useState<any>({
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: {
      technical: [],
      soft: [],
      languages: [],
    },
    certificates: [],
    awards: [],
    activities: [],
    references: [],
  });

  // Load available CVs on mount
  useEffect(() => {
    const loadCVs = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      try {
        setLoadingCVs(true);
        const response = await candidateService.getResumesAll();
        if (response.success && response.data) {
          const cvList: Array<{
            id: string;
            label: string;
            url: string;
            filename: string;
            isCurrent?: boolean;
          }> = [];

          const current = (response.data as any).current;
          if (current && (current.url || current.downloadUrl)) {
            cvList.push({
              id: "current",
              label: current.displayName || current.filename || "CV hiện tại",
              url: current.url || current.downloadUrl || "",
              filename: current.filename || "current.pdf",
              isCurrent: true,
            });
          }

          const history = (response.data as any).history || [];
          history.forEach((cv: any, index: number) => {
            if (cv.url || cv.downloadUrl) {
              cvList.push({
                id: cv._id || `history-${index}`,
                label: cv.displayName || cv.filename || `CV ${index + 1}`,
                url: cv.url || cv.downloadUrl || "",
                filename: cv.filename || `cv-${index + 1}.pdf`,
              });
            }
          });

          setAvailableCVs(cvList);
        }
      } catch (error) {
        console.error("Failed to load CVs:", error);
      } finally {
        setLoadingCVs(false);
      }
    };

    loadCVs();
  }, []);

  // Helper function to download CV file from URL
  const downloadCVAsFile = async (url: string, filename: string): Promise<File> => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download CV: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    let mimeType = "application/pdf";
    if (filename.toLowerCase().endsWith(".doc")) {
      mimeType = "application/msword";
    } else if (filename.toLowerCase().endsWith(".docx")) {
      mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    
    const file = new File([blob], filename, { type: mimeType });
    return file;
  };

  // Helper function to clean corrupted text
  const cleanText = (text: string): string => {
    if (!text) return "";
    let cleaned = text
      .replace(/Đỗ/g, " ")
      .replace(/Ngô/g, " ")
      .replace(/Đặng/g, " ")
      .replace(/Chứ/g, " ")
      .replace(/viên/g, " ")
      .replace(/Nhân/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned;
  };

  // Helper function to parse personal info from text
  const parsePersonalInfo = (text: string) => {
    const info: any = {};
    if (!text) return info;

    const cleanedText = cleanText(text);

    // Extract email
    const emailPatterns = [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|vn|edu|org|net))/i,
    ];
    for (const pattern of emailPatterns) {
      const emailMatch = cleanedText.match(pattern);
      if (emailMatch) {
        info.email = emailMatch[1].toLowerCase();
        break;
      }
    }

    // Extract phone
    const phonePatterns = [
      /(0[3|5|7|8|9][0-9]{8})/,
      /(\+84[3|5|7|8|9][0-9]{8})/,
      /(84[3|5|7|8|9][0-9]{8})/,
      /([0-9]{10,11})/,
    ];
    for (const pattern of phonePatterns) {
      const phoneMatch = cleanedText.match(pattern);
      if (phoneMatch) {
        let phone = phoneMatch[1].replace(/\s+/g, "");
        if (phone.startsWith("+84")) phone = "0" + phone.substring(3);
        if (phone.startsWith("84") && phone.length === 11) phone = "0" + phone.substring(2);
        if (phone.length === 10 || phone.length === 11) {
          info.phone = phone;
          break;
        }
      }
    }

    return info;
  };

  // Helper function to update progress smoothly
  const updateProgress = useCallback((targetValue: number, message: string, delay: number = 200) => {
    return new Promise<void>((resolve) => {
      setProgressMessage(message);
      
      setProgressValue((currentValue) => {
        const startValue = currentValue;
        const diff = targetValue - startValue;
        
        if (Math.abs(diff) < 1) {
          setTimeout(() => resolve(), delay);
          return targetValue;
        }
        
        const duration = 300;
        const steps = 20;
        const stepTime = duration / steps;
        const increment = diff / steps;
        let stepCount = 0;
        
        const interval = setInterval(() => {
          stepCount++;
          const newValue = Math.round(startValue + (increment * stepCount));
          
          if (stepCount >= steps || newValue >= targetValue) {
            setProgressValue(targetValue);
            clearInterval(interval);
            setTimeout(() => resolve(), delay);
          } else {
            setProgressValue(newValue);
          }
        }, stepTime);
        
        return startValue;
      });
    });
  }, []);

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Loại file không hợp lệ",
          description: "Vui lòng upload file PDF, DOC, hoặc DOCX",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File quá lớn",
          description: "Kích thước file không được vượt quá 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Loại file không hợp lệ",
          description: "Vui lòng upload file PDF, DOC, hoặc DOCX",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File quá lớn",
          description: "Kích thước file không được vượt quá 5MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  }, [toast]);

  // Handle analyze from file
  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setShowProgressModal(true);
    setProgressValue(0);
    setProgressMessage("Đang đọc file CV...");
    
    try {
      await updateProgress(20, "Đang trích xuất nội dung từ CV...", 300);
      const response = await aiService.analyzeCVFromFile(selectedFile);
      const data: any = response.data || response || {};
      const analysis = data.analysis || {};
      const skills = analysis.skills || {};
      
      await updateProgress(40, "Đang phân tích kỹ năng...", 200);
      
      const technicalSkills = (skills.technical || []).map((s: any) => typeof s === 'string' ? s : s.name || s).filter(Boolean);
      const softSkills = (skills.soft || []).map((s: any) => typeof s === 'string' ? s : s.name || s).filter(Boolean);
      const languageSkills = (skills.languages || []).map((s: any) => typeof s === 'string' ? s : s.name || s).filter(Boolean);
      const uniqueSkills = [...new Set([...technicalSkills, ...softSkills, ...languageSkills])];
      
      await updateProgress(60, "Đang xử lý kinh nghiệm và học vấn...", 200);
      
      const parsedData = {
        extractedSkills: uniqueSkills,
        skills: {
          technical: technicalSkills,
          soft: softSkills,
          languages: languageSkills,
        },
        experience: data.experience || [],
        education: data.education || [],
        suggestions: data.suggestions || [],
        extractedText: data.extractedText || "",
        extractedData: data.extractedData || data.analysis?.extractedData || {},
      };

      setAnalysisResult(parsedData);
      
      if (data.extractedText) {
        setEditableCVText(data.extractedText);
      }
      
      await updateProgress(80, "Đang tạo form chỉnh sửa...", 200);
      
      const personalInfoFromText = data.extractedText ? parsePersonalInfo(data.extractedText) : {};
      const formData = {
        personalInfo: {
          fullName: data.personalInfo?.fullName || personalInfoFromText.fullName || "",
          email: data.personalInfo?.email || personalInfoFromText.email || "",
          phone: data.personalInfo?.phone || personalInfoFromText.phone || "",
          address: data.personalInfo?.address || "",
          summary: data.personalInfo?.summary || data.personalInfo?.bio || "",
        },
        experience: (data.experience || []).map((exp: any) => ({
          position: exp.position || "",
          company: exp.company || "",
          duration: exp.duration || "",
          description: exp.description || "",
        })),
        education: (data.education || []).map((edu: any) => ({
          degree: edu.degree || "",
          major: edu.major || "",
          school: edu.school || "",
        })),
        skills: {
          technical: uniqueSkills.filter((s: string) => {
            const lower = s.toLowerCase();
            return !lower.includes('giao tiếp') && !lower.includes('làm việc nhóm');
          }),
          soft: uniqueSkills.filter((s: string) => {
            const lower = s.toLowerCase();
            return lower.includes('giao tiếp') || lower.includes('làm việc nhóm');
          }),
          languages: uniqueSkills.filter((s: string) => {
            const lower = s.toLowerCase();
            return lower.includes('tiếng') || lower.includes('english');
          }),
        },
        certificates: (data.certificates || []).map((cert: any) => ({
          name: cert.name || "",
          issuer: cert.issuer || "",
          year: cert.year || "",
          description: cert.description || "",
        })),
        awards: (data.awards || []).map((award: any) => ({
          name: award.name || "",
          year: award.year || "",
          description: award.description || "",
        })),
        activities: (data.activities || []).map((activity: any) => ({
          name: activity.name || "",
          organization: activity.organization || "",
          duration: activity.duration || "",
          description: activity.description || "",
        })),
        references: (data.references || []).map((ref: any) => ({
          name: ref.name || "",
          position: ref.position || "",
          phone: ref.phone || "",
          email: ref.email || "",
        })),
      };
      setCvFormData(formData);

      // Call CV improvements (RAG) using parsingData
      setIsAnalyzingImprovements(true);
      try {
      const improveRes = await aiService.analyzeCVImprovements({
        parsingData: {
          extractedData: parsedData.extractedData,
          skills: parsedData.skills,
          suggestions: parsedData.suggestions,
        },
        jobCategory: targetJobId || undefined,
      });
        if (improveRes?.success && improveRes.data) {
          setImprovements(improveRes.data);
          setRagSuggestions(improveRes.data.ragSuggestions || null);
        }
      } catch (err) {
        console.error("Analyze CV improvements failed:", err);
      } finally {
        setIsAnalyzingImprovements(false);
      }
      
      await updateProgress(100, "Hoàn thành!", 500);
      
      setTimeout(() => {
        setShowProgressModal(false);
        setProgressValue(0);
      }, 500);
      
      toast({
        title: "Phân tích CV thành công",
        description: "CV của bạn đã được phân tích. Xem kết quả bên dưới.",
      });
    } catch (error) {
      console.error("CV Analysis Error:", error);
      setShowProgressModal(false);
      toast({
        title: "Phân tích thất bại",
        description: "Không thể phân tích CV. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle analyze from text
  const handleAnalyzeText = async () => {
    if (!cvText.trim()) {
      toast({
        title: "CV trống",
        description: "Vui lòng nhập nội dung CV",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setShowProgressModal(true);
    setProgressValue(0);
    setProgressMessage("Đang phân tích nội dung CV...");
    
    try {
      setProgressValue(30);
      const response = await aiService.analyzeCVFromText(cvText);
      const data: any = response.data || response || {};
      const analysis = data.analysis || {};
      const skills = analysis.skills || {};
      
      const technicalSkills = (skills.technical || []).map((s: any) => typeof s === 'string' ? s : s.name || s).filter(Boolean);
      const softSkills = (skills.soft || []).map((s: any) => typeof s === 'string' ? s : s.name || s).filter(Boolean);
      const languageSkills = (skills.languages || []).map((s: any) => typeof s === 'string' ? s : s.name || s).filter(Boolean);
      const uniqueSkills = [...new Set([...technicalSkills, ...softSkills, ...languageSkills])];
      
      setProgressValue(80);
      setProgressMessage("Đang xử lý dữ liệu...");
      
      setAnalysisResult({
        extractedSkills: uniqueSkills,
        skills: {
          technical: technicalSkills,
          soft: softSkills,
          languages: languageSkills,
        },
        experience: data.experience || [],
        education: data.education || [],
        suggestions: data.suggestions || [],
        extractedText: cvText,
      });
      
      setEditableCVText(cvText);
      
      const personalInfoFromText = data.extractedText ? parsePersonalInfo(data.extractedText) : {};
      const formData = {
        personalInfo: {
          fullName: data.personalInfo?.fullName || personalInfoFromText.fullName || "",
          email: data.personalInfo?.email || personalInfoFromText.email || "",
          phone: data.personalInfo?.phone || personalInfoFromText.phone || "",
          address: data.personalInfo?.address || "",
          summary: data.personalInfo?.summary || data.personalInfo?.bio || "",
        },
        experience: (data.experience || []).map((exp: any) => ({
          position: exp.position || "",
          company: exp.company || "",
          duration: exp.duration || "",
          description: exp.description || "",
        })),
        education: (data.education || []).map((edu: any) => ({
          degree: edu.degree || "",
          major: edu.major || "",
          school: edu.school || "",
        })),
        skills: {
          technical: uniqueSkills.filter((s: string) => {
            const lower = s.toLowerCase();
            return !lower.includes('giao tiếp') && !lower.includes('làm việc nhóm');
          }),
          soft: uniqueSkills.filter((s: string) => {
            const lower = s.toLowerCase();
            return lower.includes('giao tiếp') || lower.includes('làm việc nhóm');
          }),
          languages: uniqueSkills.filter((s: string) => {
            const lower = s.toLowerCase();
            return lower.includes('tiếng') || lower.includes('english');
          }),
        },
        certificates: (data.certificates || []).map((cert: any) => ({
          name: cert.name || "",
          issuer: cert.issuer || "",
          year: cert.year || "",
          description: cert.description || "",
        })),
        awards: (data.awards || []).map((award: any) => ({
          name: award.name || "",
          year: award.year || "",
          description: award.description || "",
        })),
        activities: (data.activities || []).map((activity: any) => ({
          name: activity.name || "",
          organization: activity.organization || "",
          duration: activity.duration || "",
          description: activity.description || "",
        })),
        references: (data.references || []).map((ref: any) => ({
          name: ref.name || "",
          position: ref.position || "",
          phone: ref.phone || "",
          email: ref.email || "",
        })),
      };
      setCvFormData(formData);
      
      setProgressValue(100);
      setProgressMessage("Hoàn thành!");
      
      setTimeout(() => {
        setShowProgressModal(false);
        setProgressValue(0);
      }, 500);
      
      toast({
        title: "Phân tích CV thành công",
        description: "Nội dung CV đã được phân tích. Xem kết quả bên dưới.",
      });
    } catch (error) {
      console.error("CV Analysis Error:", error);
      setShowProgressModal(false);
      toast({
        title: "Phân tích thất bại",
        description: "Không thể phân tích nội dung CV. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle analyze from saved CV
  const handleAnalyzeFromSavedCV = async () => {
    if (!selectedCVId) {
      toast({
        title: "Chưa chọn CV",
        description: "Vui lòng chọn CV để phân tích",
        variant: "destructive",
      });
      return;
    }

    const selectedCV = availableCVs.find((cv) => cv.id === selectedCVId);
    if (!selectedCV) {
      toast({
        title: "CV không tồn tại",
        description: "Không tìm thấy CV đã chọn",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAnalyzing(true);
      setShowProgressModal(true);
      setProgressValue(0);
      setProgressMessage("Đang tải CV...");

      await updateProgress(10, "Đang tải CV từ hệ thống...", 300);
      const cvFile = await downloadCVAsFile(selectedCV.url, selectedCV.filename);
      setSelectedFile(cvFile);

      await updateProgress(20, "Đang trích xuất nội dung từ CV...", 300);
      const response = await aiService.analyzeCVFromFile(cvFile);
      
      const data: any = response.data || response || {};
      const analysis = data.analysis || {};
      const skills = analysis.skills || {};
      
      await updateProgress(40, "Đang phân tích kỹ năng...", 200);
      
      const technicalSkills = (skills.technical || []).map((s: any) => typeof s === 'string' ? s : s.name || s).filter(Boolean);
      const softSkills = (skills.soft || []).map((s: any) => typeof s === 'string' ? s : s.name || s).filter(Boolean);
      const languageSkills = (skills.languages || []).map((s: any) => typeof s === 'string' ? s : s.name || s).filter(Boolean);
      const uniqueSkills = [...new Set([...technicalSkills, ...softSkills, ...languageSkills])];
      
      await updateProgress(60, "Đang xử lý kinh nghiệm và học vấn...", 200);
      
      setAnalysisResult({
        extractedSkills: uniqueSkills,
        skills: {
          technical: technicalSkills,
          soft: softSkills,
          languages: languageSkills,
        },
        experience: data.experience || [],
        education: data.education || [],
        suggestions: data.suggestions || [],
        extractedText: data.extractedText || "",
      });
      
      if (data.extractedText) {
        setEditableCVText(data.extractedText);
      }
      
      await updateProgress(80, "Đang tạo form chỉnh sửa...", 200);
      
      const cleanedText = data.extractedText ? cleanText(data.extractedText) : "";
      const personalInfoFromText = cleanedText ? parsePersonalInfo(cleanedText) : {};
      
      const formData = {
        personalInfo: {
          fullName: data.personalInfo?.fullName || data.analysis?.extractedData?.personalInfo?.fullName || personalInfoFromText.fullName || "",
          email: data.personalInfo?.email || data.analysis?.extractedData?.personalInfo?.email || personalInfoFromText.email || "",
          phone: data.personalInfo?.phone || data.analysis?.extractedData?.personalInfo?.phone || personalInfoFromText.phone || "",
          address: data.personalInfo?.address || data.analysis?.extractedData?.personalInfo?.address || personalInfoFromText.address || "",
          summary: data.personalInfo?.summary || data.personalInfo?.bio || data.analysis?.extractedData?.personalInfo?.summary || "",
        },
        experience: (data.experience || []).map((exp: any) => ({
          position: exp.position || "",
          company: exp.company || "",
          duration: exp.duration || "",
          description: exp.description || "",
        })),
        education: (data.education || []).map((edu: any) => ({
          degree: edu.degree || "",
          major: edu.major || "",
          school: edu.school || "",
        })),
        skills: {
          technical: uniqueSkills.filter((s: string) => {
            const lower = s.toLowerCase();
            return !lower.includes('giao tiếp') && !lower.includes('làm việc nhóm');
          }),
          soft: uniqueSkills.filter((s: string) => {
            const lower = s.toLowerCase();
            return lower.includes('giao tiếp') || lower.includes('làm việc nhóm');
          }),
          languages: uniqueSkills.filter((s: string) => {
            const lower = s.toLowerCase();
            return lower.includes('tiếng') || lower.includes('english');
          }),
        },
        certificates: (data.certificates || []).map((cert: any) => ({
          name: cert.name || "",
          issuer: cert.issuer || "",
          year: cert.year || "",
          description: cert.description || "",
        })),
        awards: (data.awards || []).map((award: any) => ({
          name: award.name || "",
          year: award.year || "",
          description: award.description || "",
        })),
        activities: (data.activities || []).map((activity: any) => ({
          name: activity.name || "",
          organization: activity.organization || "",
          duration: activity.duration || "",
          description: activity.description || "",
        })),
        references: (data.references || []).map((ref: any) => ({
          name: ref.name || "",
          position: ref.position || "",
          phone: ref.phone || "",
          email: ref.email || "",
        })),
      };
      setCvFormData(formData);
      
      await updateProgress(100, "Hoàn thành!", 500);
      
      setTimeout(() => {
        setShowProgressModal(false);
        setProgressValue(0);
      }, 500);
      
      toast({
        title: "Phân tích CV thành công",
        description: "CV của bạn đã được phân tích. Xem các gợi ý cải thiện bên dưới.",
      });
    } catch (error: any) {
      console.error("CV Analysis Error:", error);
      setShowProgressModal(false);
      toast({
        title: "Phân tích thất bại",
        description: error?.message || "Không thể phân tích CV. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <PageLayout>
      {/* Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Đang xử lý...
            </DialogTitle>
            <DialogDescription>{progressMessage}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Progress value={progressValue} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              {progressValue}%
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-blue-600/10 to-purple-600/10 border-b border-primary/20">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
          <div className="container mx-auto px-4 py-12">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Phân tích CV bằng AI
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Phân tích và cải thiện CV của bạn
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Sử dụng AI để phân tích CV, phát hiện kỹ năng, và nhận gợi ý cải thiện để tăng cơ hội được tuyển dụng
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - CV Upload */}
            <div className="lg:col-span-1">
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-600/5 border-b">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Upload className="w-6 h-6 text-primary" />
                    Tải CV lên
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue="file" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                      <TabsTrigger value="file" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        File
                      </TabsTrigger>
                      <TabsTrigger value="saved" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        Đã lưu
                      </TabsTrigger>
                      <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        Dán text
                      </TabsTrigger>
                    </TabsList>

                    {/* File Upload Tab */}
                    <TabsContent value="file" className="space-y-4 mt-4">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                          isDragging
                            ? "border-primary bg-primary/5 scale-[1.02]"
                            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        <div className="space-y-4">
                          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <label
                              htmlFor="cv-upload"
                              className="cursor-pointer inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-lg transition-colors"
                            >
                              <FileText className="w-5 h-5" />
                              Chọn file CV
                            </label>
                            <input
                              id="cv-upload"
                              type="file"
                              accept=".pdf,.doc,.docx"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            <p className="text-sm text-muted-foreground mt-2">
                              PDF, DOC, DOCX (tối đa 5MB)
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedFile && (
                        <Alert className="border-green-200 bg-green-50/50">
                          <FileCheck className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            <div className="flex items-center justify-between">
                              <span>
                                {selectedFile.name} ({formatFileSize(selectedFile.size)})
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedFile(null)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        onClick={handleAnalyzeFile}
                        disabled={!selectedFile || isAnalyzing}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang phân tích...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Phân tích CV
                          </>
                        )}
                      </Button>
                    </TabsContent>

                    {/* Saved CV Tab */}
                    <TabsContent value="saved" className="space-y-4 mt-4">
                      {loadingCVs ? (
                        <div className="text-center py-8">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                          <p className="text-sm text-muted-foreground mt-2">Đang tải CV...</p>
                        </div>
                      ) : availableCVs.length === 0 ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Bạn chưa có CV nào đã lưu. Vui lòng tải CV lên trước.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <Select value={selectedCVId} onValueChange={setSelectedCVId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn CV để phân tích" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCVs.map((cv) => (
                                <SelectItem key={cv.id} value={cv.id}>
                                  {cv.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedCVId && (
                            <Alert className="border-blue-200 bg-blue-50/50">
                              <FileCheck className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-800">
                                Đã chọn: {availableCVs.find(cv => cv.id === selectedCVId)?.label}
                              </AlertDescription>
                            </Alert>
                          )}

                          <Button
                            onClick={handleAnalyzeFromSavedCV}
                            disabled={!selectedCVId || isAnalyzing}
                            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
                            size="lg"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang phân tích...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Phân tích CV
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </TabsContent>

                    {/* Text Input Tab */}
                    <TabsContent value="text" className="space-y-4 mt-4">
                      <Textarea
                        placeholder="Dán nội dung CV của bạn vào đây..."
                        value={cvText}
                        onChange={(e) => setCvText(e.target.value)}
                        className="min-h-[200px] resize-none"
                      />
                      <Button
                        onClick={handleAnalyzeText}
                        disabled={!cvText.trim() || isAnalyzing}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Đang phân tích...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Phân tích CV
                          </>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Middle Column - Skills Display */}
            <div className="lg:col-span-1">
              {!analysisResult && (
                <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          Chưa có kết quả phân tích
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Tải CV lên và nhấn "Phân tích CV" để bắt đầu
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysisResult && (
                <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-b-2 border-green-200">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Target className="w-6 h-6 text-green-600" />
                      Kỹ năng đã phát hiện
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Technical Skills */}
                    {analysisResult.skills?.technical && analysisResult.skills.technical.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Briefcase className="w-4 h-4 text-blue-600" />
                          <h4 className="font-semibold text-sm text-slate-700">Kỹ năng kỹ thuật</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.skills.technical.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Soft Skills */}
                    {analysisResult.skills?.soft && analysisResult.skills.soft.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare className="w-4 h-4 text-purple-600" />
                          <h4 className="font-semibold text-sm text-slate-700">Kỹ năng mềm</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.skills.soft.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Language Skills */}
                    {analysisResult.skills?.languages && analysisResult.skills.languages.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap className="w-4 h-4 text-amber-600" />
                          <h4 className="font-semibold text-sm text-slate-700">Ngôn ngữ</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.skills.languages.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="default" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - CV Editor Form */}
            <div className="lg:col-span-1">
              {!analysisResult && (
                <Card className="border-2 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Edit3 className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                          Chưa có dữ liệu
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Phân tích CV để xem form chỉnh sửa
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysisResult && (
                <Card className="border-2 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/95 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-blue-200">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Edit3 className="w-6 h-6 text-blue-600" />
                      Chỉnh sửa CV
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6 max-h-[600px] overflow-y-auto">
                    {/* Personal Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Thông tin cá nhân
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="fullName">Họ và tên</Label>
                          <Input
                            id="fullName"
                            value={cvFormData.personalInfo.fullName}
                            onChange={(e) => setCvFormData({
                              ...cvFormData,
                              personalInfo: { ...cvFormData.personalInfo, fullName: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={cvFormData.personalInfo.email}
                            onChange={(e) => setCvFormData({
                              ...cvFormData,
                              personalInfo: { ...cvFormData.personalInfo, email: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Số điện thoại</Label>
                          <Input
                            id="phone"
                            value={cvFormData.personalInfo.phone}
                            onChange={(e) => setCvFormData({
                              ...cvFormData,
                              personalInfo: { ...cvFormData.personalInfo, phone: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">Địa chỉ</Label>
                          <Input
                            id="address"
                            value={cvFormData.personalInfo.address}
                            onChange={(e) => setCvFormData({
                              ...cvFormData,
                              personalInfo: { ...cvFormData.personalInfo, address: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="summary">Tóm tắt</Label>
                          <Textarea
                            id="summary"
                            value={cvFormData.personalInfo.summary}
                            onChange={(e) => setCvFormData({
                              ...cvFormData,
                              personalInfo: { ...cvFormData.personalInfo, summary: e.target.value }
                            })}
                            className="min-h-[100px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-primary" />
                        Kinh nghiệm
                      </h4>
                      <div className="space-y-3">
                        {cvFormData.experience.map((exp: any, idx: number) => (
                          <div key={idx} className="p-3 border rounded-lg space-y-2">
                            <Input
                              placeholder="Vị trí"
                              value={exp.position}
                              onChange={(e) => {
                                const newExp = [...cvFormData.experience];
                                newExp[idx] = { ...newExp[idx], position: e.target.value };
                                setCvFormData({ ...cvFormData, experience: newExp });
                              }}
                            />
                            <Input
                              placeholder="Công ty"
                              value={exp.company}
                              onChange={(e) => {
                                const newExp = [...cvFormData.experience];
                                newExp[idx] = { ...newExp[idx], company: e.target.value };
                                setCvFormData({ ...cvFormData, experience: newExp });
                              }}
                            />
                            <Textarea
                              placeholder="Mô tả"
                              value={exp.description || ""}
                              onChange={(e) => {
                                const newExp = [...cvFormData.experience];
                                newExp[idx] = { ...newExp[idx], description: e.target.value };
                                setCvFormData({ ...cvFormData, experience: newExp });
                              }}
                              className="min-h-[80px]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary" />
                        Học vấn
                      </h4>
                      <div className="space-y-3">
                        {cvFormData.education.map((edu: any, idx: number) => (
                          <div key={idx} className="p-3 border rounded-lg space-y-2">
                            <Input
                              placeholder="Bằng cấp"
                              value={edu.degree}
                              onChange={(e) => {
                                const newEdu = [...cvFormData.education];
                                newEdu[idx] = { ...newEdu[idx], degree: e.target.value };
                                setCvFormData({ ...cvFormData, education: newEdu });
                              }}
                            />
                            <Input
                              placeholder="Chuyên ngành"
                              value={edu.major}
                              onChange={(e) => {
                                const newEdu = [...cvFormData.education];
                                newEdu[idx] = { ...newEdu[idx], major: e.target.value };
                                setCvFormData({ ...cvFormData, education: newEdu });
                              }}
                            />
                            <Input
                              placeholder="Trường học"
                              value={edu.school}
                              onChange={(e) => {
                                const newEdu = [...cvFormData.education];
                                newEdu[idx] = { ...newEdu[idx], school: e.target.value };
                                setCvFormData({ ...cvFormData, education: newEdu });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Certificates */}
                    {cvFormData.certificates && cvFormData.certificates.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                          Chứng chỉ
                        </h4>
                        <div className="space-y-3">
                          {cvFormData.certificates.map((cert: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-lg space-y-2 bg-indigo-50/50">
                              <Input
                                placeholder="Tên chứng chỉ"
                                value={cert.name}
                                onChange={(e) => {
                                  const newCerts = [...cvFormData.certificates];
                                  newCerts[idx] = { ...newCerts[idx], name: e.target.value };
                                  setCvFormData({ ...cvFormData, certificates: newCerts });
                                }}
                              />
                              <Input
                                placeholder="Tổ chức cấp"
                                value={cert.issuer || ""}
                                onChange={(e) => {
                                  const newCerts = [...cvFormData.certificates];
                                  newCerts[idx] = { ...newCerts[idx], issuer: e.target.value };
                                  setCvFormData({ ...cvFormData, certificates: newCerts });
                                }}
                              />
                              <Input
                                placeholder="Năm"
                                value={cert.year || ""}
                                onChange={(e) => {
                                  const newCerts = [...cvFormData.certificates];
                                  newCerts[idx] = { ...newCerts[idx], year: e.target.value };
                                  setCvFormData({ ...cvFormData, certificates: newCerts });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Awards */}
                    {cvFormData.awards && cvFormData.awards.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <Target className="w-5 h-5 text-primary" />
                          Giải thưởng
                        </h4>
                        <div className="space-y-3">
                          {cvFormData.awards.map((award: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-lg space-y-2 bg-yellow-50/50">
                              <Input
                                placeholder="Tên giải thưởng"
                                value={award.name}
                                onChange={(e) => {
                                  const newAwards = [...cvFormData.awards];
                                  newAwards[idx] = { ...newAwards[idx], name: e.target.value };
                                  setCvFormData({ ...cvFormData, awards: newAwards });
                                }}
                              />
                              <Input
                                placeholder="Năm"
                                value={award.year || ""}
                                onChange={(e) => {
                                  const newAwards = [...cvFormData.awards];
                                  newAwards[idx] = { ...newAwards[idx], year: e.target.value };
                                  setCvFormData({ ...cvFormData, awards: newAwards });
                                }}
                              />
                              {award.description && (
                                <Textarea
                                  placeholder="Mô tả"
                                  value={award.description || ""}
                                  onChange={(e) => {
                                    const newAwards = [...cvFormData.awards];
                                    newAwards[idx] = { ...newAwards[idx], description: e.target.value };
                                    setCvFormData({ ...cvFormData, awards: newAwards });
                                  }}
                                  className="min-h-[60px]"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Activities */}
                    {cvFormData.activities && cvFormData.activities.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-primary" />
                          Hoạt động
                        </h4>
                        <div className="space-y-3">
                          {cvFormData.activities.map((activity: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-lg space-y-2 bg-green-50/50">
                              <Input
                                placeholder="Tên hoạt động"
                                value={activity.name}
                                onChange={(e) => {
                                  const newActivities = [...cvFormData.activities];
                                  newActivities[idx] = { ...newActivities[idx], name: e.target.value };
                                  setCvFormData({ ...cvFormData, activities: newActivities });
                                }}
                              />
                              <Input
                                placeholder="Tổ chức"
                                value={activity.organization || ""}
                                onChange={(e) => {
                                  const newActivities = [...cvFormData.activities];
                                  newActivities[idx] = { ...newActivities[idx], organization: e.target.value };
                                  setCvFormData({ ...cvFormData, activities: newActivities });
                                }}
                              />
                              <Input
                                placeholder="Thời gian"
                                value={activity.duration || ""}
                                onChange={(e) => {
                                  const newActivities = [...cvFormData.activities];
                                  newActivities[idx] = { ...newActivities[idx], duration: e.target.value };
                                  setCvFormData({ ...cvFormData, activities: newActivities });
                                }}
                              />
                              {activity.description && (
                                <Textarea
                                  placeholder="Mô tả"
                                  value={activity.description || ""}
                                  onChange={(e) => {
                                    const newActivities = [...cvFormData.activities];
                                    newActivities[idx] = { ...newActivities[idx], description: e.target.value };
                                    setCvFormData({ ...cvFormData, activities: newActivities });
                                  }}
                                  className="min-h-[60px]"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* References */}
                    {cvFormData.references && cvFormData.references.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-primary" />
                          Người tham chiếu
                        </h4>
                        <div className="space-y-3">
                          {cvFormData.references.map((ref: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded-lg space-y-2 bg-purple-50/50">
                              <Input
                                placeholder="Họ và tên"
                                value={ref.name}
                                onChange={(e) => {
                                  const newRefs = [...cvFormData.references];
                                  newRefs[idx] = { ...newRefs[idx], name: e.target.value };
                                  setCvFormData({ ...cvFormData, references: newRefs });
                                }}
                              />
                              <Input
                                placeholder="Vị trí"
                                value={ref.position || ""}
                                onChange={(e) => {
                                  const newRefs = [...cvFormData.references];
                                  newRefs[idx] = { ...newRefs[idx], position: e.target.value };
                                  setCvFormData({ ...cvFormData, references: newRefs });
                                }}
                              />
                              <Input
                                placeholder="Số điện thoại"
                                value={ref.phone || ""}
                                onChange={(e) => {
                                  const newRefs = [...cvFormData.references];
                                  newRefs[idx] = { ...newRefs[idx], phone: e.target.value };
                                  setCvFormData({ ...cvFormData, references: newRefs });
                                }}
                              />
                              <Input
                                placeholder="Email"
                                type="email"
                                value={ref.email || ""}
                                onChange={(e) => {
                                  const newRefs = [...cvFormData.references];
                                  newRefs[idx] = { ...newRefs[idx], email: e.target.value };
                                  setCvFormData({ ...cvFormData, references: newRefs });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          {analysisResult && (
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => router.push("/job-recommendations")}
                variant="outline"
                className="h-12 border-2 hover:bg-primary/5 hover:border-primary transition-all duration-300"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Xem gợi ý việc làm
              </Button>
              <Button
                onClick={() => router.push("/skill-gap-analysis")}
                variant="outline"
                className="h-12 border-2 hover:bg-primary/5 hover:border-primary transition-all duration-300"
              >
                <Zap className="w-4 h-4 mr-2" />
                Phân tích khoảng cách kỹ năng
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
