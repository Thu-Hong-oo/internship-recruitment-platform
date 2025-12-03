import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usersAPI } from "../../api/users";

const { Title, Text } = Typography;

const SYSTEM_PRIMARY = "oklch(0.55 0.18 195)";
const SYSTEM_ACCENT = "#4f46e5";
const SYSTEM_BG = "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)";

const ROLE_META = {
  student: {
    label: "Ứng viên",
    color: "green",
    description: "Tìm kiếm cơ hội việc làm và quản lý hồ sơ ứng tuyển",
  },
  employer: {
    label: "Nhà tuyển dụng",
    color: "blue",
    description: "Đăng tin tuyển dụng và quản lý ứng viên",
  },
  admin: {
    label: "Quản trị viên",
    color: "magenta",
    description: "Quản lý hệ thống và phê duyệt hoạt động",
  },
};

const STATUS_META = {
  Active: { label: "Đang hoạt động", color: "green" },
  InActive: { label: "Chưa kích hoạt", color: "default" },
  Locked: { label: "Đã khóa", color: "red" },
};

const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString("vi-VN") : "-";

export default function AccountsDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [detailData, setDetailData] = useState(null);
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

  const roleMeta = ROLE_META[detailData?.role] || {
    label: detailData?.role || "Không xác định",
    color: "default",
    description: "",
  };

  const statusMeta =
    STATUS_META[detailData?.statusDisplay] ||
    STATUS_META[detailData?.isActive ? "Active" : "InActive"];

  const summaryItems = [
    {
      label: "Email",
      value: detailData?.email || "-",
      icon: <MailOutlined />,
    },
    {
      label: "Số điện thoại",
      value: detailData?.profile?.phone || "-",
      icon: <PhoneOutlined />,
    },
    {
      label: "Ngày tạo",
      value: formatDateTime(detailData?.createdAt),
      icon: <ClockCircleOutlined />,
    },
    {
      label: "Lần đăng nhập cuối",
      value: formatDateTime(detailData?.lastLogin),
      icon: <ClockCircleOutlined />,
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: SYSTEM_BG,
        padding: "24px",
      }}
    >
      <Spin spinning={loadingPage} delay={500}>
        <Card
          style={{ borderRadius: 16, marginBottom: 24 }}
          bodyStyle={{ padding: "16px 24px" }}
        >
          <Space align="center" size={16}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/admin/users")}
            >
              Quay lại
            </Button>
            <Title
              level={4}
              style={{ margin: 0, color: "#1f2937", fontWeight: 600 }}
            >
              Hồ sơ người dùng
            </Title>
            <Tag color={roleMeta.color}>{roleMeta.label}</Tag>
            {statusMeta && (
              <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
            )}
          </Space>
        </Card>

        {!loadingPage && !detailData && (
          <Card>
            <Empty description="Không tìm thấy người dùng" />
          </Card>
        )}

        {detailData && (
          <Row gutter={20}>
            <Col xs={24} lg={16}>
              <Card
                style={{
                  borderRadius: 16,
                  marginBottom: 20,
              background: `linear-gradient(135deg, ${SYSTEM_PRIMARY} 0%, ${SYSTEM_ACCENT} 100%)`,
                  color: "#fff",
                }}
                bodyStyle={{ padding: 24 }}
              >
                <Space align="center" size={16}>
                  <Badge dot color={statusMeta?.color || "blue"}>
                    <Avatar
                      size={72}
                      src={
                        detailData?.profile?.avatar ||
                        "/images/default-avatar.png"
                      }
                      icon={<UserOutlined />}
                    />
                  </Badge>
                  <div>
                    <Title level={3} style={{ color: "#fff", marginBottom: 4 }}>
                      {detailData?.fullName ||
                        `${detailData?.profile?.firstName || ""} ${
                          detailData?.profile?.lastName || ""
                        }`.trim() ||
                        "Chưa cập nhật"}
                    </Title>
                    <Text style={{ color: "#e0e7ff" }}>
                      {roleMeta.description}
                    </Text>
                  </div>
                </Space>

                <Divider style={{ borderColor: "rgba(255,255,255,0.2)" }} />

                <Row gutter={[16, 16]}>
                  {summaryItems.map((item) => (
                    <Col xs={24} sm={12} key={item.label}>
                      <Space align="start">
                        <span style={{ color: "#c7d2fe" }}>{item.icon}</span>
                        <div>
                          <div style={{ color: "#c7d2fe", fontSize: 12 }}>
                            {item.label}
                          </div>
                          <div style={{ fontWeight: 600 }}>{item.value}</div>
                        </div>
                      </Space>
                    </Col>
                  ))}
                </Row>
              </Card>

              <Card
                title="Thông tin tài khoản"
                style={{ borderRadius: 16, marginBottom: 20 }}
                bodyStyle={{ padding: 24 }}
              >
                <Descriptions
                  column={2}
                  labelStyle={{ fontWeight: 500 }}
                  contentStyle={{ fontWeight: 600 }}
                >
                  <Descriptions.Item label="ID người dùng">
                    {detailData?._id}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phương thức đăng nhập">
                    {detailData?.authMethod === "google"
                      ? "Google OAuth"
                      : "Email / Mật khẩu"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Email đã xác thực">
                    {detailData?.isEmailVerified ? (
                      <Tag color="green">Đã xác thực</Tag>
                    ) : (
                      <Tag color="default">Chưa xác thực</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái tài khoản">
                    {detailData?.statusDisplay || statusMeta?.label || "-"}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card
                title="Hoạt động & Thông tin tuyển dụng"
                style={{ borderRadius: 16, marginBottom: 20 }}
              >
                {detailData?.analytics ? (
                  <Row gutter={16}>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="Số job đã đăng"
                        value={detailData.analytics.totalJobsPosted || 0}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="Đơn ứng tuyển"
                        value={detailData.analytics.totalApplications || 0}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="Việc đang hoạt động"
                        value={detailData.analytics.activeJobs || 0}
                      />
                    </Col>
                    <Col xs={12} md={6}>
                      <Statistic
                        title="Tỷ lệ chấp nhận"
                        value={
                          detailData.analytics.acceptanceRate
                            ? `${detailData.analytics.acceptanceRate}%`
                            : "0%"
                        }
                      />
                    </Col>
                  </Row>
                ) : (
                  <Empty description="Chưa có dữ liệu hoạt động" />
                )}
              </Card>

              {detailData?.preferences && (
                <Card title="Tuỳ chỉnh & Cài đặt" style={{ borderRadius: 16 }}>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Language">
                          {detailData.preferences.language || "vi"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Timezone">
                          {detailData.preferences.timezone ||
                            "Asia/Ho_Chi_Minh"}
                        </Descriptions.Item>
                      </Descriptions>
                    </Col>
                    <Col xs={24} md={12}>
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="Thông báo email">
                          {detailData.preferences.notifications
                            ?.emailNotifications
                            ? "Bật"
                            : "Tắt"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Thông báo job alerts">
                          {detailData.preferences.notifications?.jobAlerts
                            ? "Bật"
                            : "Tắt"}
                        </Descriptions.Item>
                      </Descriptions>
                    </Col>
                  </Row>
                </Card>
              )}
            </Col>

            <Col xs={24} lg={8}>
              {!detailData?.isActive && (
                <Alert
                  type="warning"
                  showIcon
                  message="Tài khoản chưa kích hoạt"
                  description="Người dùng này cần được kích hoạt trước khi sử dụng tính năng tuyển dụng."
                  style={{ borderRadius: 16, marginBottom: 20 }}
                />
              )}

              <Card
                title="Thông tin liên hệ"
                style={{ borderRadius: 16, marginBottom: 20 }}
              >
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <div>
                    <Text type="secondary">Email</Text>
                    <div style={{ fontWeight: 600 }}>
                      {detailData?.email || "-"}
                    </div>
                  </div>
                  <Divider style={{ margin: "8px 0" }} />
                  <div>
                    <Text type="secondary">Số điện thoại</Text>
                    <div style={{ fontWeight: 600 }}>
                      {detailData?.profile?.phone || "-"}
                    </div>
                  </div>
                  <Divider style={{ margin: "8px 0" }} />
                  <div>
                    <Text type="secondary">Địa điểm</Text>
                    <div style={{ fontWeight: 600 }}>
                      {detailData?.profile?.location?.country || "Không rõ"}
                    </div>
                  </div>
                </Space>
              </Card>

              <Card title="Hành động" style={{ borderRadius: 16 }}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button type="primary" icon={<CheckCircleOutlined />}>
                    Phê duyệt / kích hoạt
                  </Button>
                  <Button danger icon={<ClockCircleOutlined />}>
                    Khoá tài khoản
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  );
}
