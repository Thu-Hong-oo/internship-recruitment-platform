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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Filter,
  Search,
  Star,
  TrendingUp,
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
      raw?: any;
    }>
  >([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

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
  const [filterScore, setFilterScore] = useState<number>(0);
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterSkill, setFilterSkill] = useState<string>("");

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
        const res: any = await nlpService.getTopCandidates(jobId, {
          limit: 5,
          minScore: 30,
          noCache: true,
        });

        const payload = res?.data || res;
        const payloadObj = payload as any;

        // Helper functions
        const normalizeSkills = (list: any) =>
          Array.isArray(list)
            ? list
                .map((s: any) => (typeof s === "string" ? s : s?.name || s))
                .filter(Boolean)
            : [];

        const extractSkills = (candidate: any) => {
          const skills: string[] = [];
          skills.push(...normalizeSkills(candidate.skills));
          skills.push(...normalizeSkills(candidate.skills?.technical));
          skills.push(...normalizeSkills(candidate.skills?.soft));
          skills.push(...normalizeSkills(candidate.cv?.skills));
          skills.push(...normalizeSkills(candidate.cv?.skills?.technical));
          skills.push(...normalizeSkills(candidate.cv?.skills?.soft));
          return Array.from(new Set(skills)).slice(0, 20);
        };

        const extractExperience = (candidate: any) => {
          const exp: any[] = [];
          const cvExp = Array.isArray(candidate.cv?.experience)
            ? candidate.cv.experience
            : [];
          const internships = Array.isArray(candidate.experience?.internships)
            ? candidate.experience.internships
            : [];
          const jobs = Array.isArray(candidate.experience?.jobs)
            ? candidate.experience.jobs
            : [];
          const all = [...cvExp, ...internships, ...jobs];
          return all
            .map((e: any) => {
              const position = e?.position || e?.title;
              const company = e?.company;
              return position ? `${position}${company ? " @ " + company : ""}` : null;
            })
            .filter(Boolean)
            .slice(0, 5);
        };

        const extractEducation = (candidate: any) => {
          const edu =
            candidate.cv?.education?.[0] ||
            candidate.education?.university ||
            candidate.education?.[0];
          return {
            degree: edu?.degree || edu?.type || "",
            major: edu?.major || edu?.field || "",
            institution: edu?.institution || edu?.name || "",
          };
        };

        // API returns either an array or { candidates: [...] }
        let candidates: any[] = [];
        if (Array.isArray(payloadObj)) {
          candidates = payloadObj;
        } else if (Array.isArray(payloadObj?.data)) {
          candidates = payloadObj.data;
        } else {
          candidates =
            payloadObj?.data?.candidates || payloadObj?.candidates || [];
        }

        if (payloadObj?.success !== false && Array.isArray(candidates)) {
          const mapped = candidates
            .map((item: any) => {
              const candidate =
                item.candidate || item.candidateId || item.candidate_id || {};

              const skills =
                item.breakdown?.skills?.matched && Array.isArray(item.breakdown.skills.matched)
                  ? item.breakdown.skills.matched
                  : extractSkills(candidate);

              const expList = extractExperience(candidate);
              const edu = extractEducation(candidate);

              return {
                candidateId: candidate._id || item.candidateId || "",
                name:
                  candidate.fullName ||
                  candidate.name ||
                  candidate.email ||
                  "Ứng viên",
                email: candidate.email,
                phone:
                  candidate.phone || candidate.cv?.phone || candidate.personalInfo?.phone,
                location:
                  candidate.location ||
                  candidate.cv?.location ||
                  candidate.personalInfo?.address?.city,
                score: item.overallScore || item.matchScore || 0,
                tier: item.tier || item.ranking?.tier,
                matchedSkills: skills,
                skills,
                experienceList: expList,
                education: edu,
                summary:
                  candidate.summary ||
                  candidate.cv?.summary ||
                  candidate.personalInfo?.bio ||
                  "",
                method: item.method,
                semanticScore: item.semanticScore,
                weightedScore: item.weightedScore || item.matchScore,
                raw: item,
              };
            })
            // Hide candidates without email so actions remain usable
            .filter((c: any) => !!c.email);
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
  }, [jobId, showSuggestions]);

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
            name:
              item.candidate?.name || item.candidate?.fullName || "Ứng viên",
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

  const profileBaseUrl =
    process.env.NEXT_PUBLIC_CANDIDATE_PROFILE_URL ||
    "https://internbridge.web.app";

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
                <h1 className="text-2xl font-semibold text-slate-800">
                  {jobData.title}
                </h1>
                {jobData?.status && getStatusBadge(jobData.status)}
              </div>
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
        <Card className="mb-6 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-white">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/10 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    Ứng viên gợi ý
                  </CardTitle>
                  <p className="text-sm text-slate-600 mt-0.5">
                    Danh sách ứng viên phù hợp với bài tuyển dụng
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
                {suggestedCandidates.length} ứng viên
              </Badge>
            </div>
          </CardHeader>

          {/* Sticky Filter Bar */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Bộ lọc:</span>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="filter-score" className="text-sm text-slate-600 whitespace-nowrap">
                    Điểm tối thiểu:
                  </Label>
                  <Input
                    id="filter-score"
                    type="number"
                    min="0"
                    max="100"
                    value={filterScore}
                    onChange={(e) => setFilterScore(Number(e.target.value))}
                    className="w-24 h-9"
                    placeholder="0"
                  />
                  <span className="text-xs text-slate-500">%</span>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor="filter-tier" className="text-sm text-slate-600 whitespace-nowrap">
                    Tier:
                  </Label>
                  <Select value={filterTier} onValueChange={setFilterTier}>
                    <SelectTrigger id="filter-tier" className="w-32 h-9">
                      <SelectValue placeholder="Tất cả" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="1">Tier 1</SelectItem>
                      <SelectItem value="2">Tier 2</SelectItem>
                      <SelectItem value="3">Tier 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Tìm theo kỹ năng..."
                      value={filterSkill}
                      onChange={(e) => setFilterSkill(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                </div>

                {(filterScore > 0 || filterTier !== "all" || filterSkill) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterScore(0);
                      setFilterTier("all");
                      setFilterSkill("");
                    }}
                    className="h-9 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            </CardContent>
          </div>

          <CardContent className="p-0">
            {loadingSuggestions && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-primary border-t-transparent mx-auto mb-4"></div>
                  <p className="text-sm text-slate-600">Đang tải gợi ý ứng viên...</p>
                </div>
              </div>
            )}
            {suggestionError && suggestedCandidates.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-red-600">{suggestionError}</p>
              </div>
            )}
            {!loadingSuggestions &&
              !suggestionError &&
              suggestedCandidates.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-slate-600">Chưa có gợi ý phù hợp.</p>
                </div>
              )}

            {!loadingSuggestions && suggestedCandidates.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-slate-50/50 border-b border-slate-200">
                      <TableHead className="font-semibold text-slate-700 w-[30%]">Ứng viên</TableHead>
                      <TableHead className="font-semibold text-slate-700 w-[25%]">Kỹ năng khớp</TableHead>
                      <TableHead className="font-semibold text-slate-700 w-[15%] text-center">Điểm số</TableHead>
                      <TableHead className="font-semibold text-slate-700 w-[15%] text-center">Tier</TableHead>
                      <TableHead className="font-semibold text-slate-700 w-[15%] text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggestedCandidates
                      .filter((c) => {
                        if (filterScore > 0 && Math.round(c.score) < filterScore) return false;
                        if (filterTier !== "all" && c.tier !== filterTier) return false;
                        if (filterSkill && c.matchedSkills) {
                          const skillLower = filterSkill.toLowerCase();
                          return !c.matchedSkills.some((s) =>
                            s.toLowerCase().includes(skillLower)
                          );
                        }
                        return true;
                      })
                      .map((c, index) => {
                        const profileLink = c.candidateId
                          ? `${profileBaseUrl}/profile/${c.candidateId}?public=1`
                          : undefined;
                        const mailto = c.email
                          ? `mailto:${c.email}?subject=Mời ứng tuyển - ${
                              jobData?.title || "Cơ hội mới"
                            }&body=Chào ${
                              c.name
                            },%0D%0AChúng tôi muốn mời bạn ứng tuyển vị trí ${
                              jobData?.title || ""
                            }.`
                          : undefined;

                        const scoreColor =
                          c.score >= 80
                            ? "text-emerald-600 bg-emerald-50"
                            : c.score >= 60
                            ? "text-blue-600 bg-blue-50"
                            : c.score >= 40
                            ? "text-amber-600 bg-amber-50"
                            : "text-slate-600 bg-slate-50";

                        return (
                          <TableRow
                            key={c.candidateId}
                            className="hover:bg-slate-50/50 transition-colors border-b border-slate-100"
                          >
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-slate-900">
                                    {c.name}
                                  </p>
                                </div>
                                {c.email && (
                                  <p className="text-sm text-slate-600">{c.email}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {c.matchedSkills && c.matchedSkills.length > 0 ? (
                                  <>
                                    {c.matchedSkills.slice(0, 3).map((skill, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="text-xs bg-primary/10 text-primary border-primary/20"
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                    {c.matchedSkills.length > 3 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-slate-100 text-slate-600"
                                      >
                                        +{c.matchedSkills.length - 3}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400">Không có</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div
                                className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full font-bold text-sm ${scoreColor}`}
                              >
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                {Math.round(c.score)}%
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              {c.tier ? (
                                <Badge
                                  variant="outline"
                                  className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 text-primary font-semibold"
                                >
                                  Tier {c.tier}
                                </Badge>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedCandidate(c)}
                                  className="h-8 text-xs"
                                >
                                  Xem
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (mailto) window.open(mailto, "_blank");
                                  }}
                                  disabled={!mailto}
                                  className="h-8 text-xs bg-primary hover:bg-primary/90"
                                >
                                  Mời
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!selectedCandidate}
        onOpenChange={() => setSelectedCandidate(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Hồ sơ ứng viên</DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedCandidate.name}
                  </p>
                  {selectedCandidate.email && (
                    <p className="text-sm text-gray-600">
                      {selectedCandidate.email}
                    </p>
                  )}
                  {(selectedCandidate.phone || selectedCandidate.location) && (
                    <p className="text-sm text-gray-600">
                      {selectedCandidate.phone ? `${selectedCandidate.phone} · ` : ""}
                      {selectedCandidate.location || ""}
                    </p>
                  )}
                  {selectedCandidate.tier && (
                    <p className="text-sm text-blue-600 mt-1">
                      Tier: {selectedCandidate.tier}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-700">
                    Điểm: {Math.round(selectedCandidate.score)}%
                  </p>
                {selectedCandidate.semanticScore !== undefined && (
                  <p className="text-xs text-gray-600">
                    Semantic:{" "}
                    {Math.round((selectedCandidate.semanticScore || 0) * 100) /
                      100}
                  </p>
                )}
                {selectedCandidate.method && (
                  <p className="text-xs text-gray-600">
                    Method: {selectedCandidate.method}
                  </p>
                )}
                </div>
              </div>

              {selectedCandidate.matchedSkills &&
                selectedCandidate.matchedSkills.length > 0 && (
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Kỹ năng khớp</p>
                    <p className="text-gray-600">
                      {selectedCandidate.matchedSkills.join(", ")}
                    </p>
                  </div>
                )}

              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Kỹ năng
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.slice(0, 15).map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedCandidate.experienceList &&
                selectedCandidate.experienceList.length > 0 && (
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Kinh nghiệm</p>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedCandidate.experienceList.map((exp: string, idx: number) => (
                        <li key={idx}>{exp}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedCandidate.education &&
                (selectedCandidate.education.degree ||
                  selectedCandidate.education.major ||
                  selectedCandidate.education.institution) && (
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-1">Học vấn</p>
                    <p className="text-gray-600">
                      {[selectedCandidate.education.degree, selectedCandidate.education.major, selectedCandidate.education.institution]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                )}

              {selectedCandidate.summary && (
                <div className="text-sm text-gray-700">
                  <p className="font-medium mb-1">Tóm tắt</p>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {selectedCandidate.summary}
                  </p>
                </div>
              )}

              {selectedCandidate.raw?.scoreBreakdown &&
                typeof selectedCandidate.raw.scoreBreakdown === "object" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {Object.entries(
                    (selectedCandidate.raw?.scoreBreakdown ?? {}) as Record<string, any>
                  ).map(
                    ([key, val]: any) => {
                      const details =
                        val?.details && typeof val.details === "object"
                          ? val.details
                          : {};
                      return (
                        <Card key={key} className="border-blue-100">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-medium capitalize text-gray-800">
                                {key.replace("Score", "")}
                              </p>
                              <p className="text-blue-700 font-semibold">
                                {Math.round(val?.score ?? 0)}% (w{" "}
                                {val?.weight ?? 0})
                              </p>
                            </div>
                            {Object.keys(details).length > 0 && (
                              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                {Object.entries(details).map(([k, v]) => {
                                  const valString = Array.isArray(v)
                                    ? v.join(", ")
                                    : v && typeof v === "object"
                                    ? Object.values(v as Record<string, any>).join(", ")
                                    : String(v ?? "");
                                  return (
                                  <li key={k}>
                                    <span className="font-medium">{k}:</span>{" "}
                                    {Array.isArray(v)
                                      ? v.join(", ")
                                      : typeof v === "object" && v !== null
                                      ? Object.values(v).join(", ")
                                      : String(v)}
                                  </li>
                                  );
                                })}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  value={
                    typeof formData.address === "string"
                      ? formData.address
                      : formData.address?.fullAddress ?? ""
                  }
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
