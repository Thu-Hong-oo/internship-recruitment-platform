import { Alert } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";

const ErrorMessage = ({ error, onClose }) => {
  if (!error) return null;

  // Xác định loại lỗi và icon tương ứng
  const getErrorInfo = (errorMessage) => {
    if (
      errorMessage.includes("mật khẩu") ||
      errorMessage.includes("password")
    ) {
      return {
        type: "error",
        icon: <CloseCircleOutlined />,
        title: "Lỗi xác thực",
      };
    }
    if (errorMessage.includes("email") || errorMessage.includes("tài khoản")) {
      return {
        type: "error",
        icon: <CloseCircleOutlined />,
        title: "Lỗi tài khoản",
      };
    }
    if (errorMessage.includes("kết nối") || errorMessage.includes("server")) {
      return {
        type: "warning",
        icon: <CloseCircleOutlined />,
        title: "Lỗi kết nối",
      };
    }
    return {
      type: "error",
      icon: <CloseCircleOutlined />,
      title: "Lỗi đăng nhập",
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <Alert
      message={errorInfo.title}
      description={error}
      type={errorInfo.type}
      icon={errorInfo.icon}
      showIcon
      closable
      onClose={onClose}
      className="mb-4"
    />
  );
};

export default ErrorMessage;


