const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export interface VerificationStatusResponse {
  success: boolean;
  message?: string;
  needsProfile?: boolean;
  setupUrl?: string;
  data?: {
    profileCompleted?: boolean;
    companyCompleted?: boolean;
    documentsCompleted?: boolean;
    verificationProgress?: {
      profile: boolean;
      company: boolean;
      documents: boolean;
    };
  };
}

export interface UpdateEmployerProfilePayload {
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  position: {
    title: string;
    level: string;
    department: string;
  };
}

// Get employer verification status
export const getVerificationStatus = async (
  token: string
): Promise<VerificationStatusResponse> => {
  try {
    if (!token) {
      return {
        success: false,
        message: "Token không hợp lệ",
        needsProfile: true,
        setupUrl: "/employers/company",
        data: {
          profileCompleted: false,
          companyCompleted: false,
          documentsCompleted: false,
          verificationProgress: {
            profile: false,
            company: false,
            documents: false,
          },
        },
      };
    }

    const response = await fetch(
      `${API_BASE_URL}/employers/verification-status`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    // Debug logging
    console.log("Verification Status API Response:", {
      status: response.status,
      data: data,
    });

    // Handle 400 status - this means profile is not set up yet
    if (response.status === 400) {
      return {
        success: false,
        message: data?.message || "Chưa thiết lập hồ sơ",
        needsProfile: true,
        setupUrl: data?.setupUrl || "/employers/company",
        data: {
          profileCompleted: false,
          companyCompleted: false,
          documentsCompleted: false,
          verificationProgress: {
            profile: false,
            company: false,
            documents: false,
          },
        },
      };
    }

    // Handle successful response
    if (response.ok) {
      return {
        success: true,
        message: data?.message,
        needsProfile: data?.needsProfile || false,
        setupUrl: data?.setupUrl,
        data: data?.data,
      };
    }

    // Handle other error responses
    return {
      success: false,
      message: data?.message || "Không thể tải trạng thái xác thực",
      needsProfile: data?.needsProfile || false,
      setupUrl: data?.setupUrl,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Không thể kết nối máy chủ",
    };
  }
};

// Update employer profile
export const updateEmployerProfile = async (
  token: string,
  payload: UpdateEmployerProfilePayload
) => {
  try {
    if (!token) {
      return { success: false, error: "Token không hợp lệ" };
    }

    const response = await fetch(`${API_BASE_URL}/employers/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return data;
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể kết nối máy chủ",
    };
  }
};
