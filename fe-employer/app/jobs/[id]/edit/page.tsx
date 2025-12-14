"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CreateJobPayload, updateJob, type JobResponse } from "@/lib/jobAPI";
import { industryService, Industry } from "@/lib/industryAPI";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Plus,
  ArrowLeft,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  Code,
  Building2,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { getCities, getDistricts, getWards } from "@/lib/vietnamAddress";
import { findOptionByLabelLoose } from "@/lib/addressUtils";
import { getJobById } from "@/lib/jobAPI";
import { getToken } from "@/lib/userStorage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EmployerShell from "@/components/layout/EmployerShell";

const JOB_LEVELS = [
  { value: "Intern", label: "Thực tập sinh" },
  { value: "Fresher", label: "Fresher" },
  { value: "Junior", label: "Junior" },
  { value: "Senior", label: "Senior" },
  { value: "Manager", label: "Manager" },
  { value: "Director", label: "Director" },
];

const JOB_TYPES = [
  { value: "Fulltime", label: "Toàn thời gian" },
  { value: "Parttime", label: "Bán thời gian" },
  { value: "Intern", label: "Thực tập" },
  { value: "Freelance", label: "Freelance" },
  { value: "Remote", label: "Làm việc từ xa" },
  { value: "Hybrid", label: "Kết hợp" },
];

const WORKING_MODES = [
  { value: "Onsite", label: "Tại văn phòng" },
  { value: "Remote", label: "Làm việc từ xa" },
  { value: "Hybrid", label: "Kết hợp" },
];

const CURRENCIES = [
  { value: "VND", label: "VND (Việt Nam Đồng)" },
  { value: "USD", label: "USD (Đô la Mỹ)" },
];

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [moderationResult, setModerationResult] = useState<{
    type: "approved" | "rejected" | "review";
    message: string;
    reviewReasons?: Array<{
      type: string;
      message: string;
      severity: string;
    }>;
    reasons?: string[];
    flags?: string[];
  } | null>(null);
  const [redirectAfterModal, setRedirectAfterModal] = useState(false);

  const [formData, setFormData] = useState<CreateJobPayload>({
    title: "",
    slug: "",
    description: "",
    requirements: "",
    benefits: "",
    skills: [],
    skillIds: [],
    level: "",
    jobType: "",
    workingMode: "",
    location: "",
    address: "",
    salaryMin: undefined,
    salaryMax: undefined,
    currency: "VND",
    industryCode: "",
    subIndustryCode: "",
    positions: 1,
    deadline: "",
  });

  const [newSkill, setNewSkill] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [subIndustries, setSubIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Address states
  const [cities, setCities] = useState<{ value: string; label: string }[]>([]);
  const [districts, setDistricts] = useState<
    { value: string; label: string }[]
  >([]);
  const [wards, setWards] = useState<{ value: string; label: string }[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Load job data on mount
  useEffect(() => {
    const loadJobData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) {
          setError("Vui lòng đăng nhập");
          return;
        }

        const result = await getJobById(jobId, token);
        if (!result.success || !result.data) {
          setError(result.error || "Không tìm thấy bài tuyển dụng");
          return;
        }

        const job = result.data;

        // Map address object to location string and address field
        let locationString = "";
        let addressString = "";

        if (job.address) {
          // Use fullAddress if available, otherwise construct from parts
          if (job.address.fullAddress) {
            locationString = job.address.fullAddress;
          } else if (
            job.address.ward &&
            job.address.district &&
            job.address.city
          ) {
            locationString = `${job.address.ward}, ${job.address.district}, ${job.address.city}`;
          }
          addressString = job.address.street || "";
        } else if (job.location) {
          // Fallback to location field if address object doesn't exist
          locationString = job.location;
        }

        // Map skills - use skills array (string[]) or extract from skillIds
        const skillsArray =
          job.skills ||
          (job.skillIds ? job.skillIds.map((s: any) => s.name || s) : []);

        const formDataPayload: CreateJobPayload = {
          title: job.title || "",
          slug: job.slug || "",
          description: job.description || "",
          requirements: job.requirements || "",
          benefits: job.benefits || "",
          skills: skillsArray,
          skillIds: job.skillIds
            ? job.skillIds.map((s: any) => s._id || s.id || s)
            : [],
          level: job.level || "",
          jobType: job.jobType || "",
          workingMode: job.workingMode || "",
          location: locationString,
          address: addressString,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          currency: job.currency || "VND",
          industryCode: job.industryCode || "",
          subIndustryCode: job.subIndustryCode || "",
          positions: job.positions || 1,
          deadline: job.deadline
            ? new Date(job.deadline).toISOString().slice(0, 10)
            : "",
        };

        // Load cities first
        const citiesData = await getCities();
        setCities(citiesData);

        // Set form data
        setFormData(formDataPayload);

        // Parse location string to set address dropdowns
        if (locationString) {
          await parseAndSetLocation(locationString, citiesData);
        }
      } catch (err) {
        setError("Không thể tải dữ liệu bài tuyển dụng");
        console.error("Failed to load job:", err);
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJobData();
    }
  }, [jobId]);

  // Parse location string and set address dropdowns
  const parseAndSetLocation = async (
    locationString: string,
    citiesData: { value: string; label: string }[]
  ) => {
    try {
      // Location format: "Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
      const parts = locationString.split(",").map((p) => p.trim());

      if (parts.length >= 3) {
        const wardName = parts[0];
        const districtName = parts[1];
        const cityName = parts[2];

        // Find and set city
        const cityOption = findOptionByLabelLoose(citiesData, cityName);
        if (cityOption) {
          setSelectedCity(cityOption.value);

          // Load districts for selected city
          const districtsData = await getDistricts(cityOption.value);
          setDistricts(districtsData);

          // Find and set district
          const districtOption = findOptionByLabelLoose(
            districtsData,
            districtName
          );
          if (districtOption) {
            setSelectedDistrict(districtOption.value);

            // Load wards for selected district
            const wardsData = await getWards(districtOption.value);
            setWards(wardsData);

            // Find and set ward
            const wardOption = findOptionByLabelLoose(wardsData, wardName);
            if (wardOption) {
              setSelectedWard(wardOption.value);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to parse location:", err);
    }
  };

  // Load root industries on mount
  useEffect(() => {
    const loadIndustries = async () => {
      setLoadingIndustries(true);
      try {
        const data = await industryService.getRootIndustries();
        setIndustries(data);
      } catch (err) {
        console.error("Failed to load industries:", err);
      } finally {
        setLoadingIndustries(false);
      }
    };
    loadIndustries();
  }, []);

  // Load cities on mount (only if not already loaded)
  useEffect(() => {
    const loadCities = async () => {
      if (cities.length === 0) {
        setLoadingAddress(true);
        try {
          const data = await getCities();
          setCities(data);
        } catch (err) {
          console.error("Failed to load cities:", err);
        } finally {
          setLoadingAddress(false);
        }
      }
    };
    loadCities();
  }, [cities.length]);

  // Load districts when city changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (selectedCity) {
        setLoadingAddress(true);
        try {
          const data = await getDistricts(selectedCity);
          setDistricts(data);
          // Reset district and ward when city changes (unless initializing)
          if (!formData.location) {
            setSelectedDistrict("");
            setSelectedWard("");
            setWards([]);
          }
        } catch (err) {
          console.error("Failed to load districts:", err);
          setDistricts([]);
        } finally {
          setLoadingAddress(false);
        }
      } else {
        setDistricts([]);
        if (!formData.location) {
          setSelectedDistrict("");
          setSelectedWard("");
          setWards([]);
        }
      }
    };
    loadDistricts();
  }, [selectedCity]);

  // Load wards when district changes
  useEffect(() => {
    const loadWards = async () => {
      if (selectedDistrict) {
        setLoadingAddress(true);
        try {
          const data = await getWards(selectedDistrict);
          setWards(data);
          // Reset ward when district changes (unless initializing)
          if (!formData.location) {
            setSelectedWard("");
          }
        } catch (err) {
          console.error("Failed to load wards:", err);
          setWards([]);
        } finally {
          setLoadingAddress(false);
        }
      } else {
        setWards([]);
        if (!formData.location) {
          setSelectedWard("");
        }
      }
    };
    loadWards();
  }, [selectedDistrict]);

  // Update location string when address selections change
  useEffect(() => {
    const addressParts: string[] = [];
    if (selectedWard) {
      const ward = wards.find((w) => w.value === selectedWard);
      if (ward) addressParts.push(ward.label);
    }
    if (selectedDistrict) {
      const district = districts.find((d) => d.value === selectedDistrict);
      if (district) addressParts.push(district.label);
    }
    if (selectedCity) {
      const city = cities.find((c) => c.value === selectedCity);
      if (city) addressParts.push(city.label);
    }

    if (addressParts.length > 0) {
      setFormData((prev) => ({
        ...prev,
        location: addressParts.join(", "),
      }));
    }
  }, [selectedCity, selectedDistrict, selectedWard, cities, districts, wards]);

  // Load sub-industries when industryCode changes
  useEffect(() => {
    const loadSubIndustries = async () => {
      if (formData.industryCode) {
        setLoadingIndustries(true);
        try {
          const data = await industryService.getSubIndustries(
            formData.industryCode
          );
          setSubIndustries(data);
        } catch (err) {
          console.error("Failed to load sub-industries:", err);
          setSubIndustries([]);
        } finally {
          setLoadingIndustries(false);
        }
      } else {
        setSubIndustries([]);
      }
    };
    loadSubIndustries();
  }, [formData.industryCode]);

  const handleInputChange = (
    field: keyof CreateJobPayload,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 100);
  };

  // Auto-generate slug when title changes (only if not manually edited)
  useEffect(() => {
    if (formData.title && !slugManuallyEdited) {
      const slug = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, slugManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Format deadline to ISO string (date-only input)
      let deadline = formData.deadline;
      if (deadline) {
        const date = new Date(deadline);
        if (!isNaN(date.getTime())) {
          deadline = date.toISOString();
        } else {
          setError("Ngày hết hạn không hợp lệ");
          setSaving(false);
          return;
        }
      }

      // Prepare payload
      const payload: CreateJobPayload = {
        ...formData,
        deadline,
        // Remove empty optional fields
        slug: formData.slug || undefined,
        benefits: formData.benefits || undefined,
        address: formData.address || undefined,
        skillIds: formData.skillIds?.length ? formData.skillIds : undefined,
        level: formData.level || undefined,
        jobType: formData.jobType || undefined,
        workingMode: formData.workingMode || undefined,
        industryCode: formData.industryCode || undefined,
        subIndustryCode: formData.subIndustryCode || undefined,
      };

      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập để cập nhật bài tuyển dụng");
        setSaving(false);
        return;
      }

      const result = (await updateJob(jobId, payload, token)) as JobResponse;

      if (result.success) {
        // Nếu backend trả về moderation info, hiển thị để employer biết lý do
        if (result.autoApproved) {
          setModerationResult({
            type: "approved",
            message:
              result.message || "Job đã được tự động duyệt và đăng thành công",
          });
          setRedirectAfterModal(true);
          return;
        }

        if (result.autoRejected) {
          setModerationResult({
            type: "rejected",
            message:
              result.message ||
              "Job không được duyệt do chứa nội dung không phù hợp",
            reasons: result.reasons || [],
            flags: result.flags || [],
          });
          setRedirectAfterModal(true);
          return;
        }

        if (result.requiresReview) {
          setModerationResult({
            type: "review",
            message:
              result.message || "Đã gửi duyệt. Vui lòng chờ admin phê duyệt",
            reviewReasons: result.reviewReasons || [],
            reasons: result.warnings || [],
          });
          setRedirectAfterModal(true);
          return;
        }

        // Không có moderation info -> redirect bình thường
        router.push("/jobs");
      } else {
        setError(result.error || "Có lỗi xảy ra khi cập nhật bài tuyển dụng");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi cập nhật bài tuyển dụng");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <EmployerShell active="jobs">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto" />
            <p className="text-slate-600 font-medium">Đang tải dữ liệu bài tuyển dụng...</p>
          </div>
        </div>
      </EmployerShell>
    );
  }

  if (error && !formData.title) {
    return (
      <EmployerShell active="jobs">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-red-300 bg-red-50 shadow-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-800 font-semibold mb-2">Có lỗi xảy ra</p>
              <p className="text-red-600 mb-6">{error}</p>
              <Button
                onClick={() => router.push("/jobs")}
                variant="outline"
                className="hover:bg-red-50"
              >
                Quay lại danh sách
              </Button>
            </CardContent>
          </Card>
        </div>
      </EmployerShell>
    );
  }

  return (
    <EmployerShell active="jobs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Chỉnh sửa bài tuyển dụng
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                Cập nhật thông tin về vị trí tuyển dụng của bạn
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thông tin cơ bản */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-linear-to-r from-teal-50 to-white border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <FileText className="h-5 w-5 text-teal-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Thông tin cơ bản
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Tiêu đề bài tuyển dụng <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ví dụ: Senior Full Stack Developer"
                  className="h-11 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  required
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Tiêu đề hấp dẫn sẽ thu hút nhiều ứng viên hơn
                </p>
              </div>

              <div>
                <Label htmlFor="slug" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Slug (URL-friendly)
                </Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    handleInputChange("slug", e.target.value);
                  }}
                  placeholder="Tự động tạo từ tiêu đề hoặc nhập thủ công"
                  className="h-11 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Slug sẽ được tự động tạo từ tiêu đề nếu chưa chỉnh sửa
                </p>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Mô tả công việc <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Mô tả chi tiết về công việc, trách nhiệm, môi trường làm việc..."
                  rows={5}
                  className="focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                  required
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Mô tả càng chi tiết, ứng viên càng hiểu rõ về công việc
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="level" className="text-sm font-semibold text-slate-700 mb-2 block">
                    Cấp độ <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => handleInputChange("level", value)}
                    required
                  >
                    <SelectTrigger id="level" className="w-full h-11 focus:ring-2 focus:ring-teal-500">
                      <SelectValue placeholder="Chọn cấp độ" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="jobType" className="text-sm font-semibold text-slate-700 mb-2 block">
                    Loại công việc <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.jobType}
                    onValueChange={(value) => handleInputChange("jobType", value)}
                    required
                  >
                    <SelectTrigger id="jobType" className="w-full h-11 focus:ring-2 focus:ring-teal-500">
                      <SelectValue placeholder="Chọn loại công việc" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="workingMode" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Chế độ làm việc <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.workingMode}
                  onValueChange={(value) =>
                    handleInputChange("workingMode", value)
                  }
                  required
                >
                  <SelectTrigger id="workingMode" className="w-full h-11 focus:ring-2 focus:ring-teal-500">
                    <SelectValue placeholder="Chọn chế độ làm việc" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKING_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="industryCode" className="text-sm font-semibold text-slate-700 mb-2 block">
                    Ngành nghề <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.industryCode}
                    onValueChange={(value) => {
                      handleInputChange("industryCode", value);
                    }}
                    disabled={loadingIndustries}
                    required
                  >
                    <SelectTrigger id="industryCode" className="w-full h-11 focus:ring-2 focus:ring-teal-500">
                      <SelectValue placeholder="Chọn ngành nghề" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry.code} value={industry.code}>
                          {industry.name.vi || industry.name.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subIndustryCode" className="text-sm font-semibold text-slate-700 mb-2 block">
                    Lĩnh vực con
                  </Label>
                  <Select
                    value={formData.subIndustryCode}
                    onValueChange={(value) =>
                      handleInputChange("subIndustryCode", value)
                    }
                    disabled={loadingIndustries || !formData.industryCode}
                  >
                    <SelectTrigger id="subIndustryCode" className="w-full h-11 focus:ring-2 focus:ring-teal-500">
                      <SelectValue placeholder="Chọn lĩnh vực con (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      {subIndustries.map((subIndustry) => (
                        <SelectItem
                          key={subIndustry.code}
                          value={subIndustry.code}
                        >
                          {subIndustry.name.vi || subIndustry.name.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-600" />
                  Địa điểm làm việc <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-xs font-medium text-slate-600 mb-1.5 block">
                      Tỉnh/Thành phố <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedCity}
                      onValueChange={setSelectedCity}
                      disabled={loadingAddress}
                      required
                    >
                      <SelectTrigger id="city" className="w-full h-11 focus:ring-2 focus:ring-teal-500">
                        <SelectValue placeholder="Chọn tỉnh/thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.value} value={city.value}>
                            {city.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="district" className="text-xs font-medium text-slate-600 mb-1.5 block">
                      Quận/Huyện <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedDistrict}
                      onValueChange={setSelectedDistrict}
                      disabled={loadingAddress || !selectedCity}
                      required
                    >
                      <SelectTrigger id="district" className="w-full h-11 focus:ring-2 focus:ring-teal-500">
                        <SelectValue placeholder="Chọn quận/huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.value} value={district.value}>
                            {district.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ward" className="text-xs font-medium text-slate-600 mb-1.5 block">
                      Phường/Xã <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedWard}
                      onValueChange={setSelectedWard}
                      disabled={loadingAddress || !selectedDistrict}
                      required
                    >
                      <SelectTrigger id="ward" className="w-full h-11 focus:ring-2 focus:ring-teal-500">
                        <SelectValue placeholder="Chọn phường/xã" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((ward) => (
                          <SelectItem key={ward.value} value={ward.value}>
                            {ward.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {formData.location && (
                  <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-sm text-teal-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="font-medium">Địa điểm:</span> {formData.location}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="address" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Địa chỉ chi tiết (Số nhà, tên đường)
                </Label>
                <Input
                  id="address"
                  value={
                    typeof formData.address === "string" ? formData.address : ""
                  }
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Ví dụ: 123 Nguyễn Huệ, Tòa nhà ABC"
                  className="h-11 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-teal-600" />
                  Mức lương <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="salaryMin" className="text-xs font-medium text-slate-600 mb-1.5 block">
                      Lương tối thiểu <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="salaryMin"
                      type="number"
                      min="0"
                      value={formData.salaryMin || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "salaryMin",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="30,000,000"
                      className="h-11 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="salaryMax" className="text-xs font-medium text-slate-600 mb-1.5 block">
                      Lương tối đa <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="salaryMax"
                      type="number"
                      min="0"
                      value={formData.salaryMax || ""}
                      onChange={(e) =>
                        handleInputChange(
                          "salaryMax",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="50,000,000"
                      className="h-11 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency" className="text-xs font-medium text-slate-600 mb-1.5 block">
                      Đơn vị tiền tệ <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        handleInputChange("currency", value)
                      }
                      required
                    >
                      <SelectTrigger id="currency" className="w-full h-11 focus:ring-2 focus:ring-teal-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="positions" className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-600" />
                  Số lượng vị trí <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="positions"
                  type="number"
                  min="1"
                  value={formData.positions}
                  onChange={(e) =>
                    handleInputChange("positions", parseInt(e.target.value) || 1)
                  }
                  className="h-11 w-32 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  required
                />
              </div>
          </CardContent>
        </Card>

          {/* Yêu cầu và kỹ năng */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-linear-to-r from-teal-50 to-white border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Code className="h-5 w-5 text-teal-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Yêu cầu và kỹ năng
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="requirements" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Yêu cầu công việc <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) =>
                    handleInputChange("requirements", e.target.value)
                  }
                  placeholder="Liệt kê các yêu cầu cụ thể về kinh nghiệm, trình độ, chứng chỉ..."
                  rows={5}
                  className="focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                  required
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Nêu rõ các yêu cầu về kinh nghiệm, trình độ học vấn, kỹ năng cần thiết
                </p>
              </div>

              <div>
                <Label htmlFor="benefits" className="text-sm font-semibold text-slate-700 mb-2 block">
                  Quyền lợi
                </Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => handleInputChange("benefits", e.target.value)}
                  placeholder="Liệt kê các quyền lợi (lương tháng 13, bảo hiểm, bonus, đào tạo...)"
                  rows={4}
                  className="focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all resize-none"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Quyền lợi hấp dẫn sẽ thu hút ứng viên chất lượng cao
                </p>
              </div>

              <div>
                <Label className="text-sm font-semibold text-slate-700 mb-3 block">
                  Kỹ năng yêu cầu <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Nhập kỹ năng và nhấn Enter hoặc click +"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="h-11 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  />
                  <Button
                    type="button"
                    onClick={addSkill}
                    size="default"
                    className="h-11 px-4 bg-teal-600 hover:bg-teal-700 text-white transition-all"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-10 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  {formData.skills.length > 0 ? (
                    formData.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200 transition-colors"
                      >
                        <span className="font-medium">{skill}</span>
                        <X
                          className="h-3.5 w-3.5 cursor-pointer hover:text-red-600 transition-colors"
                          onClick={() => removeSkill(skill)}
                        />
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Chưa có kỹ năng nào được thêm
                    </p>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Thêm các kỹ năng cần thiết cho vị trí này (ví dụ: React, Node.js, Python...)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Thời gian */}
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-linear-to-r from-teal-50 to-white border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-teal-600" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  Thời gian
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div>
                <Label htmlFor="deadline" className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  Hạn nộp hồ sơ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange("deadline", e.target.value)}
                  className="h-11 w-full max-w-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  required
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Chọn ngày hết hạn nhận hồ sơ ứng tuyển
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="border-red-300 bg-red-50 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-red-800 font-medium">Có lỗi xảy ra</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="px-6 h-11 hover:bg-slate-50 transition-all"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="px-8 h-11 bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Moderation Result Dialog */}
      <AlertDialog
        open={!!moderationResult}
        onOpenChange={(open) => {
          if (!open) {
            setModerationResult(null);
            if (redirectAfterModal) {
              router.push("/jobs");
            }
          }
        }}
      >
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {moderationResult?.type === "approved" &&
                "✅ Đã duyệt thành công"}
              {moderationResult?.type === "rejected" && "❌ Không được duyệt"}
              {moderationResult?.type === "review" && "⚠️ Cần xem xét"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {moderationResult?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Review Reasons */}
          {moderationResult?.type === "review" &&
            moderationResult.reviewReasons &&
            moderationResult.reviewReasons.length > 0 && (
              <div className="my-4">
                <h4 className="font-semibold mb-3 text-sm">
                  Các vấn đề cần lưu ý:
                </h4>
                <div className="space-y-2">
                  {moderationResult.reviewReasons.map((reason, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        reason.severity === "high"
                          ? "bg-red-50 border-red-200"
                          : reason.severity === "medium"
                          ? "bg-orange-50 border-orange-200"
                          : "bg-yellow-50 border-yellow-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg">
                          {reason.severity === "high" && "🔴"}
                          {reason.severity === "medium" && "🟠"}
                          {reason.severity === "low" && "🟡"}
                        </span>
                        <p className="text-sm text-gray-700">
                          {reason.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Rejection Reasons */}
          {moderationResult?.type === "rejected" &&
            moderationResult.reasons &&
            moderationResult.reasons.length > 0 && (
              <div className="my-4">
                <h4 className="font-semibold mb-3 text-sm text-red-600">
                  Lý do từ chối:
                </h4>
                <div className="space-y-2">
                  {moderationResult.reasons.map((reason, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-red-50 border border-red-200"
                    >
                      <p className="text-sm text-red-700">{reason}</p>
                    </div>
                  ))}
                </div>
                {moderationResult.flags &&
                  moderationResult.flags.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500">
                        Flags: {moderationResult.flags.join(", ")}
                      </p>
                    </div>
                  )}
              </div>
            )}

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setModerationResult(null);
                if (redirectAfterModal) {
                  router.push("/jobs");
                }
              }}
              className={
                moderationResult?.type === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : moderationResult?.type === "rejected"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              Đã hiểu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </EmployerShell>
  );
}
