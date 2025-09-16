import React from 'react';
import { Card, Row, Col, Table, Button, Space, Tag, Statistic, Progress } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, UserOutlined, TagsOutlined } from '@ant-design/icons';

const Skills = () => {
  const columns = [
    {
      title: 'Kỹ năng',
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
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category}</Tag>
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
      title: 'Độ phổ biến',
      dataIndex: 'popularity',
      key: 'popularity',
      render: (value) => (
        <Progress 
          percent={value} 
          size="small" 
          strokeColor="oklch(0.55 0.18 195)"
          showInfo={false}
        />
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
      name: 'React.js',
      description: 'Thư viện JavaScript cho phát triển giao diện người dùng',
      category: 'Frontend',
      jobCount: 234,
      applicantCount: 892,
      popularity: 85,
      status: 'active',
    },
    {
      key: '2',
      name: 'Node.js',
      description: 'Runtime JavaScript cho phát triển backend',
      category: 'Backend',
      jobCount: 189,
      applicantCount: 567,
      popularity: 78,
      status: 'active',
    },
    {
      key: '3',
      name: 'Python',
      description: 'Ngôn ngữ lập trình đa năng',
      category: 'Programming',
      jobCount: 156,
      applicantCount: 445,
      popularity: 72,
      status: 'active',
    },
    {
      key: '4',
      name: 'Java',
      description: 'Ngôn ngữ lập trình hướng đối tượng',
      category: 'Programming',
      jobCount: 134,
      applicantCount: 378,
      popularity: 68,
      status: 'active',
    },
    {
      key: '5',
      name: 'SQL',
      description: 'Ngôn ngữ truy vấn cơ sở dữ liệu',
      category: 'Database',
      jobCount: 198,
      applicantCount: 523,
      popularity: 82,
      status: 'active',
    },
    {
      key: '6',
      name: 'Docker',
      description: 'Công nghệ container hóa ứng dụng',
      category: 'DevOps',
      jobCount: 89,
      applicantCount: 234,
      popularity: 45,
      status: 'active',
    },
  ];

  const stats = [
    { title: 'Tổng kỹ năng', value: 156, icon: <TagsOutlined /> },
    { title: 'Tổng bài đăng', value: 1000, icon: <FileTextOutlined /> },
    { title: 'Tổng ứng viên', value: 3037, icon: <UserOutlined /> },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Button type="primary" icon={<PlusOutlined />} style={{ background: 'oklch(0.55 0.18 195)' }}>
          Thêm kỹ năng
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

export default Skills;
