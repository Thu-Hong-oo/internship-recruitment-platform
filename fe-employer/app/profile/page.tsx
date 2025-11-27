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
import {
  ArrowLeft,
  Save,
  User,
  Building,
  Edit3,
  AlertCircle,
  Upload,
  Camera,
  X,
} from "lucide-react";
import {
  User as UserType,
  getUserData,
  getToken,
  saveUserData,
} from "@/lib/userStorage";
import { EMPLOYER_LEVEL_LABEL } from "@/lib/labels";
import { getEmployerProfile } from "@/lib/api";
import { updateEmployerProfile, uploadAvatar } from "@/lib/profileAPI";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useVerificationContext } from "@/contexts/VerificationContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  isPlaceholderProfileData,
  isPlaceholderText,
  isPlaceholderEmail,
  isPlaceholderPhone,
} from "@/lib/placeholderUtils";

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
}

export default function ProfilePage() {
  const router = useRouter();
  const { refreshVerification } = useVerificationContext();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const levelLabel = EMPLOYER_LEVEL_LABEL;

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
  });

  // Address section removed

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

  // Fetch employer profile and prefill form if available
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const json = await getEmployerProfile(token);

        const profile = json?.data || json?.profile || null;
        if (!profile) return;

        // Store profile data and check if it's placeholder
        setProfileData(profile);
        const isPlaceholderData = isPlaceholderProfileData(profile);
        setIsPlaceholder(isPlaceholderData);

        const apiContact = profile.contact || {};
        const apiPosition = profile.position || {};
        setFormData((prev) => ({
          ...prev,
          contact: {
            name: apiContact.name ?? prev.contact.name,
            phone: apiContact.phone ?? prev.contact.phone,
            email: apiContact.email ?? prev.contact.email,
          },
          position: {
            title: apiPosition.title ?? prev.position.title,
            level: apiPosition.level ?? prev.position.level,
            department: apiPosition.department ?? prev.position.department,
          },
        }));

        // Set avatar URL from profile
        if (profile.user?.avatar) {
          setAvatarUrl(profile.user.avatar);
        } else if (user?.avatar) {
          setAvatarUrl(user.avatar);
        }
      } catch (err) {
        // Silent fail for initial prefill; detailed errors shown on submit flow.
      }
    };

    fetchProfile();
  }, []);

  // Removed provinces preselect and load effects

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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setAvatarError("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Kích thước file không được vượt quá 5MB");
      return;
    }

    setAvatarError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarPreview) return;

    setUploadingAvatar(true);
    setAvatarError("");

    try {
      const token = getToken();
      if (!token) {
        setAvatarError("Vui lòng đăng nhập lại");
        return;
      }

      // Get the file from the input
      const fileInput = document.getElementById(
        "avatar-input"
      ) as HTMLInputElement;
      const file = fileInput?.files?.[0];
      if (!file) {
        setAvatarError("Không tìm thấy file");
        return;
      }

      const result = await uploadAvatar(token, file);

      if (result.success) {
        // Update avatar URL
        if (result.data?.avatar) {
          setAvatarUrl(result.data.avatar);
        } else if (result.data?.user?.avatar) {
          setAvatarUrl(result.data.user.avatar);
        }

        // Clear preview
        setAvatarPreview(null);

        // Refresh profile data
        const json = await getEmployerProfile(token);
        const profile = json?.data || json?.profile || null;
        if (profile) {
          setProfileData(profile);
          if (profile.user?.avatar) {
            setAvatarUrl(profile.user.avatar);
            // Update user state
            setUser((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                avatar: profile.user.avatar,
              };
            });

            // Update localStorage with new avatar
            const userData = getUserData();
            if (userData) {
              const updatedUser = {
                ...userData,
                avatar: profile.user.avatar,
              };
              // Save to both localStorage and sessionStorage to ensure consistency
              saveUserData(updatedUser, true); // Save to localStorage
              if (typeof window !== "undefined") {
                sessionStorage.setItem("user", JSON.stringify(updatedUser));
              }
            }
          }
        }

        // Refresh verification status to update header
        refreshVerification();

        setSuccess("Cập nhật avatar thành công!");
        setTimeout(() => setSuccess(""), 3000);

        // Reload page after 1.5 seconds to update header and sidebar avatar
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setAvatarError(result.error || "Upload avatar thất bại");
      }
    } catch (error: any) {
      setAvatarError(error.message || "Không thể kết nối máy chủ");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelAvatarUpload = () => {
    setAvatarPreview(null);
    setAvatarError("");
    // Reset file input
    const fileInput = document.getElementById(
      "avatar-input"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
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

      const data = await updateEmployerProfile(token, {
        contact: formData.contact,
        position: formData.position,
      });

      if (data.success) {
        setSuccess("Cập nhật thông tin thành công!");
        // Refresh verification status
        refreshVerification();
        // Refresh profile data to update placeholder status
        const json = await getEmployerProfile(token);
        const profile = json?.data || json?.profile || null;
        if (profile) {
          setProfileData(profile);
          setIsPlaceholder(isPlaceholderProfileData(profile));
        }
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
          <div className="flex items-center justify-between">
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

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Placeholder Data Alert */}
        {isPlaceholder && !isEditing && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">
              Dữ liệu mẫu được hiển thị
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              Thông tin hiện tại là dữ liệu mẫu. Vui lòng cập nhật thông tin
              thực tế của bạn để sử dụng đầy đủ các tính năng của hệ thống.
            </AlertDescription>
          </Alert>
        )}

        {/* Avatar Upload Section */}
        <Card className="mb-6 border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Ảnh đại diện
            </CardTitle>
            <p className="text-sm text-slate-500">
              Cập nhật ảnh đại diện của bạn (JPG, PNG, tối đa 5MB)
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {/* Avatar Display */}
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-slate-200">
                  {avatarPreview || avatarUrl ? (
                    <AvatarImage
                      src={avatarPreview || avatarUrl || ""}
                      alt={user?.fullName || "Avatar"}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {user?.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                {avatarPreview && (
                  <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="avatar-input"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {avatarPreview ? "Chọn ảnh khác" : "Chọn ảnh"}
                  </label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  {avatarPreview && (
                    <>
                      <Button
                        type="button"
                        onClick={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {uploadingAvatar ? "Đang tải lên..." : "Lưu ảnh"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelAvatarUpload}
                        disabled={uploadingAvatar}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Hủy
                      </Button>
                    </>
                  )}
                </div>
                {avatarError && (
                  <p className="text-sm text-red-600">{avatarError}</p>
                )}
                {success && <p className="text-sm text-green-600">{success}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact Information */}
            <Card className="border border-slate-200 shadow-sm hover:shadow transition-shadow h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Thông tin liên hệ
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Các thông tin để chúng tôi liên hệ với bạn.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact.name">Họ và tên *</Label>
                    {isEditing ? (
                      <Input
                        id="contact.name"
                        value={formData.contact.name}
                        onChange={(e) =>
                          handleInputChange("contact.name", e.target.value)
                        }
                        placeholder="Nhập họ và tên"
                        required
                      />
                    ) : (
                      <div className="mt-1 text-base font-medium text-slate-900">
                        {isPlaceholderText(formData.contact.name)
                          ? "Chưa cập nhật"
                          : formData.contact.name || "Chưa cập nhật"}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="contact.phone">Số điện thoại *</Label>
                    {isEditing ? (
                      <Input
                        id="contact.phone"
                        value={formData.contact.phone}
                        onChange={(e) =>
                          handleInputChange("contact.phone", e.target.value)
                        }
                        placeholder="Nhập số điện thoại"
                        required
                      />
                    ) : (
                      <div className="mt-1 text-base font-medium text-slate-900">
                        {isPlaceholderPhone(formData.contact.phone)
                          ? "Chưa cập nhật"
                          : formData.contact.phone || "Chưa cập nhật"}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact.email">Email *</Label>
                  {isEditing ? (
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
                  ) : (
                    <div className="mt-1 text-base font-medium text-slate-900">
                      {isPlaceholderEmail(formData.contact.email)
                        ? "Chưa cập nhật"
                        : formData.contact.email || "Chưa cập nhật"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Position Information */}
            <Card className="border border-slate-200 shadow-sm hover:shadow transition-shadow h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Vị trí công việc
                </CardTitle>
                <p className="text-sm text-slate-500">
                  Mô tả vị trí và cấp bậc hiện tại.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="position.title">Chức vụ *</Label>
                    {isEditing ? (
                      <Input
                        id="position.title"
                        value={formData.position.title}
                        onChange={(e) =>
                          handleInputChange("position.title", e.target.value)
                        }
                        placeholder="VD: Senior HR Manager"
                        required
                      />
                    ) : (
                      <div className="mt-1 text-base font-medium text-slate-900">
                        {formData.position.title || "Chưa cập nhật"}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="position.level">Cấp bậc *</Label>
                    {isEditing ? (
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
                    ) : (
                      <div className="mt-1 text-base font-medium text-slate-900">
                        {levelLabel[formData.position.level] || "Chưa cập nhật"}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="position.department">Phòng ban *</Label>
                    {isEditing ? (
                      <Input
                        id="position.department"
                        value={formData.position.department}
                        onChange={(e) =>
                          handleInputChange(
                            "position.department",
                            e.target.value
                          )
                        }
                        placeholder="VD: Human Resources"
                        required
                      />
                    ) : (
                      <div className="mt-1 text-base font-medium text-slate-900">
                        {formData.position.department || "Chưa cập nhật"}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Đã xóa phần Địa chỉ văn phòng */}

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Đã xóa cảnh báo địa chỉ */}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Floating action bar when editing */}
          {isEditing && (
            <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border border-slate-200 shadow-lg rounded-full px-4 py-2">
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
                <Save className="w-4 h-4" />
                {loading ? "Đang lưu..." : "Lưu thông tin"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
