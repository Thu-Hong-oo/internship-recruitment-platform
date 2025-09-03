import React from 'react';
import { Card, Row, Col, Typography, Table, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Levels = () => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Tên cấp bậc',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Thứ tự',
      dataIndex: 'order',
      key: 'order',
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
      name: 'Intern',
      description: 'Thực tập sinh',
      order: 1,
    },
    {
      key: '2',
      id: '2',
      name: 'Junior',
      description: 'Nhân viên mới',
      order: 2,
    },
    {
      key: '3',
      id: '3',
      name: 'Senior',
      description: 'Nhân viên cấp cao',
      order: 3,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quản lý cấp bậc</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm cấp bậc
        </Button>
      </div>
      
      <Card>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default Levels;
