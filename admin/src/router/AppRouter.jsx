import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import menuConfig from "../config/menuConfig";
import adminMenuConfig from "../config/adminMenuConfig";
import companyMenuConfig from "../config/companyMenuConfig";
import candidateMenuConfig from "../config/candidateMenuConfig";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import Login from "../pages/login";

import NotFoundPage from "../components/NotFoundPage";
import AccountsDetail from "../pages/accounts/detail";

// Component để điều hướng dựa trên role
const RoleBasedRedirect = () => {
  const userRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
  
  switch (userRole) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'company':
      return <Navigate to="/company/dashboard" replace />;
    case 'candidate':
      return <Navigate to="/candidate/dashboard" replace />;
    default:
      return <Navigate to="/admin/dashboard" replace />;
  }
};


function flattenRoutes(menus) {
  const result = [];
  menus.forEach((item) => {
    if (item.children) {
      result.push(...flattenRoutes(item.children));
    } else if (item.path && item.element) {
      result.push({ path: item.path, element: item.element });
    }
  });
  return result;
}

// Tạo routes cho tất cả role
const adminRoutes = flattenRoutes(adminMenuConfig);
const companyRoutes = flattenRoutes(companyMenuConfig);
const candidateRoutes = flattenRoutes(candidateMenuConfig);

// Kết hợp tất cả routes
const allRoutes = [...adminRoutes, ...companyRoutes, ...candidateRoutes];

export default function AppRouter() {
  return (
    <Routes>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<RoleBasedRedirect />} />
        {allRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        


        

      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
