import React from 'react';
import { Card, Row, Col, Table, Button, Space, Tag, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, UserOutlined, DollarOutlined, CrownOutlined } from '@ant-design/icons';

const PostPackages = () => {
  const columns = [
    {
      title: 'Gói dịch vụ',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            record.type === 'premium' ? 'bg-yellow-100' : record.type === 'standard' ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            {record.type === 'premium' ? <CrownOutlined className="text-yellow-600" /> : <FileTextOutlined className="text-blue-600" />}
          </div>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-sm text-gray-500">{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price) => (
        <div className="font-medium text-lg">
          {price.toLocaleString()} VNĐ
        </div>
      ),
    },
    {
      title: 'Thời hạn',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => (
        <Tag color="blue">{duration}</Tag>
      ),
    },
    {
      title: 'Số bài đăng',
      dataIndex: 'postLimit',
      key: 'postLimit',
      render: (limit) => (
        <span className="font-medium text-green-600">{limit} bài</span>
      ),
    },
    {
      title: 'Đã bán',
      dataIndex: 'soldCount',
      key: 'soldCount',
      render: (count) => (
        <span className="font-medium">{count} gói</span>
      ),
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => (
        <div className="font-medium text-blue-600">
          {revenue.toLocaleString()} VNĐ
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
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
      name: 'Gói Cơ Bản',
      description: 'Phù hợp cho doanh nghiệp nhỏ',
      type: 'basic',
      price: 500000,
      duration: '30 ngày',
      postLimit: 5,
      soldCount: 234,
      revenue: 117000000,
      status: 'active',
    },
    {
      key: '2',
      name: 'Gói Tiêu Chuẩn',
      description: 'Phù hợp cho doanh nghiệp vừa',
      type: 'standard',
      price: 1000000,
      duration: '60 ngày',
      postLimit: 15,
      soldCount: 156,
      revenue: 156000000,
      status: 'active',
    },
    {
      key: '3',
      name: 'Gói Cao Cấp',
      description: 'Phù hợp cho doanh nghiệp lớn',
      type: 'premium',
      price: 2000000,
      duration: '90 ngày',
      postLimit: 30,
      soldCount: 89,
      revenue: 178000000,
      status: 'active',
    },
    {
      key: '4',
      name: 'Gói Doanh Nghiệp',
      description: 'Giải pháp tùy chỉnh cho doanh nghiệp',
      type: 'premium',
      price: 5000000,
      duration: '180 ngày',
      postLimit: 100,
      soldCount: 45,
      revenue: 225000000,
      status: 'active',
    },
  ];

  const stats = [
    { title: 'Tổng gói', value: 4, icon: <FileTextOutlined /> },
    { title: 'Tổng doanh thu', value: 676000000, icon: <DollarOutlined />, suffix: ' VNĐ' },
    { title: 'Tổng đã bán', value: 524, icon: <UserOutlined />, suffix: ' gói' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Button type="primary" icon={<PlusOutlined />} style={{ background: 'oklch(0.55 0.18 195)' }}>
          Thêm gói
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
                suffix={stat.suffix}
                valueStyle={{ color: 'oklch(0.55 0.18 195)' }}
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

export default PostPackages;
