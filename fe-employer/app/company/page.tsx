"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Building2,
  FileText,
  UserCircle2,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { getToken } from "@/lib/userStorage";
import { useVietnamAddress } from "@/hooks/useVietnamAddress";

interface CompanyFormData {
  company: {
    name: string;
    industry: string;
    size: string;
    email: string;
    website: string;
    description: string;
    foundedYear: number | "";
    employeesCount: number | "";
  };
  businessInfo: {
    registrationNumber: string;
    taxId: string;
    issueDate: string; // yyyy-mm-dd
    issuePlace: string;
    address: {
      street: string;
      ward: string; // name
      district: string; // name
      city: string; // name
      country: string;
    };
  };
  legalRepresentative: {
    fullName: string;
    position: string;
    phone: string;
    email: string;
  };
}

export default function CompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    cities,
    districts,
    wards,
    loading: loadingAddr,
    error: addrError,
    loadDistricts,
    loadWards,
    resetWards,
  } = useVietnamAddress();

  // Track selected codes for address cascading
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>("");

  const [formData, setFormData] = useState<CompanyFormData>({
    company: {
      name: "",
      industry: "technology",
      size: "medium",
      email: "",
      website: "",
      description: "",
      foundedYear: "",
      employeesCount: "",
    },
    businessInfo: {
      registrationNumber: "",
      taxId: "",
      issueDate: "",
      issuePlace: "",
      address: {
        street: "",
        ward: "",
        district: "",
        city: "",
        country: "Vietnam",
      },
    },
    legalRepresentative: {
      fullName: "",
      position: "",
      phone: "",
      email: "",
    },
  });

  // Handlers
  const setField = (path: string, value: any) => {
    setFormData((prev) => {
      const clone: any = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let curr = clone;
      for (let i = 0; i < parts.length - 1; i++) curr = curr[parts[i]];
      curr[parts[parts.length - 1]] = value;
      return clone as CompanyFormData;
    });
  };

  // When province changes, load districts and clear lower levels
  useEffect(() => {
    if (selectedProvinceCode) {
      loadDistricts(selectedProvinceCode);
      setSelectedDistrictCode("");
      setField(
        "businessInfo.address.city",
        cities.find((c) => c.value === selectedProvinceCode)?.label || ""
      );
      setField("businessInfo.address.district", "");
      setField("businessInfo.address.ward", "");
      resetWards();
    }
  }, [selectedProvinceCode, loadDistricts, resetWards, cities]);

  // When district changes, load wards and clear ward
  useEffect(() => {
    if (selectedDistrictCode) {
      loadWards(selectedDistrictCode);
      setField(
        "businessInfo.address.district",
        districts.find((d) => d.value === selectedDistrictCode)?.label || ""
      );
      setField("businessInfo.address.ward", "");
    }
  }, [selectedDistrictCode, loadWards, districts]);

  // Derive current ward name when selected
  const wardNameByCode = useMemo(() => {
    return (code: string) => wards.find((w) => w.value === code)?.label || "";
  }, [wards]);

  const industryOptions = [
    { value: "technology", label: "Công nghệ" },
    { value: "finance", label: "Tài chính" },
    { value: "manufacturing", label: "Sản xuất" },
    { value: "education", label: "Giáo dục" },
    { value: "healthcare", label: "Y tế" },
    { value: "retail", label: "Bán lẻ" },
    { value: "other", label: "Khác" },
  ];

  const sizeOptions = [
    { value: "small", label: "Nhỏ" },
    { value: "medium", label: "Vừa" },
    { value: "large", label: "Lớn" },
    { value: "enterprise", label: "Tập đoàn" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập lại");
        return;
      }

      const body: CompanyFormData = {
        ...formData,
        // Ensure ward name is set from selected wards list if needed
        businessInfo: {
          ...formData.businessInfo,
          address: {
            ...formData.businessInfo.address,
            // city/district already set to human-readable in effects
          },
        },
      };

      const res = await fetch("http://localhost:3000/api/employers/company", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data?.success) {
        setSuccess(data?.message || "Cập nhật thông tin công ty thành công");
      } else {
        setError(data?.error || data?.message || "Cập nhật thất bại");
      }
    } catch (err: any) {
      setError(err?.message || "Không thể kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Cập nhật thông tin công ty
              </h1>
              <p className="text-slate-600">
                Thông tin chung, pháp lý và người đại diện
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" /> Thông tin công ty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company.name">Tên công ty *</Label>
                  <Input
                    id="company.name"
                    value={formData.company.name}
                    onChange={(e) => setField("company.name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company.industry">Ngành *</Label>
                  <Select
                    value={formData.company.industry}
                    onValueChange={(v) => setField("company.industry", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn ngành" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company.size">Quy mô *</Label>
                  <Select
                    value={formData.company.size}
                    onValueChange={(v) => setField("company.size", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn quy mô" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="company.foundedYear">Năm thành lập</Label>
                  <Input
                    id="company.foundedYear"
                    type="number"
                    min={1800}
                    max={new Date().getFullYear()}
                    value={formData.company.foundedYear}
                    onChange={(e) =>
                      setField(
                        "company.foundedYear",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company.email">Email công ty *</Label>
                  <Input
                    id="company.email"
                    type="email"
                    value={formData.company.email}
                    onChange={(e) => setField("company.email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company.website">Website</Label>
                  <Input
                    id="company.website"
                    value={formData.company.website}
                    onChange={(e) =>
                      setField("company.website", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company.employeesCount">Số nhân sự</Label>
                  <Input
                    id="company.employeesCount"
                    type="number"
                    min={0}
                    value={formData.company.employeesCount}
                    onChange={(e) =>
                      setField(
                        "company.employeesCount",
                        e.target.value ? Number(e.target.value) : ""
                      )
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="company.description">Mô tả</Label>
                <Textarea
                  id="company.description"
                  value={formData.company.description}
                  onChange={(e) =>
                    setField("company.description", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Thông tin pháp lý
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="businessInfo.registrationNumber">
                    Mã ĐKKD *
                  </Label>
                  <Input
                    id="businessInfo.registrationNumber"
                    value={formData.businessInfo.registrationNumber}
                    onChange={(e) =>
                      setField(
                        "businessInfo.registrationNumber",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessInfo.taxId">MST *</Label>
                  <Input
                    id="businessInfo.taxId"
                    value={formData.businessInfo.taxId}
                    onChange={(e) =>
                      setField("businessInfo.taxId", e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessInfo.issueDate">Ngày cấp *</Label>
                  <Input
                    id="businessInfo.issueDate"
                    type="date"
                    value={formData.businessInfo.issueDate}
                    onChange={(e) =>
                      setField("businessInfo.issueDate", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessInfo.issuePlace">Nơi cấp</Label>
                  <Input
                    id="businessInfo.issuePlace"
                    value={formData.businessInfo.issuePlace}
                    onChange={(e) =>
                      setField("businessInfo.issuePlace", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Địa chỉ ĐKKD
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Tỉnh/Thành *</Label>
                    <Select
                      value={selectedProvinceCode}
                      onValueChange={(v) => setSelectedProvinceCode(v)}
                      disabled={loadingAddr}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn tỉnh/thành" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quận/Huyện *</Label>
                    <Select
                      value={selectedDistrictCode}
                      onValueChange={(v) => setSelectedDistrictCode(v)}
                      disabled={!selectedProvinceCode || loadingAddr}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quận/huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Phường/Xã *</Label>
                    <Select
                      value={
                        formData.businessInfo.address.ward
                          ? wards.find(
                              (w) =>
                                w.label === formData.businessInfo.address.ward
                            )?.value || ""
                          : ""
                      }
                      onValueChange={(v) =>
                        setField("businessInfo.address.ward", wardNameByCode(v))
                      }
                      disabled={!selectedDistrictCode || loadingAddr}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phường/xã" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((w) => (
                          <SelectItem key={w.value} value={w.value}>
                            {w.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessInfo.address.street">
                      Số nhà, đường *
                    </Label>
                    <Input
                      id="businessInfo.address.street"
                      value={formData.businessInfo.address.street}
                      onChange={(e) =>
                        setField("businessInfo.address.street", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessInfo.address.country">
                      Quốc gia
                    </Label>
                    <Input
                      id="businessInfo.address.country"
                      value={formData.businessInfo.address.country}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Representative */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-primary" /> Người đại diện
                pháp luật
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legalRepresentative.fullName">
                    Họ và tên *
                  </Label>
                  <Input
                    id="legalRepresentative.fullName"
                    value={formData.legalRepresentative.fullName}
                    onChange={(e) =>
                      setField("legalRepresentative.fullName", e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="legalRepresentative.position">
                    Chức vụ *
                  </Label>
                  <Input
                    id="legalRepresentative.position"
                    value={formData.legalRepresentative.position}
                    onChange={(e) =>
                      setField("legalRepresentative.position", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legalRepresentative.phone">
                    Số điện thoại *
                  </Label>
                  <Input
                    id="legalRepresentative.phone"
                    value={formData.legalRepresentative.phone}
                    onChange={(e) =>
                      setField("legalRepresentative.phone", e.target.value)
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="legalRepresentative.email">Email *</Label>
                  <Input
                    id="legalRepresentative.email"
                    type="email"
                    value={formData.legalRepresentative.email}
                    onChange={(e) =>
                      setField("legalRepresentative.email", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {addrError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">{addrError}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />{" "}
              {loading ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
