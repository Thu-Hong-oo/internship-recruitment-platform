import React from 'react';
import { Card, Row, Col, Typography, Table, Button, Space, Tag } from 'antd';
import { EyeOutlined, DownloadOutlined } from '@ant-design/icons';

const { Title } = Typography;

const Transactions = () => {
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Công ty',
      dataIndex: 'company',
      key: 'company',
    },
    {
      title: 'Gói dịch vụ',
      dataIndex: 'package',
      key: 'package',
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Thành công' ? 'green' : status === 'Đang xử lý' ? 'orange' : 'red'}>
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
          <Button type="link" icon={<DownloadOutlined />}>Tải hóa đơn</Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      id: '1',
      company: 'TechCorp',
      package: 'Gói cơ bản',
      amount: '500,000 VNĐ',
      status: 'Thành công',
      createdAt: '2024-01-15',
    },
    {
      key: '2',
      id: '2',
      company: 'StartupXYZ',
      package: 'Gói tiêu chuẩn',
      amount: '1,200,000 VNĐ',
      status: 'Đang xử lý',
      createdAt: '2024-01-14',
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Lịch sử giao dịch</Title>
        <Button type="primary" icon={<DownloadOutlined />}>
          Xuất báo cáo
        </Button>
      </div>
      
      <Card>
        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
};

export default Transactions;
