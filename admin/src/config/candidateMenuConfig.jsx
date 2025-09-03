import Icons from "../assets/Icons";
import Dashboard from "../pages/dashboard";
import Jobs from "../pages/jobs";

const candidateMenuConfig = [
  { key: "dashboard", label: "Trang chủ", path: "/candidate/dashboard", icon: Icons.HomeIcon, element: <Dashboard userRole="candidate" /> },

  {
    key: "jobs",
    label: "Tìm việc làm",
    path: "/jobs",
    icon: Icons.PostIcon,
    children: [
      { key: "job-search", label: "Tìm kiếm việc làm", path: "/jobs/search", element: <Jobs.Search /> },
      { key: "saved-jobs", label: "Việc làm đã lưu", path: "/jobs/saved", element: <Jobs.Saved /> },
      { key: "recommended", label: "Việc làm gợi ý", path: "/jobs/recommended", element: <Jobs.Recommended /> },
    ],
  },

  {
    key: "applications",
    label: "Đơn ứng tuyển",
    path: "/applications",
    icon: Icons.UserIcon,
    children: [
      { key: "my-applications", label: "Đơn đã nộp", path: "/applications/submitted", element: <div>Đơn đã nộp</div> },
      { key: "application-status", label: "Trạng thái ứng tuyển", path: "/applications/status", element: <div>Trạng thái</div> },
      { key: "interview-schedule", label: "Lịch phỏng vấn", path: "/applications/interviews", element: <div>Lịch phỏng vấn</div> },
    ],
  },

  {
    key: "profile",
    label: "Hồ sơ cá nhân",
    path: "/profile",
    icon: Icons.UserIcon,
    children: [
      { key: "personal-info", label: "Thông tin cá nhân", path: "/profile/personal", element: <div>Thông tin cá nhân</div> },
      { key: "resume", label: "CV/Resume", path: "/profile/resume", element: <div>CV/Resume</div> },
      { key: "skills", label: "Kỹ năng", path: "/profile/skills", element: <div>Kỹ năng</div> },
      { key: "experience", label: "Kinh nghiệm", path: "/profile/experience", element: <div>Kinh nghiệm</div> },
      { key: "education", label: "Học vấn", path: "/profile/education", element: <div>Học vấn</div> },
    ],
  },

  {
    key: "learning",
    label: "Học tập & Phát triển",
    path: "/learning",
    icon: Icons.ExamIcon,
    children: [
      { key: "courses", label: "Khóa học", path: "/learning/courses", element: <div>Khóa học</div> },
      { key: "certificates", label: "Chứng chỉ", path: "/learning/certificates", element: <div>Chứng chỉ</div> },
      { key: "assessments", label: "Bài đánh giá", path: "/learning/assessments", element: <div>Bài đánh giá</div> },
    ],
  },
];

export default candidateMenuConfig;
