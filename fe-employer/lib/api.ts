const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export type RegisterEmployerPayload = {
  email: string;
  password: string;
  fullName: string;
};

export type RegisterEmployerResponse = {
  success: boolean;
  message?: string;
  email?: string;
  emailSent?: boolean;
  error?: string;
};

export async function registerEmployer(
  payload: RegisterEmployerPayload
): Promise<RegisterEmployerResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, role: "employer" }),
    });

    const data = (await res
      .json()
      .catch(() => ({}))) as RegisterEmployerResponse;
    return data;
  } catch (e) {
    return {
      success: false,
      error: "Không thể kết nối máy chủ",
    };
  }
}

export async function verifyEmail(
  email: string,
  otp: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}

export async function resendEmailVerification(email: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  errorType?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}

export async function getEmployerProfile(token: string): Promise<{
  success: boolean;
  data?: any;
  profile?: any;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/employers/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json().catch(() => ({}));
    return json as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" } as any;
  }
}

export async function getUnverifiedAccount(email: string): Promise<{
  success: boolean;
  data?: any;
  expired?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/auth/unverified?email=${encodeURIComponent(email)}`
    );
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" } as any;
  }
}

export async function logoutEmployer(token: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" } as any;
  }
}

export async function googleAuth(idToken: string): Promise<{
  success: boolean;
  token?: string;
  user?: any;
  isNew?: boolean;
  message?: string;
  error?: string;
  errorType?: string;
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, role: "employer" }), // Specify role for employer frontend
    });
    const data = await res.json().catch(() => ({}));
    return data;
  } catch (e) {
    return {
      success: false,
      error: "Không thể kết nối máy chủ",
    };
  }
}