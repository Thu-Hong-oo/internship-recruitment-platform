"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/page-layout";
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
} from "lucide-react";
import { aiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function CVAnalysisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    extractedSkills: string[];
    experience: Array<{
      position: string;
      company: string;
      duration: string;
    }>;
    education: Array<{
      degree: string;
      major: string;
      school: string;
    }>;
    suggestions: string[];
    extractedText?: string;
  } | null>(null);
  const [editableCVText, setEditableCVText] = useState("");
  const [improvements, setImprovements] = useState<{
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: {
      structure: string[];
      content: string[];
      writing: string[];
      keywords: string[];
    };
    specificImprovements: Array<{
      line?: number;
      section?: string;
      text: string;
      issue: string;
      suggestion: string;
      severity: "high" | "medium" | "low";
    }>;
  } | null>(null);
  const [isAnalyzingImprovements, setIsAnalyzingImprovements] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [highlightedRanges, setHighlightedRanges] = useState<Array<{
    start: number;
    end: number;
    severity: "high" | "medium" | "low";
    suggestion: string;
  }>>([]);
  
  // Helper function to parse personal info from text
  const parsePersonalInfo = (text: string) => {
    const info: any = {};
    // Try to extract email
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) info.email = emailMatch[1];
    // Try to extract phone
    const phoneMatch = text.match(/(0[3|5|7|8|9][0-9]{8}|[0-9]{10,11})/);
    if (phoneMatch) info.phone = phoneMatch[1];
    // Try to extract name (first line or after "Họ tên", "Tên", etc.)
    const nameMatch = text.match(/(?:Họ\s+tên|Tên|Name)[\s:]+([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ][a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ\s]+)/i);
    if (nameMatch) info.fullName = nameMatch[1].trim();
    return info;
  };
  
  // Structured CV form data
  const [cvFormData, setCvFormData] = useState<{
    personalInfo: {
      fullName: string;
      email: string;
      phone: string;
      address: string;
      summary: string;
    };
    experience: Array<{
      position: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education: Array<{
      degree: string;
      major: string;
      school: string;
    }>;
    skills: {
      technical: string[];
      soft: string[];
      languages: string[];
    };
  }>({
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
  });

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

  // Helper function to update progress smoothly
  const updateProgress = useCallback((targetValue: number, message: string, delay: number = 200) => {
    return new Promise<void>((resolve) => {
      setProgressMessage(message);
      
      // Get current value
      setProgressValue((currentValue) => {
        const startValue = currentValue;
        const diff = targetValue - startValue;
        
        if (Math.abs(diff) < 1) {
          setTimeout(() => resolve(), delay);
          return targetValue;
        }
        
        // Animate progress smoothly
        const duration = 300; // ms
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

  const handleAnalyzeFile = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setShowProgressModal(true);
    setProgressValue(0);
    setProgressMessage("Đang đọc file CV...");
    
    try {
      await updateProgress(20, "Đang trích xuất nội dung từ CV...", 300);
      const response = await aiService.analyzeCVFromFile(selectedFile);
      // Ensure all required fields are arrays
      const data = response.data || response || {};
      const analysis = data.analysis || {};
      const skills = analysis.skills || {};
      
      await updateProgress(40, "Đang phân tích kỹ năng...", 200);
      
      // Extract all skills from nested structure
      const allSkills = [
        ...(data.extractedSkills || []),
        ...(skills.technical || []).map(s => typeof s === 'string' ? s : s.name || s),
        ...(skills.soft || []).map(s => typeof s === 'string' ? s : s.name || s),
        ...(skills.languages || []).map(s => typeof s === 'string' ? s : s.name || s),
      ].filter(Boolean);
      const uniqueSkills = [...new Set(allSkills)];
      
      await updateProgress(60, "Đang xử lý kinh nghiệm và học vấn...", 200);
      
      setAnalysisResult({
        extractedSkills: uniqueSkills,
        experience: data.experience || [],
        education: data.education || [],
        suggestions: data.suggestions || [],
        extractedText: data.extractedText || "",
      });
      // Set editable CV text if available
      if (data.extractedText) {
        setEditableCVText(data.extractedText);
      }
      
      await updateProgress(80, "Đang tạo form chỉnh sửa...", 200);
      
      // Build structured form data from analysis result
      const personalInfoFromText = data.extractedText ? parsePersonalInfo(data.extractedText) : {};
      const formData = {
        personalInfo: {
          fullName: data.personalInfo?.fullName || personalInfoFromText.fullName || "",
          email: data.personalInfo?.email || personalInfoFromText.email || "",
          phone: data.personalInfo?.phone || personalInfoFromText.phone || "",
          address: data.personalInfo?.address || "",
          summary: data.personalInfo?.summary || data.personalInfo?.bio || "",
        },
        experience: (data.experience || []).map(exp => ({
          position: exp.position || "",
          company: exp.company || "",
          duration: exp.duration || "",
          description: exp.description || "",
        })),
        education: (data.education || []).map(edu => ({
          degree: edu.degree || "",
          major: edu.major || "",
          school: edu.school || "",
        })),
        skills: {
          technical: uniqueSkills.filter(s => {
            const lower = s.toLowerCase();
            return !lower.includes('giao tiếp') && !lower.includes('làm việc nhóm') && 
                   !lower.includes('quản lý') && !lower.includes('communication') && 
                   !lower.includes('teamwork');
          }),
          soft: uniqueSkills.filter(s => {
            const lower = s.toLowerCase();
            return lower.includes('giao tiếp') || lower.includes('làm việc nhóm') || 
                   lower.includes('quản lý') || lower.includes('communication') || 
                   lower.includes('teamwork');
          }),
          languages: uniqueSkills.filter(s => {
            const lower = s.toLowerCase();
            return lower.includes('tiếng') || lower.includes('english') || 
                   lower.includes('vietnamese');
          }),
        },
      };
      setCvFormData(formData);
      
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
      // Ensure all required fields are arrays
      const data = response.data || response || {};
      const analysis = data.analysis || {};
      const skills = analysis.skills || {};
      
      // Extract all skills from nested structure
      const allSkills = [
        ...(data.extractedSkills || []),
        ...(skills.technical || []).map(s => typeof s === 'string' ? s : s.name || s),
        ...(skills.soft || []).map(s => typeof s === 'string' ? s : s.name || s),
        ...(skills.languages || []).map(s => typeof s === 'string' ? s : s.name || s),
      ].filter(Boolean);
      const uniqueSkills = [...new Set(allSkills)];
      
      setProgressValue(80);
      setProgressMessage("Đang xử lý dữ liệu...");
      
      setAnalysisResult({
        extractedSkills: uniqueSkills,
        experience: data.experience || [],
        education: data.education || [],
        suggestions: data.suggestions || [],
        extractedText: cvText,
      });
      // Set editable CV text
      setEditableCVText(cvText);
      
      // Build structured form data from analysis result
      const personalInfoFromText = data.extractedText ? parsePersonalInfo(data.extractedText) : {};
      const formData = {
        personalInfo: {
          fullName: data.personalInfo?.fullName || personalInfoFromText.fullName || "",
          email: data.personalInfo?.email || personalInfoFromText.email || "",
          phone: data.personalInfo?.phone || personalInfoFromText.phone || "",
          address: data.personalInfo?.address || "",
          summary: data.personalInfo?.summary || data.personalInfo?.bio || "",
        },
        experience: (data.experience || []).map(exp => ({
          position: exp.position || "",
          company: exp.company || "",
          duration: exp.duration || "",
          description: exp.description || "",
        })),
        education: (data.education || []).map(edu => ({
          degree: edu.degree || "",
          major: edu.major || "",
          school: edu.school || "",
        })),
        skills: {
          technical: uniqueSkills.filter(s => {
            const lower = s.toLowerCase();
            return !lower.includes('giao tiếp') && !lower.includes('làm việc nhóm') && 
                   !lower.includes('quản lý') && !lower.includes('communication') && 
                   !lower.includes('teamwork');
          }),
          soft: uniqueSkills.filter(s => {
            const lower = s.toLowerCase();
            return lower.includes('giao tiếp') || lower.includes('làm việc nhóm') || 
                   lower.includes('quản lý') || lower.includes('communication') || 
                   lower.includes('teamwork');
          }),
          languages: uniqueSkills.filter(s => {
            const lower = s.toLowerCase();
            return lower.includes('tiếng') || lower.includes('english') || 
                   lower.includes('vietnamese');
          }),
        },
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

  const handleAnalyzeImprovements = async () => {
    if (!editableCVText.trim()) {
      toast({
        title: "CV trống",
        description: "Vui lòng có nội dung CV để phân tích cải thiện",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzingImprovements(true);
    setShowProgressModal(true);
    setProgressValue(0);
    setProgressMessage("Đang phân tích cải thiện CV...");
    
    try {
      await updateProgress(20, "Đang đánh giá cấu trúc CV...", 300);
      
      // Build CV data from form
      const cvDataForAnalysis = {
        personalInfo: cvFormData.personalInfo,
        skills: {
          technical: cvFormData.skills.technical.map(s => ({ name: s })),
          soft: cvFormData.skills.soft.map(s => ({ name: s })),
          languages: cvFormData.skills.languages.map(s => ({ name: s })),
        },
        experience: cvFormData.experience,
        education: cvFormData.education,
      };

      await updateProgress(40, "Đang phân tích nội dung...", 300);
      
      const response = await aiService.analyzeCVImprovements({
        cvText: editableCVText,
        cvData: cvDataForAnalysis,
      });

      await updateProgress(60, "Đang tạo gợi ý cải thiện...", 300);

      if (response.success && response.data) {
        setImprovements(response.data);
        
        await updateProgress(80, "Đang xử lý gợi ý...", 200);
        
        // Generate highlight ranges from improvements
        const ranges: Array<{
          start: number;
          end: number;
          severity: "high" | "medium" | "low";
          suggestion: string;
        }> = [];
        
        response.data.specificImprovements.forEach((imp: any) => {
          if (imp.position && imp.position.startIndex !== undefined) {
            ranges.push({
              start: imp.position.startIndex,
              end: imp.position.endIndex || imp.position.startIndex + (imp.text?.length || 0),
              severity: imp.severity || 'medium',
              suggestion: imp.suggestion || ''
            });
          }
        });
        
        setHighlightedRanges(ranges);
        
        await updateProgress(100, "Hoàn thành!", 500);
        
        setTimeout(() => {
          setShowProgressModal(false);
          setProgressValue(0);
        }, 500);
        
        toast({
          title: "Phân tích cải thiện thành công",
          description: `CV của bạn đạt ${response.data.overallScore}/100 điểm. Xem các gợi ý cải thiện bên dưới.`,
        });
      }
    } catch (error) {
      console.error("CV Improvements Analysis Error:", error);
      setShowProgressModal(false);
      toast({
        title: "Phân tích thất bại",
        description: "Không thể phân tích cải thiện CV. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzingImprovements(false);
    }
  };

  // Helper function to get suggestion for a specific field
  const getFieldSuggestion = (fieldPath: string) => {
    if (!improvements || !improvements.specificImprovements) return null;
    
    // Map field path to section
    const fieldMap: Record<string, string> = {
      'personalInfo.fullName': 'THÔNG TIN CÁ NHÂN',
      'personalInfo.email': 'THÔNG TIN CÁ NHÂN',
      'personalInfo.phone': 'THÔNG TIN CÁ NHÂN',
      'personalInfo.summary': 'TÓM TẮT',
      'skills.technical': 'KỸ NĂNG',
      'skills.soft': 'KỸ NĂNG',
    };
    
    const section = fieldMap[fieldPath] || fieldPath.split('.')[0].toUpperCase();
    
    // Find matching improvement
    const improvement = improvements.specificImprovements.find((imp: any) => {
      if (fieldPath.startsWith('experience.')) {
        const parts = fieldPath.split('.');
        const expIndex = parseInt(parts[1]);
        const field = parts[2];
        if (field === 'description' && imp.section === 'KINH NGHIỆM') {
          // Match by experience index
          return cvFormData.experience[expIndex]?.position === imp.item || 
                 cvFormData.experience[expIndex]?.company === imp.item;
        }
        return imp.section === 'KINH NGHIỆM' && 
               cvFormData.experience[expIndex]?.position === imp.item;
      }
      if (fieldPath.startsWith('education.')) {
        const parts = fieldPath.split('.');
        const eduIndex = parseInt(parts[1]);
        return imp.section === 'HỌC VẤN' && 
               (cvFormData.education[eduIndex]?.school === imp.item ||
                cvFormData.education[eduIndex]?.major === imp.item);
      }
      return imp.section === section;
    });
    
    return improvement ? {
      issue: improvement.issue,
      suggestion: improvement.suggestion,
      severity: improvement.severity
    } : null;
  };

  // Helper function to render text with highlights
  const renderTextWithHighlights = (text: string) => {
    if (highlightedRanges.length === 0) {
      return text;
    }

    // Sort ranges by start index
    const sortedRanges = [...highlightedRanges].sort((a, b) => a.start - b.start);
    
    const parts: Array<{ text: string; highlight: boolean; severity?: string; suggestion?: string }> = [];
    let lastIndex = 0;

    sortedRanges.forEach((range, idx) => {
      // Add text before highlight
      if (range.start > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, range.start),
          highlight: false
        });
      }

      // Add highlighted text
      parts.push({
        text: text.substring(range.start, range.end),
        highlight: true,
        severity: range.severity,
        suggestion: range.suggestion
      });

      lastIndex = range.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        text: text.substring(lastIndex),
        highlight: false
      });
    }

    return parts.map((part, idx) => {
      if (part.highlight) {
        const bgColor = part.severity === 'high' ? 'bg-red-200' : 
                       part.severity === 'medium' ? 'bg-yellow-200' : 
                       'bg-blue-200';
        return (
          <span
            key={idx}
            className={`${bgColor} border-b-2 border-dashed ${
              part.severity === 'high' ? 'border-red-500' :
              part.severity === 'medium' ? 'border-yellow-500' :
              'border-blue-500'
            } cursor-help`}
            title={part.suggestion}
          >
            {part.text}
          </span>
        );
      }
      return <span key={idx}>{part.text}</span>;
    });
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
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
          <div className="container mx-auto px-4 py-16 max-w-6xl">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered CV Analysis</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                Phân tích CV thông minh
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Tải lên CV hoặc dán nội dung để nhận phân tích và gợi ý từ AI
                giúp bạn tối ưu hóa hồ sơ của mình
              </p>
              <div className="flex items-center justify-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span>Phân tích nhanh chóng</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Gợi ý cải thiện</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span>Hoàn toàn miễn phí</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-600/5 border-b">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    Tải lên CV của bạn
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs defaultValue="file" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                      <TabsTrigger value="file" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        <Upload className="w-4 h-4 mr-2" />
                        Tải file
                      </TabsTrigger>
                      <TabsTrigger value="text" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        <FileText className="w-4 h-4 mr-2" />
                        Dán nội dung
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-4 mt-6">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`
                          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300
                          ${
                            isDragging
                              ? "border-primary bg-primary/5 scale-[1.02]"
                              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
                          }
                        `}
                      >
                        <input
                          id="cv-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <div className="space-y-4">
                          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Upload
                              className={`w-8 h-8 text-primary transition-transform duration-300 ${
                                isDragging ? "scale-110" : ""
                              }`}
                            />
                          </div>
                          <div className="space-y-2">
                            <label
                              htmlFor="cv-upload"
                              className="cursor-pointer inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-lg transition-colors"
                            >
                              <span>Nhấn để tải lên</span>
                              <span className="text-muted-foreground font-normal">
                                hoặc kéo thả file vào đây
                              </span>
                            </label>
                            <p className="text-sm text-muted-foreground">
                              PDF, DOC, hoặc DOCX (Tối đa 5MB)
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedFile && (
                        <Alert className="border-green-200 bg-green-50/50">
                          <FileCheck className="h-4 w-4 text-green-600" />
                          <AlertDescription className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-900">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-green-700">
                                  {formatFileSize(selectedFile.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedFile(null)}
                              className="text-green-700 hover:text-green-900"
                            >
                              <X className="w-4 h-4" />
                            </Button>
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
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Đang phân tích...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Phân tích CV
                          </>
                        )}
                      </Button>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4 mt-6">
                      <div className="relative">
                        <Textarea
                          placeholder="Dán nội dung CV của bạn vào đây...&#10;&#10;Ví dụ:&#10;Họ và tên: Nguyễn Văn A&#10;Email: example@email.com&#10;Kinh nghiệm: ..."
                          value={cvText}
                          onChange={(e) => {
                            setCvText(e.target.value);
                            setEditableCVText(e.target.value); // Sync với editor
                          }}
                          rows={14}
                          className="resize-none text-base leading-relaxed border-2 focus:border-primary transition-colors"
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                          {cvText.length} ký tự
                        </div>
                      </div>

                      <Button
                        onClick={handleAnalyzeText}
                        disabled={!cvText.trim() || isAnalyzing}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Đang phân tích...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Phân tích nội dung
                          </>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {!analysisResult && (
                <Card className="border-2 shadow-lg">
                  <CardContent className="pt-12 pb-12">
                    <div className="text-center space-y-4">
                      <div className="mx-auto w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-muted-foreground">
                          Chưa có kết quả phân tích
                        </p>
                        <p className="text-sm text-muted-foreground/80">
                          Tải lên hoặc dán CV của bạn để xem kết quả phân tích
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysisResult && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Skills */}
                {analysisResult.extractedSkills && analysisResult.extractedSkills.length > 0 && (
                  <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        Kỹ năng được phát hiện
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex flex-wrap gap-2">
                        {(analysisResult.extractedSkills || []).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-3 py-1.5 text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                  {/* Experience */}
                  {analysisResult.experience && analysisResult.experience.length > 0 && (
                    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                          </div>
                          Kinh nghiệm làm việc
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        {(analysisResult.experience || []).map((exp, index) => (
                          <div
                            key={index}
                            className="relative pl-6 border-l-2 border-blue-200 before:absolute before:left-[-6px] before:top-0 before:w-3 before:h-3 before:rounded-full before:bg-blue-500"
                          >
                            <h4 className="font-semibold text-lg mb-1">
                              {exp.position}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <Briefcase className="w-4 h-4" />
                              {exp.company}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {exp.duration}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  )}

                  {/* Education */}
                  {analysisResult.education && analysisResult.education.length > 0 && (
                    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-purple-600" />
                          </div>
                          Học vấn
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {(analysisResult.education || []).map((edu, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg bg-purple-50/50 border border-purple-100 hover:bg-purple-50 transition-colors"
                          >
                            <h4 className="font-semibold text-base mb-1">
                              {edu.degree}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                              <GraduationCap className="w-4 h-4" />
                              {edu.major}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {edu.school}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  )}

                  {/* Suggestions */}
                  {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                    <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b">
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-yellow-600" />
                          </div>
                          Gợi ý từ AI
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <ul className="space-y-3">
                        {(analysisResult.suggestions || []).map((suggestion, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50/50 hover:bg-yellow-50 transition-colors"
                          >
                            <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <span className="text-sm leading-relaxed">
                              {suggestion}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  )}

                  {/* Structured CV Editor Form - Always visible */}
                  {analysisResult && (
                    <Card className="border-2 shadow-lg">
                      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <Edit3 className="w-5 h-5 text-indigo-600" />
                            </div>
                            Chỉnh sửa CV với AI
                          </CardTitle>
                          <Button
                            onClick={handleAnalyzeImprovements}
                            disabled={isAnalyzingImprovements}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          >
                            {isAnalyzingImprovements ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Đang phân tích...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Phân tích cải thiện
                              </>
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="space-y-8">
                          {/* Personal Info Section */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b">
                              <FileText className="w-5 h-5 text-indigo-600" />
                              Thông tin cá nhân
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="fullName">Họ và tên</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="relative">
                                      <Input
                                        id="fullName"
                                        value={cvFormData.personalInfo.fullName}
                                        onChange={(e) => setCvFormData({
                                          ...cvFormData,
                                          personalInfo: { ...cvFormData.personalInfo, fullName: e.target.value }
                                        })}
                                        className={getFieldSuggestion('personalInfo.fullName') ? 'border-yellow-400 bg-yellow-50/50 pr-8' : ''}
                                      />
                                      {getFieldSuggestion('personalInfo.fullName') && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                          <AlertCircle className="w-4 h-4 text-yellow-600 animate-pulse" />
                                        </div>
                                      )}
                                    </div>
                                  </PopoverTrigger>
                                  {getFieldSuggestion('personalInfo.fullName') && (
                                    <PopoverContent side="right" className="w-80">
                                      <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                          <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                            getFieldSuggestion('personalInfo.fullName')?.severity === 'high' 
                                              ? 'text-red-600' 
                                              : 'text-yellow-600'
                                          }`} />
                                          <div className="flex-1">
                                            <p className="font-semibold text-sm mb-1">Vấn đề:</p>
                                            <p className="text-xs text-muted-foreground mb-2">
                                              {getFieldSuggestion('personalInfo.fullName')?.issue}
                                            </p>
                                            <p className="font-semibold text-sm mb-1">Gợi ý:</p>
                                            <p className="text-xs text-muted-foreground">
                                              {getFieldSuggestion('personalInfo.fullName')?.suggestion}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  )}
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="relative">
                                      <Input
                                        id="email"
                                        type="email"
                                        value={cvFormData.personalInfo.email}
                                        onChange={(e) => setCvFormData({
                                          ...cvFormData,
                                          personalInfo: { ...cvFormData.personalInfo, email: e.target.value }
                                        })}
                                        className={getFieldSuggestion('personalInfo.email') ? 'border-yellow-400 bg-yellow-50/50 pr-8' : ''}
                                      />
                                      {getFieldSuggestion('personalInfo.email') && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                          <AlertCircle className="w-4 h-4 text-yellow-600 animate-pulse" />
                                        </div>
                                      )}
                                    </div>
                                  </PopoverTrigger>
                                  {getFieldSuggestion('personalInfo.email') && (
                                    <PopoverContent side="right" className="w-80">
                                      <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                          <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                            getFieldSuggestion('personalInfo.email')?.severity === 'high' 
                                              ? 'text-red-600' 
                                              : 'text-yellow-600'
                                          }`} />
                                          <div className="flex-1">
                                            <p className="font-semibold text-sm mb-1">Vấn đề:</p>
                                            <p className="text-xs text-muted-foreground mb-2">
                                              {getFieldSuggestion('personalInfo.email')?.issue}
                                            </p>
                                            <p className="font-semibold text-sm mb-1">Gợi ý:</p>
                                            <p className="text-xs text-muted-foreground">
                                              {getFieldSuggestion('personalInfo.email')?.suggestion}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  )}
                                </Popover>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="phone">Số điện thoại</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="relative">
                                      <Input
                                        id="phone"
                                        value={cvFormData.personalInfo.phone}
                                        onChange={(e) => setCvFormData({
                                          ...cvFormData,
                                          personalInfo: { ...cvFormData.personalInfo, phone: e.target.value }
                                        })}
                                        className={getFieldSuggestion('personalInfo.phone') ? 'border-yellow-400 bg-yellow-50/50 pr-8' : ''}
                                      />
                                      {getFieldSuggestion('personalInfo.phone') && (
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                          <AlertCircle className="w-4 h-4 text-yellow-600 animate-pulse" />
                                        </div>
                                      )}
                                    </div>
                                  </PopoverTrigger>
                                  {getFieldSuggestion('personalInfo.phone') && (
                                    <PopoverContent side="right" className="w-80">
                                      <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                          <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                            getFieldSuggestion('personalInfo.phone')?.severity === 'high' 
                                              ? 'text-red-600' 
                                              : 'text-yellow-600'
                                          }`} />
                                          <div className="flex-1">
                                            <p className="font-semibold text-sm mb-1">Vấn đề:</p>
                                            <p className="text-xs text-muted-foreground mb-2">
                                              {getFieldSuggestion('personalInfo.phone')?.issue}
                                            </p>
                                            <p className="font-semibold text-sm mb-1">Gợi ý:</p>
                                            <p className="text-xs text-muted-foreground">
                                              {getFieldSuggestion('personalInfo.phone')?.suggestion}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  )}
                                </Popover>
                              </div>
                              <div className="space-y-2">
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
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="summary">Tóm tắt / Mục tiêu nghề nghiệp</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <div className="relative">
                                    <Textarea
                                      id="summary"
                                      value={cvFormData.personalInfo.summary}
                                      onChange={(e) => setCvFormData({
                                        ...cvFormData,
                                        personalInfo: { ...cvFormData.personalInfo, summary: e.target.value }
                                      })}
                                      rows={3}
                                      className={getFieldSuggestion('personalInfo.summary') ? 'border-yellow-400 bg-yellow-50/50 pr-8' : ''}
                                      placeholder="Viết 2-3 câu tóm tắt về bản thân và mục tiêu nghề nghiệp..."
                                    />
                                    {getFieldSuggestion('personalInfo.summary') && (
                                      <div className="absolute right-2 top-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-600 animate-pulse" />
                                      </div>
                                    )}
                                  </div>
                                </PopoverTrigger>
                                {getFieldSuggestion('personalInfo.summary') && (
                                  <PopoverContent side="right" className="w-80">
                                    <div className="space-y-2">
                                      <div className="flex items-start gap-2">
                                        <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                          getFieldSuggestion('personalInfo.summary')?.severity === 'high' 
                                            ? 'text-red-600' 
                                            : 'text-yellow-600'
                                        }`} />
                                        <div className="flex-1">
                                          <p className="font-semibold text-sm mb-1">Vấn đề:</p>
                                          <p className="text-xs text-muted-foreground mb-2">
                                            {getFieldSuggestion('personalInfo.summary')?.issue}
                                          </p>
                                          <p className="font-semibold text-sm mb-1">Gợi ý:</p>
                                          <p className="text-xs text-muted-foreground">
                                            {getFieldSuggestion('personalInfo.summary')?.suggestion}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </PopoverContent>
                                )}
                              </Popover>
                            </div>
                          </div>

                          {/* Experience Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                Kinh nghiệm làm việc
                              </h3>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCvFormData({
                                  ...cvFormData,
                                  experience: [...cvFormData.experience, { position: '', company: '', duration: '', description: '' }]
                                })}
                              >
                                + Thêm kinh nghiệm
                              </Button>
                            </div>
                            <div className="space-y-6">
                              {cvFormData.experience.map((exp, index) => (
                                <Card key={index} className="border-2">
                                  <CardContent className="pt-6">
                                    <div className="space-y-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label>Vị trí / Chức danh</Label>
                                          <Input
                                            value={exp.position}
                                            onChange={(e) => {
                                              const newExp = [...cvFormData.experience];
                                              newExp[index].position = e.target.value;
                                              setCvFormData({ ...cvFormData, experience: newExp });
                                            }}
                                            className={getFieldSuggestion(`experience.${index}.position`) ? 'border-yellow-400 bg-yellow-50/50' : ''}
                                          />
                                          {getFieldSuggestion(`experience.${index}.position`) && (
                                            <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                                              <Lightbulb className="w-3 h-3 inline mr-1" />
                                              {getFieldSuggestion(`experience.${index}.position`)?.suggestion}
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Công ty</Label>
                                          <Input
                                            value={exp.company}
                                            onChange={(e) => {
                                              const newExp = [...cvFormData.experience];
                                              newExp[index].company = e.target.value;
                                              setCvFormData({ ...cvFormData, experience: newExp });
                                            }}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Thời gian</Label>
                                          <Input
                                            value={exp.duration}
                                            onChange={(e) => {
                                              const newExp = [...cvFormData.experience];
                                              newExp[index].duration = e.target.value;
                                              setCvFormData({ ...cvFormData, experience: newExp });
                                            }}
                                            placeholder="VD: 01/2023 - 12/2024"
                                          />
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Mô tả công việc</Label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <div className="relative">
                                              <Textarea
                                                value={exp.description}
                                                onChange={(e) => {
                                                  const newExp = [...cvFormData.experience];
                                                  newExp[index].description = e.target.value;
                                                  setCvFormData({ ...cvFormData, experience: newExp });
                                                }}
                                                rows={4}
                                                className={getFieldSuggestion(`experience.${index}.description`) ? 'border-yellow-400 bg-yellow-50/50 pr-8' : ''}
                                                placeholder="Mô tả trách nhiệm, thành tích với số liệu cụ thể..."
                                              />
                                              {getFieldSuggestion(`experience.${index}.description`) && (
                                                <div className="absolute right-2 top-2">
                                                  <AlertCircle className={`w-4 h-4 animate-pulse ${
                                                    getFieldSuggestion(`experience.${index}.description`)?.severity === 'high' 
                                                      ? 'text-red-600' 
                                                      : 'text-yellow-600'
                                                  }`} />
                                                </div>
                                              )}
                                            </div>
                                          </PopoverTrigger>
                                          {getFieldSuggestion(`experience.${index}.description`) && (
                                            <PopoverContent side="right" className="w-80">
                                              <div className="space-y-2">
                                                <div className="flex items-start gap-2">
                                                  <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                                    getFieldSuggestion(`experience.${index}.description`)?.severity === 'high' 
                                                      ? 'text-red-600' 
                                                      : 'text-yellow-600'
                                                  }`} />
                                                  <div className="flex-1">
                                                    <p className="font-semibold text-sm mb-1">Vấn đề:</p>
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                      {getFieldSuggestion(`experience.${index}.description`)?.issue}
                                                    </p>
                                                    <p className="font-semibold text-sm mb-1">Gợi ý:</p>
                                                    <p className="text-xs text-muted-foreground">
                                                      {getFieldSuggestion(`experience.${index}.description`)?.suggestion}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </PopoverContent>
                                          )}
                                        </Popover>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newExp = cvFormData.experience.filter((_, i) => i !== index);
                                          setCvFormData({ ...cvFormData, experience: newExp });
                                        }}
                                        className="text-red-600 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4 mr-1" />
                                        Xóa
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                              {cvFormData.experience.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Briefcase className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                  <p>Chưa có kinh nghiệm. Nhấn "Thêm kinh nghiệm" để thêm.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Education Section */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b">
                              <h3 className="text-lg font-semibold flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-purple-600" />
                                Học vấn
                              </h3>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCvFormData({
                                  ...cvFormData,
                                  education: [...cvFormData.education, { degree: '', major: '', school: '' }]
                                })}
                              >
                                + Thêm học vấn
                              </Button>
                            </div>
                            <div className="space-y-4">
                              {cvFormData.education.map((edu, index) => (
                                <Card key={index} className="border-2">
                                  <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="space-y-2">
                                        <Label>Bằng cấp</Label>
                                        <Input
                                          value={edu.degree}
                                          onChange={(e) => {
                                            const newEdu = [...cvFormData.education];
                                            newEdu[index].degree = e.target.value;
                                            setCvFormData({ ...cvFormData, education: newEdu });
                                          }}
                                          className={getFieldSuggestion(`education.${index}.degree`) ? 'border-yellow-400 bg-yellow-50/50' : ''}
                                        />
                                        {getFieldSuggestion(`education.${index}.degree`) && (
                                          <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                                            <Lightbulb className="w-3 h-3 inline mr-1" />
                                            {getFieldSuggestion(`education.${index}.degree`)?.suggestion}
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Ngành học</Label>
                                        <Input
                                          value={edu.major}
                                          onChange={(e) => {
                                            const newEdu = [...cvFormData.education];
                                            newEdu[index].major = e.target.value;
                                            setCvFormData({ ...cvFormData, education: newEdu });
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Trường</Label>
                                        <Input
                                          value={edu.school}
                                          onChange={(e) => {
                                            const newEdu = [...cvFormData.education];
                                            newEdu[index].school = e.target.value;
                                            setCvFormData({ ...cvFormData, education: newEdu });
                                          }}
                                        />
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newEdu = cvFormData.education.filter((_, i) => i !== index);
                                        setCvFormData({ ...cvFormData, education: newEdu });
                                      }}
                                      className="mt-4 text-red-600 hover:text-red-700"
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Xóa
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                              {cvFormData.education.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                  <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                  <p>Chưa có thông tin học vấn. Nhấn "Thêm học vấn" để thêm.</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Skills Section */}
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 pb-2 border-b">
                              <Zap className="w-5 h-5 text-green-600" />
                              Kỹ năng
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <Label>Kỹ năng kỹ thuật</Label>
                                <div className="flex flex-wrap gap-2 min-h-[100px] p-3 border rounded-md">
                                  {cvFormData.skills.technical.map((skill, idx) => (
                                    <Badge key={idx} variant="secondary" className="px-3 py-1">
                                      {skill}
                                      <button
                                        onClick={() => {
                                          const newSkills = cvFormData.skills.technical.filter((_, i) => i !== idx);
                                          setCvFormData({
                                            ...cvFormData,
                                            skills: { ...cvFormData.skills, technical: newSkills }
                                          });
                                        }}
                                        className="ml-2 hover:text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  <Input
                                    placeholder="Nhập kỹ năng và nhấn Enter"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        setCvFormData({
                                          ...cvFormData,
                                          skills: {
                                            ...cvFormData.skills,
                                            technical: [...cvFormData.skills.technical, e.currentTarget.value.trim()]
                                          }
                                        });
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                    className="border-dashed"
                                  />
                                </div>
                                {getFieldSuggestion('skills.technical') && (
                                  <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                                    <Lightbulb className="w-3 h-3 inline mr-1" />
                                    {getFieldSuggestion('skills.technical')?.suggestion}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label>Kỹ năng mềm</Label>
                                <div className="flex flex-wrap gap-2 min-h-[100px] p-3 border rounded-md">
                                  {cvFormData.skills.soft.map((skill, idx) => (
                                    <Badge key={idx} variant="secondary" className="px-3 py-1">
                                      {skill}
                                      <button
                                        onClick={() => {
                                          const newSkills = cvFormData.skills.soft.filter((_, i) => i !== idx);
                                          setCvFormData({
                                            ...cvFormData,
                                            skills: { ...cvFormData.skills, soft: newSkills }
                                          });
                                        }}
                                        className="ml-2 hover:text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  <Input
                                    placeholder="Nhập kỹ năng và nhấn Enter"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        setCvFormData({
                                          ...cvFormData,
                                          skills: {
                                            ...cvFormData.skills,
                                            soft: [...cvFormData.skills.soft, e.currentTarget.value.trim()]
                                          }
                                        });
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                    className="border-dashed"
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Ngôn ngữ</Label>
                                <div className="flex flex-wrap gap-2 min-h-[100px] p-3 border rounded-md">
                                  {cvFormData.skills.languages.map((skill, idx) => (
                                    <Badge key={idx} variant="secondary" className="px-3 py-1">
                                      {skill}
                                      <button
                                        onClick={() => {
                                          const newSkills = cvFormData.skills.languages.filter((_, i) => i !== idx);
                                          setCvFormData({
                                            ...cvFormData,
                                            skills: { ...cvFormData.skills, languages: newSkills }
                                          });
                                        }}
                                        className="ml-2 hover:text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  <Input
                                    placeholder="Nhập ngôn ngữ và nhấn Enter"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                        setCvFormData({
                                          ...cvFormData,
                                          skills: {
                                            ...cvFormData.skills,
                                            languages: [...cvFormData.skills.languages, e.currentTarget.value.trim()]
                                          }
                                        });
                                        e.currentTarget.value = '';
                                      }
                                    }}
                                    className="border-dashed"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {improvements && (
                            <div className="space-y-4 pt-4 border-t">
                              {/* Overall Score */}
                              <div className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                                <div className="flex-shrink-0">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                                    {improvements.overallScore}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-lg">Điểm tổng thể</h4>
                                  <p className="text-sm text-muted-foreground">CV của bạn đạt {improvements.overallScore}/100 điểm</p>
                                </div>
                              </div>

                              {/* Specific Improvements */}
                              {improvements.specificImprovements.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-base flex items-center gap-2">
                                    <Target className="w-4 h-4 text-orange-600" />
                                    Gợi ý cải thiện cụ thể ({improvements.specificImprovements.length})
                                  </h4>
                                  {improvements.specificImprovements.map((imp, idx) => {
                                    const hasPosition = imp.position && imp.position.lineNumber;
                                    return (
                                      <div
                                        key={idx}
                                        className={`p-4 rounded-lg border-l-4 ${
                                          imp.severity === 'high'
                                            ? 'bg-red-50 border-red-500'
                                            : imp.severity === 'medium'
                                            ? 'bg-yellow-50 border-yellow-500'
                                            : 'bg-blue-50 border-blue-500'
                                        }`}
                                      >
                                        <div className="flex items-start gap-3">
                                          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                                            imp.severity === 'high'
                                              ? 'text-red-600'
                                              : imp.severity === 'medium'
                                              ? 'text-yellow-600'
                                              : 'text-blue-600'
                                          }`} />
                                          <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                              {imp.section && (
                                                <span className="text-xs font-medium text-muted-foreground uppercase bg-white/50 px-2 py-1 rounded">
                                                  {imp.section}
                                                </span>
                                              )}
                                              {hasPosition && (
                                                <span className="text-xs text-muted-foreground">
                                                  Dòng {imp.position.lineNumber}
                                                </span>
                                              )}
                                            </div>
                                            {imp.text && imp.text !== 'Chưa có' && (
                                              <div className="p-2 bg-white/70 rounded border border-gray-200">
                                                <p className="text-xs text-muted-foreground mb-1">Phần cần cải thiện:</p>
                                                <p className="text-sm font-medium font-mono">
                                                  "{imp.text}"
                                                </p>
                                              </div>
                                            )}
                                            <p className="text-sm text-muted-foreground">
                                              <span className="font-medium">Vấn đề: </span>
                                              {imp.issue}
                                            </p>
                                            <p className="text-sm">
                                              <span className="font-medium text-green-700">💡 Gợi ý: </span>
                                              <span className="text-green-800">{imp.suggestion}</span>
                                            </p>
                                            {hasPosition && imp.position.lineContent && (
                                              <button
                                                onClick={() => {
                                                  // Scroll to line in editor
                                                  const textarea = document.querySelector('textarea');
                                                  if (textarea) {
                                                    const lines = editableCVText.split('\n');
                                                    const lineIndex = imp.position.lineNumber - 1;
                                                    const textBeforeLine = lines.slice(0, lineIndex).join('\n');
                                                    const position = textBeforeLine.length + (lineIndex > 0 ? 1 : 0);
                                                    textarea.focus();
                                                    textarea.setSelectionRange(position, position);
                                                    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                  }
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                                              >
                                                📍 Xem vị trí trong CV
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Suggestions by Category */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {improvements.suggestions.structure.length > 0 && (
                                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                      <FileText className="w-4 h-4" />
                                      Cấu trúc
                                    </h5>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                      {improvements.suggestions.structure.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-purple-600 mt-1">•</span>
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {improvements.suggestions.writing.length > 0 && (
                                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                      <Edit3 className="w-4 h-4" />
                                      Văn phong
                                    </h5>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                      {improvements.suggestions.writing.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-blue-600 mt-1">•</span>
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {improvements.suggestions.content.length > 0 && (
                                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                      <MessageSquare className="w-4 h-4" />
                                      Nội dung
                                    </h5>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                      {improvements.suggestions.content.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-green-600 mt-1">•</span>
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {improvements.suggestions.keywords.length > 0 && (
                                  <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                                    <h5 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                      <Zap className="w-4 h-4" />
                                      Từ khóa
                                    </h5>
                                    <ul className="space-y-1 text-sm text-muted-foreground">
                                      {improvements.suggestions.keywords.map((s, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-orange-600 mt-1">•</span>
                                          <span>{s}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <Button
                      onClick={() => router.push("/job-recommendations")}
                      className="h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Đề xuất việc làm
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
