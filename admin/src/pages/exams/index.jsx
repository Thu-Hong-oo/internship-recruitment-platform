import React from 'react';
import { Card, Row, Col, Typography, Table, Button, Space, Tag } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Exams = () => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Tên bài thi',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Thời gian (phút)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Hoạt động' ? 'green' : 'red'}>
          {status}
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
      id: '1',
      name: 'Bài thi Frontend',
      description: 'Kiểm tra kiến thức Frontend',
      duration: 60,
      status: 'Hoạt động',
    },
    {
      key: '2',
      id: '2',
      name: 'Bài thi Backend',
      description: 'Kiểm tra kiến thức Backend',
      duration: 90,
      status: 'Hoạt động',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quản lý bài thi</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm bài thi
        </Button>
      </div>
      
      <Card>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default Exams;
