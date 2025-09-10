import { Button, Dropdown, Avatar, message } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { authAPI } from "../api/auth";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
  const navigate = useNavigate();

  // Lấy thông tin user từ localStorage hoặc sessionStorage
  const userInfo = JSON.parse(
    localStorage.getItem("userInfo") ||
      sessionStorage.getItem("userInfo") ||
      "{}"
  );

  const handleLogout = () => {
    authAPI.logout();
    message.success("Đăng xuất thành công!");
    navigate("/login", { replace: true });
  };

  const items = [
    {
      key: "profile",
      label: "Thông tin cá nhân",
      icon: <UserOutlined />,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight" arrow>
      <Button type="text" className="flex items-center gap-2">
        <Avatar
          size="small"
          src={userInfo.profile?.avatar}
          icon={<UserOutlined />}
        />
        <span className="text-foreground">
          {userInfo.fullName || userInfo.email}
        </span>
      </Button>
    </Dropdown>
  );
};

export default UserProfile;


