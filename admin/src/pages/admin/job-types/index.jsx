import React from 'react';
import { Card, Row, Col, Table, Button, Space, Tag, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';

const JobTypes = () => {
  const columns = [
    {
      title: 'Loại công việc',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Số bài đăng',
      dataIndex: 'jobCount',
      key: 'jobCount',
      render: (value) => <span className="font-medium text-blue-600">{value}</span>,
    },
    {
      title: 'Số ứng viên',
      dataIndex: 'applicantCount',
      key: 'applicantCount',
      render: (value) => <span className="font-medium text-green-600">{value}</span>,
    },
    {
      title: 'Thời gian trung bình',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      render: (value) => (
        <div className="flex items-center">
          <ClockCircleOutlined className="mr-1 text-gray-500" />
          <span>{value}</span>
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
      name: 'Thực tập (Internship)',
      description: 'Công việc thực tập cho sinh viên, thời gian 3-6 tháng',
      jobCount: 456,
      applicantCount: 1247,
      avgDuration: '4.2 tháng',
      status: 'active',
    },
    {
      key: '2',
      name: 'Toàn thời gian (Full-time)',
      description: 'Công việc chính thức toàn thời gian',
      jobCount: 234,
      applicantCount: 892,
      avgDuration: '12 tháng',
      status: 'active',
    },
    {
      key: '3',
      name: 'Bán thời gian (Part-time)',
      description: 'Công việc bán thời gian, linh hoạt giờ giấc',
      jobCount: 156,
      applicantCount: 567,
      avgDuration: '6 tháng',
      status: 'active',
    },
    {
      key: '4',
      name: 'Hợp đồng (Contract)',
      description: 'Công việc theo dự án, hợp đồng ngắn hạn',
      jobCount: 89,
      applicantCount: 234,
      avgDuration: '3 tháng',
      status: 'active',
    },
    {
      key: '5',
      name: 'Freelance',
      description: 'Công việc tự do, làm việc từ xa',
      jobCount: 67,
      applicantCount: 189,
      avgDuration: '2 tháng',
      status: 'active',
    },
  ];

  const stats = [
    { title: 'Tổng loại công việc', value: 5, icon: <FileTextOutlined /> },
    { title: 'Tổng bài đăng', value: 1002, icon: <UserOutlined /> },
    { title: 'Tổng ứng viên', value: 3129, icon: <ClockCircleOutlined /> },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Button type="primary" icon={<PlusOutlined />} style={{ background: 'oklch(0.55 0.18 195)' }}>
          Thêm loại công việc
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

export default JobTypes;
