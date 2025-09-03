// Dữ liệu users mẫu cho 3 vai trò
export const users = [
  {
    id: 1,
    phone: "0123456789",
    password: "123456",
    role: "admin",
    name: "Admin User",
    email: "admin@globalcare.vn",
    avatar: "/icons/accounts/user-profile.svg",
    permissions: ["all"]
  },
  {
    id: 2,
    phone: "0987654321",
    password: "123456",
    role: "company",
    name: "Company User",
    email: "company@globalcare.vn",
    avatar: "/icons/accounts/user-profile.svg",
    companyName: "FPT Software",
    permissions: ["jobs", "candidates", "company-profile", "media"]
  },
  {
    id: 3,
    phone: "0369852147",
    password: "123456",
    role: "candidate",
    name: "Candidate User",
    email: "candidate@globalcare.vn",
    avatar: "/icons/accounts/user-profile.svg",
    skills: ["React", "JavaScript", "Node.js"],
    experience: "1 năm",
    permissions: ["jobs", "applications", "profile", "learning"]
  }
];

// Hàm kiểm tra đăng nhập
export const authenticateUser = (phoneOrEmail, password) => {
  // Tìm user theo số điện thoại hoặc email
  const user = users.find(u => 
    (u.phone === phoneOrEmail || u.email === phoneOrEmail) && 
    u.password === password
  );
  
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return {
      success: true,
      user: userWithoutPassword,
      message: "Đăng nhập thành công!"
    };
  }
  return {
    success: false,
    user: null,
    message: "Sai tài khoản hoặc mật khẩu!"
  };
};

// Hàm lấy user theo role
export const getUserByRole = (role) => {
  return users.find(u => u.role === role);
};

// Hàm lấy tất cả users theo role
export const getUsersByRole = (role) => {
  return users.filter(u => u.role === role);
};
