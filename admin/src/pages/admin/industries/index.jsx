import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Space,
  Tag,
  Form,
  Select,
  Input,
  Switch,
  Modal,
  message,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  UserOutlined,
  ReloadOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import industriesAPI from "../../../api/industries";

const { TextArea } = Input;

const Industries = () => {
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentIndustry, setCurrentIndustry] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [allIndustries, setAllIndustries] = useState([]);
  const [selectedParent, setSelectedParent] = useState("");
  const [includeStats, setIncludeStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState([]);
  const [subIndustriesCache, setSubIndustriesCache] = useState(new Map());
  const [loadingSubIndustries, setLoadingSubIndustries] = useState(new Set());

  const navigate = useNavigate();

  const nextSortOrder = useMemo(() => {
    if (allIndustries.length === 0) return 0;
    const maxOrder = Math.max(
      ...allIndustries.map((item) => item.sortOrder ?? 0)
    );
    return maxOrder + 1;
  }, [allIndustries]);

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
    // {
    //   title: "Mã",
    //   dataIndex: "code",
    //   key: "code",
    //   render: (code) => <Tag color="blue">{code}</Tag>,
    // },
    {
      title: "Cấp cha",
      dataIndex: "parentCode",
      key: "parentCode",
      render: (parentCode) =>
        parentCode ? (
          <Tag color="orange">{parentCode}</Tag>
        ) : (
          <Tag color="gray">Không</Tag>
        ),
    },
    {
      title: "Thống kê",
      key: "stats",
      render: (_, record) => {
        if (!includeStats || !record.stats) return "-";
        return (
          <div className="text-sm">
            <div>
              <FileTextOutlined className="mr-1" />
              {record.stats.totalJobs || 0} việc làm
            </div>
            <div>
              <UserOutlined className="mr-1" />
              {record.stats.totalCandidates || 0} ứng viên
            </div>
          </div>
        );
      },
    },
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
        q: filters.search ?? searchQuery,
        parent: filters.parent !== undefined ? filters.parent : selectedParent,
        includeStats: includeStats,
      });

      if (success) {
        const industriesWithKey = data.map((item) => ({
          key: item._id || item.code,
          ...item,
        }));
        setIndustries(industriesWithKey);
        // setAllIndustries(industriesWithKey);
      } else {
        message.error(error || "Không thể tải danh sách ngành nghề");
        setIndustries([]);
      }
    } catch (error) {
      console.error("Failed to fetch industries:", error);
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
    setIsEditing(true);
    setCurrentIndustry(record);
    addForm.resetFields();
    addForm.setFieldsValue({
      code: record.code,
      parentCode: record.parentCode ?? "",
      nameVi: record.name?.vi ?? "",
      nameEn: record.name?.en ?? "",
      descriptionVi: record.description?.vi ?? "",
      descriptionEn: record.description?.en ?? "",
      color: record.color ?? "#2563eb",
      icon: record.icon ?? "",
      keywords: record.keywords?.join(", ") ?? "",
      suggestedTemplates: record.suggestedTemplates?.join(", ") ?? "",
      summarySuggestions: record.suggestions?.summary?.join(", ") ?? "",
      experienceSuggestions: record.suggestions?.experience?.join(", ") ?? "",
      projectSuggestions: record.suggestions?.projects?.join(", ") ?? "",
      skillSuggestions: record.suggestions?.skills?.join(", ") ?? "",
      visible: record.visible ?? true,
      sortOrder: record.sortOrder ?? nextSortOrder,
    });
    setShowAddModal(true);
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
            record.code
          );
          if (success) {
            message.success("Xóa thành công");
            // Cập nhật lại danh sách hiện tại
            setIndustries((prev) =>
              prev.filter((industry) => industry.code !== record.code)
            );
            setAllIndustries((prev) =>
              prev.filter((industry) => industry.code !== record.code)
            );
            setSubIndustriesCache((prev) => {
              const next = new Map();
              prev.forEach((value, key) => {
                if (key !== record.code) {
                  next.set(
                    key,
                    value.filter((industry) => industry.code !== record.code)
                  );
                }
              });
              return next;
            });
            setExpandedRows((prev) => prev.filter((key) => key !== record.key));
            fetchIndustries();
            fetchAllIndustries();
          } else {
            message.error(error || "Không thể xóa ngành nghề");
          }
        } catch (error) {
          console.error("Failed to delete industry:", error);
          message.error("Có lỗi xảy ra khi xóa");
        }
      },
    });
  };

  const handleAdd = () => {
    setIsEditing(false);
    setCurrentIndustry(null);
    addForm.resetFields();
    addForm.setFieldsValue({
      parentCode: "",
      visible: true,
      sortOrder: nextSortOrder,
      color: "#2563eb",
    });
    setShowAddModal(true);
  };

  const parseListInput = (value) => {
    if (!value) return [];
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const handleSubmitIndustry = async () => {
    try {
      const values = await addForm.validateFields();
      const payload = {
        code: values.code.trim(),
        parentCode:
          values.parentCode === "" || values.parentCode === undefined
            ? null
            : values.parentCode,
        name: {
          vi: values.nameVi?.trim() || "",
          en: values.nameEn?.trim() || "",
        },
        description: {
          vi: values.descriptionVi?.trim() || "",
          en: values.descriptionEn?.trim() || "",
        },
        color: values.color || "#2563eb",
        icon: values.icon || "",
        keywords: parseListInput(values.keywords),
        suggestedTemplates: parseListInput(values.suggestedTemplates),
        suggestions: {
          summary: parseListInput(values.summarySuggestions),
          experience: parseListInput(values.experienceSuggestions),
          projects: parseListInput(values.projectSuggestions),
          skills: parseListInput(values.skillSuggestions),
        },
        visible: Boolean(values.visible),
        sortOrder:
          typeof values.sortOrder === "number"
            ? values.sortOrder
            : Number(values.sortOrder) || 0,
      };

      setCreating(true);
      if (isEditing && currentIndustry) {
        const { success, error } = await industriesAPI.updateIndustry(
          currentIndustry.code,
          payload
        );
        if (success) {
          message.success("Cập nhật ngành nghề thành công");
          setShowAddModal(false);
          setCurrentIndustry(null);
          fetchIndustries();
          fetchAllIndustries();
        } else {
          message.error(error || "Không thể cập nhật ngành nghề");
        }
      } else {
        const { success, error } = await industriesAPI.createIndustry(payload);
        if (success) {
          message.success("Tạo ngành nghề thành công");
          setShowAddModal(false);
          fetchIndustries();
          fetchAllIndustries();
        } else {
          message.error(error || "Không thể tạo ngành nghề");
        }
      }
    } catch (error) {
      if (error?.errorFields) {
        return;
      }
      console.error("Failed to submit industry:", error);
      message.error("Có lỗi xảy ra khi xử lý ngành nghề");
    } finally {
      setCreating(false);
    }
  };

  // Get parent options for filter
  const parentOptions = useMemo(() => {
    const roots = allIndustries.filter((i) => !i.parentCode);
    return [
      { value: "", label: "Không lọc" },
      { value: "root", label: "Không có danh mục cha" },
      ...roots.map((i) => ({
        value: i.code,
        label: `${i.name?.vi || i.name}`,
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
        <Button
          icon={<BarChartOutlined />}
          onClick={() => navigate("/admin/industries/analytics")}
        >
          Xem thống kê
        </Button>
      </div>

      <Card>
        <Form
          form={form}
          layout="inline"
          className="mb-4"
          initialValues={{
            search: "",
            parent: "",
          }}
          onFinish={(values) => {
            const parentValue = values.parent ?? "";
            setSearchQuery(values.search || "");
            setSelectedParent(parentValue);
            fetchIndustries({
              search: values.search,
              parent: parentValue,
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
          <Form.Item name="parent" label="Lọc theo danh mục cha">
            <Select
              allowClear
              placeholder="Không lọc"
              style={{ width: 200 }}
              onChange={() => form.submit()}
            >
              {parentOptions.map((opt) => (
                <Select.Option
                  key={opt.value === "" ? "all" : opt.value}
                  value={opt.value}
                >
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
                  setSelectedParent("");
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
            rowExpandable: () => {
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

      <Modal
        title={isEditing ? "Cập nhật ngành nghề" : "Thêm ngành nghề"}
        open={showAddModal}
        onCancel={() => setShowAddModal(false)}
        confirmLoading={creating}
        onOk={handleSubmitIndustry}
        width={720}
        okText={isEditing ? "Cập nhật" : "Tạo"}
        cancelText="Hủy"
      >
        <Form form={addForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Mã ngành nghề"
                rules={[
                  { required: true, message: "Vui lòng nhập mã ngành nghề" },
                  {
                    pattern: /^[a-z0-9-]+$/,
                    message: "Chỉ sử dụng chữ thường, số và dấu gạch ngang",
                  },
                ]}
              >
                <Input
                  placeholder="Ví dụ: construction-real-estate"
                  disabled={isEditing}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="parentCode" label="Ngành nghề cha">
                <Select placeholder="Không có" allowClear>
                  <Select.Option value="">Không có</Select.Option>
                  {allIndustries
                    .filter(
                      (item) =>
                        !item.parentCode && item.code !== currentIndustry?.code
                    )
                    .map((item) => (
                      <Select.Option key={item.code} value={item.code}>
                        {item.name?.vi || item.name}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nameVi"
                label="Tên (Tiếng Việt)"
                rules={[
                  { required: true, message: "Vui lòng nhập tên tiếng Việt" },
                ]}
              >
                <Input placeholder="Tên tiếng Việt" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nameEn"
                label="Tên (Tiếng Anh)"
                rules={[
                  { required: true, message: "Vui lòng nhập tên tiếng Anh" },
                ]}
              >
                <Input placeholder="Tên tiếng Anh" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="descriptionVi" label="Mô tả (Tiếng Việt)">
                <TextArea rows={3} placeholder="Mô tả ngành nghề" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="descriptionEn" label="Mô tả (Tiếng Anh)">
                <TextArea rows={3} placeholder="Description" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="color" label="Màu sắc">
                <Input placeholder="#2563eb" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="icon" label="Icon">
                <Input placeholder="Ví dụ: building" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="keywords"
                label="Từ khóa"
                tooltip="Phân tách bằng dấu phẩy"
              >
                <Input placeholder="construction, architecture, property" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="suggestedTemplates"
                label="Gợi ý template"
                tooltip="Phân tách bằng dấu phẩy"
              >
                <Input placeholder="classic, executive" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="summarySuggestions"
                label="Gợi ý Summary"
                tooltip="Phân tách bằng dấu phẩy"
              >
                <Input placeholder="Kỹ sư xây dựng..., Kiến trúc sư..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="experienceSuggestions"
                label="Gợi ý Kinh nghiệm"
                tooltip="Phân tách bằng dấu phẩy"
              >
                <Input placeholder="Giám sát thi công..., Thiết kế 20+ dự án" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectSuggestions"
                label="Gợi ý Dự án"
                tooltip="Phân tách bằng dấu phẩy"
              >
                <Input placeholder="Dự án chung cư 30 tầng..., Khu đô thị thông minh..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="skillSuggestions"
                label="Gợi ý Kỹ năng"
                tooltip="Phân tách bằng dấu phẩy"
              >
                <Input placeholder="AutoCAD, Revit, Project Management" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="visible"
                label="Hiển thị"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sortOrder"
                label="Thứ tự hiển thị"
                rules={[{ required: true, message: "Vui lòng nhập thứ tự" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default Industries;
