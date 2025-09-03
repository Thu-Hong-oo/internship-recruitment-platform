import React from 'react';
import { Card, Row, Col, Table, Button, Space, Tag, Avatar, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, UserOutlined, FileTextOutlined, DollarOutlined, EyeOutlined as ViewIcon } from '@ant-design/icons';

const Jobs = () => {
  const columns = [
    {
      title: 'Vị trí',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <Avatar size={40} src={record.companyLogo} icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-sm text-gray-500">{record.company}</div>
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
      title: 'Loại công việc',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'intern' ? 'blue' : type === 'fulltime' ? 'green' : 'orange'}>
          {type === 'intern' ? 'Thực tập' : type === 'fulltime' ? 'Toàn thời gian' : 'Bán thời gian'}
        </Tag>
      ),
    },
    {
      title: 'Lương',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary) => (
        <div className="font-medium">
          {salary.min.toLocaleString()} - {salary.max.toLocaleString()} VNĐ
        </div>
      ),
    },
    {
      title: 'Thống kê',
      key: 'stats',
      render: (_, record) => (
        <div className="text-sm">
          <div className="flex items-center mb-1">
            <ViewIcon className="mr-1" />
            <span>{record.stats.views} lượt xem</span>
          </div>
          <div className="flex items-center">
            <UserOutlined className="mr-1" />
            <span>{record.stats.applications} ứng viên</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status === 'active' ? 'Hoạt động' : status === 'pending' ? 'Chờ duyệt' : 'Tạm khóa'}
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
      title: 'Frontend Developer Intern',
      company: 'TechCorp Vietnam',
      companyLogo: '/images/logo.png',
      location: 'Ho Chi Minh',
      type: 'intern',
      salary: { min: 8000000, max: 12000000 },
      stats: { views: 1247, applications: 45 },
      status: 'active',
      postedAt: '2024-01-15',
    },
    {
      key: '2',
      title: 'Backend Developer Intern',
      company: 'StartupXYZ',
      companyLogo: '/images/logo.png',
      location: 'Ha Noi',
      type: 'intern',
      salary: { min: 6000000, max: 10000000 },
      stats: { views: 892, applications: 32 },
      status: 'active',
      postedAt: '2024-01-14',
    },
    {
      key: '3',
      title: 'UI/UX Designer Intern',
      company: 'DesignStudio',
      companyLogo: '/images/logo.png',
      location: 'Da Nang',
      type: 'intern',
      salary: { min: 7000000, max: 11000000 },
      stats: { views: 567, applications: 28 },
      status: 'pending',
      postedAt: '2024-01-13',
    },
    {
      key: '4',
      title: 'Data Analyst Intern',
      company: 'DataTech Solutions',
      companyLogo: '/images/logo.png',
      location: 'Ho Chi Minh',
      type: 'intern',
      salary: { min: 9000000, max: 15000000 },
      stats: { views: 1892, applications: 67 },
      status: 'active',
      postedAt: '2024-01-12',
    },
    {
      key: '5',
      title: 'Mobile Developer Intern',
      company: 'EduTech Vietnam',
      companyLogo: '/images/logo.png',
      location: 'Ha Noi',
      type: 'intern',
      salary: { min: 7500000, max: 13000000 },
      stats: { views: 734, applications: 38 },
      status: 'active',
      postedAt: '2024-01-11',
    },
  ];

  const stats = [
    { title: 'Tổng bài đăng', value: 892, icon: <FileTextOutlined /> },
    { title: 'Đang hoạt động', value: 756, icon: <UserOutlined /> },
    { title: 'Chờ duyệt', value: 136, icon: <DollarOutlined /> },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm việc làm
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

export default Jobs;
