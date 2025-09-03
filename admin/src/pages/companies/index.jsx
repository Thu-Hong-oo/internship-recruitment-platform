import React from 'react';
import { Card, Row, Col, Table, Button, Space, Tag, Avatar, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, UserOutlined, FileTextOutlined, StarOutlined } from '@ant-design/icons';

const Companies = () => {
  const columns = [
    {
      title: 'Công ty',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <Avatar size={40} src={record.logo} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-sm text-gray-500">{record.industry}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Quy mô',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <div className="flex items-center">
          <StarOutlined className="text-yellow-400 mr-1" />
          <span>{rating.average}</span>
          <span className="text-gray-500 ml-1">({rating.count})</span>
        </div>
      ),
    },
    {
      title: 'Thống kê',
      key: 'stats',
      render: (_, record) => (
        <div className="text-sm">
          <div>{record.stats.totalJobs} bài đăng</div>
          <div>{record.stats.activeInternships} thực tập sinh</div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'verified' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status === 'verified' ? 'Đã xác thực' : status === 'pending' ? 'Chờ duyệt' : 'Tạm khóa'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />}>Xem</Button>
          <Button type="link" icon={<EditOutlined />}>Sửa</Button>
          <Button type="link" danger icon={<DeleteOutlined />}>Xóa</Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      name: 'TechCorp Vietnam',
      logo: '/images/logo.png',
      industry: 'Công nghệ thông tin',
      location: 'Ho Chi Minh',
      size: '201-500 nhân viên',
      rating: { average: 4.2, count: 156 },
      stats: { totalJobs: 45, activeInternships: 23 },
      status: 'verified',
    },
    {
      key: '2',
      name: 'StartupXYZ',
      logo: '/images/logo.png',
      industry: 'Fintech',
      location: 'Ha Noi',
      size: '11-50 nhân viên',
      rating: { average: 4.5, count: 89 },
      stats: { totalJobs: 28, activeInternships: 15 },
      status: 'verified',
    },
    {
      key: '3',
      name: 'DesignStudio',
      logo: '/images/logo.png',
      industry: 'Thiết kế & Sáng tạo',
      location: 'Da Nang',
      size: '51-200 nhân viên',
      rating: { average: 4.1, count: 67 },
      stats: { totalJobs: 32, activeInternships: 18 },
      status: 'pending',
    },
    {
      key: '4',
      name: 'DataTech Solutions',
      logo: '/images/logo.png',
      industry: 'Phân tích dữ liệu',
      location: 'Ho Chi Minh',
      size: '501-1000 nhân viên',
      rating: { average: 4.3, count: 234 },
      stats: { totalJobs: 67, activeInternships: 41 },
      status: 'verified',
    },
    {
      key: '5',
      name: 'EduTech Vietnam',
      logo: '/images/logo.png',
      industry: 'Giáo dục',
      location: 'Ha Noi',
      size: '1000+ nhân viên',
      rating: { average: 4.0, count: 178 },
      stats: { totalJobs: 89, activeInternships: 52 },
      status: 'verified',
    },
  ];

  const stats = [
    { title: 'Tổng công ty', value: 156, icon: <UserOutlined /> },
    { title: 'Đã xác thực', value: 142, icon: <FileTextOutlined /> },
    { title: 'Chờ duyệt', value: 14, icon: <FileTextOutlined /> },
  ];

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
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        ))}
      </Row>
      
      <Card>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default Companies;
