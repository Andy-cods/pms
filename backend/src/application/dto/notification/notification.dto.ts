import {
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Notification Types
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

// Query DTO for listing notifications
export class NotificationListQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// Response DTOs
export interface NotificationResponseDto {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponseDto {
  notifications: NotificationResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

export interface UnreadCountResponseDto {
  count: number;
}

// Notification Preferences
export interface NotificationPreference {
  inApp: boolean;
  telegram: boolean;
}

export interface NotificationPreferencesDto {
  taskAssigned: NotificationPreference;
  taskUpdated: NotificationPreference;
  approvalPending: NotificationPreference;
  approvalResult: NotificationPreference;
  meetingReminder: NotificationPreference;
  deadlineReminder: NotificationPreference;
  commentMention: NotificationPreference;
  projectUpdate: NotificationPreference;
}

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  taskAssigned?: NotificationPreference;

  @IsOptional()
  taskUpdated?: NotificationPreference;

  @IsOptional()
  approvalPending?: NotificationPreference;

  @IsOptional()
  approvalResult?: NotificationPreference;

  @IsOptional()
  meetingReminder?: NotificationPreference;

  @IsOptional()
  deadlineReminder?: NotificationPreference;

  @IsOptional()
  commentMention?: NotificationPreference;

  @IsOptional()
  projectUpdate?: NotificationPreference;
}

// Labels for frontend
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

// Default preferences
export const DefaultNotificationPreferences: NotificationPreferencesDto = {
  taskAssigned: { inApp: true, telegram: true },
  taskUpdated: { inApp: true, telegram: false },
  approvalPending: { inApp: true, telegram: true },
  approvalResult: { inApp: true, telegram: true },
  meetingReminder: { inApp: true, telegram: true },
  deadlineReminder: { inApp: true, telegram: true },
  commentMention: { inApp: true, telegram: true },
  projectUpdate: { inApp: true, telegram: false },
};
