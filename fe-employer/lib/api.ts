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
    const res = await fetch("http://localhost:3000/api/auth/register", {
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
    const res = await fetch("http://localhost:3000/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}

export async function resendEmailVerification(
  email: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  errorType?: string;
}> {
  try {
    const res = await fetch(
      "http://localhost:3000/api/auth/resend-verification",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}

export async function getUnverifiedAccount(
  email: string
): Promise<{
  success: boolean;
  data?: any;
  expired?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(
      `http://localhost:3000/api/auth/unverified?email=${encodeURIComponent(
        email
      )}`
    );
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" } as any;
  }
}
