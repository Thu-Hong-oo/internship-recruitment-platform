import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Space, Typography } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  CrownOutlined
} from '@ant-design/icons';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import CompanyDashboard from '../pages/dashboard/CompanyDashboard';
import CandidateDashboard from '../pages/dashboard/CandidateDashboard';

const { Title, Paragraph } = Typography;

const DashboardSelector = ({ userRole = 'admin', onRoleChange }) => {
  const [currentRole, setCurrentRole] = useState(userRole);

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    if (onRoleChange) {
      onRoleChange(role);
    }
  };

  const renderDashboard = () => {
    switch (currentRole) {
      case 'company':
        return <CompanyDashboard />;
      case 'candidate':
        return <CandidateDashboard />;
      case 'admin':
      default:
        return <AdminDashboard />;
    }
  };

  const getRoleInfo = (role) => {
    const roleConfig = {
      admin: {
        title: 'Admin Dashboard',
        description: 'Quản lý toàn bộ hệ thống tuyển dụng thực tập sinh',
        icon: <CrownOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
        color: '#1890ff'
      },
      company: {
        title: 'Company Dashboard',
        description: 'Quản lý tuyển dụng và ứng viên của công ty',
        icon: <BankOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
        color: '#52c41a'
      },
      candidate: {
        title: 'Candidate Dashboard',
        description: 'Theo dõi quá trình ứng tuyển thực tập',
        icon: <UserOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
        color: '#722ed1'
      }
    };
    return roleConfig[role] || roleConfig.admin;
  };

  const currentRoleInfo = getRoleInfo(currentRole);

  return (
    <div className="dashboard-selector">
      {/* Role Selector */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentRoleInfo.icon}
            <div>
              <Title level={3} style={{ margin: 0, color: currentRoleInfo.color }}>
                {currentRoleInfo.title}
              </Title>
              <Paragraph style={{ margin: 0, color: '#666' }}>
                {currentRoleInfo.description}
              </Paragraph>
            </div>
          </div>
          
          <Space>
            <Button 
              type={currentRole === 'admin' ? 'primary' : 'default'}
              icon={<CrownOutlined />}
              onClick={() => handleRoleChange('admin')}
            >
              Admin
            </Button>
            <Button 
              type={currentRole === 'company' ? 'primary' : 'default'}
              icon={<BankOutlined />}
              onClick={() => handleRoleChange('company')}
            >
              Company
            </Button>
            <Button 
              type={currentRole === 'candidate' ? 'primary' : 'default'}
              icon={<UserOutlined />}
              onClick={() => handleRoleChange('candidate')}
            >
              Candidate
            </Button>
          </Space>
        </div>
      </Card>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default DashboardSelector;
