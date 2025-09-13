import { Avatar, Image, Spin, message } from "antd";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { StatusWidget } from "./components/common-renderers";
import { usersAPI } from "../../api/users";

const getUserData = (data) => [
  {
    label: "Họ và tên",
    value:
      data?.fullName ||
      `${data?.profile?.firstName || ""} ${
        data?.profile?.lastName || ""
      }`.trim(),
  },
  { label: "Email", value: data?.email },
  { label: "Vai trò", value: getRoleText(data?.role) },
  {
    label: "Phương thức đăng nhập",
    value: getAuthMethodText(data?.authMethod),
  },
  {
    label: "Trạng thái email",
    value: data?.isEmailVerified ? "Đã xác thực" : "Chưa xác thực",
  },
  {
    label: "Trạng thái tài khoản",
    value: data?.isActive ? "Đang hoạt động" : "Chưa kích hoạt",
  },
  {
    label: "Ngày tạo",
    value: data?.createdAt
      ? new Date(data.createdAt).toLocaleDateString("vi-VN")
      : "",
  },
  {
    label: "Lần đăng nhập cuối",
    value: data?.lastLogin
      ? new Date(data.lastLogin).toLocaleDateString("vi-VN")
      : "",
  },
];

const getRoleText = (role) => {
  const roleMap = {
    student: "Người tìm việc",
    employer: "Nhà tuyển dụng",
    admin: "Quản trị viên",
  };
  return roleMap[role] || role || "-";
};

const getAuthMethodText = (authMethod) => {
  const authMap = {
    local: "Email/Password",
    google: "Google OAuth",
  };
  return authMap[authMethod] || authMethod || "-";
};

export default function AccountsDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [detailData, setDetailData] = useState({});
  const [loadingPage, setLoadingPage] = useState(false);

  const userId = searchParams.get("uid");

  const fetchUserDetail = useCallback(async () => {
    try {
      setLoadingPage(true);
      const response = await usersAPI.getUserDetail(userId);

      if (response.success && response.data) {
        setDetailData(response.data);
      } else {
        message.error("Không thể tải thông tin người dùng");
        navigate("/admin/users");
      }
    } catch (error) {
      console.error("Error fetching user detail:", error);
      message.error("Có lỗi xảy ra khi tải thông tin người dùng");
      navigate("/admin/users");
    } finally {
      setLoadingPage(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
  }, [userId, fetchUserDetail]);

  return (
    <Spin spinning={loadingPage} delay={500}>
      <div className="flex items-center gap-1">
        <img
          src="/icons/accounts/btn-back.svg"
          onClick={() => navigate("/admin/users")}
          className="mr-1 w-[28px] cursor-pointer"
        />
        <div className="text-[16px] cursor-pointer ">Quản lý tài khoản</div>
        <img src="/icons/accounts/ic-chevron-right.svg" />
        <div className="text-[16px]">Xem chi tiết</div>
      </div>

      {!detailData?.isActive && (
        <div className="bg-[#FDF0F1] border border-[#D2D2D2]/50 px-[30px] py-[15px] mt-5 rounded-[24px]">
          <div className="title flex font-medium text-[20px] mb-[5px]">
            <img
              src="/icons/accounts/block-account.svg"
              alt="block"
              className="mr-1"
            />
            <span> Tài khoản chưa kích hoạt</span>
          </div>
          <div>Tài khoản này chưa được kích hoạt hoặc đã bị vô hiệu hóa</div>
        </div>
      )}
      <div className="flex gap-4">
        <div className="w-[70%] bg-white shadow-md rounded-2xl p-6 mt-4">
          <div className="flex items-center gap-2 text-left">
            <div className="inline-block rounded-full p-[2px] bg-gradient-to-b from-[#09BAFD] to-[#4285ED]">
              <div className="rounded-full p-[2px] bg-white">
                <Avatar
                  size={45}
                  src={detailData?.profile?.avatar || "/images/logo.png"}
                />
              </div>
            </div>
            <div>
              <div className="text-base text-[#003478] font-semibold">
                {detailData?.fullName ||
                  `${detailData?.profile?.firstName || ""} ${
                    detailData?.profile?.lastName || ""
                  }`.trim() ||
                  "Chưa có tên"}
              </div>
              <div className="text-xs text-[#969696]">
                {getRoleText(detailData?.role)}
              </div>
              <StatusWidget
                status={detailData?.isActive ? "Active" : "InActive"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-4 mt-6 text-sm">
            {getUserData(detailData).map((item) => (
              <div key={item.label}>
                <div className="text-[#003478]">{item.label}</div>
                <div className="h-[0.5px] max-w-[80px] bg-[#003478] mt-[0.5px] mb-1"></div>
                <div className="text-gray-900">{item.value || "-"}</div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="btn btn-active flex gap-[5px]">
              <img src="/icons/accounts/ic-btn-approve.svg" />
              Duyệt tài khoản
            </button>
          </div>
        </div>
        <div className="w-[30%] bg-white shadow-md rounded-2xl p-6 mt-4">
          <div className="text-[#003478] font-semibold mb-4">
            Thông tin bổ sung
          </div>

          {/* Preferences */}
          {detailData?.preferences && (
            <div className="mb-6">
              <div className="text-[#003478] text-sm font-medium mb-2">
                Cài đặt riêng tư
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>
                  Hiển thị hồ sơ:{" "}
                  {detailData.preferences.privacySettings?.profileVisibility ===
                  "public"
                    ? "Công khai"
                    : "Riêng tư"}
                </div>
                <div>
                  Hiển thị email:{" "}
                  {detailData.preferences.privacySettings?.showEmail
                    ? "Có"
                    : "Không"}
                </div>
                <div>
                  Hiển thị SĐT:{" "}
                  {detailData.preferences.privacySettings?.showPhone
                    ? "Có"
                    : "Không"}
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {detailData?.preferences?.notifications && (
            <div className="mb-6">
              <div className="text-[#003478] text-sm font-medium mb-2">
                Thông báo
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>
                  Email:{" "}
                  {detailData.preferences.notifications.emailNotifications
                    ? "Bật"
                    : "Tắt"}
                </div>
                <div>
                  Push:{" "}
                  {detailData.preferences.notifications.pushNotifications
                    ? "Bật"
                    : "Tắt"}
                </div>
                <div>
                  Cảnh báo việc làm:{" "}
                  {detailData.preferences.notifications.jobAlerts
                    ? "Bật"
                    : "Tắt"}
                </div>
                <div>
                  Cập nhật ứng tuyển:{" "}
                  {detailData.preferences.notifications.applicationUpdates
                    ? "Bật"
                    : "Tắt"}
                </div>
              </div>
            </div>
          )}

          {/* System Info */}
          <div className="mb-6">
            <div className="text-[#003478] text-sm font-medium mb-2">
              Thông tin hệ thống
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Ngôn ngữ: {detailData?.preferences?.language || "vi"}</div>
              <div>
                Múi giờ:{" "}
                {detailData?.preferences?.timezone || "Asia/Ho_Chi_Minh"}
              </div>
              <div>Email Status: {detailData?.emailStatus || "unknown"}</div>
            </div>
          </div>

          {/* Location */}
          {detailData?.profile?.location && (
            <div className="mb-6">
              <div className="text-[#003478] text-sm font-medium mb-2">
                Vị trí
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>
                  Quốc gia: {detailData.profile.location.country || "-"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Spin>
  );
}
