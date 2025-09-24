"use client";

import { useState, useEffect } from "react";
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
import { Save, Building2, UserCircle2, ArrowLeft, Edit3 } from "lucide-react";
import { getToken } from "@/lib/userStorage";
import { useVietnamAddress } from "@/hooks/useVietnamAddress";
import { AddressOption, findOptionByLabelLoose } from "@/lib/addressUtils";

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
      ward: string;
      district: string;
      city: string;
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
  const [isEditing, setIsEditing] = useState(false);
  const [companyView, setCompanyView] = useState<any>(null);

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

  // Vietnam address dropdowns
  const {
    cities,
    districts,
    wards,
    loadDistricts,
    loadWards,
    resetDistricts,
    resetWards,
  } = useVietnamAddress();

  const [selectedCityKey, setSelectedCityKey] = useState<string>("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<string>("");
  const [selectedWardCode, setSelectedWardCode] = useState<string>("");

  // When city changes, load districts and set city label
  useEffect(() => {
    if (!selectedCityKey) {
      resetDistricts();
      setSelectedDistrictCode("");
      setSelectedWardCode("");
      resetWards();
      return;
    }
    const selected = cities.find((c) => c.value === selectedCityKey);
    setField("businessInfo.address.city", selected?.label || "");
    loadDistricts(selectedCityKey);
    setSelectedDistrictCode("");
    setSelectedWardCode("");
    resetWards();
  }, [selectedCityKey]);

  // When district changes, load wards and set district label
  useEffect(() => {
    if (!selectedDistrictCode) {
      setSelectedWardCode("");
      resetWards();
      return;
    }
    const selected = districts.find((d) => d.value === selectedDistrictCode);
    setField("businessInfo.address.district", selected?.label || "");
    loadWards(selectedDistrictCode);
  }, [selectedDistrictCode]);

  // When ward changes, set ward label
  useEffect(() => {
    if (!selectedWardCode) return;
    const selected = wards.find((w) => w.value === selectedWardCode);
    setField("businessInfo.address.ward", selected?.label || "");
  }, [selectedWardCode]);

  // Prefill from GET /employers/company
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const res = await fetch("http://localhost:3000/api/employers/company", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        const data = json?.data;
        if (!data?.company) return;
        setCompanyView(data);
        const c = data.company;
        setFormData((prev) => ({
          ...prev,
          company: {
            ...prev.company,
            name: c.name || "",
            industry: c.industry || prev.company.industry,
            size: c.size || prev.company.size,
            email: c.email || "",
            website: c.website || "",
            description: c.description || "",
            foundedYear: c.foundedYear ?? "",
            employeesCount: c.employeesCount ?? "",
          },
          businessInfo: {
            ...prev.businessInfo,
            address: {
              ...prev.businessInfo.address,
              street: c.officeAddress?.street || "",
              ward: c.officeAddress?.ward || "",
              district: c.officeAddress?.district || "",
              city: c.officeAddress?.city || "",
              country: c.officeAddress?.country || "Vietnam",
            },
          },
        }));

        // Sync dropdown selection by matching labels to options
        const cityOpt = (cities || []).find(
          (o) => o.label === c.officeAddress?.city
        );
        if (cityOpt) {
          setSelectedCityKey(cityOpt.value);
          await loadDistricts(cityOpt.value);
          const districtOpt = (districts || []).find(
            (o) => o.label === c.officeAddress?.district
          );
          if (districtOpt) {
            setSelectedDistrictCode(districtOpt.value);
            await loadWards(districtOpt.value);
            const wardOpt = (wards || []).find(
              (o) => o.label === c.officeAddress?.ward
            );
            if (wardOpt) setSelectedWardCode(wardOpt.value);
          }
        }
      } catch (e) {
        // silent
      }
    };

    if (cities.length) fetchCompany();
  }, [cities]);

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

      const body = {
        company: formData.company,
        businessInfo: {
          registrationNumber: formData.businessInfo.registrationNumber,
          taxId: formData.businessInfo.taxId,
          issueDate: formData.businessInfo.issueDate
            ? new Date(formData.businessInfo.issueDate).toISOString()
            : "",
          issuePlace: formData.businessInfo.issuePlace,
          address: formData.businessInfo.address,
        },
        legalRepresentative: formData.legalRepresentative,
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
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
                  Thông tin công ty và người đại diện
                </p>
              </div>
            </div>
            {!isEditing && (
              <Button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-primary text-white hover:brightness-110 shadow-sm px-4"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Chỉnh sửa
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {!isEditing && (
          <div className="space-y-6">
            {/* View Mode - Company visuals */}
            <Card>
              <CardHeader>
                <CardTitle>Hình ảnh công ty</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Logo</Label>
                    <div className="mt-2">
                      {companyView?.company?.logo?.url ? (
                        <img
                          src={companyView.company.logo.url}
                          alt="Logo"
                          className="h-16 w-16 rounded object-cover border"
                        />
                      ) : (
                        <div className="text-slate-500">Chưa có logo</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Ảnh bìa</Label>
                    <div className="mt-2">
                      {companyView?.company?.coverImage?.url ? (
                        <img
                          src={companyView.company.coverImage.url}
                          alt="Cover"
                          className="h-28 w-full max-w-md rounded object-cover border"
                        />
                      ) : (
                        <div className="text-slate-500">Chưa có ảnh bìa</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin công ty</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-slate-900">
                  <div>
                    <span className="text-slate-500">Tên:</span>{" "}
                    {formData.company.name || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Ngành:</span>{" "}
                    {formData.company.industry}
                  </div>
                  <div>
                    <span className="text-slate-500">Quy mô:</span>{" "}
                    {formData.company.size}
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>{" "}
                    {formData.company.email || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Website:</span>{" "}
                    {formData.company.website || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Năm thành lập:</span>{" "}
                    {formData.company.foundedYear || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Số nhân sự:</span>{" "}
                    {formData.company.employeesCount || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Mô tả:</span>
                    <div className="mt-1 whitespace-pre-line">
                      {formData.company.description || "Chưa cập nhật"}
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Địa chỉ văn phòng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-slate-900">
                  <div>
                    <span className="text-slate-500">Địa chỉ:</span>{" "}
                    {formData.businessInfo.address.street || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Phường/Xã:</span>{" "}
                    {formData.businessInfo.address.ward || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Quận/Huyện:</span>{" "}
                    {formData.businessInfo.address.district || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Tỉnh/Thành phố:</span>{" "}
                    {formData.businessInfo.address.city || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Quốc gia:</span>{" "}
                    {formData.businessInfo.address.country || "Chưa cập nhật"}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Thống kê</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">
                    {companyView?.stats?.totalJobs ?? 0}
                  </div>
                  <div className="text-slate-500">Tổng tin</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {companyView?.stats?.activeJobs ?? 0}
                  </div>
                  <div className="text-slate-500">Đang hoạt động</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {companyView?.stats?.totalApplications ?? 0}
                  </div>
                  <div className="text-slate-500">Ứng tuyển</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {companyView?.stats?.successfulHires ?? 0}
                  </div>
                  <div className="text-slate-500">Tuyển thành công</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
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
              <CardTitle>Thông tin pháp lý</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessInfo.registrationNumber">
                    Số ĐKKD *
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
                  <Label htmlFor="businessInfo.taxId">Mã số thuế *</Label>
                  <Input
                    id="businessInfo.taxId"
                    value={formData.businessInfo.taxId}
                    onChange={(e) =>
                      setField("businessInfo.taxId", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="businessInfo.issuePlace">Nơi cấp *</Label>
                  <Input
                    id="businessInfo.issuePlace"
                    value={formData.businessInfo.issuePlace}
                    onChange={(e) =>
                      setField("businessInfo.issuePlace", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <Label>Địa chỉ</Label>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Số nhà, tên đường"
                      value={formData.businessInfo.address.street}
                      onChange={(e) =>
                        setField("businessInfo.address.street", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Select
                      value={selectedCityKey}
                      onValueChange={(v) => setSelectedCityKey(v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tỉnh/Thành phố" />
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
                    <Select
                      value={selectedDistrictCode}
                      onValueChange={(v) => setSelectedDistrictCode(v)}
                      disabled={!selectedCityKey}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Quận/Huyện" />
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
                    <Select
                      value={selectedWardCode}
                      onValueChange={(v) => setSelectedWardCode(v)}
                      disabled={!selectedDistrictCode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Phường/Xã" />
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
                  <div>
                    <Input
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
