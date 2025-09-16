import React from 'react';
import { Card, Timeline, Avatar, Tag, Space } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  InfoCircleOutlined,
  UserOutlined,
  BankOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons';

const RecentActivity = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'approval':
        return <CheckCircleOutlined />;
      case 'company':
        return <BankOutlined />;
      case 'complaint':
        return <ExclamationCircleOutlined />;
      case 'system':
        return <SettingOutlined />;
      case 'job':
        return <FileTextOutlined />;
      case 'user':
        return <UserOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getActivityColor = (status) => {
    switch (status) {
      case 'success':
        return 'green';
      case 'warning':
        return 'orange';
      case 'error':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getActivityTag = (type) => {
    const tagConfig = {
      approval: { color: 'green', text: 'Duyệt' },
      company: { color: 'blue', text: 'Công ty' },
      complaint: { color: 'orange', text: 'Khiếu nại' },
      system: { color: 'purple', text: 'Hệ thống' },
      job: { color: 'cyan', text: 'Bài đăng' },
      user: { color: 'magenta', text: 'Người dùng' }
    };
    
    const config = tagConfig[type] || tagConfig.system;
    return <Tag color={config.color} size="small">{config.text}</Tag>;
  };

  if (!activities.length) {
    return (
      <Card title="Hoạt động gần đây" className="h-80">
        <div className="flex items-center justify-center h-32 text-gray-500">
          <div className="text-center">
            <InfoCircleOutlined className="text-2xl mb-2" />
            <div>Không có hoạt động nào</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Hoạt động gần đây" className="h-80">
      <Timeline
        items={activities.map((activity, index) => ({
          key: index,
          color: getActivityColor(activity.status),
          children: (
            <div className="flex items-start gap-3">
              <Avatar 
                size="small" 
                icon={getActivityIcon(activity.type)}
                style={{ 
                  backgroundColor: getActivityColor(activity.status) === 'green' ? '#52c41a' :
                                  getActivityColor(activity.status) === 'orange' ? '#fa8c16' :
                                  getActivityColor(activity.status) === 'red' ? '#f5222d' : '#1890ff'
                }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{activity.action}</span>
                  {getActivityTag(activity.type)}
                </div>
                <div className="text-xs text-gray-500 mb-1">{activity.user}</div>
                <div className="text-xs text-gray-400">{activity.time}</div>
                {activity.description && (
                  <div className="text-xs text-gray-600 mt-1">{activity.description}</div>
                )}
              </div>
            </div>
          )
        }))}
      />
    </Card>
  );
};

export default RecentActivity;
