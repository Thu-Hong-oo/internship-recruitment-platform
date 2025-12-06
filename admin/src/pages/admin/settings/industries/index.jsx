import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Space,
  Tag,
  Statistic,
  Form,
  Select,
  Input,
  Switch,
  Tree,
  Modal,
  message,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UserOutlined,
  ReloadOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import industriesAPI from "../../../api/industries";

const Industries = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState([]);
  const [allIndustries, setAllIndustries] = useState([]);
  const [selectedParent, setSelectedParent] = useState(undefined);
  const [includeStats, setIncludeStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);
  const [subIndustriesCache, setSubIndustriesCache] = useState(new Map());
  const [loadingSubIndustries, setLoadingSubIndustries] = useState(new Set());

  const columns = [
    {
      title: "Tên ngành nghề",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <div>
          <div className="font-medium">
            {name?.vi || name}
            {name?.en && (
              <span className="text-gray-500 ml-2">({name.en})</span>
            )}
          </div>
          {record.description?.vi && (
            <div className="text-sm text-gray-500 mt-1">
              {record.description.vi}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      render: (code) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: "Cấp cha",
      dataIndex: "parentCode",
      key: "parentCode",
      render: (parentCode) =>
        parentCode ? (
          <Tag color="orange">{parentCode}</Tag>
        ) : (
          <Tag color="green">Root</Tag>
        ),
    },
    // {
    //   title: "Thống kê",
    //   key: "stats",
    //   render: (_, record) => {
    //     if (!includeStats || !record.stats) return "-";
    //     return (
    //       <div className="text-sm">
    //         <div>
    //           <FileTextOutlined className="mr-1" />
    //           {record.stats.totalJobs || 0} việc làm
    //         </div>
    //         <div>
    //           <UserOutlined className="mr-1" />
    //           {record.stats.totalCandidates || 0} ứng viên
    //         </div>
    //       </div>
    //     );
    //   },
    // },
    {
      title: "Trạng thái",
      dataIndex: "visible",
      key: "visible",
      render: (visible) => (
        <Tag color={visible ? "green" : "red"}>
          {visible ? "Hiển thị" : "Ẩn"}
        </Tag>
      ),
    },
    {
      title: "Sắp xếp",
      dataIndex: "sortOrder",
      key: "sortOrder",
      render: (order) => <span className="font-medium">{order || 0}</span>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Xem
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  const fetchIndustries = async (filters = {}) => {
    try {
      setLoading(true);
      const { data, success, error } = await industriesAPI.getIndustries({
        q: filters.search || searchQuery,
        parent: filters.parent || selectedParent,
        includeStats: includeStats,
      });

      if (success) {
        const industriesWithKey = data.map((item) => ({
          key: item._id || item.code,
          ...item,
        }));
        setIndustries(industriesWithKey);
        setAllIndustries(industriesWithKey);
      } else {
        message.error(error || "Không thể tải danh sách ngành nghề");
        setIndustries([]);
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi tải dữ liệu");
      setIndustries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllIndustries = async () => {
    try {
      const { data, success } = await industriesAPI.getIndustries({
        includeStats: false,
      });
      if (success) {
        setAllIndustries(
          data.map((item) => ({ key: item._id || item.code, ...item }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch all industries:", error);
    }
  };

  useEffect(() => {
    fetchIndustries();
    fetchAllIndustries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeStats]);

  const stats = useMemo(() => {
    const totalIndustries = allIndustries.length;
    const rootIndustries = allIndustries.filter((i) => !i.parentCode).length;
    const totalJobs = includeStats
      ? allIndustries.reduce((sum, i) => sum + (i.stats?.totalJobs || 0), 0)
      : 0;
    const totalCandidates = includeStats
      ? allIndustries.reduce(
          (sum, i) => sum + (i.stats?.totalCandidates || 0),
          0
        )
      : 0;

    return [
      {
        title: "Tổng ngành nghề",
        value: totalIndustries,
        icon: <FolderOutlined />,
      },
      {
        title: "Ngành nghề gốc",
        value: rootIndustries,
        icon: <FolderOpenOutlined />,
      },
      {
        title: "Tổng việc làm",
        value: totalJobs,
        icon: <FileTextOutlined />,
        show: includeStats,
      },
      {
        title: "Tổng ứng viên",
        value: totalCandidates,
        icon: <UserOutlined />,
        show: includeStats,
      },
    ].filter((stat) => stat.show !== false);
  }, [allIndustries, includeStats]);

  const handleViewDetail = (record) => {
    Modal.info({
      title: record.name?.vi || record.name,
      width: 600,
      content: (
        <div className="mt-4">
          <div className="mb-2">
            <strong>Tên tiếng Anh:</strong> {record.name?.en || "-"}
          </div>
          <div className="mb-2">
            <strong>Mã:</strong> <Tag>{record.code}</Tag>
          </div>
          <div className="mb-2">
            <strong>Cấp cha:</strong>{" "}
            {record.parentCode ? (
              <Tag color="orange">{record.parentCode}</Tag>
            ) : (
              <Tag color="green">Root</Tag>
            )}
          </div>
          <div className="mb-2">
            <strong>Mô tả:</strong> {record.description?.vi || "-"}
          </div>
          <div className="mb-2">
            <strong>Keywords:</strong>{" "}
            {record.keywords?.length > 0
              ? record.keywords.map((k) => <Tag key={k}>{k}</Tag>)
              : "-"}
          </div>
          {includeStats && record.stats && (
            <div className="mt-4">
              <strong>Thống kê:</strong>
              <div className="mt-2">
                <div>Việc làm: {record.stats.totalJobs || 0}</div>
                <div>Ứng viên: {record.stats.totalCandidates || 0}</div>
                <div>CV: {record.stats.totalCVs || 0}</div>
                <div>Ứng tuyển: {record.stats.totalApplications || 0}</div>
              </div>
            </div>
          )}
        </div>
      ),
    });
  };

  const handleEdit = (record) => {
    message.info("Chức năng sửa đang được phát triển");
    // TODO: Implement edit modal
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa ngành nghề "${
        record.name?.vi || record.name
      }"?`,
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const { success, error } = await industriesAPI.deleteIndustry(
            record._id
          );
          if (success) {
            message.success("Xóa thành công");
            fetchIndustries();
            fetchAllIndustries();
          } else {
            message.error(error || "Không thể xóa ngành nghề");
          }
        } catch (error) {
          message.error("Có lỗi xảy ra khi xóa");
        }
      },
    });
  };

  const handleAdd = () => {
    message.info("Chức năng thêm mới đang được phát triển");
    // TODO: Implement add modal
  };

  // Get parent options for filter
  const parentOptions = useMemo(() => {
    const roots = allIndustries.filter((i) => !i.parentCode);
    return [
      { value: undefined, label: "Tất cả" },
      { value: "root", label: "Root (Ngành nghề gốc)" },
      ...roots.map((i) => ({
        value: i.code,
        label: `${i.name?.vi || i.name} (${i.code})`,
      })),
    ];
  }, [allIndustries]);

  // Filter industries based on parent selection
  const displayedIndustries = useMemo(() => {
    if (!selectedParent) return industries;
    if (selectedParent === "root") {
      return industries.filter((i) => !i.parentCode);
    }
    return industries.filter((i) => i.parentCode === selectedParent);
  }, [industries, selectedParent]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ background: "oklch(0.55 0.18 195)" }}
        >
          Thêm ngành nghề
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: "oklch(0.55 0.18 195)" }}
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
            search: "",
            parent: undefined,
          }}
          onFinish={(values) => {
            setSearchQuery(values.search || "");
            setSelectedParent(values.parent);
            fetchIndustries({
              search: values.search,
              parent: values.parent,
            });
          }}
        >
          <Form.Item name="search">
            <Input.Search
              allowClear
              placeholder="Tìm kiếm theo tên, mã..."
              onSearch={() => form.submit()}
              style={{ width: 260 }}
            />
          </Form.Item>
          <Form.Item name="parent" label="Cấp cha">
            <Select
              allowClear
              placeholder="Tất cả"
              style={{ width: 200 }}
              onChange={() => form.submit()}
            >
              {parentOptions.map((opt) => (
                <Select.Option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Bao gồm thống kê">
            <Switch
              checked={includeStats}
              onChange={(checked) => {
                setIncludeStats(checked);
              }}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  form.resetFields();
                  setSearchQuery("");
                  setSelectedParent(undefined);
                  fetchIndustries();
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
          dataSource={displayedIndustries}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50", "100"],
            showTotal: (t) => `Tổng ${t} ngành nghề`,
          }}
          expandable={{
            expandedRowKeys: expandedRows,
            onExpand: async (expanded, record) => {
              if (expanded) {
                setExpandedRows([...expandedRows, record.key]);

                // Fetch sub-industries if not in cache
                if (!subIndustriesCache.has(record.code)) {
                  setLoadingSubIndustries((prev) =>
                    new Set(prev).add(record.code)
                  );
                  try {
                    const { data, success } =
                      await industriesAPI.getSubIndustries(
                        record.code,
                        includeStats
                      );
                    if (success && data.length > 0) {
                      const children = data.map((item) => ({
                        key: item._id || item.code,
                        ...item,
                      }));
                      setSubIndustriesCache((prev) => {
                        const newMap = new Map(prev);
                        newMap.set(record.code, children);
                        return newMap;
                      });
                      // Update allIndustries to include fetched children
                      setAllIndustries((prev) => {
                        const existing = prev.map((i) => i.key);
                        const newItems = children.filter(
                          (c) => !existing.includes(c.key)
                        );
                        return [...prev, ...newItems];
                      });
                    }
                  } catch (error) {
                    console.error("Failed to fetch sub-industries:", error);
                    message.error("Không thể tải ngành nghề con");
                  } finally {
                    setLoadingSubIndustries((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(record.code);
                      return newSet;
                    });
                  }
                }
              } else {
                setExpandedRows(expandedRows.filter((k) => k !== record.key));
              }
            },
            onExpandedRowsChange: setExpandedRows,
            rowExpandable: (record) => {
              // Always allow expand (will check if has children when expanded)
              return true;
            },
            expandedRowRender: (record) => {
              // Check if loading
              if (loadingSubIndustries.has(record.code)) {
                return (
                  <div className="p-4 text-center text-gray-500">
                    Đang tải...
                  </div>
                );
              }

              // Check cache
              if (subIndustriesCache.has(record.code)) {
                const children = subIndustriesCache.get(record.code);
                if (children.length === 0) {
                  return (
                    <div className="p-4 text-center text-gray-500">
                      Không có ngành nghề con
                    </div>
                  );
                }
                return (
                  <Table
                    columns={columns}
                    dataSource={children}
                    pagination={false}
                    rowKey="key"
                    size="small"
                  />
                );
              }

              // Check existing data
              const existingChildren = allIndustries.filter(
                (i) => i.parentCode === record.code
              );
              if (existingChildren.length > 0) {
                return (
                  <Table
                    columns={columns}
                    dataSource={existingChildren}
                    pagination={false}
                    rowKey="key"
                    size="small"
                  />
                );
              }

              return (
                <div className="p-4 text-center text-gray-500">
                  Không có ngành nghề con
                </div>
              );
            },
          }}
        />
      </Card>
    </div>
  );
};

export default Industries;
