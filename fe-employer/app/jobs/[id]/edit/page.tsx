"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CreateJobPayload, updateJob } from "@/lib/jobAPI";
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
import { X, Plus, ArrowLeft } from "lucide-react";
import { getCities, getDistricts, getWards } from "@/lib/vietnamAddress";
import { findOptionByLabelLoose } from "@/lib/addressUtils";
import { getJobById } from "@/lib/jobAPI";
import { getToken } from "@/lib/userStorage";

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

      const result = await updateJob(jobId, payload, token);

      if (result.success) {
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

  if (error && !formData.title) {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </div>
        <h1 className="text-2xl font-semibold mb-2">
          Chỉnh sửa bài tuyển dụng
        </h1>
        <p className="text-gray-600">Cập nhật thông tin về vị trí tuyển dụng</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              <p className="text-xs text-gray-500 mt-1">
                Slug sẽ được tự động tạo từ tiêu đề nếu chưa chỉnh sửa
              </p>
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
                  onValueChange={(value) => handleInputChange("jobType", value)}
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
                        <SelectItem key={district.value} value={district.value}>
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
                  handleInputChange("positions", parseInt(e.target.value) || 1)
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
                onChange={(e) => handleInputChange("benefits", e.target.value)}
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
              {formData.skills.length === 0 && (
                <p className="text-sm text-gray-500">
                  Chưa có kỹ năng nào được thêm
                </p>
              )}
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
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange("deadline", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </div>
  );
}
