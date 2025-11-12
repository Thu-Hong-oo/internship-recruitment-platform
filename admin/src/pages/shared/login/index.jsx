import { Button, Checkbox, Form, Input, message } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearRememberMeCookie,
  getPath,
  setRememberMeCookie,
} from "../../utils";
import { authAPI } from "../../api/auth";
import ErrorMessage from "../../components/ErrorMessage";
import "./style.css";
import {
  UserOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const password = Form.useWatch("password", form);
  const email = Form.useWatch("email", form);

  useEffect(() => {
    const savedEmail = localStorage.getItem("saved_email");
    if (savedEmail) {
      form.setFieldsValue({ email: savedEmail, rememberLogin: true });
    }
  }, []);

  const handleLoginFormSubmit = async (values) => {
    setIsLoading(true);
    setError(null);

    try {
      // Gọi API đăng nhập
      const response = await authAPI.login(values.email, values.password);

      // Debug log để kiểm tra response
      console.log("Login response:", response);

      if (response.success) {
        const { token, user } = response;

        // Lưu thông tin user
        if (values.rememberLogin) {
          setRememberMeCookie(values.email);
          localStorage.setItem("saved_email", values.email);
          localStorage.setItem("accessToken", token);
          localStorage.setItem("userRole", user.role);
          localStorage.setItem("userInfo", JSON.stringify(user));
        } else {
          clearRememberMeCookie();
          localStorage.removeItem("saved_email");
          sessionStorage.setItem("accessToken", token);
          sessionStorage.setItem("userRole", user.role);
          sessionStorage.setItem("userInfo", JSON.stringify(user));
        }

        message.success("Đăng nhập thành công!");

        // Chuyển hướng vào admin dashboard
        navigate("/admin/dashboard", { replace: true });
      } else {
        // Hiển thị lý do cụ thể khi đăng nhập thất bại
        const errorMessage = response.error || "Đăng nhập thất bại!";
        setError(errorMessage);
      }
    } catch (error) {
      // Xử lý các loại lỗi khác nhau
      let errorMessage = "Có lỗi xảy ra khi đăng nhập!";

      if (error.response?.data?.error) {
        // Lỗi từ server với thông báo cụ thể
        errorMessage = error.response.data.error;
      } else if (error.message) {
        // Lỗi đã được xử lý trong authAPI
        errorMessage = error.message;
      } else if (error.code === "NETWORK_ERROR" || !navigator.onLine) {
        errorMessage =
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng!";
      } else if (error.response?.status === 500) {
        errorMessage = "Lỗi server. Vui lòng thử lại sau!";
      } else if (error.response?.status === 404) {
        errorMessage = "Không tìm thấy API. Vui lòng liên hệ quản trị viên!";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-logo">
            <img
              src="/images/logo.png"
              alt="logo"
              style={{ maxWidth: "200px", height: "auto" }}
            />
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleLoginFormSubmit}
            className="login-form"
          >
            <div className="mb-[15px]">
              Đăng nhập bằng tài khoản InternBridge của bạn.
            </div>

            {/* Hiển thị lỗi đăng nhập */}
            <ErrorMessage error={error} onClose={() => setError(null)} />
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input
                size="large"
                placeholder="Nhập email"
                prefix={<UserOutlined />}
                className="gap-2"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
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
                <Checkbox className="!text-[oklch(0.55_0.18_195)]">
                  Nhớ đăng nhập
                </Checkbox>
              </Form.Item>
              <div className="!text-[oklch(0.55_0.18_195)] hover:underline hover:cursor-pointer">
                Quên mật khẩu?
              </div>
            </div>
            <Button
              type="primary"
              htmlType="submit"
              block
              disabled={!email || !password || isLoading}
              loading={isLoading}
              className="btn-active"
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </Form>
        </div>
      </div>

      <footer className="login-footer">
        <div className="flex align-center gap-[20px]">
          <div className="flex items-center gap-1">
            <img
              src={getPath("icons/auth/ic-phone.svg")}
              alt="phone"
              width={20}
              height={20}
            />
            <a href="tel:1900292987">0123456789</a>
          </div>
        </div>
        <div className="flex align-center justify-end gap-[20px]">
          <a
            href="#"
            target="_blank"
            aria-label="Facebook"
            className="flex items-center text-white hover:text-[#0B7CE4]"
          >
            <img
              src={getPath("icons/auth/ic-FB.svg")}
              alt="FB"
              width="20"
              height="20"
            />
          </a>
          <a
            href="#"
            target="_blank"
            aria-label="LinkedIn"
            className="flex items-center text-white hover:text-[#0B7CE4]"
          >
            <img
              src={getPath("icons/auth/ic-In.svg")}
              alt="IG"
              width="20"
              height="20"
            />
          </a>
          <a
            href="#"
            target="_blank"
            aria-label="Other"
            className="flex items-center text-white hover:text-[#0B7CE4]"
          >
            <img
              src={getPath("icons/auth/ic-Zalo.svg")}
              alt="Zalo"
              width="20"
              height="20"
            />
          </a>
          <a
            href="#"
            target="_blank"
            aria-label="Other"
            className="flex items-center text-white hover:text-[#0B7CE4]"
          >
            <img
              src={getPath("icons/auth/ic-YT.svg")}
              alt="YT"
              width="20"
              height="20"
            />
          </a>
        </div>
        {/* © {new Date().getFullYear()} CRM System - All rights reserved. */}
      </footer>
    </div>
  );
};

export default Login;
