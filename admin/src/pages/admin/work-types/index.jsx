import React from 'react';
import { Card, Row, Col, Typography, Table, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

const WorkTypes = () => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Tên hình thức',
      dataIndex: 'name',
      key: 'name',
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
      name: 'Full-time',
      description: 'Làm việc toàn thời gian',
      status: 'Hoạt động',
    },
    {
      key: '2',
      id: '2',
      name: 'Part-time',
      description: 'Làm việc bán thời gian',
      status: 'Hoạt động',
    },
    {
      key: '3',
      id: '3',
      name: 'Remote',
      description: 'Làm việc từ xa',
      status: 'Hoạt động',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quản lý hình thức làm việc</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm hình thức
        </Button>
      </div>
      
      <Card>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default WorkTypes;
