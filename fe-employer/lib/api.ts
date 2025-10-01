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

export async function resendEmailVerification(email: string): Promise<{
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

export async function getEmployerProfile(token: string): Promise<{
  success: boolean;
  data?: any;
  profile?: any;
  error?: string;
}> {
  try {
    const res = await fetch("http://localhost:3000/api/employers/profile", {
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
      `http://localhost:3000/api/auth/unverified?email=${encodeURIComponent(
        email
      )}`
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
    const res = await fetch("http://localhost:3000/api/auth/logout", {
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

export type CreateJobPayload = {
  title: string;
  description: string;
  skills: string[];
  requirements: string;
  education: string;
  experience: string;
  salary: string;
  location: string;
  positions: number;
  deadline: string;
};

export async function createJob(
  payload: CreateJobPayload,
  token: string
): Promise<{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch("http://localhost:3000/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}

// Get all jobs posted by employer
export async function getMyJobs(
  token: string,
  options?: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
): Promise<{
  success: boolean;
  data?: any[];
  total?: number;
  page?: number;
  limit?: number;
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.status) params.append("status", options.status);
    if (options?.sortBy) params.append("sortBy", options.sortBy);
    if (options?.sortOrder) params.append("sortOrder", options.sortOrder);

    const queryString = params.toString();
    const url = `http://localhost:3000/api/jobs/employer${
      queryString ? `?${queryString}` : ""
    }`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}

// Get draft jobs only
export async function getDraftJobs(token: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const res = await fetch("http://localhost:3000/api/jobs/drafts", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}

// Update job
export async function updateJob(
  jobId: string,
  payload: CreateJobPayload,
  token: string
): Promise<{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`http://localhost:3000/api/jobs/${jobId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}

// Delete job
export async function deleteJob(
  jobId: string,
  token: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`http://localhost:3000/api/jobs/${jobId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}

// Get job applications
export async function getJobApplications(
  jobId: string,
  token: string
): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const res = await fetch(
      `http://localhost:3000/api/jobs/${jobId}/applications`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}

// Submit job for review
export async function submitJobForReview(
  jobId: string,
  token: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`http://localhost:3000/api/jobs/${jobId}/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return (await res.json()) as any;
  } catch (e) {
    return { success: false, error: "Không thể kết nối máy chủ" };
  }
}
