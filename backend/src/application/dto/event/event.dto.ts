import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EventType } from '@prisma/client';

// Enums
export { EventType };

export type AttendeeStatus = 'pending' | 'accepted' | 'declined';

// DTO for creating an event
export class CreateEventDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsEnum(EventType)
  type!: EventType;

  @IsDateString()
  startTime!: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  recurrence?: string; // RRULE format

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingLink?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendeeIds?: string[];

  @IsOptional()
  @IsArray()
  attendeeEmails?: AttendeeEmailDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10080) // Max 1 week in minutes
  reminderBefore?: number;
}

// DTO for external attendee emails
export class AttendeeEmailDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

// DTO for updating an event
export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  recurrence?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  meetingLink?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendeeIds?: string[];

  @IsOptional()
  @IsArray()
  attendeeEmails?: AttendeeEmailDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10080)
  reminderBefore?: number;

  @IsOptional()
  @IsEnum(['this', 'all'])
  updateScope?: 'this' | 'all'; // For recurring events
}

// DTO for listing events
export class EventListQueryDto {
  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsString()
  projectId?: string;

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
  limit?: number = 50;
}

// DTO for responding to an event invitation
export class RespondToEventDto {
  @IsEnum(['accepted', 'declined'])
  status!: 'accepted' | 'declined';
}

// Response DTOs
export interface EventAttendeeResponseDto {
  id: string;
  userId: string | null;
  email: string | null;
  name: string | null;
  status: AttendeeStatus;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
}

export interface EventResponseDto {
  id: string;
  title: string;
  description: string | null;
  type: EventType;
  startTime: string;
  endTime: string | null;
  isAllDay: boolean;
  recurrence: string | null;
  location: string | null;
  meetingLink: string | null;
  projectId: string | null;
  taskId: string | null;
  reminderBefore: number | null;
  project?: {
    id: string;
    code: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  attendees: EventAttendeeResponseDto[];
  createdAt: string;
  updatedAt: string;
  // For recurring event occurrences
  isRecurringOccurrence?: boolean;
  occurrenceDate?: string;
}

export interface EventListResponseDto {
  events: EventResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Labels and colors for frontend use
export const EventTypeLabels: Record<EventType, string> = {
  MEETING: 'Cuộc họp',
  DEADLINE: 'Deadline',
  MILESTONE: 'Milestone',
  REMINDER: 'Nhắc nhở',
};

export const EventTypeColors: Record<EventType, string> = {
  MEETING: 'bg-blue-100 text-blue-800',
  DEADLINE: 'bg-red-100 text-red-800',
  MILESTONE: 'bg-purple-100 text-purple-800',
  REMINDER: 'bg-yellow-100 text-yellow-800',
};

export const EventTypeCalendarColors: Record<EventType, string> = {
  MEETING: '#3b82f6', // blue-500
  DEADLINE: '#ef4444', // red-500
  MILESTONE: '#a855f7', // purple-500
  REMINDER: '#eab308', // yellow-500
};

export const AttendeeStatusLabels: Record<AttendeeStatus, string> = {
  pending: 'Chờ phản hồi',
  accepted: 'Tham gia',
  declined: 'Từ chối',
};

export const AttendeeStatusColors: Record<AttendeeStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
};
