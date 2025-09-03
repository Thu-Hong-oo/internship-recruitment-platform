import { Button, Checkbox, Form, Input, message } from "antd";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearRememberMeCookie, getPath, setRememberMeCookie } from "../../utils";
import { authenticateUser } from "../../data/users";
import "./style.css";
import { UserOutlined , LockOutlined , EyeInvisibleOutlined , EyeOutlined } from "@ant-design/icons";


const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const password = Form.useWatch("password", form);
  const phone = Form.useWatch("phone", form);

  useEffect(() => {
    const savedPhone = localStorage.getItem("saved_phone");
    if (savedPhone) {
      form.setFieldsValue({ phone: savedPhone, rememberLogin: true });
    }
  }, []);

  const handleLoginFormSubmit = async (values) => {
    try {
      // Auto login thành công - không cần kiểm tra tài khoản
      const fakeUser = {
        id: 1,
        role: 'admin',
        name: 'Admin User',
        email: values.phone
      };
      
      // Lưu thông tin user
      if (values.rememberLogin) {
        setRememberMeCookie(values.phone);
        localStorage.setItem("saved_phone", values.phone);
        localStorage.setItem("accessToken", `token_${fakeUser.id}`);
        localStorage.setItem("userRole", fakeUser.role);
        localStorage.setItem("userInfo", JSON.stringify(fakeUser));
      } else {
        clearRememberMeCookie();
        localStorage.removeItem("saved_phone");
        sessionStorage.setItem("accessToken", `token_${fakeUser.id}`);
        sessionStorage.setItem("userRole", fakeUser.role);
        sessionStorage.setItem("userInfo", JSON.stringify(fakeUser));
      }
      
      message.success("Đăng nhập thành công!");
      
      // Auto chuyển hướng vào admin dashboard
      navigate("/admin/dashboard", { replace: true });
      
    } catch (error) {
      message.error("Có lỗi xảy ra!");
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-logo">
            <img src="/images/logo.png" alt="logo" style={{maxWidth: "200px", height: "auto"}} />
          </div>
          <Form form={form} layout="vertical" onFinish={handleLoginFormSubmit} className="login-form">
            <div className="mb-[15px]">Đăng nhập bằng tài khoản InternBridge của bạn.</div>
            <Form.Item
              name="phone"
              label="Đăng nhập"
              // rules={[
              //   { required: true, message: 'Nhập số điện thoại hoặc email' },
              //   { pattern: /^0[3|5|7|8|9]\d{8}$/, message: 'Số điện thoại không hợp lệ' },
              // ]}
            >
              <Input size="large" placeholder="Nhập số điện thoại hoặc email" prefix={<UserOutlined />} className="gap-2" />
            </Form.Item>
            <Form.Item name="password" label="Mật khẩu">
              <Input.Password
                size="large"
                placeholder="Nhập mật khẩu"
                prefix={<LockOutlined />}
                className="!gap-2 !bg-white"
                iconRender={(visible) =>
                  visible ? (
                    <EyeInvisibleOutlined style={{ cursor: "pointer" }} />
                  ) : (
                    <EyeOutlined style={{ cursor: "pointer" }} />
                  )
                }
              />
            </Form.Item>
            <div className="flex items-center justify-between mt-4 mb-4">
              <Form.Item name="rememberLogin" valuePropName="checked" noStyle>
                <Checkbox className="!text-[oklch(0.55_0.18_195)]">Nhớ đăng nhập</Checkbox>
              </Form.Item>
              <div className="!text-[oklch(0.55_0.18_195)] hover:underline hover:cursor-pointer">Quên mật khẩu?</div>
            </div>
            <Button type="primary" htmlType="submit" block disabled={!phone || !password} className="btn-active">
              Đăng nhập
            </Button>
          </Form>
        </div>
      </div>

      <footer className="login-footer">
        <div className="flex align-center gap-[20px]">
          <div className="flex items-center gap-1">
            <img src={getPath("icons/auth/ic-phone.svg")} alt="phone" width={20} height={20} />
            <a href="tel:1900292987">0123456789</a>
          </div>
        
        </div>
        <div className="flex align-center justify-end gap-[20px]">
          <a href="#" target="_blank" aria-label="Facebook" className="flex items-center text-white hover:text-[#0B7CE4]">
            <img src={getPath("icons/auth/ic-FB.svg")} alt="FB" width="20" height="20" />
          </a>
          <a
            href="#"
            target="_blank"
            aria-label="LinkedIn"
            className="flex items-center text-white hover:text-[#0B7CE4]"
          >
            <img src={getPath("icons/auth/ic-In.svg")} alt="IG" width="20" height="20" />
          </a>
          <a href="#" target="_blank" aria-label="Other" className="flex items-center text-white hover:text-[#0B7CE4]">
            <img src={getPath("icons/auth/ic-Zalo.svg")} alt="Zalo" width="20" height="20" />
          </a>
          <a
            href="#"
            target="_blank"
            aria-label="Other"
            className="flex items-center text-white hover:text-[#0B7CE4]"
          >
            <img src={getPath("icons/auth/ic-YT.svg")} alt="YT" width="20" height="20" />
          </a>
        </div>
        {/* © {new Date().getFullYear()} CRM System - All rights reserved. */}
      </footer>
    </div>
  );
};

export default Login;
