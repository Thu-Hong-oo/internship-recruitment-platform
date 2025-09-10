import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      if (token) {
        // User đã đăng nhập, redirect về dashboard
        navigate("/admin/dashboard", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  return children;
};

export default AuthGuard;


