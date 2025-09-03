import Icons from "../assets/Icons";
import Dashboard from "../pages/dashboard";
import Jobs from "../pages/jobs";
import Candidates from "../pages/candidates";
import Media from "../pages/media";

const companyMenuConfig = [
  { key: "dashboard", label: "Trang chủ", path: "/company/dashboard", icon: Icons.HomeIcon, element: <Dashboard userRole="company" /> },

  {
    key: "jobs",
    label: "Quản lý tuyển dụng",
    path: "/jobs",
    icon: Icons.PostIcon,
    children: [
      { key: "job-list", label: "Danh sách bài đăng", path: "/jobs/list", element: <Jobs.List /> },
      { key: "create-job", label: "Đăng bài tuyển dụng", path: "/jobs/create", element: <Jobs.Create /> },
      { key: "job-analytics", label: "Thống kê bài đăng", path: "/jobs/analytics", element: <Jobs.Analytics /> },
    ],
  },

  {
    key: "candidates",
    label: "Quản lý ứng viên",
    path: "/candidates",
    icon: Icons.UserIcon,
    children: [
      { key: "candidate-list", label: "Danh sách ứng viên", path: "/candidates/list", element: <Candidates.List /> },
      { key: "applications", label: "Đơn ứng tuyển", path: "/candidates/applications", element: <Candidates.Applications /> },
      { key: "interviews", label: "Lịch phỏng vấn", path: "/candidates/interviews", element: <Candidates.Interviews /> },
      { key: "hired", label: "Ứng viên đã tuyển", path: "/candidates/hired", element: <Candidates.Hired /> },
    ],
  },

  {
    key: "company-profile",
    label: "Hồ sơ công ty",
    path: "/company-profile",
    icon: Icons.BankOutlined,
    children: [
      { key: "profile", label: "Thông tin công ty", path: "/company-profile/info", element: <div>Thông tin công ty</div> },
      { key: "settings", label: "Cài đặt", path: "/company-profile/settings", element: <div>Cài đặt</div> },
      { key: "subscription", label: "Gói dịch vụ", path: "/company-profile/subscription", element: <div>Gói dịch vụ</div> },
    ],
  },

  { key: "media", label: "Kho Media", path: "/media", icon: Icons.MediaIcon, element: <Media /> },
];

export default companyMenuConfig;
