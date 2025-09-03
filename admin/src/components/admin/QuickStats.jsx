import React from 'react';
import { Card, Row, Col, Statistic, Badge } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  FileTextOutlined, 
  DollarOutlined,
  EyeOutlined,
  TrophyOutlined,
  TeamOutlined,
  CalendarOutlined
} from '@ant-design/icons';

const QuickStats = ({ stats, loading = false }) => {
  const statCards = [
    {
      title: 'Tổng người dùng',
      value: stats?.totalUsers || 0,
      icon: <UserOutlined className="text-green-500" />,
      color: 'oklch(0.55 0.18 195)',
      growth: '+12%',
      suffix: 'người'
    },
    {
      title: 'Tổng công ty',
      value: stats?.totalCompanies || 0,
      icon: <BankOutlined className="text-blue-500" />,
      color: 'oklch(0.55 0.18 195)',
      growth: '+8%',
      suffix: 'công ty'
    },
    {
      title: 'Tổng bài đăng',
      value: stats?.totalJobs || 0,
      icon: <FileTextOutlined className="text-purple-500" />,
      color: 'oklch(0.55 0.18 195)',
      growth: '+15%',
      suffix: 'bài đăng'
    },
    {
      title: 'Doanh thu',
      value: stats?.totalRevenue || 0,
      icon: <DollarOutlined className="text-orange-500" />,
      color: 'oklch(0.55 0.18 195)',
      growth: '+22%',
      suffix: 'VNĐ',
      formatter: (value) => `${value.toLocaleString()}`
    },
    {
      title: 'Lượt xem',
      value: stats?.totalViews || 0,
      icon: <EyeOutlined className="text-cyan-500" />,
      color: 'oklch(0.55 0.18 195)',
      growth: '+18%',
      suffix: 'lượt'
    },
    {
      title: 'Tỷ lệ chuyển đổi',
      value: stats?.conversionRate || 0,
      icon: <TrophyOutlined className="text-red-500" />,
      color: 'oklch(0.55 0.18 195)',
      growth: '+5%',
      suffix: '%'
    }
  ];

  return (
    <Row gutter={[16, 16]}>
      {statCards.map((stat, index) => (
        <Col xs={24} sm={12} lg={8} xl={4} key={index}>
          <Card 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer"
            loading={loading}
            bodyStyle={{ padding: '20px' }}
          >
            <Statistic
              title={stat.title}
              value={stat.value}
              prefix={stat.icon}
              valueStyle={{ color: stat.color, fontSize: '24px', fontWeight: 'bold' }}
              suffix={
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{stat.suffix}</span>
                  <Badge 
                    count={stat.growth} 
                    style={{ 
                      backgroundColor: stat.color,
                      fontSize: '10px',
                      padding: '2px 6px'
                    }} 
                  />
                </div>
              }
              formatter={stat.formatter}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default QuickStats;
