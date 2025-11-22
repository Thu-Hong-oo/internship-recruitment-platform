# Frontend Notification Integration Guide

## Tổng Quan

Hệ thống notification sử dụng **Socket.io** để gửi realtime notifications. Frontend cần:
1. Kết nối Socket.io với authentication token
2. Listen các events từ server
3. Hiển thị notifications trong UI
4. Mark notifications as read

## 1. Socket.io Connection

### Cài đặt

```bash
npm install socket.io-client
```

### Khởi tạo Connection

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
  auth: {
    token: localStorage.getItem('token'), // JWT token từ login
  },
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### Authentication

Socket.io tự động gửi token qua `auth.token` hoặc `Authorization` header.

## 2. Socket Events Cần Listen

### 2.1. `new-notification` - Notification mới

```typescript
socket.on('new-notification', (notification) => {
  console.log('New notification:', notification);
  
  // notification object:
  // {
  //   _id: string,
  //   type: 'NEW_APPLICATION' | 'APPLICATION_STATUS' | 'INTERVIEW_SCHEDULED' | 'JOB_MATCH' | 'NEW_MESSAGE' | 'SKILL_RECOMMENDATION' | 'SYSTEM',
  //   title: string,
  //   message: string,
  //   data: {
  //     jobId?: string,
  //     applicationId?: string,
  //     interviewTime?: Date,
  //     chatRoomId?: string,
  //     matchScore?: number,
  //     url?: string,
  //   },
  //   priority: 'low' | 'medium' | 'high',
  //   createdAt: Date,
  //   isRead: boolean,
  // }
  
  // Hiển thị notification trong UI
  showNotification(notification);
  
  // Update notification list
  updateNotificationList(notification);
  
  // Play sound (optional)
  playNotificationSound();
});
```

### 2.2. `notification_read` - Notification đã được đọc

```typescript
socket.on('notification_read', (data) => {
  // data: { notificationId: string, readAt: Date }
  
  // Update UI để mark notification as read
  markNotificationAsRead(data.notificationId);
});
```

### 2.3. `interview-notification` - Interview scheduled (từ socket handler)

```typescript
socket.on('interview-notification', (data) => {
  // data: {
  //   type: 'scheduled',
  //   applicationId: string,
  //   interviewData: object,
  //   message: string,
  // }
  
  showInterviewNotification(data);
});
```

### 2.4. `application-status-changed` - Application status thay đổi

```typescript
socket.on('application-status-changed', (data) => {
  // data: {
  //   applicationId: string,
  //   status: string,
  //   updatedBy: { id, name, role },
  //   timestamp: Date,
  // }
  
  updateApplicationStatus(data);
});
```

## 3. Notification Types và Actions

### NEW_APPLICATION
- **Người nhận**: Employer
- **Khi nào**: Candidate apply job
- **Action**: Navigate to `/employer/applications/:applicationId`

```typescript
if (notification.type === 'NEW_APPLICATION') {
  router.push(`/employer/applications/${notification.data.applicationId}`);
}
```

### APPLICATION_STATUS
- **Người nhận**: Candidate
- **Khi nào**: Employer update application status
- **Action**: Navigate to `/candidate/applications/:applicationId`

```typescript
if (notification.type === 'APPLICATION_STATUS') {
  const status = notification.data.status;
  if (status === 'rejected') {
    // Show rejection reason
    showRejectionModal(notification);
  } else {
    router.push(`/candidate/applications/${notification.data.applicationId}`);
  }
}
```

### INTERVIEW_SCHEDULED
- **Người nhận**: Candidate và Employer
- **Khi nào**: Interview được schedule
- **Action**: Navigate to interview details

```typescript
if (notification.type === 'INTERVIEW_SCHEDULED') {
  router.push(`/interviews/${notification.data.applicationId}`);
}
```

### JOB_MATCH
- **Người nhận**: Candidate
- **Khi nào**: Có job mới phù hợp
- **Action**: Navigate to job details

```typescript
if (notification.type === 'JOB_MATCH') {
  router.push(`/jobs/${notification.data.jobId}`);
}
```

### NEW_MESSAGE
- **Người nhận**: User nhận tin nhắn
- **Khi nào**: Có tin nhắn mới trong chat
- **Action**: Navigate to chat room

```typescript
if (notification.type === 'NEW_MESSAGE') {
  router.push(`/messages/${notification.data.chatRoomId}`);
}
```

### SKILL_RECOMMENDATION
- **Người nhận**: Candidate
- **Khi nào**: AI recommend skills
- **Action**: Navigate to skills page

```typescript
if (notification.type === 'SKILL_RECOMMENDATION') {
  router.push('/candidate/skills?recommended=true');
}
```

### SYSTEM
- **Người nhận**: User
- **Khi nào**: System messages (verification, etc.)
- **Action**: Navigate to URL trong data hoặc show modal

```typescript
if (notification.type === 'SYSTEM') {
  if (notification.data.url) {
    router.push(notification.data.url);
  } else {
    showSystemModal(notification);
  }
}
```

## 4. Mark Notification as Read

### API Call

```typescript
// Mark single notification as read
const markAsRead = async (notificationId: string) => {
  const response = await fetch(
    `${API_URL}/api/users/notifications/${notificationId}/read`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

// Mark all notifications as read
const markAllAsRead = async () => {
  const response = await fetch(
    `${API_URL}/api/users/notifications/read-all`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};
```

### Socket Event (tự động emit khi mark read)

```typescript
// Server tự động emit 'notification_read' khi mark read
// Frontend chỉ cần listen và update UI
socket.on('notification_read', (data) => {
  markNotificationAsReadInUI(data.notificationId);
});
```

## 5. Get Notifications List

### API Endpoint

```typescript
// GET /api/users/notifications?page=1&limit=20&unreadOnly=false
const getNotifications = async (page = 1, limit = 20, unreadOnly = false) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    unreadOnly: unreadOnly.toString(),
  });
  
  const response = await fetch(
    `${API_URL}/api/users/notifications?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

// Response:
// {
//   success: true,
//   data: Notification[],
//   pagination: {
//     current: number,
//     pages: number,
//     total: number,
//     hasNext: boolean,
//     hasPrev: boolean,
//   },
// }
```

## 6. React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  isRead: boolean;
}

export const useNotifications = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Initialize socket
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // Listen for new notifications
    newSocket.on('new-notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast/alert
      showToast(notification);
    });

    // Listen for read updates
    newSocket.on('notification_read', (data: { notificationId: string }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === data.notificationId ? { ...n, isRead: true } : n
        ))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_URL}/api/users/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    socket,
  };
};
```

## 7. UI Component Example

```typescript
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Check } from 'lucide-react';

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div className="relative">
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
      
      {/* Notification Dropdown */}
      <div className="notification-dropdown">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
            onClick={() => {
              markAsRead(notification._id);
              handleNotificationClick(notification);
            }}
          >
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.message}</div>
            <div className="notification-time">
              {formatTime(notification.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 8. Notification Priority Styling

```css
.notification-item {
  padding: 12px;
  border-left: 4px solid #ccc;
}

.notification-item.priority-high {
  border-left-color: #ef4444; /* red */
  background-color: #fef2f2;
}

.notification-item.priority-medium {
  border-left-color: #f59e0b; /* amber */
  background-color: #fffbeb;
}

.notification-item.priority-low {
  border-left-color: #3b82f6; /* blue */
  background-color: #eff6ff;
}

.notification-item.unread {
  font-weight: 600;
  background-color: #f9fafb;
}
```

## 9. Error Handling

```typescript
socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
  // Retry connection or show error message
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
  // Handle reconnection
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

## 10. Testing

### Test Socket Connection

```typescript
socket.on('connect', () => {
  console.log('✅ Connected to server');
  console.log('Socket ID:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});
```

### Test Notification Flow

1. **Apply for job** → Should receive `new-notification` with type `NEW_APPLICATION` (employer)
2. **Update application status** → Should receive `new-notification` with type `APPLICATION_STATUS` (candidate)
3. **Mark notification as read** → Should receive `notification_read` event

## 11. Best Practices

1. **Reconnection**: Socket.io tự động reconnect, nhưng nên handle reconnection manually nếu cần
2. **Token Refresh**: Khi token refresh, cần reconnect socket với token mới
3. **Cleanup**: Luôn cleanup socket listeners khi component unmount
4. **Error Handling**: Handle tất cả socket errors gracefully
5. **Performance**: Debounce notification updates nếu có nhiều notifications
6. **Persistence**: Lưu notifications vào localStorage/IndexedDB để persist khi reload

## 12. API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/notifications` | Get notifications list |
| PUT | `/api/users/notifications/:id/read` | Mark notification as read |
| PUT | `/api/users/notifications/read-all` | Mark all as read |
| DELETE | `/api/users/notifications/:id` | Delete notification |

## 13. Socket Events Summary

| Event | Direction | Description |
|-------|-----------|-------------|
| `new-notification` | Server → Client | New notification created |
| `notification_read` | Server → Client | Notification marked as read |
| `interview-notification` | Server → Client | Interview scheduled |
| `application-status-changed` | Server → Client | Application status updated |
| `connect` | Client → Server | Socket connected |
| `disconnect` | Client → Server | Socket disconnected |

## 14. Notification Data Structure

```typescript
interface Notification {
  _id: string;
  recipient: string; // User ID
  sender?: string; // User ID (optional)
  type: 'NEW_APPLICATION' | 'APPLICATION_STATUS' | 'INTERVIEW_SCHEDULED' | 
        'JOB_MATCH' | 'NEW_MESSAGE' | 'SKILL_RECOMMENDATION' | 'SYSTEM';
  title: string;
  message: string;
  data: {
    jobId?: string;
    applicationId?: string;
    interviewTime?: Date;
    chatRoomId?: string;
    matchScore?: number;
    status?: string;
    url?: string;
    reason?: string;
  };
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  readAt?: Date;
}
```

## 15. Example Implementation

Xem file `fe/lib/hooks/useNotifications.ts` và `fe/components/NotificationBell.tsx` để xem implementation đầy đủ.

