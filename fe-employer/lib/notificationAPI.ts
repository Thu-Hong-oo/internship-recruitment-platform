const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export interface NotificationData {
  candidateId?: string;
  jobId?: string;
  applicationId?: string;
  [key: string]: any;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender?: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  isSent: boolean;
  priority: "low" | "medium" | "high";
  channel: string;
  actionRequired: boolean;
  locale: string;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  data?: NotificationData;
  error?: {
    retries: number;
  };
  __v?: number;
}

export interface NotificationsResponse {
  success: boolean;
  data?: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount?: number;
  error?: string;
}

export interface NotificationDetailResponse {
  success: boolean;
  data?: Notification;
  error?: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
  priority?: string;
}

// Get notifications list
export const getNotifications = async (
  token: string,
  params?: GetNotificationsParams
): Promise<NotificationsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.isRead !== undefined)
      queryParams.append("isRead", String(params.isRead));
    if (params?.type) queryParams.append("type", params.type);
    if (params?.priority) queryParams.append("priority", params.priority);

    const url = `${API_BASE_URL}/notifications${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return {
      success: response.ok,
      data: data?.data,
      pagination: data?.pagination,
      unreadCount: data?.unreadCount,
      error: data?.error,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể kết nối máy chủ",
    };
  }
};

// Get notification detail
export const getNotificationDetail = async (
  token: string,
  notificationId: string
): Promise<NotificationDetailResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return {
      success: response.ok,
      data: data?.data,
      error: data?.error,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể kết nối máy chủ",
    };
  }
};

// Mark notification as read
export const markNotificationAsRead = async (
  token: string,
  notificationId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return {
      success: response.ok,
      error: data?.error,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể kết nối máy chủ",
    };
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (
  token: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return {
      success: response.ok,
      error: data?.error,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Không thể kết nối máy chủ",
    };
  }
};
