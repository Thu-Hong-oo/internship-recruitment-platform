import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  Spin,
  Table,
  Tag,
  Empty,
  Tabs,
  Button,
  Avatar,
} from "antd";
import {
  Line,
  Column,
  Pie,
  Area,
  Heatmap,
} from "@ant-design/plots";
import {
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  FileTextOutlined,
  RiseOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  AimOutlined,
  FireOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import dashboardAPI from "../../api/dashboard";

const { Option } = Select;
const { TabPane } = Tabs;

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

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboard();
  }, [period]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboard(period);
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (type, data) => {
    if (type === "user" && data?._id) {
      navigate(`/admin/users/detail?uid=${data._id}`);
    } else if (type === "job" && data?._id) {
      navigate(`/admin/posts/${data._id}`);
    } else if (type === "application" && data?._id) {
      // Navigate to job detail with application filter
      if (data.jobId?._id) {
        navigate(`/admin/posts/${data.jobId._id}`);
      }
    } else if (type === "employer" && data?.employerId) {
      navigate(`/admin/companies/${data.employerId}`);
    } else if (type === "users") {
      // Navigate to users list with filter
      const role = data?.type === "candidate" ? "candidate" : data?.type === "employer" ? "employer" : undefined;
      navigate(`/admin/users${role ? `?role=${role}` : ""}`);
    } else if (type === "jobs") {
      navigate("/admin/jobs");
    } else if (type === "applications") {
      navigate("/admin/jobs");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <Empty description="Không có dữ liệu dashboard" />
      </div>
    );
  }

  const { stats, charts, recentActivities } = dashboardData;

  // ========== STAT CARDS ==========
  const statCards = [
    {
      title: "Tổng người dùng",
      value: stats?.totalUsers || 0,
      Icon: UserOutlined,
      color: SYSTEM_COLORS.info,
      change: stats?.newUsersToday || 0,
      changeLabel: "hôm nay",
      onClick: () => handleViewDetail("users", { type: "all" }),
    },
    {
      title: "Ứng viên",
      value: stats?.totalStudents || 0,
      Icon: TeamOutlined,
      color: SYSTEM_COLORS.success,
      onClick: () => handleViewDetail("users", { type: "candidate" }),
    },
    {
      title: "Nhà tuyển dụng",
      value: stats?.totalEmployers || 0,
      Icon: BankOutlined,
      color: SYSTEM_COLORS.purple,
      verified: stats?.verifiedEmployers || 0,
      onClick: () => handleViewDetail("users", { type: "employer" }),
    },
    {
      title: "Tổng công việc",
      value: stats?.totalJobs || 0,
      Icon: FileTextOutlined,
      color: SYSTEM_COLORS.warning,
      active: stats?.activeJobs || 0,
      change: stats?.newJobsToday || 0,
      changeLabel: "hôm nay",
      onClick: () => handleViewDetail("jobs", { type: "all" }),
    },
    {
      title: "Đơn ứng tuyển",
      value: stats?.totalApplications || 0,
      Icon: FileTextOutlined,
      color: SYSTEM_COLORS.cyan,
      pending: stats?.pendingApplications || 0,
      change: stats?.newApplicationsToday || 0,
      changeLabel: "hôm nay",
      onClick: () => handleViewDetail("applications", { type: "all" }),
    },
    {
      title: "Tỷ lệ chấp nhận",
      value: stats?.totalApplications
        ? Math.round(
            ((stats?.acceptedApplications || 0) / stats.totalApplications) * 100
          )
        : 0,
      Icon: AimOutlined,
      color: SYSTEM_COLORS.error,
      suffix: "%",
    },
  ];

  // ========== USER GROWTH TREND (Only candidate and employer) ==========
  const userGrowthData = charts?.userGrowthTrend
    ?.filter((item) => item._id?.role !== "admin") // Filter out admin
    .map((item) => ({
      date: item._id?.date || "",
      role: item._id?.role || "unknown",
      count: item.count || 0,
    })) || [];

  const roles = [...new Set(userGrowthData.map((item) => item.role))].filter(
    (r) => r !== "admin"
  );
  const dates = [...new Set(userGrowthData.map((item) => item.date))].sort();
  
  const userGrowthByDate = {};
  userGrowthData.forEach((item) => {
    if (!userGrowthByDate[item.date]) {
      userGrowthByDate[item.date] = {};
    }
    userGrowthByDate[item.date][item.role] = item.count;
  });

  const userGrowthChartData = dates.map((date) => {
    const dataPoint = {
      date: moment(date).format("DD/MM"),
    };
    roles.forEach((role) => {
      dataPoint[role] = userGrowthByDate[date]?.[role] || 0;
    });
    return dataPoint;
  });

  // ========== APPLICATION STATUS DISTRIBUTION ==========
  const applicationStatusData =
    charts?.applicationStatusDistribution?.map((item) => ({
      type: item._id === "pending" ? "Chờ duyệt" : item._id === "accepted" ? "Đã chấp nhận" : item._id === "rejected" ? "Đã từ chối" : item._id,
      value: item.count || 0,
      status: item._id,
    })) || [];

  // ========== JOB STATUS DISTRIBUTION ==========
  const jobStatusData =
    charts?.jobStatusDistribution?.map((item) => ({
      type:
        item._id === "active"
          ? "Đang hoạt động"
          : item._id === "paused"
          ? "Tạm dừng"
          : item._id === "draft"
          ? "Bản nháp"
          : item._id === "expired"
          ? "Hết hạn"
          : item._id,
      value: item.count || 0,
      status: item._id,
    })) || [];

  // ========== APPLICATIONS TREND ==========
  const applicationsTrendData =
    charts?.applicationsTrend?.map((item) => ({
      date: moment(item._id?.date).format("DD/MM"),
      status: item._id?.status === "pending" ? "Chờ duyệt" : item._id?.status === "accepted" ? "Đã chấp nhận" : item._id?.status === "rejected" ? "Đã từ chối" : item._id?.status,
      count: item.count || 0,
      rawStatus: item._id?.status,
    })) || [];

  // ========== TOP INDUSTRIES ==========
  const topIndustriesData =
    charts?.topIndustries
      ?.slice(0, 10)
      .map((item) => ({
        industry: item._id || "Unknown",
        count: item.count || 0,
      })) || [];

  // ========== TOP SKILLS ==========
  const topSkillsData =
    charts?.topSkills
      ?.slice(0, 10)
      .map((item) => ({
        skill: item._id || "Unknown",
        count: item.count || 0,
      })) || [];

  // ========== JOB LEVEL DISTRIBUTION ==========
  const jobLevelData =
    charts?.jobLevelDistribution?.map((item) => ({
      type: item._id || "Unknown",
      value: item.count || 0,
    })) || [];

  // ========== JOB TYPE DISTRIBUTION ==========
  const jobTypeData =
    charts?.jobTypeDistribution?.map((item) => ({
      type: item._id === "Fulltime" ? "Toàn thời gian" : item._id === "Parttime" ? "Bán thời gian" : item._id === "Intern" ? "Thực tập" : item._id,
      value: item.count || 0,
      rawType: item._id,
    })) || [];

  // ========== MOST ACTIVE EMPLOYERS ==========
  const mostActiveEmployersData =
    charts?.mostActiveEmployers?.map((item, index) => ({
      key: index,
      rank: index + 1,
      company: item.companyName || "Unknown",
      totalJobs: item.jobCount || 0,
      activeJobs: item.activeJobs || 0,
      isVerified: item.isVerified || false,
      employerId: item._id,
    })) || [];

  // ========== USER ACTIVITY HEATMAP ==========
  const heatmapData = charts?.userActivityHeatmap?.map((item) => ({
    day: item._id?.dayOfWeek || 0,
    hour: item._id?.hour || 0,
    value: item.count || 0,
  })) || [];

  const daysOfWeek = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const heatmapChartData = [];
  daysOfWeek.forEach((day, dayIndex) => {
    hours.forEach((hour) => {
      const dataPoint = heatmapData.find(
        (d) => d.day === dayIndex && d.hour === hour
      );
      heatmapChartData.push({
        day,
        hour: `${hour.toString().padStart(2, "0")}:00`,
        value: dataPoint?.value || 0,
      });
    });
  });

  // ========== RECENT ACTIVITIES TABLES ==========
  const recentUsersColumns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
      width: 200,
    },
    {
      title: "Tên",
      dataIndex: "displayFullName",
      key: "fullName",
      ellipsis: true,
      width: 150,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      width: 130,
      render: (role) => (
        <Tag
          color={
            role === "admin"
              ? "red"
              : role === "employer"
              ? "blue"
              : "green"
          }
        >
          {role === "admin"
            ? "Quản trị viên"
            : role === "employer"
            ? "Nhà tuyển dụng"
            : "Ứng viên"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetail("user", record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  const recentJobsColumns = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      width: 200,
    },
    {
      title: "Công ty",
      key: "company",
      ellipsis: true,
      width: 180,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {record.employer?.company?.logo?.url && (
            <Avatar
              size="small"
              src={record.employer.company.logo.url}
              icon={<BankOutlined />}
            />
          )}
          <span>{record.employer?.company?.name || "N/A"}</span>
        </div>
      ),
    },
    {
      title: "Cấp độ",
      dataIndex: "level",
      key: "level",
      width: 100,
      render: (level) => level && <Tag>{level}</Tag>,
    },
    {
      title: "Loại",
      dataIndex: "jobType",
      key: "jobType",
      width: 100,
      render: (type) =>
        type && (
          <Tag color={type === "Fulltime" ? "blue" : type === "Parttime" ? "orange" : "green"}>
            {type === "Fulltime" ? "Toàn thời gian" : type === "Parttime" ? "Bán thời gian" : "Thực tập"}
          </Tag>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag
          color={
            status === "active"
              ? "green"
              : status === "paused"
              ? "orange"
              : status === "draft"
              ? "default"
              : "red"
          }
        >
          {status === "active"
            ? "Đang hoạt động"
            : status === "paused"
            ? "Tạm dừng"
            : status === "draft"
            ? "Bản nháp"
            : status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetail("job", record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  const recentApplicationsColumns = [
    {
      title: "Ứng viên",
      key: "candidate",
      ellipsis: true,
      width: 150,
      render: (_, record) => (
        <div>
          <div className="font-medium">
            {record.candidateId?.userId?.displayFullName || "N/A"}
          </div>
          <div className="text-xs text-gray-500">
            {record.candidateId?.userId?.email || ""}
          </div>
        </div>
      ),
    },
    {
      title: "Công việc",
      key: "job",
      ellipsis: true,
      width: 200,
      render: (_, record) => record.jobId?.title || "N/A",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag
          color={
            status === "accepted"
              ? "green"
              : status === "rejected"
              ? "red"
              : "orange"
          }
        >
          {status === "accepted"
            ? "Đã chấp nhận"
            : status === "rejected"
            ? "Đã từ chối"
            : "Chờ duyệt"}
        </Tag>
      ),
    },
    {
      title: "Ngày ứng tuyển",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => handleViewDetail("application", record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  // Chart configurations
  const userGrowthChartDataTransformed = [];
  userGrowthChartData.forEach((item) => {
    roles.forEach((role) => {
      userGrowthChartDataTransformed.push({
        date: item.date,
        role: role === "candidate" ? "Ứng viên" : role === "employer" ? "Nhà tuyển dụng" : role,
        count: item[role] || 0,
      });
    });
  });

  const userGrowthConfig = {
    data: userGrowthChartDataTransformed,
    xField: "date",
    yField: "count",
    seriesField: "role",
    smooth: true,
    point: {
      size: 5,
      shape: "circle",
      style: {
        fill: "#fff",
        stroke: SYSTEM_PRIMARY,
        lineWidth: 2,
      },
    },
    legend: {
      position: "top-right",
      itemName: {
        style: {
          fontSize: 12,
        },
      },
    },
    color: [SYSTEM_COLORS.success, SYSTEM_COLORS.purple],
    animation: {
      appear: {
        animation: "wave-in",
        duration: 2000,
      },
    },
  };

  const applicationStatusConfig = {
    data: applicationStatusData,
    angleField: "value",
    colorField: "type",
    radius: 0.85,
    innerRadius: 0.5,
    label: {
      type: "outer",
      content: "{name}\n{value}",
      style: {
        fontSize: 12,
        fontWeight: 500,
      },
    },
    color: [SYSTEM_COLORS.warning, SYSTEM_COLORS.success, SYSTEM_COLORS.error],
    interactions: [{ type: "element-active" }],
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: "pre-wrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
        content: "Tổng\n" + applicationStatusData.reduce((sum, item) => sum + item.value, 0),
      },
    },
  };

  const jobStatusConfig = {
    data: jobStatusData,
    angleField: "value",
    colorField: "type",
    radius: 0.85,
    innerRadius: 0.5,
    label: {
      type: "outer",
      content: "{name}\n{value}",
      style: {
        fontSize: 12,
        fontWeight: 500,
      },
    },
    color: [SYSTEM_COLORS.success, SYSTEM_COLORS.warning, "#6b7280", SYSTEM_COLORS.error],
    interactions: [{ type: "element-active" }],
    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: "pre-wrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
        content: "Tổng\n" + jobStatusData.reduce((sum, item) => sum + item.value, 0),
      },
    },
  };

  const applicationsTrendConfig = {
    data: applicationsTrendData,
    xField: "date",
    yField: "count",
    seriesField: "status",
    smooth: true,
    area: {
      style: {
        fillOpacity: 0.4,
      },
    },
    point: {
      size: 4,
      shape: "circle",
    },
    color: [SYSTEM_COLORS.warning, SYSTEM_COLORS.success, SYSTEM_COLORS.error],
    legend: {
      position: "top-right",
      itemName: {
        style: {
          fontSize: 12,
        },
      },
    },
  };

  const topIndustriesConfig = {
    data: topIndustriesData,
    xField: "industry",
    yField: "count",
    color: SYSTEM_PRIMARY,
    columnStyle: {
      radius: [8, 8, 0, 0],
    },
    label: {
      position: "top",
      style: {
        fill: "#666",
        fontSize: 11,
        fontWeight: 500,
      },
    },
  };

  const topSkillsConfig = {
    data: topSkillsData,
    xField: "skill",
    yField: "count",
    color: SYSTEM_COLORS.purple,
    columnStyle: {
      radius: [8, 8, 0, 0],
    },
    label: {
      position: "top",
      style: {
        fill: "#666",
        fontSize: 11,
        fontWeight: 500,
      },
    },
  };

  const jobLevelConfig = {
    data: jobLevelData,
    angleField: "value",
    colorField: "type",
    radius: 0.85,
    innerRadius: 0.5,
    label: {
      type: "outer",
      content: "{name}\n{value}",
      style: {
        fontSize: 12,
        fontWeight: 500,
      },
    },
    color: [SYSTEM_COLORS.info, SYSTEM_COLORS.success, SYSTEM_COLORS.warning, SYSTEM_COLORS.purple, SYSTEM_COLORS.error],
  };

  const jobTypeConfig = {
    data: jobTypeData,
    angleField: "value",
    colorField: "type",
    radius: 0.85,
    innerRadius: 0.5,
    label: {
      type: "outer",
      content: "{name}\n{value}",
      style: {
        fontSize: 12,
        fontWeight: 500,
      },
    },
    color: [SYSTEM_COLORS.info, SYSTEM_COLORS.success, SYSTEM_COLORS.warning],
  };

  const heatmapConfig = {
    data: heatmapChartData,
    xField: "hour",
    yField: "day",
    colorField: "value",
    color: [
      "#ebedf0",
      "#c6e48b",
      "#7bc96f",
      "#239a3b",
      "#196127",
    ],
    size: 24,
    shape: "rect",
    label: {
      style: {
        fill: "#000",
        fontSize: 10,
      },
    },
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Dashboard Quản Trị
          </h1>
          <p className="text-gray-600 text-sm">
            Tổng quan hệ thống và thống kê hoạt động
          </p>
        </div>
        <Select
          value={period}
          onChange={setPeriod}
          style={{ width: 150 }}
          size="large"
        >
          <Option value={7}>7 ngày qua</Option>
          <Option value={30}>30 ngày qua</Option>
          <Option value={90}>90 ngày qua</Option>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="mb-6"
        type="card"
        size="large"
      >
        <TabPane
          tab={
            <span>
              <BarChartOutlined className="mr-2" />
              Tổng quan
            </span>
          }
          key="overview"
        >
          {/* Stat Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            {statCards.map((stat, index) => {
              const IconComponent = stat.Icon;
              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                  <Card
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer border"
                    style={{
                      borderRadius: "12px",
                      borderColor: "#e5e7eb",
                    }}
                    bodyStyle={{ padding: "24px" }}
                    onClick={stat.onClick}
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
                      {stat.change !== undefined && (
                        <div className="text-xs text-gray-600 text-right bg-gray-100 px-2 py-1 rounded-lg">
                          <div className="font-semibold text-green-600">+{stat.change}</div>
                          <div>{stat.changeLabel}</div>
                        </div>
                      )}
                    </div>
                    <Statistic
                      title={
                        <span className="text-gray-600 text-sm font-medium">
                          {stat.title}
                        </span>
                      }
                      value={stat.value}
                      suffix={stat.suffix}
                      valueStyle={{
                        fontSize: "28px",
                        fontWeight: "bold",
                        color: "#1f2937",
                      }}
                    />
                    {stat.active !== undefined && (
                      <div className="mt-3 text-xs text-gray-500">
                        <span className="font-semibold">{stat.active}</span> đang hoạt động
                      </div>
                    )}
                    {stat.pending !== undefined && (
                      <div className="mt-3 text-xs text-gray-500">
                        <span className="font-semibold">{stat.pending}</span> chờ duyệt
                      </div>
                    )}
                    {stat.verified !== undefined && (
                      <div className="mt-3 text-xs text-gray-500">
                        <span className="font-semibold">{stat.verified}</span> đã xác thực
                      </div>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>

          {/* Charts Row 1 */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} lg={16}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <RiseOutlined style={{ color: SYSTEM_PRIMARY, fontSize: "18px" }} />
                    <span className="font-semibold">Xu hướng tăng trưởng (Ứng viên & Nhà tuyển dụng)</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                {userGrowthChartData.length > 0 ? (
                  <Line {...userGrowthConfig} height={320} />
                ) : (
                  <Empty description="Chưa có dữ liệu" />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <FileTextOutlined style={{ color: SYSTEM_COLORS.warning, fontSize: "18px" }} />
                    <span className="font-semibold">Trạng thái đơn ứng tuyển</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                {applicationStatusData.length > 0 ? (
                  <Pie {...applicationStatusConfig} height={320} />
                ) : (
                  <Empty description="Chưa có dữ liệu" />
                )}
              </Card>
            </Col>
          </Row>

          {/* Charts Row 2 */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <BankOutlined style={{ color: SYSTEM_COLORS.purple, fontSize: "18px" }} />
                    <span className="font-semibold">Trạng thái công việc</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                {jobStatusData.length > 0 ? (
                  <Pie {...jobStatusConfig} height={320} />
                ) : (
                  <Empty description="Chưa có dữ liệu" />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <BarChartOutlined style={{ color: SYSTEM_COLORS.cyan, fontSize: "18px" }} />
                    <span className="font-semibold">Xu hướng ứng tuyển</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                {applicationsTrendData.length > 0 ? (
                  <Area {...applicationsTrendConfig} height={320} />
                ) : (
                  <Empty description="Chưa có dữ liệu" />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <PieChartOutlined className="mr-2" />
              Phân tích chi tiết
            </span>
          }
          key="analytics"
        >
          {/* Charts Row 3 */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <BankOutlined style={{ color: SYSTEM_COLORS.success, fontSize: "18px" }} />
                    <span className="font-semibold">Top 10 ngành nghề</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                {topIndustriesData.length > 0 ? (
                  <Column {...topIndustriesConfig} height={320} />
                ) : (
                  <Empty description="Chưa có dữ liệu" />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <TrophyOutlined style={{ color: SYSTEM_COLORS.error, fontSize: "18px" }} />
                    <span className="font-semibold">Top 10 kỹ năng</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                {topSkillsData.length > 0 ? (
                  <Column {...topSkillsConfig} height={320} />
                ) : (
                  <Empty description="Chưa có dữ liệu" />
                )}
              </Card>
            </Col>
          </Row>

          {/* Charts Row 4 */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <AimOutlined style={{ color: SYSTEM_COLORS.info, fontSize: "18px" }} />
                    <span className="font-semibold">Phân bổ cấp độ công việc</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                {jobLevelData.length > 0 ? (
                  <Pie {...jobLevelConfig} height={320} />
                ) : (
                  <Empty description="Chưa có dữ liệu" />
                )}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <ClockCircleOutlined style={{ color: SYSTEM_COLORS.warning, fontSize: "18px" }} />
                    <span className="font-semibold">Phân bổ loại công việc</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                {jobTypeData.length > 0 ? (
                  <Pie {...jobTypeConfig} height={320} />
                ) : (
                  <Empty description="Chưa có dữ liệu" />
                )}
              </Card>
            </Col>
          </Row>

          {/* Heatmap */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <FireOutlined style={{ color: SYSTEM_COLORS.purple, fontSize: "18px" }} />
                    <span className="font-semibold">Heatmap hoạt động người dùng (theo giờ trong tuần)</span>
                  </div>
                }
                className="shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                {heatmapChartData.length > 0 ? (
                  <Heatmap {...heatmapConfig} height={250} />
                ) : (
                  <Empty description="Chưa có dữ liệu" />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined className="mr-2" />
              Hoạt động gần đây
            </span>
          }
          key="activities"
        >
          {/* Most Active Employers */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <BankOutlined style={{ color: SYSTEM_PRIMARY, fontSize: "18px" }} />
                    <span className="font-semibold">Nhà tuyển dụng hoạt động nhiều nhất</span>
                  </div>
                }
                className="shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                <Table
                  dataSource={mostActiveEmployersData}
                  columns={[
                    {
                      title: "Hạng",
                      dataIndex: "rank",
                      key: "rank",
                      width: 80,
                      align: "center",
                      render: (rank) => (
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold">
                          {rank}
                        </div>
                      ),
                    },
                    {
                      title: "Công ty",
                      dataIndex: "company",
                      key: "company",
                      ellipsis: true,
                    },
                    {
                      title: "Tổng công việc",
                      dataIndex: "totalJobs",
                      key: "totalJobs",
                      align: "center",
                      width: 120,
                    },
                    {
                      title: "Đang hoạt động",
                      dataIndex: "activeJobs",
                      key: "activeJobs",
                      align: "center",
                      width: 130,
                    },
                    // {
                    //   title: "Xác thực",
                    //   dataIndex: "isVerified",
                    //   key: "isVerified",
                    //   align: "center",
                    //   width: 120,
                    //   render: (verified) => (
                    //     <Tag color={verified ? "green" : "default"}>
                    //       {verified ? "Đã xác thực" : "Chưa xác thực"}
                    //     </Tag>
                    //   ),
                    // },
                    {
                      title: "Thao tác",
                      key: "action",
                      width: 100,
                      fixed: "right",
                      render: (_, record) => (
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          size="small"
                          onClick={() =>
                            handleViewDetail("employer", record)
                          }
                        >
                          Chi tiết
                        </Button>
                      ),
                    },
                  ]}
                  pagination={false}
                  size="small"
                  scroll={{ x: 600 }}
                />
              </Card>
            </Col>
          </Row>

          {/* Recent Activities */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <UserOutlined style={{ color: SYSTEM_COLORS.success, fontSize: "18px" }} />
                    <span className="font-semibold">Người dùng mới</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                <Table
                  dataSource={recentActivities?.users || []}
                  columns={recentUsersColumns}
                  pagination={false}
                  size="small"
                  scroll={{ x: 500, y: 300 }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <FileTextOutlined style={{ color: SYSTEM_PRIMARY, fontSize: "18px" }} />
                    <span className="font-semibold">Công việc gần đây</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                <Table
                  dataSource={recentActivities?.jobs || []}
                  columns={recentJobsColumns}
                  pagination={false}
                  size="small"
                  scroll={{ x: 700, y: 300 }}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card
                title={
                  <div className="flex items-center gap-2">
                    <FileTextOutlined style={{ color: SYSTEM_COLORS.warning, fontSize: "18px" }} />
                    <span className="font-semibold">Đơn ứng tuyển gần đây</span>
                  </div>
                }
                className="h-full shadow-sm"
                bodyStyle={{ padding: "20px" }}
              >
                <Table
                  dataSource={recentActivities?.applications || []}
                  columns={recentApplicationsColumns}
                  pagination={false}
                  size="small"
                  scroll={{ x: 600, y: 300 }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Dashboard;
