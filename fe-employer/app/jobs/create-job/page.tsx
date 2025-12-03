"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createJob, CreateJobPayload } from "@/lib/jobAPI";
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
import { X, Plus } from "lucide-react";
import { getCities, getDistricts, getWards } from "@/lib/vietnamAddress";

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

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  // Separate state for street address (detailed address)
  const [streetAddress, setStreetAddress] = useState<string>("");

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

  // Load cities on mount
  useEffect(() => {
    const loadCities = async () => {
      setLoadingAddress(true);
      try {
        const data = await getCities();
        setCities(data);
      } catch (err) {
        console.error("Failed to load cities:", err);
      } finally {
        setLoadingAddress(false);
      }
    };
    loadCities();
  }, []);

  // Load districts when city changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (selectedCity) {
        setLoadingAddress(true);
        try {
          const data = await getDistricts(selectedCity);
          setDistricts(data);
          // Reset district and ward when city changes
          setSelectedDistrict("");
          setSelectedWard("");
          setWards([]);
        } catch (err) {
          console.error("Failed to load districts:", err);
          setDistricts([]);
        } finally {
          setLoadingAddress(false);
        }
      } else {
        setDistricts([]);
        setSelectedDistrict("");
        setSelectedWard("");
        setWards([]);
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
          // Reset ward when district changes
          setSelectedWard("");
        } catch (err) {
          console.error("Failed to load wards:", err);
          setWards([]);
        } finally {
          setLoadingAddress(false);
        }
      } else {
        setWards([]);
        setSelectedWard("");
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
          // Reset subIndustryCode when industry changes
          setFormData((prev) => ({ ...prev, subIndustryCode: "" }));
        } catch (err) {
          console.error("Failed to load sub-industries:", err);
          setSubIndustries([]);
        } finally {
          setLoadingIndustries(false);
        }
      } else {
        setSubIndustries([]);
        setFormData((prev) => ({ ...prev, subIndustryCode: "" }));
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
    setLoading(true);
    setError(null);

    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập để tạo bài tuyển dụng");
        setLoading(false);
        return;
      }

      // Format deadline to ISO string
      let deadline = formData.deadline;
      if (deadline) {
        // datetime-local returns format: "YYYY-MM-DDTHH:mm" (local time)
        // Convert to ISO string with UTC timezone
        const date = new Date(deadline);
        if (!isNaN(date.getTime())) {
          deadline = date.toISOString();
        } else {
          setError("Ngày hết hạn không hợp lệ");
          setLoading(false);
          return;
        }
      }

      // Build address object from selected values
      const wardObj = wards.find((w) => w.value === selectedWard);
      const districtObj = districts.find((d) => d.value === selectedDistrict);
      const cityObj = cities.find((c) => c.value === selectedCity);

      const addressObject = {
        street: streetAddress || undefined,
        ward: wardObj?.label || undefined,
        district: districtObj?.label || undefined,
        city: cityObj?.label || undefined,
        country: "Vietnam",
        fullAddress: formData.location || undefined,
      };

      // Prepare payload
      const payload: CreateJobPayload = {
        ...formData,
        deadline,
        // Remove empty optional fields
        slug: formData.slug || undefined,
        benefits: formData.benefits || undefined,
        address: addressObject,
        location: formData.location || undefined,
        skillIds: formData.skillIds?.length ? formData.skillIds : undefined,
        level: formData.level || undefined,
        jobType: formData.jobType || undefined,
        workingMode: formData.workingMode || undefined,
        industryCode: formData.industryCode || undefined,
        subIndustryCode: formData.subIndustryCode || undefined,
      };

      const result = await createJob(payload, token);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push("/jobs"), 1500);
      } else {
        setError(result.error || "Có lỗi xảy ra khi tạo bài tuyển dụng");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tạo bài tuyển dụng");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-green-600 text-lg font-semibold mb-2">
              ✅ Tin của bạn đã được lưu nháp!
            </div>
            <p className="text-gray-600">Đang chuyển về trang quản lý tin...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Tạo bài tuyển dụng mới</h1>
        <p className="text-gray-600">
          Điền thông tin chi tiết về vị trí tuyển dụng
        </p>
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
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
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
                type="datetime-local"
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
            disabled={loading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo bài tuyển dụng"}
          </Button>
        </div>
      </form>
    </div>
  );
}
