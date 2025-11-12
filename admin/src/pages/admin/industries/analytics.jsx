import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Statistic,
  Progress,
  Empty,
  message,
  Alert,
} from "antd";
import {
  ReloadOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FileTextOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import industriesAPI from "../../../api/industries";

const IndustriesAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [topIndustries, setTopIndustries] = useState([]);
  const [totals, setTotals] = useState(null);
  const [syncResult, setSyncResult] = useState(null);

  const fetchAnalytics = async (showMessage = false) => {
    try {
      setLoading(true);
      const { success, data, error } = await industriesAPI.getAnalyticsOverview();
      if (success && data) {
        setOverview(data.overview ?? null);
        setTopIndustries(data.topIndustries ?? []);
        setTotals(data.totals ?? null);
        if (showMessage) {
          message.success("Đã làm mới thống kê");
        }
      } else {
        setOverview(null);
        setTopIndustries([]);
        setTotals(null);
        if (error) {
          throw new Error(error);
        }
      }
    } catch (err) {
      console.error("Failed to fetch analytics overview:", err);
      setOverview(null);
      setTopIndustries([]);
      setTotals(null);
      message.error("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAnalytics = async () => {
    try {
      setSyncing(true);
      const { success, data, message: msg, error } =
        await industriesAPI.syncAnalytics();
      if (success) {
        setSyncResult(data ?? null);
        message.success(msg || "Đồng bộ thống kê thành công");
        fetchAnalytics();
      } else {
        setSyncResult(null);
        message.error(error || "Không thể đồng bộ thống kê");
      }
    } catch (err) {
      console.error("Failed to sync analytics:", err);
      setSyncResult(null);
      message.error("Có lỗi xảy ra khi đồng bộ thống kê");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const data = overview ?? {};
    return [
      {
        title: "Tổng ngành nghề",
        value: data.totalIndustries ?? 0,
        icon: <FolderOutlined />,
      },
      {
        title: "Ngành nghề hiển thị",
        value: data.visibleIndustries ?? 0,
        icon: <EyeOutlined />,
      },
      {
        title: "Ngành nghề ẩn",
        value: data.hiddenIndustries ?? 0,
        icon: <EyeInvisibleOutlined />,
      },
      {
        title: "Ngành nghề gốc",
        value: data.rootIndustries ?? 0,
        icon: <FolderOpenOutlined />,
      },
      {
        title: "Ngành nghề con",
        value: data.subIndustries ?? 0,
        icon: <FolderOutlined />,
      },
    ];
  }, [overview]);

  const maxJobs = useMemo(() => {
    if (!topIndustries || topIndustries.length === 0) return 1;
    const max = Math.max(
      ...topIndustries.map((item) => item?.stats?.totalJobs ?? 0)
    );
    return max > 0 ? max : 1;
  }, [topIndustries]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold mb-1">Thống kê danh mục nghề</h1>
          <p className="text-sm text-gray-500">
            Tổng quan số liệu về ngành nghề, việc làm và ứng viên
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchAnalytics(true)}
            loading={loading}
            disabled={syncing}
          >
            Làm mới
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={handleSyncAnalytics}
            loading={syncing}
            disabled={loading}
          >
            Đồng bộ thống kê
          </Button>
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/admin/industries")}
            style={{ background: "oklch(0.55 0.18 195)" }}
          >
            Quay lại quản lý
          </Button>
        </Space>
      </div>

      {syncResult && (
        <Alert
          className="bg-blue-50"
          type="info"
          showIcon
          message="Kết quả đồng bộ"
          description={
            <div className="space-y-1">
              <div>
                Tổng danh mục: <strong>{syncResult.totalIndustries ?? 0}</strong>
              </div>
              <div>
                Đã cập nhật: <strong>{syncResult.updatedCount ?? 0}</strong>
              </div>
              {syncResult.updated && syncResult.updated.length > 0 && (
                <div>
                  Danh sách cập nhật:
                  <ul className="list-disc ml-6 text-sm">
                    {syncResult.updated.map((item) => (
                      <li key={item.code}>{item.name?.vi || item.code}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={4} key={index}>
            <Card loading={loading && !overview}>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Tổng việc làm & ứng viên" loading={loading && !totals}>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Statistic
                title="Tổng việc làm"
                value={totals?.totalJobs ?? 0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: "oklch(0.55 0.18 195)" }}
              />
              <Statistic
                title="Tổng ứng viên"
                value={totals?.totalCandidates ?? 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: "oklch(0.55 0.18 195)" }}
              />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Top ngành theo việc làm" loading={loading && !overview}>
            {topIndustries && topIndustries.length > 0 ? (
              <Space direction="vertical" size="large" style={{ width: "100%" }}>
                {topIndustries.map((industry, index) => {
                  const jobs = industry?.stats?.totalJobs ?? 0;
                  const candidates = industry?.stats?.totalCandidates ?? 0;
                  const percent = Math.round((jobs / maxJobs) * 100);
                  return (
                    <div key={industry._id || industry.code}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          {index + 1}. {industry?.name?.vi || industry.code}
                        </span>
                        <span className="text-sm text-gray-500">
                          {jobs} việc làm
                        </span>
                      </div>
                      <Progress percent={percent} showInfo={false} />
                      <div className="text-xs text-gray-500 mt-1">
                        Ứng viên: {candidates}
                      </div>
                    </div>
                  );
                })}
              </Space>
            ) : (
              <Empty description="Chưa có dữ liệu thống kê" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default IndustriesAnalytics;
