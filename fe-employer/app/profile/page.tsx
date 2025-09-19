"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, User, MapPin, Building } from "lucide-react";
import { User as UserType, getUserData, getToken } from "@/lib/userStorage";
import { useVietnamAddress } from "@/hooks/useVietnamAddress";

interface ProfileData {
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  position: {
    title: string;
    level: string;
    department: string;
  };
  officeAddress: {
    street: string;
    ward: string;
    district: string;
    city: string;
    country: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form data
  const [formData, setFormData] = useState<ProfileData>({
    contact: {
      name: "",
      phone: "",
      email: "",
    },
    position: {
      title: "",
      level: "",
      department: "",
    },
    officeAddress: {
      street: "",
      ward: "",
      district: "",
      city: "",
      country: "Vietnam",
    },
  });

  // Address hook
  const {
    cities,
    districts,
    wards,
    loading: loadingAddress,
    error: addressError,
    loadDistricts,
    loadWards,
    resetDistricts,
    resetWards,
  } = useVietnamAddress();

  // Load user data and initialize form
  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUser(userData);
      // Initialize form with user data
      setFormData((prev) => ({
        ...prev,
        contact: {
          name: userData.fullName || "",
          phone: "",
          email: userData.email || "",
        },
      }));
    }
  }, []);

  // Load districts when city changes
  useEffect(() => {
    if (formData.officeAddress.city) {
      // city now stores province code
      loadDistricts(formData.officeAddress.city);
      // Reset district and ward when city changes
      setFormData((prev) => ({
        ...prev,
        officeAddress: {
          ...prev.officeAddress,
          district: "",
          ward: "",
        },
      }));
      resetWards();
    }
  }, [formData.officeAddress.city, loadDistricts, resetWards]);

  // Load wards when district changes
  useEffect(() => {
    if (formData.officeAddress.city && formData.officeAddress.district) {
      // district now stores district code
      loadWards(formData.officeAddress.district);
      // Reset ward when district changes
      setFormData((prev) => ({
        ...prev,
        officeAddress: {
          ...prev.officeAddress,
          ward: "",
        },
      }));
    }
  }, [formData.officeAddress.district, loadWards]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const keys = field.split(".");
      if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0] as keyof ProfileData],
            [keys[1]]: value,
          },
        };
      }
      return prev;
    });
  };

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

      const response = await fetch(
        "http://localhost:3000/api/employers/profile",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("Cập nhật thông tin thành công!");
        // Update user data in localStorage if needed
        if (data.user) {
          // You might want to update the user data here
        }
      } else {
        setError(data.error || "Cập nhật thông tin thất bại");
      }
    } catch (error: any) {
      setError(error.message || "Không thể kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Đang tải thông tin người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Cập nhật thông tin cá nhân
              </h1>
              <p className="text-slate-600">
                Quản lý thông tin liên hệ và vị trí công việc của bạn
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Thông tin liên hệ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact.name">Họ và tên *</Label>
                  <Input
                    id="contact.name"
                    value={formData.contact.name}
                    onChange={(e) =>
                      handleInputChange("contact.name", e.target.value)
                    }
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact.phone">Số điện thoại *</Label>
                  <Input
                    id="contact.phone"
                    value={formData.contact.phone}
                    onChange={(e) =>
                      handleInputChange("contact.phone", e.target.value)
                    }
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contact.email">Email *</Label>
                <Input
                  id="contact.email"
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) =>
                    handleInputChange("contact.email", e.target.value)
                  }
                  placeholder="Nhập email"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Position Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Thông tin vị trí công việc
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="position.title">Chức vụ *</Label>
                  <Input
                    id="position.title"
                    value={formData.position.title}
                    onChange={(e) =>
                      handleInputChange("position.title", e.target.value)
                    }
                    placeholder="VD: Senior HR Manager"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="position.level">Cấp bậc *</Label>
                  <Select
                    value={formData.position.level}
                    onValueChange={(value) =>
                      handleInputChange("position.level", value)
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn cấp bậc" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intern">Thực tập sinh</SelectItem>
                      <SelectItem value="junior">Nhân viên</SelectItem>
                      <SelectItem value="middle">Chuyên viên</SelectItem>
                      <SelectItem value="senior">
                        Chuyên viên cao cấp
                      </SelectItem>
                      <SelectItem value="lead">Trưởng nhóm</SelectItem>
                      <SelectItem value="manager">Quản lý</SelectItem>
                      <SelectItem value="director">Giám đốc</SelectItem>
                      <SelectItem value="ceo">Tổng giám đốc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="position.department">Phòng ban *</Label>
                  <Input
                    id="position.department"
                    value={formData.position.department}
                    onChange={(e) =>
                      handleInputChange("position.department", e.target.value)
                    }
                    placeholder="VD: Human Resources"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Office Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Địa chỉ văn phòng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="officeAddress.street">Địa chỉ chi tiết *</Label>
                <Input
                  id="officeAddress.street"
                  value={formData.officeAddress.street}
                  onChange={(e) =>
                    handleInputChange("officeAddress.street", e.target.value)
                  }
                  placeholder="VD: 57 Huỳnh Thúc Kháng"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="officeAddress.city">Tỉnh/Thành phố *</Label>
                  <Select
                    value={formData.officeAddress.city}
                    onValueChange={(value) =>
                      handleInputChange("officeAddress.city", value)
                    }
                    disabled={loadingAddress}
                    required
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="officeAddress.district">Quận/Huyện *</Label>
                  <Select
                    value={formData.officeAddress.district}
                    onValueChange={(value) =>
                      handleInputChange("officeAddress.district", value)
                    }
                    disabled={!formData.officeAddress.city || loadingAddress}
                    required
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="officeAddress.ward">Phường/Xã *</Label>
                  <Select
                    value={formData.officeAddress.ward}
                    onValueChange={(value) =>
                      handleInputChange("officeAddress.ward", value)
                    }
                    disabled={
                      !formData.officeAddress.district || loadingAddress
                    }
                    required
                  >
                    <SelectTrigger>
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

              <div>
                <Label htmlFor="officeAddress.country">Quốc gia</Label>
                <Input
                  id="officeAddress.country"
                  value={formData.officeAddress.country}
                  onChange={(e) =>
                    handleInputChange("officeAddress.country", e.target.value)
                  }
                  placeholder="Vietnam"
                  readOnly
                />
              </div>
            </CardContent>
          </Card>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {addressError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">{addressError}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Submit Button */}
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
              <Save className="w-4 h-4" />
              {loading ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
