"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getJobById, updateJob, CreateJobPayload } from "@/lib/jobAPI";
import { nlpService } from "@/lib/api/nlp.service";
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
  ArrowLeft,
  Edit,
  Save,
  X,
  Plus,
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Clock,
  Building,
  Users,
} from "lucide-react";
import { getCities, getDistricts, getWards } from "@/lib/vietnamAddress";
import { findOptionByLabelLoose } from "@/lib/addressUtils";
import { getToken } from "@/lib/userStorage";

const JOB_LEVELS = [
  { value: "Intern", label: "Thực tập sinh" },
  { value: "Junior", label: "Junior" },
  { value: "Middle", label: "Middle" },
  { value: "Senior", label: "Senior" },
  { value: "Lead", label: "Lead" },
  { value: "Manager", label: "Quản lý" },
];

const JOB_TYPES = [
  { value: "Fulltime", label: "Toàn thời gian" },
  { value: "Parttime", label: "Bán thời gian" },
  { value: "Contract", label: "Hợp đồng" },
  { value: "Internship", label: "Thực tập" },
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

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id as string;

  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [suggestedCandidates, setSuggestedCandidates] = useState<
    Array<{
      candidateId: string;
      name: string;
      email?: string;
      score: number;
      tier?: string;
      matchedSkills?: string[];
    }>
  >([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const [jobData, setJobData] = useState<any>(null);
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
  const [showSuggestions, setShowSuggestions] = useState(false);

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
        if (result.success && result.data) {
          setJobData(result.data);
          initializeFormData(result.data);
        } else {
          setError(result.error || "Không tìm thấy bài tuyển dụng");
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

  // Fetch suggested candidates for this job (employer view)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!jobId) return;
      setLoadingSuggestions(true);
      setSuggestionError(null);
      try {
        const res = await nlpService.getTopCandidates(jobId, {
          limit: 5,
          minScore: 30,
        });
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map((item: any) => ({
            candidateId: item.candidateId || item.candidate?._id || "",
            name: item.candidate?.name || item.candidate?.fullName || "Ứng viên",
            email: item.candidate?.email,
            score: item.overallScore || item.matchScore || 0,
            tier: item.tier,
            matchedSkills:
              item.breakdown?.skills?.matched ||
              item.scoreBreakdown?.skillsScore?.details?.matchedSkills?.map(
                (s: any) => s.skill
              ) ||
              [],
          }));
          setSuggestedCandidates(mapped);
        } else {
          setSuggestionError(res.message || "Không tải được gợi ý ứng viên");
        }
      } catch (err: any) {
        setSuggestionError(
          err?.response?.data?.message ||
            "Không thể tải gợi ý ứng viên cho job này"
        );
      } finally {
        setLoadingSuggestions(false);
      }
    };

    // Only employers should see suggestions
    fetchSuggestions();
  }, [jobId]);

  // Initialize form data from job data
  const initializeFormData = async (job: any) => {
    // Map address object to location string and address field
    let locationString = "";
    let addressString = "";

    if (job.address) {
      // Use fullAddress if available, otherwise construct from parts
      if (job.address.fullAddress) {
        locationString = job.address.fullAddress;
      } else if (job.address.ward && job.address.district && job.address.city) {
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

    const formData: CreateJobPayload = {
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
        ? new Date(job.deadline).toISOString().slice(0, 16)
        : "",
    };

    setFormData(formData);

    // Load cities and parse location
    if (locationString) {
      const citiesData = await getCities();
      setCities(citiesData);
      await parseAndSetLocation(locationString, citiesData);
    }

    // Load industries
    try {
      const industriesData = await industryService.getRootIndustries();
      setIndustries(industriesData);

      if (job.industryCode) {
        const subIndustriesData = await industryService.getSubIndustries(
          job.industryCode
        );
        setSubIndustries(subIndustriesData);
      }
    } catch (err) {
      console.error("Failed to load industries:", err);
    }
  };

  // Fetch suggested candidates for this job (employer view)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!jobId) return;
      setLoadingSuggestions(true);
      setSuggestionError(null);
      try {
        const res = await nlpService.getTopCandidates(jobId, {
          limit: 5,
          minScore: 30,
        });
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map((item: any) => ({
            candidateId: item.candidateId || item.candidate?._id || "",
            name: item.candidate?.name || item.candidate?.fullName || "Ứng viên",
            email: item.candidate?.email,
            score: item.overallScore || item.matchScore || 0,
            tier: item.tier,
            matchedSkills:
              item.breakdown?.skills?.matched ||
              item.scoreBreakdown?.skillsScore?.details?.matchedSkills?.map(
                (s: any) => s.skill
              ) ||
              [],
          }));
          setSuggestedCandidates(mapped);
        } else {
          setSuggestionError(res.message || "Không tải được gợi ý ứng viên");
        }
      } catch (err: any) {
        setSuggestionError(
          err?.response?.data?.message ||
            "Không thể tải gợi ý ứng viên cho job này"
        );
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [jobId]);

  // Parse location string and set address dropdowns
  const parseAndSetLocation = async (
    locationString: string,
    citiesData: { value: string; label: string }[]
  ) => {
    try {
      const parts = locationString.split(",").map((p) => p.trim());

      if (parts.length >= 3) {
        const wardName = parts[0];
        const districtName = parts[1];
        const cityName = parts[2];

        const cityOption = findOptionByLabelLoose(citiesData, cityName);
        if (cityOption) {
          setSelectedCity(cityOption.value);

          const districtsData = await getDistricts(cityOption.value);
          setDistricts(districtsData);

          const districtOption = findOptionByLabelLoose(
            districtsData,
            districtName
          );
          if (districtOption) {
            setSelectedDistrict(districtOption.value);

            const wardsData = await getWards(districtOption.value);
            setWards(wardsData);

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

  // Load districts when city changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (selectedCity) {
        setLoadingAddress(true);
        try {
          const data = await getDistricts(selectedCity);
          setDistricts(data);
          if (!isEditMode || !formData.location) {
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
        if (!isEditMode || !formData.location) {
          setSelectedDistrict("");
          setSelectedWard("");
          setWards([]);
        }
      }
    };
    loadDistricts();
  }, [selectedCity, isEditMode]);

  // Load wards when district changes
  useEffect(() => {
    const loadWards = async () => {
      if (selectedDistrict) {
        setLoadingAddress(true);
        try {
          const data = await getWards(selectedDistrict);
          setWards(data);
          if (!isEditMode || !formData.location) {
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
        if (!isEditMode || !formData.location) {
          setSelectedWard("");
        }
      }
    };
    loadWards();
  }, [selectedDistrict, isEditMode]);

  // Update location string when address selections change
  useEffect(() => {
    if (isEditMode) {
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
    }
  }, [
    selectedCity,
    selectedDistrict,
    selectedWard,
    cities,
    districts,
    wards,
    isEditMode,
  ]);

  // Load cities when entering edit mode
  useEffect(() => {
    const loadCities = async () => {
      if (isEditMode && cities.length === 0) {
        try {
          const data = await getCities();
          setCities(data);
        } catch (err) {
          console.error("Failed to load cities:", err);
        }
      }
    };
    loadCities();
  }, [isEditMode, cities.length]);

  // Load industries when entering edit mode
  useEffect(() => {
    const loadIndustries = async () => {
      if (isEditMode && industries.length === 0) {
        try {
          const data = await industryService.getRootIndustries();
          setIndustries(data);
        } catch (err) {
          console.error("Failed to load industries:", err);
        }
      }
    };
    loadIndustries();
  }, [isEditMode, industries.length]);

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
    if (isEditMode) {
      loadSubIndustries();
    }
  }, [formData.industryCode, isEditMode]);

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

  // Auto-generate slug when title changes
  useEffect(() => {
    if (isEditMode && formData.title && !slugManuallyEdited) {
      const slug = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title, slugManuallyEdited, isEditMode]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập");
        setSaving(false);
        return;
      }

      // Format deadline to ISO string
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

      const result = await updateJob(jobId, payload, token);
      if (result.success) {
        setSuccess(true);
        setIsEditMode(false);
        // Reload job data
        const updatedJob = await getJobById(jobId, token);
        if (updatedJob.success && updatedJob.data) {
          setJobData(updatedJob.data);
        }
      } else {
        setError(result.error || "Có lỗi xảy ra khi cập nhật bài tuyển dụng");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi cập nhật bài tuyển dụng");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (jobData) {
      initializeFormData(jobData);
    }
    setIsEditMode(false);
    setError(null);
    setSuccess(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const formatSalary = (min?: number, max?: number, currency?: string) => {
    if (!min && !max) return "Thỏa thuận";
    const formatNumber = (num: number) =>
      num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const currencySymbol = currency === "USD" ? "$" : "₫";
    if (min && max) {
      return `${formatNumber(min)} - ${formatNumber(max)} ${currencySymbol}`;
    }
    return min
      ? `Từ ${formatNumber(min)} ${currencySymbol}`
      : max
      ? `Đến ${formatNumber(max)} ${currencySymbol}`
      : "Thỏa thuận";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" }
    > = {
      draft: { label: "Bản nháp", variant: "secondary" },
      pending: { label: "Chờ duyệt", variant: "default" },
      approved: { label: "Đã duyệt", variant: "default" },
      rejected: { label: "Từ chối", variant: "destructive" },
      active: { label: "Đang hoạt động", variant: "default" },
      closed: { label: "Đã đóng", variant: "secondary" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu bài tuyển dụng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !jobData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push("/jobs")} variant="outline">
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!jobData) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {jobData.title}
                </h1>
                {jobData?.status && getStatusBadge(jobData.status)}
              </div>
              <p className="text-gray-600">
                {jobData.company || "Công ty chưa cập nhật"} •{" "}
                {formatDate(jobData.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <Button onClick={() => setIsEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            )}
            <Button
              variant={showSuggestions ? "default" : "outline"}
              onClick={() => setShowSuggestions((prev) => !prev)}
            >
              Ứng viên gợi ý
            </Button>
          </div>
        </div>

        {!isEditMode && (
          <div className="mb-4 text-gray-700">
            <p>{jobData.description}</p>
          </div>
        )}
      </div>

      {success && (
        <Card className="border-green-200 bg-green-50 mb-6">
          <CardContent className="p-4">
            <p className="text-green-600">Cập nhật thành công!</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Suggested Candidates */}
      {showSuggestions && (
        <Card className="border-blue-100 bg-blue-50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
              Ứng viên gợi ý cho bài tuyển dụng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSuggestions && (
              <p className="text-sm text-gray-600">Đang tải gợi ý ứng viên...</p>
            )}
            {suggestionError && (
              <p className="text-sm text-red-600">{suggestionError}</p>
            )}
            {!loadingSuggestions &&
              !suggestionError &&
              suggestedCandidates.length === 0 && (
                <p className="text-sm text-gray-600">Chưa có gợi ý phù hợp.</p>
              )}
            <div className="space-y-3">
              {suggestedCandidates.map((c) => (
                <div
                  key={c.candidateId}
                  className="border border-blue-100 bg-white rounded-md p-3 flex justify-between items-start"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    {c.email && (
                      <p className="text-sm text-gray-600">{c.email}</p>
                    )}
                    {c.matchedSkills && c.matchedSkills.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Kỹ năng khớp: {c.matchedSkills.slice(0, 5).join(", ")}
                        {c.matchedSkills.length > 5
                          ? ` +${c.matchedSkills.length - 5}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-700">
                      Điểm: {Math.round(c.score)}%
                    </p>
                    {c.tier && (
                      <p className="text-xs text-gray-500">Tier {c.tier}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isEditMode ? (
        /* Edit Mode - Form */
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Tiêu đề bài tuyển dụng *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Ví dụ: Senior Full Stack Developer"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL-friendly)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    handleInputChange("slug", e.target.value);
                  }}
                  placeholder="Tự động tạo từ tiêu đề hoặc nhập thủ công"
                />
              </div>

              <div>
                <Label htmlFor="description">Mô tả công việc *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Mô tả chi tiết về công việc, trách nhiệm..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Cấp độ *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => handleInputChange("level", value)}
                    required
                  >
                    <SelectTrigger id="level" className="w-full">
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
                  <Label htmlFor="jobType">Loại công việc *</Label>
                  <Select
                    value={formData.jobType}
                    onValueChange={(value) =>
                      handleInputChange("jobType", value)
                    }
                    required
                  >
                    <SelectTrigger id="jobType" className="w-full">
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
                <Label htmlFor="workingMode">Chế độ làm việc *</Label>
                <Select
                  value={formData.workingMode}
                  onValueChange={(value) =>
                    handleInputChange("workingMode", value)
                  }
                  required
                >
                  <SelectTrigger id="workingMode" className="w-full">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industryCode">Ngành nghề *</Label>
                  <Select
                    value={formData.industryCode}
                    onValueChange={(value) => {
                      handleInputChange("industryCode", value);
                    }}
                    disabled={loadingIndustries}
                    required
                  >
                    <SelectTrigger id="industryCode" className="w-full">
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
                  <Label htmlFor="subIndustryCode">Lĩnh vực con</Label>
                  <Select
                    value={formData.subIndustryCode}
                    onValueChange={(value) =>
                      handleInputChange("subIndustryCode", value)
                    }
                    disabled={loadingIndustries || !formData.industryCode}
                  >
                    <SelectTrigger id="subIndustryCode" className="w-full">
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
                <Label>Địa điểm làm việc *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-sm text-gray-600">
                      Tỉnh/Thành phố *
                    </Label>
                    <Select
                      value={selectedCity}
                      onValueChange={setSelectedCity}
                      disabled={loadingAddress}
                      required
                    >
                      <SelectTrigger id="city" className="w-full">
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
                    <Label htmlFor="district" className="text-sm text-gray-600">
                      Quận/Huyện *
                    </Label>
                    <Select
                      value={selectedDistrict}
                      onValueChange={setSelectedDistrict}
                      disabled={loadingAddress || !selectedCity}
                      required
                    >
                      <SelectTrigger id="district" className="w-full">
                        <SelectValue placeholder="Chọn quận/huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem
                            key={district.value}
                            value={district.value}
                          >
                            {district.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ward" className="text-sm text-gray-600">
                      Phường/Xã *
                    </Label>
                    <Select
                      value={selectedWard}
                      onValueChange={setSelectedWard}
                      disabled={loadingAddress || !selectedDistrict}
                      required
                    >
                      <SelectTrigger id="ward" className="w-full">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Địa điểm: {formData.location}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address">
                  Địa chỉ chi tiết (Số nhà, tên đường)
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Ví dụ: 123 Nguyễn Huệ, Tòa nhà ABC"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="salaryMin">Lương tối thiểu *</Label>
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
                    placeholder="30000000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="salaryMax">Lương tối đa *</Label>
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
                    placeholder="50000000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="currency">Đơn vị tiền tệ *</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      handleInputChange("currency", value)
                    }
                    required
                  >
                    <SelectTrigger id="currency" className="w-full">
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

              <div>
                <Label htmlFor="positions">Số lượng vị trí *</Label>
                <Input
                  id="positions"
                  type="number"
                  min="1"
                  value={formData.positions}
                  onChange={(e) =>
                    handleInputChange(
                      "positions",
                      parseInt(e.target.value) || 1
                    )
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu và kỹ năng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="requirements">Yêu cầu công việc *</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) =>
                    handleInputChange("requirements", e.target.value)
                  }
                  placeholder="Liệt kê các yêu cầu cụ thể..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="benefits">Quyền lợi</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) =>
                    handleInputChange("benefits", e.target.value)
                  }
                  placeholder="Liệt kê các quyền lợi (lương tháng 13, bảo hiểm, bonus...)"
                  rows={3}
                />
              </div>

              <div>
                <Label>Kỹ năng yêu cầu *</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Nhập kỹ năng và nhấn Enter"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {skill}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thời gian</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="deadline">Hạn nộp hồ sơ *</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) =>
                    handleInputChange("deadline", e.target.value)
                  }
                  required
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      ) : (
        /* View Mode - Display */
        <div className="space-y-6">
          {/* Status and Basic Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{jobData.title}</CardTitle>
                {getStatusBadge(jobData.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="h-4 w-4" />
                  <span>
                    {JOB_LEVELS.find((l) => l.value === jobData.level)?.label ||
                      jobData.level}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {JOB_TYPES.find((t) => t.value === jobData.jobType)
                      ?.label || jobData.jobType}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="h-4 w-4" />
                  <span>
                    {WORKING_MODES.find((m) => m.value === jobData.workingMode)
                      ?.label || jobData.workingMode}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>{jobData.positions} vị trí</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Mô tả công việc</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {jobData.description}
              </p>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Yêu cầu công việc</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {jobData.requirements}
              </p>
            </CardContent>
          </Card>

          {/* Benefits */}
          {jobData.benefits && (
            <Card>
              <CardHeader>
                <CardTitle>Quyền lợi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {jobData.benefits}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Kỹ năng yêu cầu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(jobData.skills || []).map((skill: any, index: number) => {
                  const skillName =
                    typeof skill === "string" ? skill : skill.name || skill;
                  const skillKey =
                    typeof skill === "string"
                      ? skill
                      : skill._id || skill.id || index;
                  return (
                    <Badge key={skillKey} variant="secondary">
                      {skillName}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Experience and Education */}
          {(jobData.experience || jobData.education) && (
            <Card>
              <CardHeader>
                <CardTitle>Yêu cầu bổ sung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobData.experience && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Kinh nghiệm
                    </p>
                    <p className="text-gray-700">{jobData.experience}</p>
                  </div>
                )}
                {jobData.education && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      Học vấn
                    </p>
                    <p className="text-gray-700">{jobData.education}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          {jobData.stats && (
            <Card>
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Ứng viên
                      </p>
                      <p className="text-2xl font-semibold">
                        {jobData.stats.applications || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Phỏng vấn
                      </p>
                      <p className="text-2xl font-semibold">
                        {jobData.stats.interviews || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Đề xuất
                      </p>
                      <p className="text-2xl font-semibold">
                        {jobData.stats.offers || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Địa điểm
                    </p>
                    <p className="text-gray-900">
                      {jobData.address?.fullAddress ||
                        (jobData.address?.ward &&
                        jobData.address?.district &&
                        jobData.address?.city
                          ? `${jobData.address.ward}, ${jobData.address.district}, ${jobData.address.city}`
                          : jobData.location || "N/A")}
                    </p>
                    {jobData.address?.street && (
                      <p className="text-sm text-gray-600">
                        {jobData.address.street}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Mức lương
                    </p>
                    <p className="text-gray-900">
                      {formatSalary(
                        jobData.salaryMin,
                        jobData.salaryMax,
                        jobData.currency
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Hạn nộp hồ sơ
                    </p>
                    <p className="text-gray-900">
                      {formatDate(jobData.deadline)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Ngày tạo
                    </p>
                    <p className="text-gray-900">
                      {formatDateTime(jobData.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
