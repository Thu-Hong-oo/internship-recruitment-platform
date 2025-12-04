"use client";

import { useState, useEffect, useRef } from "react";
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
  UserCircle2,
  ArrowLeft,
  Edit3,
  FileText,
  AlertCircle,
} from "lucide-react";
import { getToken } from "@/lib/userStorage";
import { useVietnamAddress } from "@/hooks/useVietnamAddress";
import { AddressOption, findOptionByLabelLoose } from "@/lib/addressUtils";
import {
  getCompanyInfo,
  updateCompanyInfo,
  uploadCompanyLogo,
  uploadCompanyCoverImage,
  CompanyFormData,
} from "@/lib/companyAPI";
import { useVerificationContext } from "@/contexts/VerificationContext";
import { industryService, type Industry } from "@/lib/industryAPI";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  isPlaceholderCompanyData,
  isPlaceholderText,
  isPlaceholderEmail,
  isPlaceholderPhone,
  isPlaceholderRegistrationNumber,
  isPlaceholderTaxId,
} from "@/lib/placeholderUtils";

export default function CompanyPage() {
  const router = useRouter();
  const { refreshVerification } = useVerificationContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [companyView, setCompanyView] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);
  const [isPlaceholder, setIsPlaceholder] = useState(false);

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadLogo = async (file: File) => {
    try {
      setUploadingLogo(true);
      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập lại");
        return;
      }

      const result = await uploadCompanyLogo(token, file);

      if (result.success) {
        setCompanyView((prev: any) => ({
          ...(prev || {}),
          logo: result.data?.logoUrl || prev?.logo,
        }));
        setSuccess(result.message || "Tải logo thành công");
      } else {
        setError(result.error || "Tải logo thất bại");
      }
    } catch (e: any) {
      setError(e?.message || "Không thể tải logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleUploadCover = async (file: File) => {
    try {
      setUploadingCover(true);
      const token = getToken();
      if (!token) {
        setError("Vui lòng đăng nhập lại");
        return;
      }

      const result = await uploadCompanyCoverImage(token, file);

      if (result.success) {
        setCompanyView((prev: any) => ({
          ...(prev || {}),
          coverImage: result.data?.coverImageUrl || prev?.coverImage,
        }));
        setSuccess(result.message || "Tải ảnh bìa thành công");
      } else {
        setError(result.error || "Tải ảnh bìa thất bại");
      }
    } catch (e: any) {
      setError(e?.message || "Không thể tải ảnh bìa");
    } finally {
      setUploadingCover(false);
    }
  };

  const [formData, setFormData] = useState<CompanyFormData>({
    company: {
      name: "",
      industry: "",
      size: "",
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

  // Sync dropdowns when districts are loaded
  useEffect(() => {
    if (districts.length > 0 && companyView?.businessInfo?.address?.district) {
      const districtLabel = companyView.businessInfo.address.district;
      const districtOpt = districts.find((o) => o.label === districtLabel);
      if (districtOpt && selectedDistrictCode !== districtOpt.value) {
        setSelectedDistrictCode(districtOpt.value);
        loadWards(districtOpt.value);
      }
    }
  }, [districts, companyView]);

  // Sync dropdowns when wards are loaded
  useEffect(() => {
    if (wards.length > 0 && companyView?.businessInfo?.address?.ward) {
      const wardLabel = companyView.businessInfo.address.ward;
      const wardOpt = wards.find((o) => o.label === wardLabel);
      if (wardOpt && selectedWardCode !== wardOpt.value) {
        setSelectedWardCode(wardOpt.value);
      }
    }
  }, [wards, companyView]);

  // Prefill from GET /employers/company
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const result = await getCompanyInfo(token);
        if (!result.success || !result.data) return;
        const data = result.data;

        // Check if data is placeholder
        const isPlaceholderData = isPlaceholderCompanyData(data);
        setIsPlaceholder(isPlaceholderData);

        setCompanyView({
          ...data,
          logo: data?.logo || data?.company?.logo?.url || data?.company?.logo,
          coverImage:
            data?.coverImage ||
            data?.company?.coverImage?.url ||
            data?.company?.coverImage,
        });

        setFormData((prev) => {
          const businessInfo = data.businessInfo || {};
          const address = businessInfo.address || {};
          const legalRep = data.legalRepresentative || {};

          const normalizedIssueDate =
            businessInfo.issueDate && !isPlaceholderData
              ? new Date(businessInfo.issueDate).toISOString().split("T")[0]
              : "";

          return {
            ...prev,
            company: {
              ...prev.company,
              name: isPlaceholderText(data.name) ? "" : data.name || "",
              industry: isPlaceholderData ? "" : data.industry || "",
              size: isPlaceholderData ? "" : data.size || "",
              email: isPlaceholderEmail(data.email) ? "" : data.email || "",
              website: data.website || "",
              description: data.description || "",
              foundedYear: data.foundedYear ?? "",
              employeesCount: data.employeesCount ?? "",
            },
            businessInfo: {
              ...prev.businessInfo,
              registrationNumber: isPlaceholderRegistrationNumber(
                businessInfo.registrationNumber
              )
                ? ""
                : businessInfo.registrationNumber || "",
              taxId: isPlaceholderTaxId(businessInfo.taxId)
                ? ""
                : businessInfo.taxId || "",
              issueDate: normalizedIssueDate,
              issuePlace: isPlaceholderText(businessInfo.issuePlace)
                ? ""
                : businessInfo.issuePlace || "",
              address: {
                ...prev.businessInfo.address,
                street: isPlaceholderText(address.street)
                  ? ""
                  : address.street || "",
                ward: isPlaceholderText(address.ward) ? "" : address.ward || "",
                district: isPlaceholderText(address.district)
                  ? ""
                  : address.district || "",
                city: isPlaceholderText(address.city) ? "" : address.city || "",
                country: address.country || "Vietnam",
              },
            },
            legalRepresentative: {
              ...prev.legalRepresentative,
              fullName: isPlaceholderText(legalRep.fullName)
                ? ""
                : legalRep.fullName || "",
              position: isPlaceholderText(legalRep.position)
                ? ""
                : legalRep.position || "",
              phone: isPlaceholderPhone(legalRep.phone)
                ? ""
                : legalRep.phone || "",
              email: isPlaceholderEmail(legalRep.email)
                ? ""
                : legalRep.email || "",
            },
          };
        });

        // Sync dropdown selection by matching labels to options
        const syncAddressDropdowns = async () => {
          const cityLabel = data.businessInfo?.address?.city;
          const districtLabel = data.businessInfo?.address?.district;
          const wardLabel = data.businessInfo?.address?.ward;

          console.log("Syncing address dropdowns:", {
            cityLabel,
            districtLabel,
            wardLabel,
          });
          console.log("Available cities:", cities.length);

          if (cityLabel && cities.length > 0) {
            const cityOpt = cities.find((o) => o.label === cityLabel);
            console.log("Found city option:", cityOpt);

            if (cityOpt) {
              setSelectedCityKey(cityOpt.value);
              await loadDistricts(cityOpt.value);

              // Wait for districts to load, then set district
              setTimeout(() => {
                if (districtLabel) {
                  const districtOpt = districts.find(
                    (o) => o.label === districtLabel
                  );
                  console.log("Found district option:", districtOpt);

                  if (districtOpt) {
                    setSelectedDistrictCode(districtOpt.value);
                    loadWards(districtOpt.value);

                    // Wait for wards to load, then set ward
                    setTimeout(() => {
                      if (wardLabel) {
                        const wardOpt = wards.find(
                          (o) => o.label === wardLabel
                        );
                        console.log("Found ward option:", wardOpt);

                        if (wardOpt) {
                          setSelectedWardCode(wardOpt.value);
                        }
                      }
                    }, 300);
                  }
                }
              }, 300);
            }
          }
        };

        // Delay sync to ensure cities are loaded
        setTimeout(syncAddressDropdowns, 100);
      } catch (e) {
        // silent
      }
    };

    if (cities.length) fetchCompany();
  }, [cities]);

  // Fetch industries on mount
  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        setLoadingIndustries(true);
        const rootIndustries = await industryService.getRootIndustries();
        setIndustries(rootIndustries);
      } catch (error) {
        console.error("Failed to fetch industries:", error);
        setError("Không thể tải danh sách ngành nghề");
      } finally {
        setLoadingIndustries(false);
      }
    };

    fetchIndustries();
  }, []);

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

      const result = await updateCompanyInfo(token, formData);

      if (result.success) {
        setSuccess(result.message || "Cập nhật thông tin công ty thành công");
        // Thoát chế độ chỉnh sửa sau khi lưu thành công
        setIsEditing(false);
        // Refresh verification status after successful update
        refreshVerification();
        // Refresh company data to update placeholder status
        const refreshResult = await getCompanyInfo(token);
        if (refreshResult.success && refreshResult.data) {
          const data = refreshResult.data;
          setIsPlaceholder(isPlaceholderCompanyData(data));
          setCompanyView({
            ...data,
            logo: data?.logo || data?.company?.logo?.url || data?.company?.logo,
            coverImage:
              data?.coverImage ||
              data?.company?.coverImage?.url ||
              data?.company?.coverImage,
          });
        }
      } else {
        setError(result.error || "Cập nhật thất bại");
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
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/company/documents")}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Tài liệu công ty
              </Button>
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
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Placeholder Data Alert */}
        {isPlaceholder && !isEditing && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">
              Dữ liệu mẫu được hiển thị
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              Thông tin công ty hiện tại là dữ liệu mẫu. Vui lòng cập nhật thông
              tin thực tế của công ty để sử dụng đầy đủ các tính năng của hệ
              thống.
            </AlertDescription>
          </Alert>
        )}

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
                      {companyView?.logo ||
                      companyView?.company?.logo?.url ||
                      companyView?.company?.logo ? (
                        <img
                          src={
                            companyView.logo ||
                            companyView?.company?.logo?.url ||
                            (companyView?.company?.logo as any)
                          }
                          alt="Logo"
                          className="h-16 w-16 rounded object-cover border"
                        />
                      ) : (
                        <div className="text-slate-500">Chưa có logo</div>
                      )}
                      <div className="mt-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadLogo(f);
                            e.currentTarget.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="mt-1"
                        >
                          {uploadingLogo ? "Đang tải..." : "Thay đổi logo"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Ảnh bìa</Label>
                    <div className="mt-2">
                      {companyView?.coverImage ||
                      companyView?.company?.coverImage?.url ||
                      companyView?.company?.coverImage ? (
                        <img
                          src={
                            companyView.coverImage ||
                            companyView?.company?.coverImage?.url ||
                            (companyView?.company?.coverImage as any)
                          }
                          alt="Cover"
                          className="h-28 w-full max-w-md rounded object-cover border"
                        />
                      ) : (
                        <div className="text-slate-500">Chưa có ảnh bìa</div>
                      )}
                      <div className="mt-2">
                        <input
                          ref={coverInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUploadCover(f);
                            e.currentTarget.value = "";
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={uploadingCover}
                          className="mt-1"
                        >
                          {uploadingCover ? "Đang tải..." : "Thay đổi ảnh bìa"}
                        </Button>
                      </div>
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
                    {isPlaceholderText(formData.company.name)
                      ? "Chưa cập nhật"
                      : formData.company.name || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Ngành:</span>{" "}
                    {isPlaceholder
                      ? "Chưa cập nhật"
                      : industries.find(
                          (i) => i.code === formData.company.industry
                        )?.name?.vi ||
                        industries.find(
                          (i) => i.code === formData.company.industry
                        )?.name?.en ||
                        formData.company.industry ||
                        "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Quy mô:</span>{" "}
                    {isPlaceholder
                      ? "Chưa cập nhật"
                      : sizeOptions.find(
                          (o) => o.value === formData.company.size
                        )?.label ||
                        formData.company.size ||
                        "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Email:</span>{" "}
                    {isPlaceholderEmail(formData.company.email)
                      ? "Chưa cập nhật"
                      : formData.company.email || "Chưa cập nhật"}
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
                    {isPlaceholderText(formData.businessInfo.address.street)
                      ? "Chưa cập nhật"
                      : formData.businessInfo.address.street || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Phường/Xã:</span>{" "}
                    {isPlaceholderText(formData.businessInfo.address.ward)
                      ? "Chưa cập nhật"
                      : formData.businessInfo.address.ward || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Quận/Huyện:</span>{" "}
                    {isPlaceholderText(formData.businessInfo.address.district)
                      ? "Chưa cập nhật"
                      : formData.businessInfo.address.district ||
                        "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Tỉnh/Thành phố:</span>{" "}
                    {isPlaceholderText(formData.businessInfo.address.city)
                      ? "Chưa cập nhật"
                      : formData.businessInfo.address.city || "Chưa cập nhật"}
                  </div>
                  <div>
                    <span className="text-slate-500">Quốc gia:</span>{" "}
                    {formData.businessInfo.address.country || "Chưa cập nhật"}
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        )}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" /> Thông tin công
                  ty
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
                      disabled={loadingIndustries}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingIndustries ? "Đang tải..." : "Chọn ngành"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry.code} value={industry.code}>
                            {industry.name.vi ||
                              industry.name.en ||
                              industry.code}
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
                      onChange={(e) =>
                        setField("company.email", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company.website">Website</Label>
                    <Input
                      id="company.website"
                      // Chuyển thành type="text" để cho phép nhập các dạng như bluewaveagency.vn, example.com, v.v.
                      type="text"
                      placeholder="https://example.com, example.com"
                      value={formData.company.website}
                      onChange={(e) => setField("company.website", e.target.value)}
                      pattern="^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Bạn có thể nhập dạng https://example.com, example.com hoặc bluewaveagency.vn - hệ thống sẽ tự động thêm https:// nếu bạn chưa nhập.
                    </p>
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
                          setField(
                            "businessInfo.address.street",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:justify-between justify-between">
                      <div className="flex-1">
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
                      <div className="flex-1">
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
                      <div className="flex-1">
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Representative */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle2 className="w-5 h-5 text-primary" /> Người đại
                  diện pháp luật
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
                <div className="text-red-800 whitespace-pre-line">
                  {typeof error === "string" ? error : JSON.stringify(error)}
                </div>
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
                onClick={() => setIsEditing(false)}
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
        ) : (
          <div className="space-y-6">
            {/* View Mode - Business Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin pháp lý</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Số ĐKKD</Label>
                    <div className="mt-1 text-slate-900">
                      {isPlaceholder ||
                      isPlaceholderRegistrationNumber(
                        formData.businessInfo.registrationNumber
                      )
                        ? "Chưa cập nhật"
                        : formData.businessInfo.registrationNumber ||
                          "Chưa cập nhật"}
                    </div>
                  </div>
                  <div>
                    <Label>Mã số thuế</Label>
                    <div className="mt-1 text-slate-900">
                      {isPlaceholder ||
                      isPlaceholderTaxId(formData.businessInfo.taxId)
                        ? "Chưa cập nhật"
                        : formData.businessInfo.taxId || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ngày cấp</Label>
                    <div className="mt-1 text-slate-900">
                      {!formData.businessInfo.issueDate || isPlaceholder
                        ? "Chưa cập nhật"
                        : formData.businessInfo.issueDate}
                    </div>
                  </div>
                  <div>
                    <Label>Nơi cấp</Label>
                    <div className="mt-1 text-slate-900">
                      {isPlaceholderText(formData.businessInfo.issuePlace)
                        ? "Chưa cập nhật"
                        : formData.businessInfo.issuePlace || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Địa chỉ</Label>
                  <div className="mt-1 text-slate-900">
                    {(() => {
                      const addressParts = [
                        formData.businessInfo.address.street,
                        formData.businessInfo.address.ward,
                        formData.businessInfo.address.district,
                        formData.businessInfo.address.city,
                        formData.businessInfo.address.country,
                      ];
                      const hasPlaceholder = addressParts.some(
                        (part) => part && isPlaceholderText(part)
                      );
                      if (hasPlaceholder) return "Chưa cập nhật";
                      return (
                        addressParts.filter(Boolean).join(", ") ||
                        "Chưa cập nhật"
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Mode - Legal Representative */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle2 className="w-5 h-5 text-primary" /> Người đại
                  diện pháp luật
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Họ và tên</Label>
                    <div className="mt-1 text-slate-900">
                      {isPlaceholderText(formData.legalRepresentative.fullName)
                        ? "Chưa cập nhật"
                        : formData.legalRepresentative.fullName ||
                          "Chưa cập nhật"}
                    </div>
                  </div>
                  <div>
                    <Label>Chức vụ</Label>
                    <div className="mt-1 text-slate-900">
                      {isPlaceholderText(formData.legalRepresentative.position)
                        ? "Chưa cập nhật"
                        : formData.legalRepresentative.position ||
                          "Chưa cập nhật"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Số điện thoại</Label>
                    <div className="mt-1 text-slate-900">
                      {isPlaceholderPhone(formData.legalRepresentative.phone)
                        ? "Chưa cập nhật"
                        : formData.legalRepresentative.phone || "Chưa cập nhật"}
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <div className="mt-1 text-slate-900">
                      {isPlaceholderEmail(formData.legalRepresentative.email)
                        ? "Chưa cập nhật"
                        : formData.legalRepresentative.email || "Chưa cập nhật"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
