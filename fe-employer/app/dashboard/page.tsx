"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, BarChart3 as BarIcon, PieChart, LineChart, CalendarDays, TrendingUp, TrendingDown, Filter, X, Calendar } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import EmployerShell from "@/components/layout/EmployerShell";
import { getToken } from "@/lib/userStorage";
import { getEmployerInterviews, getAnalytics, AnalyticsResponse } from "@/lib/jobAPI";
import "react-day-picker/dist/style.css";
import {
  LineChart as ReLineChart,
  Line,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";

// Mock data generator
const generateMockTrendData = (days = 30) => {
  const data = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    data.push({
      date: new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(Math.random() * 50) + 10,
    });
  }
  return data;
};

// Period options
const PERIOD_OPTIONS = [
  { value: "7", label: "7 ngày", days: 7, groupBy: "day" },
  { value: "30", label: "30 ngày", days: 30, groupBy: "day" },
  { value: "90", label: "3 tháng", days: 90, groupBy: "month" },
  { value: "180", label: "6 tháng", days: 180, groupBy: "month" },
  { value: "365", label: "1 năm", days: 365, groupBy: "month" },
];

const MiniSparkline = ({ 
  data, 
  color = "#008e92", 
  trend,
  groupBy = "day"
}: { 
  data: any[]; 
  color?: string; 
  trend: { pct: number; up: boolean };
  groupBy?: "day" | "month";
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-12 flex items-center justify-center text-xs text-muted-foreground">
          Không có dữ liệu
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${trend.up ? 'text-green-600' : 'text-red-600'}`}>
          {trend.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {trend.pct}%
        </div>
      </div>
    );
  }

  // Get comparison values: today vs yesterday, or this month vs last month
  const values = data.map(d => d.value || 0);
  const currentValue = values[values.length - 1] || 0; // Latest value (today/this month)
  const previousValue = values.length >= 2 ? values[values.length - 2] : values[0] || 0; // Previous value (yesterday/last month)
  
  // Calculate change
  const change = currentValue - previousValue;
  const changePercent = previousValue > 0 
    ? Math.round((change / previousValue) * 100) 
    : (currentValue > 0 ? 100 : 0);
  
  // Determine colors
  const trendColor = trend.up ? "#10b981" : "#ef4444";
  const lineColor = color;
  
  // Mark comparison points in data
  const chartData = data.map((d, index) => {
    const isCurrent = index === data.length - 1;
    const isPrevious = index === data.length - 2;
    return {
      ...d,
      isCurrent,
      isPrevious,
      isComparisonPoint: isCurrent || isPrevious,
    };
  });

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-12 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ReLineChart 
            data={chartData} 
            margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
          >
            {/* Main trend line */}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={lineColor}
              strokeWidth={1.5}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
              strokeOpacity={0.4}
            />
            {/* Highlight comparison line (previous to current) */}
            {chartData.length >= 2 && (
              <Line
                type="linear"
                dataKey={(entry: any) => entry.isComparisonPoint ? entry.value : null}
                stroke={trendColor}
                strokeWidth={2.5}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            )}
            {/* Dots for comparison points */}
            <Line
              type="monotone"
              dataKey={(entry: any) => entry?.isComparisonPoint ? entry.value : null}
              stroke="none"
              dot={(props: any) => {
                const entry = props.payload;
                if (!entry?.isComparisonPoint) {
                  return <circle key={`dot-${props.index}`} cx={props.cx} cy={props.cy} r={0} fill="none" />;
                }
                
                const isCurrent = entry.isCurrent;
                const dotColor = isCurrent ? trendColor : "#94a3b8";
                const dotSize = isCurrent ? 5 : 4;
                
                return (
                  <circle
                    key={`dot-${props.index}-${isCurrent ? 'current' : 'previous'}`}
                    cx={props.cx}
                    cy={props.cy}
                    r={dotSize}
                    fill={dotColor}
                    stroke="#fff"
                    strokeWidth={isCurrent ? 2 : 1.5}
                  />
                );
              }}
              activeDot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ReLineChart>
        </ResponsiveContainer>
        {/* Comparison indicator overlay */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            {groupBy === "day" ? "Hôm qua" : "Tháng trước"}
          </span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${trend.up ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {groupBy === "day" ? "Hôm nay" : "Tháng này"}
          </span>
        </div>
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${trend.up ? 'text-green-600' : 'text-red-600'}`}>
        {trend.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {trend.pct}%
      </div>
    </div>
  );
};

const StatCard = ({ 
  title, 
  value, 
  trendData, 
  trend, 
  onClick, 
  color = "#008e92",
  groupBy = "day"
}: { 
  title: string; 
  value: number; 
  trendData: any[]; 
  trend: { pct: number; up: boolean }; 
  onClick?: () => void;
  color?: string;
  groupBy?: "day" | "month";
}) => {
  return (
    <Card 
      className="!shadow-md cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all" 
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="text-xs uppercase text-muted-foreground font-medium">{title}</div>
        <div className="text-3xl font-bold text-slate-800">{value.toLocaleString("vi-VN")}</div>
        <MiniSparkline data={trendData} color={color} trend={trend} groupBy={groupBy} />
      </CardContent>
    </Card>
  );
};

const InterviewFilterBar = ({ 
  statusFilter, 
  setStatusFilter, 
  typeFilter, 
  setTypeFilter,
  searchTerm,
  setSearchTerm 
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
          Bộ lọc
          {(statusFilter || typeFilter || searchTerm) && (
            <span className="w-2 h-2 bg-[#008e92] rounded-full"></span>
          )}
        </button>
        
        {(statusFilter || typeFilter || searchTerm) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setTypeFilter("");
              setSearchTerm("");
            }}
            className="text-xs text-red-600 hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Xóa bộ lọc
          </button>
        )}
      </div>
      
      {isOpen && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Tìm kiếm</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tên ứng viên, vị trí..."
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Tất cả</option>
                <option value="scheduled">Đã lên lịch</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Loại phỏng vấn</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Tất cả</option>
                <option value="online">Online</option>
                <option value="offline">Trực tiếp</option>
                <option value="phone">Điện thoại</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsResponse["data"] | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [loadingInterviews, setLoadingInterviews] = useState(false);
  const [monthlyInterviews, setMonthlyInterviews] = useState<any[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const calendarRef = useRef<HTMLDivElement | null>(null);

  // Load analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const token = getToken();
        if (!token) return;
        const res = await getAnalytics(token, selectedPeriod);
        if (res.success) {
          setAnalytics(res.data || null);
        }
      } finally {
        setLoadingAnalytics(false);
      }
    };
    loadAnalytics();
  }, [selectedPeriod]);

  // Load upcoming interviews (next 14 days)
  useEffect(() => {
    const loadInterviews = async () => {
      try {
        setLoadingInterviews(true);
        const token = getToken();
        if (!token) return;
        const from = new Date().toISOString();
        const to = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
        const res = await getEmployerInterviews(token, { from, to, limit: 200 });
        if (res.success && Array.isArray(res.data)) {
          setUpcomingInterviews(res.data);
        }
      } finally {
        setLoadingInterviews(false);
      }
    };
    loadInterviews();
  }, []);

  // Load interviews for calendar month
  useEffect(() => {
    const loadMonthInterviews = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const start = new Date(calendarMonth);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        const res = await getEmployerInterviews(token, {
          from: start.toISOString(),
          to: end.toISOString(),
          limit: 200,
        });
        if (res.success && Array.isArray(res.data)) {
          setMonthlyInterviews(res.data);
        }
      } catch (e) {
        // ignore silent fail
      }
    };
    loadMonthInterviews();
  }, [calendarMonth]);

  // Get current period config
  const currentPeriod = PERIOD_OPTIONS.find(p => p.value === selectedPeriod) || PERIOD_OPTIONS[1];
  
  // Fill missing dates in the period
  const fillMissingDates = (perDayData: any[], periodDays: number, groupBy: "day" | "month" = "day") => {
    if (groupBy === "month") {
      // For monthly grouping, we'll handle it differently
      return perDayData;
    }
    
    // Create a map of existing data
    const dataMap = new Map<string, number>();
    perDayData.forEach((d) => {
      dataMap.set(d.date, d.count || 0);
    });
    
    // Generate all dates in the period
    const filledData: { date: string; value: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start from (periodDays - 1) days ago to today
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      filledData.push({
        date: dateStr,
        value: dataMap.get(dateStr) || 0,
      });
    }
    
    return filledData;
  };
  
  // Generate trend data from perDay data, grouped by day or month
  const generateTrendData = (perDayData: any[], periodDays: number, groupBy: "day" | "month" = "day") => {
    if (!perDayData || perDayData.length === 0) {
      return generateMockTrendData(periodDays);
    }
    
    if (groupBy === "day") {
      // Fill missing dates first
      const filledData = fillMissingDates(perDayData, periodDays, "day");
      return filledData.map((d) => ({
        date: d.date,
        value: d.value,
      }));
      } else {
      // Group by month
      const monthlyMap = new Map<string, number>();
      perDayData.forEach((d) => {
        const date = new Date(d.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + (d.count || 0));
      });
      
      // Fill missing months in the period
      const filledMonths: { date: string; value: number }[] = [];
      const today = new Date();
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - Math.floor(periodDays / 30));
      
      const currentMonth = new Date(startDate);
      while (currentMonth <= today) {
        const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
        filledMonths.push({
          date: `${monthKey}-01`,
          value: monthlyMap.get(monthKey) || 0,
        });
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
      
      return filledMonths;
    }
  };

  // Calculate trend percentage based on period data
  const calculateTrendFromData = (trendData: any[], groupBy: "day" | "month") => {
    if (!trendData || trendData.length < 2) {
      return { pct: 0, up: true };
    }
    
    // Compare first half vs second half of the period
    const midPoint = Math.floor(trendData.length / 2);
    const firstHalf = trendData.slice(0, midPoint);
    const secondHalf = trendData.slice(midPoint);
    
    const firstHalfSum = firstHalf.reduce((sum, d) => sum + (d.value || 0), 0);
    const secondHalfSum = secondHalf.reduce((sum, d) => sum + (d.value || 0), 0);
    
    if (firstHalfSum === 0) {
      return { pct: secondHalfSum > 0 ? 100 : 0, up: secondHalfSum > 0 };
    }
    
    const change = ((secondHalfSum - firstHalfSum) / firstHalfSum) * 100;
    return { pct: Math.min(999, Math.round(Math.abs(change))), up: change >= 0 };
  };

  // Calculate trend percentage
  const calculateTrend = (current: number, previous: number) => {
    if (!previous || previous === 0) return { pct: current > 0 ? 100 : 0, up: current > 0 };
    const change = ((current - previous) / previous) * 100;
    return { pct: Math.min(999, Math.round(Math.abs(change))), up: change >= 0 };
  };

  const trendPct = (part?: number, base?: number) => {
    if (!part || !base || base === 0) return { pct: 0, up: true };
    const pct = Math.min(999, Math.round((part / base) * 100));
    return { pct, up: pct >= 0 };
  };

  const statusLookup = (name: string) =>
    analytics?.applications?.statusDistribution?.find((s) => 
      (s.status || "").toLowerCase() === name.toLowerCase()
    )?.count || 0;

  const pieColors = ["#008e92", "#00bcd4", "#00a3af", "#66d8dd", "#b2ecee"];
  const truncateLabel = (value: string) => (value?.length > 18 ? `${value.slice(0, 18)}…` : value);

  // Prepare data
  const perDayData = analytics?.applications?.perDay?.map((d) => ({
    date: d.date,
    count: d.count || 0,
  })) || [];

  // Map status to Vietnamese
  const statusMap: Record<string, string> = {
    pending: "Chờ xử lý",
    shortlisted: "Đã shortlist",
    interview: "Phỏng vấn",
    rejected: "Từ chối",
    accepted: "Chấp nhận",
    hired: "Đã tuyển",
    withdrawn: "Rút đơn",
  };

  const statusData = analytics?.applications?.statusDistribution?.map((s) => ({
    name: statusMap[s.status?.toLowerCase() || ""] || s.status || "Khác",
    value: s.count || 0,
    originalStatus: s.status, // Keep original for filtering
  })) || [];

  const topJobData = React.useMemo(() => {
    const data = analytics?.applications?.topJobs?.map((j: any) => ({
    name: j.title || "Job",
      value: Number(j.count) || 0,
      jobId: j.jobId || j._id || "",
  })) || [];
    // Filter out items with value 0 and sort descending
    const filtered = data
      .filter(item => item.value > 0 && !isNaN(item.value))
      .sort((a, b) => b.value - a.value); // Sort descending (largest first)
    // Debug log
    console.log('Top jobs chart data:', filtered);
    console.log('Top jobs sample:', filtered[0]);
    return filtered;
  }, [analytics?.applications?.topJobs]);
  // Prepare chart data for industries - calculate directly from analytics
  const industriesChartData = React.useMemo(() => {
    const rawData = analytics?.jobs?.byIndustry || [];
  if (!rawData || rawData.length === 0) {
    return [];
  }
    
    const processed = rawData
      .map((industry: any) => {
        if (!industry) return null;
        
      // Parse count and active as numbers
        const count = Number(industry.count) || 0;
        const active = Number(industry.active) || 0;
        
      // Skip if no valid count
      if (count <= 0 || isNaN(count)) return null;
        
        // Format name: convert "business-administration" to "Business Administration"
      // Use industryCode if name is null
      const sourceName = industry.name || industry.industryCode || '';
      const displayName = sourceName
        ? sourceName
              .split('-')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
        : 'Chưa phân loại';
        
        return {
          name: displayName.length > 25 ? `${displayName.slice(0, 25)}...` : displayName,
          value: count,
          active: active,
          fullName: displayName,
          industryCode: industry.industryCode,
          category: industry.category,
        };
      })
    .filter((item): item is NonNullable<typeof item> => {
      return item !== null && item.value > 0 && !isNaN(item.value);
    })
    .sort((a, b) => b.value - a.value) // Sort descending (largest first)
      .slice(0, 10);
    
  // Debug log
  console.log('Industries chart data processed:', processed);
  console.log('Industries sample:', processed[0]);
  console.log('Industries values:', processed.map(item => ({ name: item.name, value: item.value, type: typeof item.value })));
  
    return processed;
  }, [analytics?.jobs?.byIndustry]);
  // Generate trend data based on selected period
  const applicationsTrend = generateTrendData(perDayData, currentPeriod.days, currentPeriod.groupBy as "day" | "month");
  const shortlistTrend = generateTrendData(perDayData, currentPeriod.days, currentPeriod.groupBy as "day" | "month");
  const rejectedTrend = generateTrendData(perDayData, currentPeriod.days, currentPeriod.groupBy as "day" | "month");
  const jobsTrend = generateTrendData(perDayData, currentPeriod.days, currentPeriod.groupBy as "day" | "month");

  // Calculate trends
  const totalApps = analytics?.applications?.total || 0;
  const new7d = analytics?.applications?.new7d || 0;
  const shortlistedCount = statusLookup("shortlisted") + statusLookup("interview");
  const rejectedCount = statusLookup("rejected");
  const totalJobs = analytics?.jobs?.total || 0;
  const activeJobs = analytics?.jobs?.active || 0;
  const closedJobs = analytics?.jobs?.closed || 0;

  // Filter interviews
  const allInterviews = [...upcomingInterviews, ...monthlyInterviews];
  const uniqueInterviews = Array.from(
    new Map(allInterviews.map((it) => [`${it.applicationId}-${it.interviewId}`, it])).values()
  );

  const filteredInterviews = uniqueInterviews.filter((interview) => {
    if (statusFilter && interview.status !== statusFilter) return false;
    if (typeFilter && interview.type && !interview.type.toLowerCase().includes(typeFilter.toLowerCase())) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        interview.candidateName?.toLowerCase().includes(search) ||
        interview.jobTitle?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Group interviews by date
  const interviewsByDate = filteredInterviews.reduce<Record<string, any[]>>((acc, it) => {
    if (!it.scheduledAt) return acc;
    const d = new Date(it.scheduledAt);
    const key = d.toDateString();
    acc[key] = acc[key] || [];
    acc[key].push(it);
    return acc;
  }, {});

  const selectedDateInterviews = selectedDate && interviewsByDate[selectedDate.toDateString()] 
    ? interviewsByDate[selectedDate.toDateString()] 
    : [];

  const formatNumber = (n?: number) => (n || 0).toLocaleString("vi-VN");

  return (
    <EmployerShell active="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
              <div>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tổng quan hoạt động tuyển dụng của bạn
                </p>
              </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1.5 border rounded-md text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#008e92] focus:border-transparent"
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-muted-foreground">
              Cập nhật: {format(new Date(), "dd/MM/yyyy HH:mm", { locale: vi })}
            </div>
            </div>
          </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Ứng tuyển"
            value={totalApps}
            trendData={applicationsTrend}
            trend={calculateTrendFromData(applicationsTrend, currentPeriod.groupBy as "day" | "month")}
            color="#008e92"
            groupBy={currentPeriod.groupBy as "day" | "month"}
            onClick={() => router.push("/applications")}
          />
          <StatCard
            title="Vào shortlist"
            value={shortlistedCount}
            trendData={shortlistTrend}
            trend={calculateTrendFromData(shortlistTrend, currentPeriod.groupBy as "day" | "month")}
            color="#10b981"
            groupBy={currentPeriod.groupBy as "day" | "month"}
            onClick={() => router.push("/applications?status=shortlisted")}
          />
          <StatCard
            title="Từ chối"
            value={rejectedCount}
            trendData={rejectedTrend}
            trend={calculateTrendFromData(rejectedTrend, currentPeriod.groupBy as "day" | "month")}
            color="#ef4444"
            groupBy={currentPeriod.groupBy as "day" | "month"}
            onClick={() => router.push("/applications?status=rejected")}
          />
          <StatCard
            title="Ứng viên mới 7 ngày"
            value={new7d}
            trendData={applicationsTrend.slice(-7)}
            trend={calculateTrendFromData(applicationsTrend.slice(-7), "day")}
            color="#f59e0b"
            groupBy="day"
            onClick={() => router.push("/applications?sort=createdAt")}
          />
        </div>

        {/* Job Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Tổng tin tuyển dụng"
            value={totalJobs}
            trendData={jobsTrend}
            trend={calculateTrendFromData(jobsTrend, currentPeriod.groupBy as "day" | "month")}
            color="#6366f1"
            groupBy={currentPeriod.groupBy as "day" | "month"}
                  onClick={() => router.push("/jobs")}
          />
          <StatCard
            title="Đang mở"
            value={activeJobs}
            trendData={jobsTrend}
            trend={trendPct(activeJobs, totalJobs)}
            color="#10b981"
            groupBy={currentPeriod.groupBy as "day" | "month"}
            onClick={() => router.push("/jobs?status=active")}
          />
          <StatCard
            title="Đã đóng"
            value={closedJobs}
            trendData={jobsTrend}
            trend={trendPct(closedJobs, totalJobs)}
            color="#94a3b8"
            groupBy={currentPeriod.groupBy as "day" | "month"}
            onClick={() => router.push("/jobs?status=closed")}
          />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <button
            className="px-4 py-2 rounded-md bg-[#008e92] text-white text-sm font-medium shadow hover:opacity-90"
            onClick={() => router.push("/jobs/create-job")}
          >
            Tạo tin mới
          </button>
          <button
            className="px-4 py-2 rounded-md border border-[#008e92] text-[#008e92] text-sm font-medium hover:bg-[#e6f5f5]"
                      onClick={() => router.push("/applications")}
                    >
            Xem tất cả ứng viên
          </button>
          <button
            className="px-4 py-2 rounded-md border border-[#008e92] text-[#008e92] text-sm font-medium hover:bg-[#e6f5f5]"
            onClick={() => calendarRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            Lịch phỏng vấn
          </button>
                </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 !shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <LineChart className="h-5 w-5 text-[#008e92]" />
                Xu hướng ứng viên ({currentPeriod.label})
              </CardTitle>
              {loadingAnalytics && (
                <span className="text-xs text-muted-foreground">Đang tải...</span>
              )}
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={applicationsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => {
                      const date = new Date(val);
                      if (currentPeriod.groupBy === "month") {
                        return format(date, "MM/yyyy", { locale: vi });
                      }
                      return format(date, "dd/MM", { locale: vi });
                    }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    labelFormatter={(val) => {
                      const date = new Date(val);
                      if (currentPeriod.groupBy === "month") {
                        return format(date, "MM/yyyy", { locale: vi });
                      }
                      return format(date, "dd/MM/yyyy", { locale: vi });
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#008e92" 
                    strokeWidth={3}
                    dot={{ fill: "#008e92", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </ReLineChart>
              </ResponsiveContainer>
                </CardContent>
              </Card>

          <Card className="!shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#008e92]" />
                Phân bổ trạng thái
                  </CardTitle>
                </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    onClick={(data: any) => {
                      if (data?.originalStatus) {
                        router.push(`/applications?status=${data.originalStatus}`);
                      }
                    }}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    formatter={(value: any) => [`${value} ứng viên`, "Số lượng"]}
                  />
                </RePieChart>
              </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

        {/* Top Jobs */}
        <Card className="!shadow-md">
                <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarIcon className="h-5 w-5 text-[#008e92]" />
              Top tin tuyển dụng theo lượt ứng tuyển
                  </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {topJobData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={topJobData}
                  key={`top-jobs-${topJobData.map(d => d.value).join('-')}`}
                  layout="vertical"
                  margin={{ top: 10, right: 16, bottom: 10, left: 170 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12 }}
                    domain={[0, 'dataMax']}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    width={160}
                    interval={0}
                    tickFormatter={truncateLabel}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    formatter={(value: any) => [`${value} lượt ứng tuyển`, "Số lượng"]}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#008e92" 
                    radius={[0, 8, 8, 0]}
                    barSize={20}
                    onClick={(_, index: number) => {
                      const item = topJobData[index];
                      if (item?.jobId) {
                        router.push(`/jobs/${item.jobId}/applications`);
                      }
                    }}
                  />
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <BarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chưa có dữ liệu ứng tuyển</p>
                  <p className="text-xs mt-1">Dữ liệu sẽ hiển thị khi có ứng viên ứng tuyển</p>
                </div>
                  </div>
            )}
          </CardContent>
        </Card>

        {/* Jobs by Industry */}
        <Card className="!shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarIcon className="h-5 w-5 text-[#008e92]" />
              Bài đăng theo ngành nghề
            </CardTitle>
                </CardHeader>
          <CardContent className="h-80">
            {industriesChartData && industriesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart
                  data={industriesChartData}
                  key={`industries-${industriesChartData.map(d => d.value).join('-')}`}
                  layout="vertical"
                  margin={{ top: 10, right: 16, bottom: 10, left: 190 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number" 
                    allowDecimals={false} 
                    tick={{ fontSize: 12 }}
                    domain={[0, 'dataMax']}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    width={180}
                    interval={0}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    formatter={(value: any, name: string, props: any) => {
                      if (name === "value") {
                        return [`${value} bài đăng (${props.payload.active} đang mở)`, "Tổng số"];
                      }
                      return value;
                    }}
                    labelFormatter={(label) => `Ngành: ${label}`}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#008e92" 
                    radius={[0, 8, 8, 0]}
                    barSize={18}
                    onClick={(_, index: number) => {
                      const item = industriesChartData[index];
                      if (!item) return;
                      const params = new URLSearchParams();
                      if (item.industryCode) {
                        params.set("industryCode", item.industryCode);
                      } else if (item.category) {
                        params.set("category", item.category);
                      }
                      if (params.toString()) {
                        router.push(`/jobs?${params.toString()}`);
                      }
                    }}
                  />
                </ReBarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <BarIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chưa có dữ liệu ngành nghề</p>
                  <p className="text-xs mt-1">Dữ liệu sẽ hiển thị khi bạn đăng tin tuyển dụng có phân loại ngành nghề</p>
                </div>
                  </div>
            )}
                </CardContent>
              </Card>

      {/* Interview Calendar */}
      <div ref={calendarRef}>
        <Card className="!shadow-md">
                <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#008e92]" />
              Lịch phỏng vấn
                  </CardTitle>
                </CardHeader>
          <CardContent className="space-y-4">
            <InterviewFilterBar
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-2 flex justify-center">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  locale={vi}
                  modifiers={{
                    hasInterview: Object.keys(interviewsByDate).map((k) => new Date(k)),
                  }}
                  modifiersStyles={{
                    hasInterview: {
                      backgroundColor: "#d1f2f3",
                      color: "#008e92",
                      fontWeight: "bold",
                      borderRadius: "8px",
                    },
                    selected: {
                      backgroundColor: "#008e92",
                      color: "white",
                      fontWeight: "bold",
                      borderRadius: "8px",
                    },
                    today: {
                      border: "2px solid #008e92",
                      borderRadius: "8px",
                      fontWeight: "bold",
                    },
                  }}
                  styles={{
                    caption: { fontSize: "16px", fontWeight: 600, color: "#0f172a" },
                    head_cell: { color: "#64748b", fontSize: "14px", fontWeight: 500 },
                    cell: { padding: "8px" },
                    day: { fontSize: "14px" },
                  }}
                />
              </div>

              {/* Selected Date Interviews */}
              <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: vi }) : "Chọn ngày"}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {selectedDateInterviews.length} lịch
                  </span>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-auto">
                  {selectedDateInterviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarClock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Không có lịch phỏng vấn</p>
                    </div>
                  ) : (
                    selectedDateInterviews.map((interview) => (
                      <div
                        key={`${interview.applicationId}-${interview.interviewId}`}
                        className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-slate-800">
                              {interview.candidateName}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {interview.jobTitle}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {interview.type}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {interview.location}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-[#008e92]">
                              {format(new Date(interview.scheduledAt), "HH:mm")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Interviews Summary */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">
                  Sắp tới (14 ngày) - {filteredInterviews.length} lịch
                </h3>
                <button
                  className="text-xs text-[#008e92] hover:underline"
                  onClick={() => router.push("/applications?tab=interviews")}
                >
                  Xem tất cả
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredInterviews.slice(0, 6).map((interview) => (
                  <div
                    key={`${interview.applicationId}-${interview.interviewId}`}
                    className="bg-white border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      if (interview.jobId) {
                        router.push(`/jobs/${interview.jobId}/applications`);
                      } else {
                        router.push(`/applications`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">
                          {interview.candidateName || "Ứng viên"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {interview.jobTitle || "Tin tuyển dụng"}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {interview.type && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {interview.type}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {interview.scheduledAt && (
                          <>
                            <div className="font-medium text-[#008e92]">
                              {format(new Date(interview.scheduledAt), "dd/MM", { locale: vi })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(interview.scheduledAt), "HH:mm", { locale: vi })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
                </CardContent>
              </Card>
            </div>
          </div>
    </EmployerShell>
  );
}