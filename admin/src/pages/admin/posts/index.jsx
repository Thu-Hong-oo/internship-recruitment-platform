import React from 'react';
import { Card, Row, Col, Typography, Table, Button, Space, Tag } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Posts = () => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Công ty',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Vị trí',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Hoạt động' ? 'green' : status === 'Chờ duyệt' ? 'orange' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
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
      id: '1',
      title: 'Tuyển Frontend Developer',
      company: 'TechCorp',
      position: 'Frontend Developer',
      status: 'Hoạt động',
      createdAt: '2024-01-15',
    },
    {
      key: '2',
      id: '2',
      title: 'Tuyển Backend Developer',
      company: 'StartupXYZ',
      position: 'Backend Developer',
      status: 'Chờ duyệt',
      createdAt: '2024-01-14',
    },
    {
      key: '3',
      id: '3',
      title: 'Tuyển UI/UX Designer',
      company: 'DesignStudio',
      position: 'UI/UX Designer',
      status: 'Hoạt động',
      createdAt: '2024-01-13',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quản lý bài đăng</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm bài đăng
        </Button>
      </div>
      
      <Card>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default Posts;
