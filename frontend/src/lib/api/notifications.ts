import { api } from './index';

// Types
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'APPROVAL_PENDING'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'APPROVAL_CHANGES_REQUESTED'
  | 'MEETING_REMINDER'
  | 'DEADLINE_REMINDER'
  | 'COMMENT_MENTION'
  | 'COMMENT_REPLY'
  | 'PROJECT_UPDATE';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface NotificationListParams {
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface NotificationPreference {
  inApp: boolean;
  telegram: boolean;
}

export interface NotificationPreferences {
  taskAssigned: NotificationPreference;
  taskUpdated: NotificationPreference;
  approvalPending: NotificationPreference;
  approvalResult: NotificationPreference;
  meetingReminder: NotificationPreference;
  deadlineReminder: NotificationPreference;
  commentMention: NotificationPreference;
  projectUpdate: NotificationPreference;
}

// Labels
export const NotificationTypeLabels: Record<NotificationType, string> = {
  TASK_ASSIGNED: 'Nhiệm vụ mới',
  TASK_UPDATED: 'Cập nhật nhiệm vụ',
  TASK_COMPLETED: 'Hoàn thành nhiệm vụ',
  APPROVAL_PENDING: 'Chờ phê duyệt',
  APPROVAL_APPROVED: 'Đã phê duyệt',
  APPROVAL_REJECTED: 'Từ chối phê duyệt',
  APPROVAL_CHANGES_REQUESTED: 'Yêu cầu chỉnh sửa',
  MEETING_REMINDER: 'Nhắc nhở cuộc họp',
  DEADLINE_REMINDER: 'Nhắc nhở deadline',
  COMMENT_MENTION: 'Được đề cập',
  COMMENT_REPLY: 'Trả lời bình luận',
  PROJECT_UPDATE: 'Cập nhật dự án',
};

export const NotificationTypeIcons: Record<NotificationType, string> = {
  TASK_ASSIGNED: 'ClipboardList',
  TASK_UPDATED: 'Edit',
  TASK_COMPLETED: 'CheckCircle',
  APPROVAL_PENDING: 'Clock',
  APPROVAL_APPROVED: 'Check',
  APPROVAL_REJECTED: 'X',
  APPROVAL_CHANGES_REQUESTED: 'AlertCircle',
  MEETING_REMINDER: 'Calendar',
  DEADLINE_REMINDER: 'Bell',
  COMMENT_MENTION: 'AtSign',
  COMMENT_REPLY: 'MessageCircle',
  PROJECT_UPDATE: 'Folder',
};

export const NotificationPreferenceLabels: Record<keyof NotificationPreferences, string> = {
  taskAssigned: 'Nhiệm vụ được giao',
  taskUpdated: 'Cập nhật nhiệm vụ',
  approvalPending: 'Chờ phê duyệt',
  approvalResult: 'Kết quả phê duyệt',
  meetingReminder: 'Nhắc nhở cuộc họp',
  deadlineReminder: 'Nhắc nhở deadline',
  commentMention: 'Được đề cập',
  projectUpdate: 'Cập nhật dự án',
};

// API functions
export const notificationsApi = {
  // List notifications
  list: async (params?: NotificationListParams): Promise<NotificationListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.unreadOnly !== undefined) searchParams.set('unreadOnly', String(params.unreadOnly));
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    const response = await api.get(`/notifications${query ? `?${query}` : ''}`);
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark as read
  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async (): Promise<{ count: number }> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  // Get preferences
  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  // Update preferences
  updatePreferences: async (prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const response = await api.patch('/notifications/preferences', prefs);
    return response.data;
  },
};
