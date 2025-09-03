import React from 'react';
import { Card, Row, Col, Typography, Table, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ViewPackages = () => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Tên gói',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Số lượt xem',
      dataIndex: 'viewCount',
      key: 'viewCount',
    },
    {
      title: 'Giá (VNĐ)',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Thời hạn (ngày)',
      dataIndex: 'duration',
      key: 'duration',
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
      name: 'Gói xem cơ bản',
      viewCount: 100,
      price: '200,000',
      duration: 30,
      status: 'Hoạt động',
    },
    {
      key: '2',
      id: '2',
      name: 'Gói xem tiêu chuẩn',
      viewCount: 500,
      price: '800,000',
      duration: 30,
      status: 'Hoạt động',
    },
    {
      key: '3',
      id: '3',
      name: 'Gói xem không giới hạn',
      viewCount: 'Không giới hạn',
      price: '2,000,000',
      duration: 30,
      status: 'Hoạt động',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quản lý các gói xem ứng viên</Title>
        <Button type="primary" icon={<PlusOutlined />}>
          Thêm gói
        </Button>
      </div>
      
      <Card>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default ViewPackages;
