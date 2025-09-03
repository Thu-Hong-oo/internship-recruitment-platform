import React from 'react';
import { Alert, Row, Col, Button, Space } from 'antd';
import { BellOutlined, ExclamationCircleOutlined, InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const SystemAlerts = ({ alerts = [], onActionClick }) => {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return <ExclamationCircleOutlined />;
      case 'error':
        return <ExclamationCircleOutlined />;
      case 'success':
        return <CheckCircleOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getAlertStyle = (type) => {
    switch (type) {
      case 'warning':
        return { border: '1px solid #faad14', backgroundColor: '#fffbe6' };
      case 'error':
        return { border: '1px solid #ff4d4f', backgroundColor: '#fff2f0' };
      case 'success':
        return { border: '1px solid #52c41a', backgroundColor: '#f6ffed' };
      default:
        return { border: '1px solid #1890ff', backgroundColor: '#f0f9ff' };
    }
  };

  if (!alerts.length) {
    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col span={24}>
          <Alert
            message="Hệ thống hoạt động bình thường"
            description="Không có cảnh báo hoặc thông báo nào cần chú ý."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ borderRadius: '8px' }}
          />
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {alerts.map((alert, index) => (
        <Col xs={24} sm={12} lg={8} key={index}>
          <Alert
            type={alert.type}
            message={alert.message}
            description={alert.description}
            action={
              <Space>
                <Button 
                  size="small" 
                  type="text"
                  onClick={() => onActionClick?.(alert, index)}
                >
                  {alert.action}
                </Button>
                {alert.secondaryAction && (
                  <Button 
                    size="small" 
                    type="link"
                    onClick={() => onActionClick?.(alert, index, 'secondary')}
                  >
                    {alert.secondaryAction}
                  </Button>
                )}
              </Space>
            }
            showIcon
            icon={getAlertIcon(alert.type)}
            style={{
              borderRadius: '8px',
              ...getAlertStyle(alert.type)
            }}
            className="hover:shadow-md transition-shadow"
          />
        </Col>
      ))}
    </Row>
  );
};

export default SystemAlerts;
