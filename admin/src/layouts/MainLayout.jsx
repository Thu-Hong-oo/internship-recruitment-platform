import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import SideMenu from "../components/SideMenu";
import UserProfile from "../components/UserProfile";

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
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
            <UserProfile />
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
