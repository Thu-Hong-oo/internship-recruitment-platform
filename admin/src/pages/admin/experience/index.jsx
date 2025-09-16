import React from 'react';
import { Card, Row, Col, Typography, Table, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Experience = () => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Kinh nghiệm',
      dataIndex: 'experience',
      key: 'experience',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link">Sửa</Button>
          <Button type="link" danger>Xóa</Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      id: '1',
      experience: '0 - 1 năm',
      description: 'Mới bắt đầu',
      status: 'Hoạt động',
    },
    {
      key: '2',
      id: '2',
      experience: '1 - 3 năm',
      description: 'Có kinh nghiệm cơ bản',
      status: 'Hoạt động',
    },
    {
      key: '3',
      id: '3',
      experience: '3 - 5 năm',
      description: 'Có kinh nghiệm tốt',
      status: 'Hoạt động',
    },
    {
      key: '4',
      id: '4',
      experience: '5+ năm',
      description: 'Kinh nghiệm cao',
      status: 'Hoạt động',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quản lý kinh nghiệm làm việc</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm kinh nghiệm
        </Button>
      </div>
      
      <Card>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default Experience;
