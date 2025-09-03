import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || null;
  const location = useLocation()
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />
  return children ? children : <Outlet />
}