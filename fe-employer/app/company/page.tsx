"use client";

import type React from "react";

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
import {
  getCompanyInfo,
  updateCompanyInfo,
  uploadCompanyLogo,
  uploadCompanyCoverImage,
  type CompanyFormData,
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
import EmployerShell from "@/components/layout/EmployerShell";

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
    <EmployerShell active="company">
      <div className="space-y-6">
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/company/documents")}
          >
            <FileText className="w-4 h-4 mr-2" /> Tài liệu
          </Button>
          {!isEditing && (
            <Button type="button" onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" /> Chỉnh sửa
            </Button>
          )}
        </div>
        {/* Success/Error Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Lỗi</AlertTitle>
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Thành công</AlertTitle>
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Placeholder Alert */}
        {isPlaceholder && !isEditing && (
          <Alert className="border-amber-200 bg-amber-50">
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

        {/* View Mode */}
        {!isEditing && (
          <div className="space-y-6">
            {/* Company Images Card */}
            <Card>
              <CardHeader>
                <CardTitle>Hình ảnh công ty</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Logo */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700">
                      Logo công ty
                    </Label>
                    <div className="space-y-3">
                      {companyView?.logo ||
                      companyView?.company?.logo?.url ||
                      companyView?.company?.logo ? (
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-xl border-2 border-slate-200 overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-shadow">
                            <img
                              src={
                                companyView.logo ||
                                companyView?.company?.logo?.url ||
                                (companyView?.company?.logo as any) ||
                                "/placeholder.svg"
                              }
                              alt="Logo"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                          <Building2 className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div>
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
                        >
                          {uploadingLogo ? "Đang tải..." : "Thay đổi logo"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-700">
                      Ảnh bìa
                    </Label>
                    <div className="space-y-3">
                      {companyView?.coverImage ||
                      companyView?.company?.coverImage?.url ||
                      companyView?.company?.coverImage ? (
                        <div className="relative group">
                          <div className="w-full h-32 rounded-xl border-2 border-slate-200 overflow-hidden bg-white shadow-sm group-hover:shadow-md transition-shadow">
                            <img
                              src={
                                companyView.coverImage ||
                                companyView?.company?.coverImage?.url ||
                                (companyView?.company?.coverImage as any) ||
                                "/placeholder.svg"
                              }
                              alt="Cover"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                          <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                      <div>
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
                        >
                          {uploadingCover ? "Đang tải..." : "Thay đổi ảnh bìa"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Company Info & Address Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin công ty</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <dl className="space-y-4">
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Tên công ty
                      </dt>
                      <dd className="text-base font-semibold text-slate-900">
                        {isPlaceholderText(formData.company.name)
                          ? "Chưa cập nhật"
                          : formData.company.name || "Chưa cập nhật"}
                      </dd>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Ngành nghề
                        </dt>
                        <dd className="text-sm text-slate-900">
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
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Quy mô
                        </dt>
                        <dd className="text-sm text-slate-900">
                          {isPlaceholder
                            ? "Chưa cập nhật"
                            : sizeOptions.find(
                                (o) => o.value === formData.company.size
                              )?.label ||
                              formData.company.size ||
                              "Chưa cập nhật"}
                        </dd>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Năm thành lập
                        </dt>
                        <dd className="text-sm text-slate-900">
                          {formData.company.foundedYear || "Chưa cập nhật"}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Số nhân sự
                        </dt>
                        <dd className="text-sm text-slate-900">
                          {formData.company.employeesCount || "Chưa cập nhật"}
                        </dd>
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Email
                      </dt>
                      <dd className="text-sm text-primary">
                        {isPlaceholderEmail(formData.company.email)
                          ? "Chưa cập nhật"
                          : formData.company.email || "Chưa cập nhật"}
                      </dd>
                    </div>

                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Website
                      </dt>
                      <dd className="text-sm text-primary">
                        {formData.company.website || "Chưa cập nhật"}
                      </dd>
                    </div>

                    {formData.company.description && (
                      <div className="flex flex-col pt-2 border-t">
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                          Mô tả
                        </dt>
                        <dd className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                          {formData.company.description}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Địa chỉ văn phòng</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <dl className="space-y-4">
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Địa chỉ
                      </dt>
                      <dd className="text-sm text-slate-900">
                        {isPlaceholderText(formData.businessInfo.address.street)
                          ? "Chưa cập nhật"
                          : formData.businessInfo.address.street ||
                            "Chưa cập nhật"}
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Phường/Xã
                      </dt>
                      <dd className="text-sm text-slate-900">
                        {isPlaceholderText(formData.businessInfo.address.ward)
                          ? "Chưa cập nhật"
                          : formData.businessInfo.address.ward ||
                            "Chưa cập nhật"}
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Quận/Huyện
                      </dt>
                      <dd className="text-sm text-slate-900">
                        {isPlaceholderText(
                          formData.businessInfo.address.district
                        )
                          ? "Chưa cập nhật"
                          : formData.businessInfo.address.district ||
                            "Chưa cập nhật"}
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Tỉnh/Thành phố
                      </dt>
                      <dd className="text-sm text-slate-900">
                        {isPlaceholderText(formData.businessInfo.address.city)
                          ? "Chưa cập nhật"
                          : formData.businessInfo.address.city ||
                            "Chưa cập nhật"}
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Quốc gia
                      </dt>
                      <dd className="text-sm text-slate-900">
                        {formData.businessInfo.address.country ||
                          "Chưa cập nhật"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            {/* Business Info & Legal Rep Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Business Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin pháp lý</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <dl className="space-y-4">
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Số ĐKKD
                      </dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {isPlaceholderRegistrationNumber(
                          formData.businessInfo.registrationNumber
                        )
                          ? "Chưa cập nhật"
                          : formData.businessInfo.registrationNumber ||
                            "Chưa cập nhật"}
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Mã số thuế
                      </dt>
                      <dd className="text-sm font-medium text-slate-900">
                        {isPlaceholderTaxId(formData.businessInfo.taxId)
                          ? "Chưa cập nhật"
                          : formData.businessInfo.taxId || "Chưa cập nhật"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Ngày cấp
                        </dt>
                        <dd className="text-sm text-slate-900">
                          {formData.businessInfo.issueDate
                            ? new Date(
                                formData.businessInfo.issueDate
                              ).toLocaleDateString("vi-VN")
                            : "Chưa cập nhật"}
                        </dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                          Nơi cấp
                        </dt>
                        <dd className="text-sm text-slate-900">
                          {isPlaceholderText(formData.businessInfo.issuePlace)
                            ? "Chưa cập nhật"
                            : formData.businessInfo.issuePlace ||
                              "Chưa cập nhật"}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Legal Representative */}
              <Card>
                <CardHeader>
                  <CardTitle>Người đại diện pháp luật</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <dl className="space-y-4">
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Họ và tên
                      </dt>
                      <dd className="text-base font-semibold text-slate-900">
                        {isPlaceholderText(
                          formData.legalRepresentative.fullName
                        )
                          ? "Chưa cập nhật"
                          : formData.legalRepresentative.fullName ||
                            "Chưa cập nhật"}
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Chức vụ
                      </dt>
                      <dd className="text-sm text-slate-900">
                        {isPlaceholderText(
                          formData.legalRepresentative.position
                        )
                          ? "Chưa cập nhật"
                          : formData.legalRepresentative.position ||
                            "Chưa cập nhật"}
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Số điện thoại
                      </dt>
                      <dd className="text-sm text-slate-900">
                        {isPlaceholderPhone(formData.legalRepresentative.phone)
                          ? "Chưa cập nhật"
                          : formData.legalRepresentative.phone ||
                            "Chưa cập nhật"}
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                        Email
                      </dt>
                      <dd className="text-sm text-primary">
                        {isPlaceholderEmail(formData.legalRepresentative.email)
                          ? "Chưa cập nhật"
                          : formData.legalRepresentative.email ||
                            "Chưa cập nhật"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin công ty</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="company.name"
                      className="text-sm font-medium text-slate-700"
                    >
                      Tên công ty <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="company.name"
                      value={formData.company.name}
                      onChange={(e) => setField("company.name", e.target.value)}
                      required
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="company.industry"
                      className="text-sm font-medium text-slate-700"
                    >
                      Ngành nghề <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.company.industry}
                      onValueChange={(v) => setField("company.industry", v)}
                      disabled={loadingIndustries}
                    >
                      <SelectTrigger className="focus:border-primary focus:ring-primary">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="company.size"
                      className="text-sm font-medium text-slate-700"
                    >
                      Quy mô <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.company.size}
                      onValueChange={(v) => setField("company.size", v)}
                    >
                      <SelectTrigger className="focus:border-primary focus:ring-primary">
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
                  <div className="space-y-2">
                    <Label
                      htmlFor="company.foundedYear"
                      className="text-sm font-medium text-slate-700"
                    >
                      Năm thành lập
                    </Label>
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
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="company.email"
                      className="text-sm font-medium text-slate-700"
                    >
                      Email công ty <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="company.email"
                      type="email"
                      value={formData.company.email}
                      onChange={(e) =>
                        setField("company.email", e.target.value)
                      }
                      required
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="company.website"
                      className="text-sm font-medium text-slate-700"
                    >
                      Website
                    </Label>
                    <Input
                      id="company.website"
                      type="text"
                      placeholder="https://example.com"
                      value={formData.company.website}
                      onChange={(e) =>
                        setField("company.website", e.target.value)
                      }
                      pattern="^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$"
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="company.employeesCount"
                      className="text-sm font-medium text-slate-700"
                    >
                      Số nhân sự
                    </Label>
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
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="company.description"
                    className="text-sm font-medium text-slate-700"
                  >
                    Mô tả công ty
                  </Label>
                  <Textarea
                    id="company.description"
                    value={formData.company.description}
                    onChange={(e) =>
                      setField("company.description", e.target.value)
                    }
                    rows={4}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Business Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin pháp lý</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="businessInfo.registrationNumber"
                      className="text-sm font-medium text-slate-700"
                    >
                      Số ĐKKD <span className="text-red-500">*</span>
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
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="businessInfo.taxId"
                      className="text-sm font-medium text-slate-700"
                    >
                      Mã số thuế <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="businessInfo.taxId"
                      value={formData.businessInfo.taxId}
                      onChange={(e) =>
                        setField("businessInfo.taxId", e.target.value)
                      }
                      required
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="businessInfo.issueDate"
                      className="text-sm font-medium text-slate-700"
                    >
                      Ngày cấp <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="businessInfo.issueDate"
                      type="date"
                      value={formData.businessInfo.issueDate}
                      onChange={(e) =>
                        setField("businessInfo.issueDate", e.target.value)
                      }
                      required
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="businessInfo.issuePlace"
                      className="text-sm font-medium text-slate-700"
                    >
                      Nơi cấp <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="businessInfo.issuePlace"
                      value={formData.businessInfo.issuePlace}
                      onChange={(e) =>
                        setField("businessInfo.issuePlace", e.target.value)
                      }
                      required
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Address Section */}
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-semibold text-slate-700">
                    Địa chỉ văn phòng
                  </Label>
                  <div className="space-y-4">
                    <Input
                      placeholder="Số nhà, tên đường"
                      value={formData.businessInfo.address.street}
                      onChange={(e) =>
                        setField("businessInfo.address.street", e.target.value)
                      }
                      className="focus:border-primary focus:ring-primary"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Select
                        value={selectedCityKey}
                        onValueChange={(v) => setSelectedCityKey(v)}
                      >
                        <SelectTrigger className="focus:border-primary focus:ring-primary">
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
                      <Select
                        value={selectedDistrictCode}
                        onValueChange={(v) => setSelectedDistrictCode(v)}
                        disabled={!selectedCityKey}
                      >
                        <SelectTrigger className="focus:border-primary focus:ring-primary">
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
                      <Select
                        value={selectedWardCode}
                        onValueChange={(v) => setSelectedWardCode(v)}
                        disabled={!selectedDistrictCode}
                      >
                        <SelectTrigger className="focus:border-primary focus:ring-primary">
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
              </CardContent>
            </Card>

            {/* Legal Representative Card */}
            <Card>
              <CardHeader>
                <CardTitle>Người đại diện pháp luật</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="legalRepresentative.fullName"
                      className="text-sm font-medium text-slate-700"
                    >
                      Họ và tên <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="legalRepresentative.fullName"
                      value={formData.legalRepresentative.fullName}
                      onChange={(e) =>
                        setField("legalRepresentative.fullName", e.target.value)
                      }
                      required
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="legalRepresentative.position"
                      className="text-sm font-medium text-slate-700"
                    >
                      Chức vụ <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="legalRepresentative.position"
                      value={formData.legalRepresentative.position}
                      onChange={(e) =>
                        setField("legalRepresentative.position", e.target.value)
                      }
                      required
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="legalRepresentative.phone"
                      className="text-sm font-medium text-slate-700"
                    >
                      Số điện thoại <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="legalRepresentative.phone"
                      value={formData.legalRepresentative.phone}
                      onChange={(e) =>
                        setField("legalRepresentative.phone", e.target.value)
                      }
                      required
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="legalRepresentative.email"
                      className="text-sm font-medium text-slate-700"
                    >
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="legalRepresentative.email"
                      type="email"
                      value={formData.legalRepresentative.email}
                      onChange={(e) =>
                        setField("legalRepresentative.email", e.target.value)
                      }
                      required
                      className="focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </EmployerShell>
  );
}
