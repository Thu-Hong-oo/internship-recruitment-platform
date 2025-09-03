import React from 'react';
import { Card, Button, Space, Tooltip, Badge } from 'antd';
import { 
  ClockCircleOutlined,
  BarChartOutlined,
  UserOutlined,
  BankOutlined,
  SettingOutlined,
  PlusOutlined,
  FileTextOutlined,
  TeamOutlined,
  DollarOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ stats = {} }) => {
  const navigate = useNavigate();

  const actions = [
    {
      key: 'approve-jobs',
      title: 'Duyệt bài đăng mới',
      icon: <ClockCircleOutlined />,
      type: 'primary',
      count: stats.pendingApprovals || 0,
      onClick: () => navigate('/admin/jobs'),
      description: 'Có bài đăng chờ duyệt'
    },
    {
      key: 'revenue-report',
      title: 'Báo cáo doanh thu',
      icon: <BarChartOutlined />,
      type: 'default',
      onClick: () => navigate('/admin/transactions'),
      description: 'Xem thống kê tài chính'
    },
    {
      key: 'manage-users',
      title: 'Quản lý người dùng',
      icon: <UserOutlined />,
      type: 'default',
      onClick: () => navigate('/admin/accounts'),
      description: 'Quản lý tài khoản'
    },
    {
      key: 'manage-companies',
      title: 'Quản lý công ty',
      icon: <BankOutlined />,
      type: 'default',
      onClick: () => navigate('/admin/companies'),
      description: 'Quản lý thông tin công ty'
    },
    {
      key: 'manage-jobs',
      title: 'Quản lý bài đăng',
      icon: <FileTextOutlined />,
      type: 'default',
      onClick: () => navigate('/admin/jobs'),
      description: 'Quản lý tin tuyển dụng'
    },
    {
      key: 'manage-candidates',
      title: 'Quản lý ứng viên',
      icon: <TeamOutlined />,
      type: 'default',
      onClick: () => navigate('/admin/candidates'),
      description: 'Quản lý hồ sơ ứng viên'
    },
    {
      key: 'transactions',
      title: 'Giao dịch',
      icon: <DollarOutlined />,
      type: 'default',
      onClick: () => navigate('/admin/transactions'),
      description: 'Lịch sử giao dịch'
    },
    {
      key: 'system-settings',
      title: 'Cài đặt hệ thống',
      icon: <SettingOutlined />,
      type: 'default',
      onClick: () => navigate('/admin/media'),
      description: 'Cấu hình hệ thống'
    }
  ];

  return (
    <Card title="Hành động nhanh" className="h-80">
      <div className="space-y-3">
        {actions.map((action) => (
          <Tooltip key={action.key} title={action.description}>
            <Button 
              type={action.type}
              block 
              icon={action.icon}
              onClick={action.onClick}
              className="flex items-center justify-start"
            >
              <div className="flex items-center justify-between w-full">
                <span>{action.title}</span>
                {action.count > 0 && (
                  <Badge 
                    count={action.count} 
                    style={{ 
                      backgroundColor: action.type === 'primary' ? '#fff' : '#1890ff',
                      color: action.type === 'primary' ? '#1890ff' : '#fff'
                    }} 
                  />
                )}
              </div>
            </Button>
          </Tooltip>
        ))}
      </div>
    </Card>
  );
};

export default QuickActions;
