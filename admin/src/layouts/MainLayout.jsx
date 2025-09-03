import { Layout } from "antd";
import { Outlet , useNavigate} from "react-router-dom";
import SideMenu from "../components/SideMenu";
import { getPath } from "../utils";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const navigate = useNavigate();
  
  // Lấy role từ userInfo hoặc localStorage
  const getUserRole = () => {
    const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userRole');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        return parsed.role;
      } catch (e) {
        return 'admin';
      }
    }
    return localStorage.getItem('userRole') || 'admin';
  };
  
  const userRole = getUserRole();
  
  // Lấy thông tin user từ localStorage hoặc sessionStorage
  const getUserInfo = () => {
    const userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    if (userInfo) {
      try {
        return JSON.parse(userInfo);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const userInfo = getUserInfo();
  
  // Lấy tên hiển thị theo role
  const getDisplayName = () => {
    if (userInfo) {
      return userInfo.name;
    }
    
    switch (userRole) {
      case 'company':
        return 'Company User';
      case 'candidate':
        return 'Candidate User';
      case 'admin':
      default:
        return 'Admin User';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userInfo');
    navigate("/login", { replace: true });
  }
  return (

    <Layout className="min-h-[100vh] max-h-[100vh] p-3 bg-[#F0F2F5]">
      <Sider className="!min-w-[280px] bg-white rounded-2xl">
        <div className="h-full flex flex-col justify-between overflow-x-auto">
          <div>
            <div className="flex align-center justify-center m-1">
              <img src="/images/logo.png" alt="logo" width={140} />
            </div>
              <SideMenu />
          </div>
          <div className="m-1 mt-10 pl-3 font-semibold">
            <div className="flex gap-2 mb-4 text-[#000D4D73]">
              <UserOutlined style={{ fontSize: '20px' }} />
              <span>{getDisplayName()}</span>
            </div>
            <div className="flex gap-2 mb-4 text-[#FF003D] hover:underline hover:cursor-pointer" onClick={() => handleLogout()}>
              <LogoutOutlined style={{ fontSize: '20px' }} /> Đăng xuất
            </div>
          </div>

        </div>
      </Sider>
      <Layout>
        {/* <Header className='bg-white ml-3 mb-3 p-3 rounded-2xl'> Top bar Huyenxinhhhh... </Header> */}
        <Content className="bg-[#F0F2F5] py-4 pl-5 pr-2 overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
