import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Button,
  Descriptions,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { jobsAPI } from "../../../api/jobs";

const { Title, Text } = Typography;

const formatDate = (value) => new Date(value).toLocaleString("vi-VN");

export default function AdminJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState(null);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);

  const statusColor = useMemo(
    () => ({
      pending: "orange",
      active: "green",
      deleted: "red",
    }),
    []
  );

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobsAPI.getJobDetail(id);
      if (!response.success) {
        throw new Error(
          response.error || "Không thể tải chi tiết job"
        );
      }
      setJobData(response.data);
    } catch (e) {
      const errorMessage =
        e?.response?.data?.error ||
        e?.message ||
        "Có lỗi xảy ra khi tải chi tiết job";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    if (!jobData?.job?._id) return;
    try {
      setApproving(true);
      const response = await jobsAPI.updateJobStatus(
        jobData.job._id,
        "active"
      );
      if (!response.success) {
        throw new Error(response.error || "Không thể duyệt bài");
      }
      message.success("Duyệt bài thành công");
      // Refresh detail to update status
      fetchDetail();
    } catch (e) {
      const errorMessage =
        e?.response?.data?.error ||
        e?.message ||
        "Không thể duyệt bài";
      message.error(errorMessage);
    } finally {
      setApproving(false);
    }
  };

  const job = jobData?.job;
  const employer = jobData?.employer;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            Chi tiết bài đăng
          </Title>
        </Space>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDetail}
            disabled={loading}
          >
            Tải lại
          </Button>
          {job?.status === "pending" && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={approving}
              onClick={handleApprove}
            >
              Duyệt bài
            </Button>
          )}
        </Space>
      </div>

      {error && (
        <Card style={{ marginBottom: 12 }}>
          <Text type="danger">{error}</Text>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card
            loading={loading}
            title={job?.title || "Bài đăng"}
            extra={
              job?.status ? (
                <Tag color={statusColor[job.status] || "default"}>
                  {job.status}
                </Tag>
              ) : null
            }
          >
            <Descriptions column={1} bordered size="middle">
              <Descriptions.Item label="Vị trí">
                {job?.location || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {job?.createdAt ? formatDate(job.createdAt) : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật">
                {job?.updatedAt ? formatDate(job.updatedAt) : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Kỹ năng">
                <Space wrap>
                  {(job?.skills || []).map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                  {job?.description || "-"}
                </pre>
              </Descriptions.Item>
              <Descriptions.Item label="Yêu cầu">
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                  {job?.requirements || "-"}
                </pre>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={loading} title="Nhà tuyển dụng">
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {employer?.company?.logo?.url ? (
                  <img
                    src={employer.company.logo.url}
                    alt="logo"
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      objectFit: "cover",
                    }}
                  />
                ) : null}
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {employer?.company?.name || "-"}
                  </div>
                  <Text type="secondary" style={{ display: "block" }}>
                    {employer?.user?.email || "-"}
                  </Text>
                </div>
              </div>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Ngành">
                  {employer?.company?.industry || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Quy mô">
                  {employer?.company?.size || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Website">
                  {employer?.company?.website ? (
                    <a
                      href={employer.company.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {employer.company.website}
                    </a>
                  ) : (
                    "-"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {employer?.company?.officeAddress
                    ? `${employer.company.officeAddress.street || ""} ${
                        employer.company.officeAddress.ward || ""
                      } ${employer.company.officeAddress.district || ""} ${
                        employer.company.officeAddress.city || ""
                      }`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Xác thực">
                  {employer?.verification?.isVerified ? (
                    <Tag color="green">Đã xác thực</Tag>
                  ) : (
                    <Tag>Chưa xác thực</Tag>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
