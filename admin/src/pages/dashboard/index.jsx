import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress } from 'antd';
import { UserOutlined, BankOutlined, FileTextOutlined, DollarOutlined, EyeOutlined, SendOutlined, SaveOutlined } from '@ant-design/icons';

const Dashboard = ({ userRole = 'admin' }) => {
  const stats = [
    {
      title: 'Tổng người dùng',
      value: 2847,
      icon: <UserOutlined />,
      color: '#1890ff',
      change: '+12%',
    },
    {
      title: 'Tổng công ty',
      value: 156,
      icon: <BankOutlined />,
      color: '#52c41a',
      change: '+8%',
    },
    {
      title: 'Tổng bài đăng',
      value: 892,
      icon: <FileTextOutlined />,
      color: '#faad14',
      change: '+15%',
    },
    {
      title: 'Doanh thu tháng',
      value: 125000000,
      icon: <DollarOutlined />,
      color: '#f5222d',
      change: '+22%',
      suffix: ' VNĐ',
    },
  ];

  const recentJobs = [
    {
      key: '1',
      title: 'Frontend Developer Intern',
      company: 'TechCorp Vietnam',
      location: 'Ho Chi Minh',
      salary: '8,000,000 - 12,000,000 VNĐ',
      applications: 45,
      status: 'active',
      postedAt: '2024-01-15',
    },
    {
      key: '2',
      title: 'Backend Developer Intern',
      company: 'StartupXYZ',
      location: 'Ha Noi',
      salary: '6,000,000 - 10,000,000 VNĐ',
      applications: 32,
      status: 'active',
      postedAt: '2024-01-14',
    },
    {
      key: '3',
      title: 'UI/UX Designer Intern',
      company: 'DesignStudio',
      location: 'Da Nang',
      salary: '7,000,000 - 11,000,000 VNĐ',
      applications: 28,
      status: 'pending',
      postedAt: '2024-01-13',
    },
    {
      key: '4',
      title: 'Data Analyst Intern',
      company: 'DataTech Solutions',
      location: 'Ho Chi Minh',
      salary: '9,000,000 - 15,000,000 VNĐ',
      applications: 67,
      status: 'active',
      postedAt: '2024-01-12',
    },
  ];

  const jobColumns = [
    {
      title: 'Vị trí',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <a className="font-medium">{text}</a>,
    },
    {
      title: 'Công ty',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Lương',
      dataIndex: 'salary',
      key: 'salary',
    },
    {
      title: 'Ứng viên',
      dataIndex: 'applications',
      key: 'applications',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? 'Hoạt động' : 'Chờ duyệt'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Row gutter={[16, 16]} className="mb-6">
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
                suffix={stat.suffix}
              />
              <div className="text-sm text-green-600 mt-2">{stat.change} so với tháng trước</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Bài đăng gần đây" extra={<a>Xem tất cả</a>}>
            <Table 
              columns={jobColumns} 
              dataSource={recentJobs} 
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Thống kê ứng viên">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Đã ứng tuyển</span>
                  <span className="font-medium">1,247</span>
                </div>
                <Progress percent={75} strokeColor="#52c41a" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Đã phỏng vấn</span>
                  <span className="font-medium">892</span>
                </div>
                <Progress percent={60} strokeColor="#1890ff" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Đã nhận việc</span>
                  <span className="font-medium">456</span>
                </div>
                <Progress percent={35} strokeColor="#faad14" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
