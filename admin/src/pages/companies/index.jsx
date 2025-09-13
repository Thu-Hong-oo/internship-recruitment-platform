
import React, { useEffect, useMemo, useState } from "react";

import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Statistic,

  Form,
  Select,
  Input,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  FileTextOutlined,
  StarOutlined,

  ReloadOutlined,
} from "@ant-design/icons";
import companiesAPI from "../../api/companies";

const Companies = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [filters, setFilters] = useState({
    status: undefined,
    size: undefined,
    companyType: undefined,
    search: "",
  });

  const columns = [
    {
      title: "Công ty",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            size={40}
            src={record?.logo?.url || record.logo}
            icon={<UserOutlined />}
          />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-sm text-gray-500">
              {record?.industry?.primary}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",

      render: (_, record) =>
        record?.fullAddress || record?.location?.headquarters?.city || "-",
    },
    {
      title: "Quy mô",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      render: (rating) => (
        <div className="flex items-center">
          <StarOutlined className="text-yellow-400 mr-1" />
          <span>{rating?.overall ?? rating?.average ?? 0}</span>
          <span className="text-gray-500 ml-1">({rating?.count ?? 0})</span>
        </div>
      ),
    },
    {
      title: "Thống kê",
      key: "stats",
      render: (_, record) => (
        <div className="text-sm">
          <div>{record?.stats?.totalJobs ?? 0} bài đăng</div>
          <div>
            {record?.stats?.activeJobs ?? record?.stats?.activeInterns ?? 0}{" "}
            đang hoạt động
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "verified"
              ? "green"
              : status === "pending"
              ? "orange"
              : "red"
          }
        >
          {status === "verified"
            ? "Đã xác thực"
            : status === "pending"
            ? "Chờ duyệt"
            : "Tạm khóa"}
        </Tag>
      ),

    },
    {
      title: "Hành động",
      key: "action",
      render: () => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />}>
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
  ];
  const stats = useMemo(() => {
    const verified = companies.filter(
      (c) => c?.verification?.isVerified
    ).length;
    const totalCompanies = total || companies.length;
    const pending = totalCompanies - verified;
    return [
      { title: "Tổng công ty", value: totalCompanies, icon: <UserOutlined /> },
      { title: "Đã xác thực", value: verified, icon: <FileTextOutlined /> },
      { title: "Chờ duyệt", value: pending, icon: <FileTextOutlined /> },
    ];
  }, [companies, total]);


  const fetchCompanies = async (
    page = pagination.current,
    pageSize = pagination.pageSize,
    nextFilters = filters
  ) => {
    try {
      setLoading(true);
      const { companies: rows, total: totalItems } =
        await companiesAPI.getCompanies({
          page,
          limit: pageSize,
          status: nextFilters.status,
          size: nextFilters.size,
          companyType: nextFilters.companyType,
          search: nextFilters.search,
        });
      setCompanies(rows.map((c) => ({ key: c.id || c._id, ...c })));
      setTotal(totalItems);
      setPagination({ current: page, pageSize });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(1, 10, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm công ty
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        {stats.map((stat, index) => (
          <Col xs={24} sm={8} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Form
          form={form}
          layout="inline"
          className="mb-4"
          initialValues={{
            status: undefined,
            size: undefined,
            companyType: undefined,
            search: "",
          }}
          onFinish={(values) => {
            const next = { ...filters, ...values };
            setFilters(next);
            fetchCompanies(1, pagination.pageSize, next);
          }}
        >
          <Form.Item name="search">
            <Input.Search
              allowClear
              placeholder="Tìm theo tên, mô tả..."
              onSearch={() => form.submit()}
              style={{ width: 260 }}
            />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái">
            <Select
              allowClear
              placeholder="Tất cả"
              style={{ width: 160 }}
              onChange={() => form.submit()}
            >
              <Select.Option value="active">Hoạt động</Select.Option>
              <Select.Option value="inactive">Tạm khóa</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="size" label="Quy mô">
            <Select
              allowClear
              placeholder="Tất cả"
              style={{ width: 180 }}
              onChange={() => form.submit()}
            >
              <Select.Option value="startup">Startup</Select.Option>
              <Select.Option value="small">Nhỏ</Select.Option>
              <Select.Option value="medium">Vừa</Select.Option>
              <Select.Option value="large">Lớn</Select.Option>
              <Select.Option value="enterprise">Tập đoàn</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="companyType" label="Loại hình">
            <Select
              allowClear
              placeholder="Tất cả"
              style={{ width: 180 }}
              onChange={() => form.submit()}
            >
              <Select.Option value="private">Tư nhân</Select.Option>
              <Select.Option value="public">Nhà nước/Đại chúng</Select.Option>
              <Select.Option value="ngo">NGO/Non-profit</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  form.resetFields();
                  const next = {
                    status: undefined,
                    size: undefined,
                    companyType: undefined,
                    search: "",
                  };
                  setFilters(next);
                  fetchCompanies(1, pagination.pageSize, next);
                }}
              >
                Làm mới
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          rowKey="key"
          loading={loading}
          columns={columns}
          dataSource={companies}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: total,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (t) => `Tổng ${t} công ty`,
          }}
          onChange={(pager) => {
            const { current, pageSize } = pager;
            fetchCompanies(current, pageSize, filters);
          }}
        />
      </Card>
    </div>
  );
};

export default Companies;
