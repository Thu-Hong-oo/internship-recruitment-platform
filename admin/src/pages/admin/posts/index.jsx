import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Form,
  Select,
  Input,
  DatePicker,
  Switch,
  Statistic,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import moment from "moment";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// System colors
const SYSTEM_PRIMARY = "oklch(0.55 0.18 195)";
const SYSTEM_COLORS = {
  primary: SYSTEM_PRIMARY,
  success: "#52c41a",
  warning: "#faad14",
  error: "#ff4d4f",
  info: "#1890ff",
  purple: "#722ed1",
  cyan: "#13c2c2",
};

const formatDate = (value) => new Date(value).toLocaleString("vi-VN");

const statusColor = (status) => {
  switch (status) {
    case "active":
      return SYSTEM_COLORS.success;
    case "pending":
      return SYSTEM_COLORS.warning;
    case "deleted":
      return SYSTEM_COLORS.error;
    case "paused":
      return SYSTEM_COLORS.warning;
    case "draft":
      return "#6b7280";
    default:
      return "#6b7280";
  }
};

const statusText = (status) => {
  switch (status) {
    case "active":
      return "Đang hoạt động";
    case "pending":
      return "Chờ duyệt";
    case "deleted":
      return "Đã xóa";
    case "paused":
      return "Tạm dừng";
    case "draft":
      return "Bản nháp";
    default:
      return status;
  }
};

const Jobs = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [stats, setStats] = useState(null);

  const columns = useMemo(
    () => [
      {
        title: "Tiêu đề",
        dataIndex: "title",
        key: "title",
        ellipsis: true,
        width: 200,
        render: (text, record) => (
          <div>
            <div style={{ fontWeight: 500, color: "#1f2937" }}>{text}</div>
            {record?.employer?.company?.name && (
              <div style={{ color: "#667085", fontSize: 12 }}>
                {record.employer.company.name}
              </div>
            )}
          </div>
        ),
      },
      {
        title: "Công ty",
        key: "employer",
        ellipsis: true,
        width: 180,
        render: (_, record) => (
          <div className="flex items-center gap-2">
            {record?.employer?.company?.logo?.url && (
              <Avatar
                size="small"
                src={record.employer.company.logo.url}
                icon={<BankOutlined />}
              />
            )}
            <div>
              <div style={{ fontWeight: 500 }}>
                {record?.employer?.company?.name || record?.employer?.name || "-"}
              </div>
              {record?.employer?.email && (
                <div style={{ color: "#667085", fontSize: 12 }}>
                  {record.employer.email}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        title: "Địa điểm",
        dataIndex: "location",
        key: "location",
        ellipsis: true,
        width: 120,
      },
      {
        title: "Kỹ năng",
        dataIndex: "skills",
        key: "skills",
        width: 200,
        render: (skills = []) => (
          <Space wrap size={[4, 4]}>
            {(skills || []).slice(0, 3).map((s, idx) => (
              <Tag key={idx} style={{ margin: 0 }}>
                {s}
              </Tag>
            ))}
            {(skills || []).length > 3 ? (
              <Tag style={{ margin: 0 }}>
                +{(skills || []).length - 3}
              </Tag>
            ) : null}
          </Space>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => (
          <Tag
            color={statusColor(status)}
            style={{
              color: statusColor(status),
              backgroundColor: `${statusColor(status)}15`,
              borderColor: statusColor(status),
            }}
          >
            {statusText(status)}
          </Tag>
        ),
      },
      {
        title: "Ứng tuyển",
        key: "applications",
        width: 100,
        align: "center",
        render: (_, r) => (
          <span style={{ fontWeight: 500 }}>
            {r?.analytics?.applications ?? 0}
          </span>
        ),
      },
      {
        title: "Lượt xem",
        key: "views",
        width: 100,
        align: "center",
        render: (_, r) => (
          <span style={{ fontWeight: 500 }}>{r?.analytics?.views ?? 0}</span>
        ),
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 150,
        render: (v) => (
          <span style={{ color: "#667085" }}>{moment(v).format("DD/MM/YYYY")}</span>
        ),
      },
      {
        title: "Hành động",
        key: "action",
        width: 150,
        fixed: "right",
        render: (_, record) => (
          <Space size="small">
            <Button
              type="link"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/admin/posts/${record?._id}`)}
              style={{ padding: 0 }}
            >
              Xem
            </Button>
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              style={{ padding: 0 }}
            >
              Sửa
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
              style={{ padding: 0 }}
            >
              Xóa
            </Button>
          </Space>
        ),
      },
    ],
    [navigate]
  );

  const buildQuery = (values) => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("limit", String(pagination.limit));

    if (values.status && values.status !== "all")
      params.set("status", values.status);
    if (values.level && values.level !== "all")
      params.set("level", values.level);
    if (values.jobType && values.jobType !== "all")
      params.set("jobType", values.jobType);
    if (values.location) params.set("location", values.location.trim());
    if (values.salaryMin) params.set("salaryMin", values.salaryMin);
    if (values.salaryMax) params.set("salaryMax", values.salaryMax);
    if (values.search) params.set("search", values.search.trim());
    if (typeof values.flagged === "boolean")
      params.set("flagged", String(values.flagged));

    if (values.dateRange && values.dateRange.length === 2) {
      const [from, to] = values.dateRange;
      if (from) params.set("dateFrom", from.startOf("day").toISOString());
      if (to) params.set("dateTo", to.endOf("day").toISOString());
    }

    return params.toString();
  };

  const fetchJobs = async (overrideValues) => {
    try {
      setLoading(true);
      setError(null);
      const values = { ...form.getFieldsValue(), ...overrideValues };
      const qs = buildQuery(values);
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      if (!token) {
        throw new Error("Vui lòng đăng nhập để sử dụng tính năng này");
      }

      const res = await fetch(`http://localhost:3000/api/admin/jobs?${qs}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."
          );
        } else if (res.status === 403) {
          throw new Error("Bạn không có quyền truy cập tính năng này.");
        } else {
          throw new Error(
            data?.error || `Lỗi ${res.status}: Không thể tải danh sách công việc`
          );
        }
      }

      if (!data?.success) {
        throw new Error(data?.error || "Không thể tải danh sách công việc");
      }

      setJobs(data.data || []);
      setStats(data.stats || null);
      setPagination((p) => ({ ...p, total: data.pagination?.total || 0 }));
    } catch (e) {
      setError(e.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      status: "all",
      level: "all",
      jobType: "all",
      location: "",
      salaryMin: undefined,
      salaryMax: undefined,
      dateRange: undefined,
      search: "",
      flagged: false,
    });
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = () => fetchJobs();
  const onReset = () => {
    form.resetFields();
    form.setFieldsValue({
      status: "all",
      level: "all",
      jobType: "all",
      flagged: false,
    });
    setPagination((p) => ({ ...p, page: 1 }));
    fetchJobs({ page: 1 });
  };

  const onTableChange = (pag) => {
    const next = { page: pag.current, limit: pag.pageSize };
    setPagination((p) => ({ ...p, ...next }));
    fetchJobs(next);
  };

  const statCards = [
    {
      title: "Tổng công việc",
      value: stats?.totalJobs || 0,
      Icon: FileTextOutlined,
      color: SYSTEM_COLORS.info,
    },
    {
      title: "Đang hoạt động",
      value: stats?.statusBreakdown?.active || 0,
      Icon: CheckCircleOutlined,
      color: SYSTEM_COLORS.success,
    },
    {
      title: "Chờ duyệt",
      value: stats?.statusBreakdown?.pending || 0,
      Icon: ClockCircleOutlined,
      color: SYSTEM_COLORS.warning,
    },
    {
      title: "Cần chú ý",
      value: stats?.needAttention || 0,
      Icon: ExclamationCircleOutlined,
      color: SYSTEM_COLORS.error,
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
            Quản lý công việc
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Quản lý và theo dõi tất cả công việc trong hệ thống
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          style={{
            background: `linear-gradient(135deg, ${SYSTEM_PRIMARY} 0%, ${SYSTEM_COLORS.info} 100%)`,
            border: "none",
          }}
        >
          Thêm công việc
        </Button>
      </div>

      {/* Stat Cards */}
      {stats && (
        <Row gutter={[16, 16]} className="mb-6">
          {statCards.map((stat, index) => {
            const IconComponent = stat.Icon;
            return (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card
                  className="hover:shadow-lg transition-all duration-300 border"
                  style={{
                    borderRadius: "12px",
                    borderColor: "#e5e7eb",
                  }}
                  bodyStyle={{ padding: "24px" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="p-3 rounded-xl"
                      style={{
                        backgroundColor: `${stat.color}15`,
                      }}
                    >
                      <IconComponent
                        style={{
                          fontSize: "24px",
                          color: stat.color,
                        }}
                      />
                    </div>
                  </div>
                  <Statistic
                    title={
                      <span className="text-gray-600 text-sm font-medium">
                        {stat.title}
                      </span>
                    }
                    value={stat.value}
                    valueStyle={{
                      fontSize: "28px",
                      fontWeight: "bold",
                      color: "#1f2937",
                    }}
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Filter Card */}
      <Card
        className="mb-6 shadow-sm"
        style={{ borderRadius: "12px", borderColor: "#e5e7eb" }}
      >
        <Form form={form} layout="vertical" onFinish={onSearch}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Trạng thái" name="status">
                <Select
                  options={[
                    { label: "Tất cả", value: "all" },
                    { label: "Chờ duyệt", value: "pending" },
                    { label: "Hoạt động", value: "active" },
                    { label: "Tạm dừng", value: "paused" },
                    { label: "Bản nháp", value: "draft" },
                    { label: "Đã xóa", value: "deleted" },
                  ]}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Cấp độ" name="level">
                <Select
                  options={[
                    { label: "Tất cả", value: "all" },
                    { label: "Intern", value: "intern" },
                    { label: "Junior", value: "junior" },
                    { label: "Mid", value: "mid" },
                    { label: "Senior", value: "senior" },
                    { label: "Manager", value: "manager" },
                  ]}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Loại công việc" name="jobType">
                <Select
                  options={[
                    { label: "Tất cả", value: "all" },
                    { label: "Full-time", value: "full-time" },
                    { label: "Part-time", value: "part-time" },
                    { label: "Internship", value: "internship" },
                    { label: "Contract", value: "contract" },
                  ]}
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Địa điểm" name="location">
                <Input placeholder="Nhập địa điểm" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Lương tối thiểu" name="salaryMin">
                <Input
                  type="number"
                  min={0}
                  placeholder="VD: 5000000"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Lương tối đa" name="salaryMax">
                <Input
                  type="number"
                  min={0}
                  placeholder="VD: 15000000"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item label="Khoảng thời gian" name="dateRange">
                <RangePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Form.Item label="Gắn cờ" name="flagged" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[12, 12]}>
            <Col xs={24} md={16}>
              <Form.Item label="Tìm kiếm" name="search">
                <Input
                  placeholder="Tìm theo tiêu đề, công ty..."
                  allowClear
                  prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
                />
              </Form.Item>
            </Col>
            <Col
              xs={24}
              md={8}
              style={{ display: "flex", alignItems: "end", gap: 8 }}
            >
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                style={{
                  background: `linear-gradient(135deg, ${SYSTEM_PRIMARY} 0%, ${SYSTEM_COLORS.info} 100%)`,
                  border: "none",
                }}
              >
                Tìm kiếm
              </Button>
              <Button
                onClick={onReset}
                icon={<ReloadOutlined />}
                style={{ borderColor: "#e5e7eb" }}
              >
                Làm mới
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Error Message */}
      {error && (
        <Card
          style={{
            marginBottom: 16,
            borderColor: SYSTEM_COLORS.error,
            backgroundColor: `${SYSTEM_COLORS.error}10`,
          }}
        >
          <Text type="danger" style={{ color: SYSTEM_COLORS.error }}>
            {error}
          </Text>
        </Card>
      )}

      {/* Table Card */}
      <Card
        className="shadow-sm"
        style={{ borderRadius: "12px", borderColor: "#e5e7eb" }}
      >
        <Table
          rowKey={(r) => r?._id}
          loading={loading}
          columns={columns}
          dataSource={jobs}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} công việc`,
          }}
          onChange={(pag) => onTableChange(pag)}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

// Export as Posts for backward compatibility with imports
const Posts = Jobs;
export default Posts;
