import React from 'react';
import { Card, Row, Col, Typography, Table, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

const SalaryRanges = () => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Khoảng lương',
      dataIndex: 'range',
      key: 'range',
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
      range: '0 - 5 triệu',
      description: 'Mức lương cho thực tập sinh',
      status: 'Hoạt động',
    },
    {
      key: '2',
      id: '2',
      range: '5 - 10 triệu',
      description: 'Mức lương cho junior',
      status: 'Hoạt động',
    },
    {
      key: '3',
      id: '3',
      range: '10 - 20 triệu',
      description: 'Mức lương cho senior',
      status: 'Hoạt động',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quản lý khoảng lương</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm khoảng lương
        </Button>
      </div>
      
      <Card>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default SalaryRanges;
