import Icons from "../assets/Icons";
import Dashboard from "../pages/dashboard";
import Companies from "../pages/companies";
import Jobs from "../pages/jobs";
import Candidates from "../pages/candidates";
import Transactions from "../pages/transactions";
import Media from "../pages/media";
import Exams from "../pages/exams";
import Accounts from "../pages/accounts";
import AccountsDetail from "../pages/accounts/detail";
import Charts from "../pages/admin/charts";
import JobTypes from "../pages/admin/job-types";
import Skills from "../pages/admin/skills";
import Levels from "../pages/admin/levels";
import WorkTypes from "../pages/admin/work-types";
import SalaryRanges from "../pages/admin/salary-ranges";
import Experience from "../pages/admin/experience";
import PostPackages from "../pages/admin/packages/post-packages";
import ViewPackages from "../pages/admin/packages/view-packages";
import Posts from "../pages/admin/posts";

const adminMenuConfig = [
  { key: "dashboard", label: "Trang chủ", path: "/admin/dashboard", icon: Icons.HomeIcon, element: <Dashboard userRole="admin" /> },
  { key: "charts", label: "Đồ thị", path: "/admin/charts", icon: Icons.ChartIcon, element: <Charts /> },
  { key: "users", label: "Quản lý các tài khoản", path: "/admin/users", icon: Icons.UserIcon, element: <Accounts /> },
  
  {
    key: "job-management",
    label: "Quản lý công việc",
    path: "/admin/job-management",
    icon: Icons.WorkIcon,
    children: [
      { key: "job-types", label: "Loại công việc", path: "/admin/job-types", element: <JobTypes /> },
      { key: "skills", label: "Kỹ năng", path: "/admin/skills", element: <Skills /> },
      { key: "levels", label: "Cấp bậc", path: "/admin/levels", element: <Levels /> },
      { key: "work-types", label: "Hình thức làm việc", path: "/admin/work-types", element: <WorkTypes /> },
      { key: "salary-ranges", label: "Khoảng lương", path: "/admin/salary-ranges", element: <SalaryRanges /> },
      { key: "experience", label: "Kinh nghiệm", path: "/admin/experience", element: <Experience /> },
    ],
  },

  {
    key: "packages",
    label: "Quản lý gói dịch vụ",
    path: "/admin/packages",
    icon: Icons.PackageIcon,
    children: [
      { key: "post-packages", label: "Gói bài đăng", path: "/admin/post-packages", element: <PostPackages /> },
      { key: "view-packages", label: "Gói xem ứng viên", path: "/admin/view-packages", element: <ViewPackages /> },
    ],
  },

  { key: "companies", label: "Quản lý các công ty", path: "/admin/companies", icon: Icons.CompanyIcon, element: <Companies /> },
  { key: "posts", label: "Quản lý bài đăng", path: "/admin/posts", icon: Icons.PostIcon, element: <Posts /> },
];

export default adminMenuConfig;
