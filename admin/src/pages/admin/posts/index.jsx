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
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatDate = (value) => new Date(value).toLocaleString("vi-VN");

const statusColor = (status) => {
  switch (status) {
    case "active":
      return "green";
    case "pending":
      return "orange";
    case "deleted":
      return "red";
    default:
      return "default";
  }
};

const Posts = () => {
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
        render: (text, record) => (
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ color: "#667085" }}>{record?.employer?.name}</div>
          </div>
        ),
      },
      {
        title: "Công ty (Email)",
        key: "employer",
        render: (_, record) => (
          <div>
            <div>{record?.employer?.name || "-"}</div>
            <div style={{ color: "#667085", fontSize: 12 }}>
              {record?.employer?.email || "-"}
            </div>
          </div>
        ),
      },
      {
        title: "Địa điểm",
        dataIndex: "location",
        key: "location",
      },
      {
        title: "Kỹ năng",
        dataIndex: "skills",
        key: "skills",
        render: (skills = []) => (
          <Space wrap size={[4, 4]}>
            {(skills || []).slice(0, 4).map((s) => (
              <Tag key={s}>{s}</Tag>
            ))}
            {(skills || []).length > 4 ? (
              <Tag>+{(skills || []).length - 4}</Tag>
            ) : null}
          </Space>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status) => <Tag color={statusColor(status)}>{status}</Tag>,
      },
      {
        title: "Ứng tuyển",
        key: "applications",
        render: (_, r) => r?.analytics?.applications ?? 0,
      },
      {
        title: "Views",
        key: "views",
        render: (_, r) => r?.analytics?.views ?? 0,
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v) => <span>{formatDate(v)}</span>,
      },
      {
        title: "Hành động",
        key: "action",
        render: (_, record) => (
          <Space size="middle">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() =>
                (window.location.href = `/admin/posts/${record?._id}`)
              }
            >
              Xem
            </Button>
            <Button type="link" icon={<EditOutlined />}>
              Sửa
            </Button>
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Space>
        ),
      },
    ],
    []
  );

  const buildQuery = (values) => {
    const params = new URLSearchParams();
    params.set("page", String(pagination.page));
    params.set("limit", String(pagination.limit));

    // status: 'all' -> omit; otherwise pass raw value (e.g., 'is-pending')
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

    // Date range
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
            data?.error || `Lỗi ${res.status}: Không thể tải danh sách bài đăng`
          );
        }
      }

      if (!data?.success) {
        throw new Error(data?.error || "Không thể tải danh sách bài đăng");
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
    // Defaults
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quản lý bài đăng</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm bài đăng
        </Button>
      </div>

      {stats && (
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="Tổng bài đăng" value={stats?.totalJobs || 0} />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Đang hoạt động"
                value={stats?.statusBreakdown?.active || 0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Chờ duyệt"
                value={stats?.statusBreakdown?.pending || 0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="Cần chú ý" value={stats?.needAttention || 0} />
            </Card>
          </Col>
        </Row>
      )}

      <Card className="mb-4">
        <Form form={form} layout="vertical" onFinish={onSearch}>
          <Row gutter={12}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Trạng thái" name="status">
                <Select
                  options={[
                    { label: "Tất cả", value: "all" },
                    { label: "Chờ duyệt", value: "pending" },
                    { label: "Hoạt động", value: "active" },
                    { label: "Đã xóa", value: "deleted" },
                  ]}
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
                  ]}
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
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Địa điểm" name="location">
                <Input placeholder="Nhập địa điểm" allowClear />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={12}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Lương tối thiểu" name="salaryMin">
                <Input type="number" min={0} placeholder="VD: 5000000" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Lương tối đa" name="salaryMax">
                <Input type="number" min={0} placeholder="VD: 15000000" />
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

          <Row gutter={12}>
            <Col xs={24} md={16}>
              <Form.Item label="Tìm kiếm" name="search">
                <Input placeholder="Tìm theo tiêu đề, công ty..." allowClear />
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
              >
                Tìm kiếm
              </Button>
              <Button onClick={onReset} icon={<ReloadOutlined />}>
                Làm mới
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {error && (
        <Card style={{ marginBottom: 12 }}>
          <Text type="danger">{error}</Text>
        </Card>
      )}

      <Card>
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
          }}
          onChange={(pag) => onTableChange(pag)}
        />
      </Card>
    </div>
  );
};

export default Posts;
