import Icons from "../assets/Icons";
import Accounts from "../pages/accounts";
import Companies from "../pages/companies";
import Jobs from "../pages/jobs";
import Candidates from "../pages/candidates";
import Transactions from "../pages/transactions";
import Media from "../pages/media";
import Dashboard from "../pages/dashboard";

const menuConfig = [
  { key: "dashboard", label: "Trang chủ", path: "/dashboard", icon: Icons.HomeIcon, element: <Dashboard /> },

  {
    key: "companies",
    label: "Quản lý công ty",
    path: "/companies",
    icon: Icons.CompanyIcon,
    children: [
      { key: "company-list", label: "Danh sách công ty", path: "/companies/list", element: <Companies.List /> },
      { key: "add-company", label: "Thêm công ty mới", path: "/companies/add", element: <Companies.Add /> },
      { key: "recruitments", label: "Tuyển dụng công ty", path: "/companies/recruitments", element: <Companies.Recruitments /> },
    ],
  },

  {
    key: "jobs",
    label: "Quản lý bài đăng",
    path: "/jobs",
    icon: Icons.JobIcon,
    children: [
      { key: "job-list", label: "Danh sách bài đăng", path: "/jobs/list", element: <Jobs.List /> },
      { key: "create-job", label: "Tạo bài đăng mới", path: "/jobs/create", element: <Jobs.Create /> },
      { key: "purchase-jobs", label: "Mua thêm lượt đăng", path: "/jobs/purchase", element: <Jobs.Purchase /> },
    ],
  },

  {
    key: "candidates",
    label: "Tìm kiếm ứng viên",
    path: "/candidates",
    icon: Icons.CandidateIcon,
    children: [
      { key: "candidate-list", label: "Danh sách ứng viên", path: "/candidates/list", element: <Candidates.List /> },
      { key: "purchase-views", label: "Mua thêm lượt xem ứng viên", path: "/candidates/purchase", element: <Candidates.Purchase /> },
    ],
  },

  {
    key: "transactions",
    label: "Lịch sử giao dịch",
    path: "/transactions",
    icon: Icons.TransactionIcon,
    children: [
      { key: "transaction-list", label: "Danh sách giao dịch", path: "/transactions/list", element: <Transactions.List /> },
    ],
  },

  { key: "media", label: "Quản lý kho Media", path: "/media", icon: Icons.MediaIcon, element: <Media /> },
];

export default menuConfig;
