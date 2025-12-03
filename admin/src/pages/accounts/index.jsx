import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  Pagination,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  EyeOutlined,
  SearchOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { usersAPI } from "../../api/users";
import moment from "moment";

const { Text } = Typography;

// System colors
const SYSTEM_PRIMARY = "oklch(0.55 0.18 195)";
const SYSTEM_COLORS = {
  primary: SYSTEM_PRIMARY,
  success: "#52c41a",
  warning: "#faad14",
  error: "#ff4d4f",
  info: "#1890ff",
};

const statusColor = (status) => {
  switch (status) {
    case "Active":
      return SYSTEM_COLORS.success;
    case "InActive":
      return "#6b7280";
    case "Locked":
      return SYSTEM_COLORS.error;
    case "Pending_Review":
    case "Pending_Lock_Approval":
      return SYSTEM_COLORS.warning;
    default:
      return "#6b7280";
  }
};

const statusText = (status) => {
  const statusMap = {
    Active: "Đang hoạt động",
    InActive: "Chưa kích hoạt",
    Locked: "Đã khóa",
    Pending_Review: "Chờ kiểm duyệt",
    Pending_Lock_Approval: "Chờ duyệt khóa",
    Violation: "Vi phạm",
    Rejected: "Từ chối duyệt",
  };
  return statusMap[status] || status;
};

const roleText = (role) => {
  const roleMap = {
    candidate: "Ứng viên",
    student: "Ứng viên",
    employer: "Nhà tuyển dụng",
    admin: "Quản trị viên",
  };
  return roleMap[role] || role;
};

const roleColor = (role) => {
  switch (role) {
    case "candidate":
    case "student":
      return SYSTEM_COLORS.success;
    case "employer":
      return SYSTEM_COLORS.info;
    case "admin":
      return SYSTEM_COLORS.error;
    default:
      return "#6b7280";
  }
};

export default function Accounts() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({
    page: 1,
    pageSize: 10,
    role: undefined,
    status: undefined,
    fullname: "",
    phone: "",
    email: "",
  });
  const [total, setTotal] = useState(0);
  const [loadingPage, setLoadingPage] = useState(false);
  const [pageLabel, setPageLabel] = useState("1/1");
  const [filterTimeout, setFilterTimeout] = useState(null);

  const getUsersList = useCallback(async () => {
    try {
      setLoadingPage(true);
      const res = await usersAPI.getUsers({
        page: formData?.page || 1,
        limit: formData?.pageSize || 10,
        role: formData?.role || undefined,
        status: formData?.status || undefined,
      });

      const mapped = (res?.users || []).map((u, idx) => {
        const profileAvatar =
          u?.profile?.avatar && String(u.profile.avatar).trim() !== ""
            ? u.profile.avatar
            : null;
        const apiAvatar =
          u?.avatar && u.avatar !== "default-avatar" ? u.avatar : null;

        return {
          uid: u?.id || u?._id || String(idx),
          fullname:
            u?.fullName ||
            [u?.profile?.firstName, u?.profile?.lastName]
              .filter(Boolean)
              .join(" ") ||
            "",
          avatar: apiAvatar || profileAvatar,
          phone: u?.profile?.phone || "",
          email: u?.email || "",
          status:
            u?.statusDisplay || (u?.isEmailVerified ? "Active" : "InActive"),
          role: u?.role || "",
          createdAt: u?.createdAt || "",
        };
      });

      setData(mapped);
      setTotal(res?.total || 0);
      setPageLabel(res?.pagination?.label || "1/1");
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingPage(false);
    }
  }, [formData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getUsersList();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [formData, getUsersList]);

  // Cleanup filter timeout on unmount
  useEffect(() => {
    return () => {
      if (filterTimeout) {
        clearTimeout(filterTimeout);
      }
    };
  }, [filterTimeout]);

  const handleViewDetail = (uid) => {
    navigate(`/admin/users/detail?uid=${uid}`);
  };

  const handleFilterChange = (changedValues, allValues) => {
    const isTextInput =
      Object.prototype.hasOwnProperty.call(changedValues, "fullname") ||
      Object.prototype.hasOwnProperty.call(changedValues, "phone") ||
      Object.prototype.hasOwnProperty.call(changedValues, "email");

    if (isTextInput) {
      if (filterTimeout) {
        clearTimeout(filterTimeout);
      }
      const timeoutId = setTimeout(() => {
        setFormData((prev) => ({
          ...prev,
          ...allValues,
          page: 1,
        }));
      }, 300);
      setFilterTimeout(timeoutId);
    } else {
      setFormData((prev) => ({
        ...prev,
        ...allValues,
        page: 1,
      }));
    }
  };


  const columns = [
    {
      title: "#",
      width: 70,
      align: "center",
      render: (_, __, index) => (
        <div
          style={{
            color: "#9ca3af",
            fontWeight: 500,
            fontSize: "14px",
          }}
        >
          {index + 1 + (formData?.page - 1) * formData?.pageSize}
        </div>
      ),
    },
    {
      title: "Người dùng",
      key: "user",
      width: 280,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Badge
            dot
            color={statusColor(record.status)}
            offset={[-2, 2]}
            style={{
              width: "12px",
              height: "12px",
            }}
          >
            <Avatar
              size={48}
              src={record?.avatar}
              icon={<UserOutlined />}
              style={{
                border: `2px solid ${statusColor(record.status)}30`,
                boxShadow: `0 2px 8px ${statusColor(record.status)}20`,
              }}
            />
          </Badge>
          <div className="flex-1 min-w-0">
            <div
              style={{
                fontWeight: 600,
                color: "#1f2937",
                fontSize: "15px",
                marginBottom: "4px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {record?.fullname || "N/A"}
            </div>
            {record?.email && (
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "13px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {record.email}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (phone) => (
        <span style={{ color: "#6b7280", fontSize: "14px" }}>
          {phone || "-"}
        </span>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 150,
      render: (role) => {
        const color = roleColor(role);
        const isAdmin = role === "admin";
        return (
          <Tag
            icon={isAdmin ? <CrownOutlined /> : null}
            color={color}
            style={{
              color: color,
              backgroundColor: `${color}15`,
              borderColor: color,
              padding: "4px 12px",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "13px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {roleText(role)}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => {
        const color = statusColor(status);
        return (
          <Tag
            color={color}
            style={{
              color: color,
              backgroundColor: `${color}15`,
              borderColor: color,
              padding: "4px 12px",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "13px",
            }}
          >
            {statusText(status)}
          </Tag>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 130,
      render: (date) => (
        <div style={{ color: "#6b7280", fontSize: "14px" }}>
          {date ? moment(date).format("DD/MM/YYYY") : "-"}
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Tooltip title="Xem chi tiết">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handleViewDetail(record.uid)}
            style={{
              borderRadius: "6px",
              fontWeight: 500,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            Chi tiết
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div

    >
      <Spin spinning={loadingPage} delay={500}>
        {/* Filter Card */}
        <Card
          className="mb-6"
          style={{
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            background: "#ffffff",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <Form
            form={form}
            layout="vertical"
            onValuesChange={handleFilterChange}
            initialValues={{
              fullname: "",
              phone: "",
              email: "",
              role: undefined,
              status: undefined,
            }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="fullname"
                  label={<span style={{ fontWeight: 500 }}>Họ & tên</span>}
                >
                  <Input
                    placeholder="Tìm theo họ & tên"
                    allowClear
                    prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="phone"
                  label={<span style={{ fontWeight: 500 }}>Số điện thoại</span>}
                >
                  <Input
                    placeholder="Tìm theo số điện thoại"
                    allowClear
                    prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="email"
                  label={<span style={{ fontWeight: 500 }}>Email</span>}
                >
                  <Input
                    placeholder="Tìm theo email"
                    allowClear
                    prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3}>
                <Form.Item
                  name="role"
                  label={<span style={{ fontWeight: 500 }}>Vai trò</span>}
                >
                  <Select
                    placeholder="Tất cả"
                    allowClear
                    style={{ width: "100%", borderRadius: "8px" }}
                    options={[
                      { label: "Ứng viên", value: "candidate" },
                      { label: "Nhà tuyển dụng", value: "employer" },
                      { label: "Quản trị viên", value: "admin" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={3}>
                <Form.Item
                  name="status"
                  label={<span style={{ fontWeight: 500 }}>Trạng thái</span>}
                >
                  <Select
                    placeholder="Tất cả"
                    allowClear
                    style={{ width: "100%", borderRadius: "8px" }}
                    options={[
                      { label: "Đang hoạt động", value: "active" },
                      { label: "Chưa kích hoạt", value: "inactive" },
                    ]}
                  />
                </Form.Item>
              </Col>
             </Row>
           </Form>
        </Card>

        {/* Table Card */}
        <Card
          style={{
            borderRadius: "16px",
            border: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            background: "#ffffff",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9" }}>
            <Text style={{ color: "#64748b", fontSize: "14px" }}>
              Tổng số người dùng:{" "}
              <span style={{ color: "#111827", fontWeight: 600 }}>{total}</span>{" "}
              • Trang:{" "}
              <span style={{ color: "#111827", fontWeight: 600 }}>
                {pageLabel}
              </span>
            </Text>
          </div>
          <div style={{ padding: "24px" }}>
            <Table
              loading={loadingPage}
              columns={columns}
              dataSource={data || []}
              rowKey="uid"
              pagination={false}
              scroll={{ x: 1000 }}
              style={{
                borderRadius: "12px",
              }}
            />
            <div
              className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 pt-6"
              style={{ borderTop: "1px solid #f1f5f9" }}
            >
              <div
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                Hiển thị{" "}
                <span style={{ color: "#1e293b", fontWeight: 600 }}>
                  {(formData?.page - 1) * formData?.pageSize + 1} -{" "}
                  {Math.min(formData?.page * formData?.pageSize, total)}
                </span>{" "}
                của{" "}
                <span style={{ color: "#1e293b", fontWeight: 600 }}>{total}</span>{" "}
                người dùng
              </div>
              <Pagination
                total={total || 0}
                pageSize={formData?.pageSize}
                current={formData?.page}
                onChange={(page) => {
                  setFormData((prev) => ({ ...prev, page }));
                }}
                onShowSizeChange={(_, size) => {
                  setFormData((prev) => ({ ...prev, page: 1, pageSize: size }));
                }}
                showSizeChanger
                pageSizeOptions={["10", "20", "50", "100"]}
              />
            </div>
          </div>
        </Card>
      </Spin>
    </div>
  );
}


