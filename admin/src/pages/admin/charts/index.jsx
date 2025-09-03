import React from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Select, DatePicker } from 'antd';
import { UserOutlined, FileTextOutlined, DollarOutlined, EyeOutlined, SendOutlined, SaveOutlined, RiseOutlined, FallOutlined, BarChartOutlined, PieChartOutlined, LineChartOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const Charts = () => {
  const monthlyStats = [
    { month: 'Tháng 1', users: 2847, jobs: 892, revenue: 125000000, applications: 1247 },
    { month: 'Tháng 2', users: 3120, jobs: 945, revenue: 138000000, applications: 1456 },
    { month: 'Tháng 3', users: 2980, jobs: 878, revenue: 122000000, applications: 1123 },
    { month: 'Tháng 4', users: 3250, jobs: 1020, revenue: 145000000, applications: 1678 },
    { month: 'Tháng 5', users: 3420, jobs: 1156, revenue: 158000000, applications: 1890 },
    { month: 'Tháng 6', users: 3680, jobs: 1289, revenue: 172000000, applications: 2134 },
  ];

  const topIndustries = [
    { industry: 'Công nghệ thông tin', jobs: 234, companies: 45, growth: 12.5 },
    { industry: 'Tài chính - Ngân hàng', jobs: 189, companies: 32, growth: 8.3 },
    { industry: 'Thương mại điện tử', jobs: 156, companies: 28, growth: 15.7 },
    { industry: 'Giáo dục', jobs: 134, companies: 25, growth: 6.2 },
    { industry: 'Y tế', jobs: 98, companies: 18, growth: 9.8 },
  ];

  const applicationStats = [
    { status: 'Đã ứng tuyển', count: 1247, percentage: 75, color: '#1890ff' },
    { status: 'Đã phỏng vấn', count: 892, percentage: 60, color: '#52c41a' },
    { status: 'Đã nhận việc', count: 456, percentage: 35, color: '#faad14' },
    { status: 'Từ chối', count: 234, percentage: 18, color: '#f5222d' },
  ];

  const jobTypeDistribution = [
    { type: 'Thực tập', count: 456, percentage: 45 },
    { type: 'Toàn thời gian', count: 234, percentage: 23 },
    { type: 'Bán thời gian', count: 156, percentage: 15 },
    { type: 'Hợp đồng', count: 89, percentage: 9 },
    { type: 'Freelance', count: 67, percentage: 7 },
  ];

  const locationStats = [
    { location: 'Ho Chi Minh', jobs: 456, applications: 1234, companies: 89 },
    { location: 'Ha Noi', jobs: 389, applications: 987, companies: 67 },
    { location: 'Da Nang', jobs: 156, applications: 445, companies: 34 },
    { location: 'Can Tho', jobs: 89, applications: 234, companies: 23 },
    { location: 'Hai Phong', jobs: 67, applications: 178, companies: 18 },
  ];

  const columns = [
    {
      title: 'Ngành nghề',
      dataIndex: 'industry',
      key: 'industry',
    },
    {
      title: 'Số bài đăng',
      dataIndex: 'jobs',
      key: 'jobs',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      title: 'Số công ty',
      dataIndex: 'companies',
      key: 'companies',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      title: 'Tăng trưởng',
      dataIndex: 'growth',
      key: 'growth',
      render: (value) => (
        <div className="flex items-center">
          {value > 0 ? <RiseOutlined className="text-green-500 mr-1" /> : <FallOutlined className="text-red-500 mr-1" />}
          <span className={value > 0 ? 'text-green-500' : 'text-red-500'}>{value}%</span>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 w-full overflow-x-hidden">
      {/* Header với Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Dashboard Analytics</h1>
          <p className="text-sm md:text-base text-gray-600">Thống kê chi tiết về hoạt động tuyển dụng</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-shrink-0">
          <Select
            defaultValue="all"
            style={{ width: '100%', maxWidth: 120 }}
            options={[
              { value: 'all', label: 'Tất cả' },
              { value: 'intern', label: 'Thực tập' },
              { value: 'fulltime', label: 'Toàn thời gian' },
              { value: 'parttime', label: 'Bán thời gian' },
            ]}
          />
          <RangePicker style={{ width: '100%', maxWidth: 180 }} />
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[12, 12]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <Statistic
                  title="Tổng người dùng"
                  value={3680}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: 'oklch(0.55 0.18 195)' }}
                />
                <div className="flex items-center mt-2 flex-wrap gap-1">
                  <RiseOutlined className="text-green-500 flex-shrink-0" />
                  <span className="text-green-500 text-sm flex-shrink-0">+12.5%</span>
                  <span className="text-gray-500 text-xs hidden sm:inline">so với tháng trước</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserOutlined className="text-blue-600 text-sm" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <Statistic
                  title="Tổng bài đăng"
                  value={1289}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: 'oklch(0.55 0.18 195)' }}
                />
                <div className="flex items-center mt-2 flex-wrap gap-1">
                  <RiseOutlined className="text-green-500 flex-shrink-0" />
                  <span className="text-green-500 text-sm flex-shrink-0">+8.3%</span>
                  <span className="text-gray-500 text-xs hidden sm:inline">so với tháng trước</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileTextOutlined className="text-green-600 text-sm" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <Statistic
                  title="Doanh thu tháng"
                  value={172000000}
                  prefix={<DollarOutlined />}
                  suffix=" VNĐ"
                  valueStyle={{ color: 'oklch(0.55 0.18 195)' }}
                />
                <div className="flex items-center mt-2 flex-wrap gap-1">
                  <RiseOutlined className="text-green-500 flex-shrink-0" />
                  <span className="text-green-500 text-sm flex-shrink-0">+15.7%</span>
                  <span className="text-gray-500 text-xs hidden sm:inline">so với tháng trước</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarOutlined className="text-yellow-600 text-sm" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-2">
                <Statistic
                  title="Tỷ lệ thành công"
                  value={35}
                  prefix={<SendOutlined />}
                  suffix="%"
                  valueStyle={{ color: 'oklch(0.55 0.18 195)' }}
                />
                <div className="flex items-center mt-2 flex-wrap gap-1">
                  <RiseOutlined className="text-green-500 flex-shrink-0" />
                  <span className="text-green-500 text-sm flex-shrink-0">+2.1%</span>
                  <span className="text-gray-500 text-xs hidden sm:inline">so với tháng trước</span>
                </div>
              </div>
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <SendOutlined className="text-purple-600 text-sm" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[12, 12]} className="mb-6">
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div className="flex items-center">
                <LineChartOutlined className="mr-2 text-blue-600" />
                <span className="truncate">Xu hướng tăng trưởng theo tháng</span>
              </div>
            }
            className="h-80"
          >
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChartOutlined className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500">Line Chart - Xu hướng tăng trưởng</p>
                <p className="text-sm text-gray-400">Số liệu: Người dùng, Bài đăng, Doanh thu, Ứng tuyển</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="flex items-center">
                <PieChartOutlined className="mr-2 text-green-600" />
                <span className="truncate">Phân bố loại công việc</span>
              </div>
            }
            className="h-80"
          >
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <PieChartOutlined className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500">Pie Chart - Phân bố công việc</p>
                <p className="text-sm text-gray-400">Thực tập: 45%, Toàn thời gian: 23%</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[12, 12]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="flex items-center">
                <BarChartOutlined className="mr-2 text-orange-600" />
                <span className="truncate">Thống kê ứng viên theo giai đoạn</span>
              </div>
            }
            className="h-80"
          >
            <div className="space-y-4">
              {applicationStats.map((stat, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm truncate flex-1 mr-2">{stat.status}</span>
                    <span className="font-medium text-sm flex-shrink-0">{stat.count}</span>
                  </div>
                  <Progress 
                    percent={stat.percentage} 
                    strokeColor={stat.color}
                    showInfo={false}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div className="flex items-center">
                <BarChartOutlined className="mr-2 text-purple-600" />
                <span className="truncate">Top ngành nghề theo tăng trưởng</span>
              </div>
            }
            className="h-80"
          >
            <div className="overflow-x-auto">
              <Table 
                columns={columns} 
                dataSource={topIndustries} 
                pagination={false}
                size="small"
                className="mt-4"
                scroll={{ x: 300 }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 3 */}
      <Row gutter={[12, 12]}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div className="flex items-center">
                <BarChartOutlined className="mr-2 text-indigo-600" />
                <span className="truncate">Phân bố theo địa điểm</span>
              </div>
            }
            className="h-80"
          >
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <BarChartOutlined className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500">Bar Chart - Phân bố địa điểm</p>
                <p className="text-sm text-gray-400">Ho Chi Minh: 456 bài, Ha Noi: 389 bài</p>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="flex items-center">
                <PieChartOutlined className="mr-2 text-pink-600" />
                <span className="truncate">Tỷ lệ ứng tuyển thành công</span>
              </div>
            }
            className="h-80"
          >
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <PieChartOutlined className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500">Doughnut Chart - Tỷ lệ thành công</p>
                <p className="text-sm text-gray-400">Thành công: 35%, Đang xử lý: 45%</p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Charts;
