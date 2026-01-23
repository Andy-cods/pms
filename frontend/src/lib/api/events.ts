import { api } from './index';

// Enums
export type EventType = 'MEETING' | 'DEADLINE' | 'MILESTONE' | 'REMINDER';
export type AttendeeStatus = 'pending' | 'accepted' | 'declined';

// Types
export interface EventAttendee {
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

export interface CalendarEvent {
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
  attendees: EventAttendee[];
  createdAt: string;
  updatedAt: string;
  // For recurring event occurrences
  isRecurringOccurrence?: boolean;
  occurrenceDate?: string;
}

export interface EventListResponse {
  events: CalendarEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EventListParams {
  start: string;
  end: string;
  type?: EventType;
  projectId?: string;
  page?: number;
  limit?: number;
}

export interface AttendeeEmailInput {
  email: string;
  name?: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  type: EventType;
  startTime: string;
  endTime?: string;
  isAllDay?: boolean;
  recurrence?: string;
  location?: string;
  meetingLink?: string;
  projectId?: string;
  taskId?: string;
  attendeeIds?: string[];
  attendeeEmails?: AttendeeEmailInput[];
  reminderBefore?: number;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  type?: EventType;
  startTime?: string;
  endTime?: string;
  isAllDay?: boolean;
  recurrence?: string;
  location?: string;
  meetingLink?: string;
  projectId?: string;
  attendeeIds?: string[];
  attendeeEmails?: AttendeeEmailInput[];
  reminderBefore?: number;
  updateScope?: 'this' | 'all';
}

export interface RespondToEventInput {
  status: 'accepted' | 'declined';
}

// Labels and colors
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

// Recurrence patterns for UI
export const RecurrencePatterns = [
  { label: 'Không lặp lại', value: '' },
  { label: 'Hàng ngày', value: 'FREQ=DAILY' },
  { label: 'Hàng tuần', value: 'FREQ=WEEKLY' },
  { label: 'Các ngày trong tuần', value: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' },
  { label: 'Hàng tháng', value: 'FREQ=MONTHLY' },
  { label: 'Hàng năm', value: 'FREQ=YEARLY' },
];

// API functions
export const eventsApi = {
  // List events in date range
  list: async (params: EventListParams): Promise<EventListResponse> => {
    const searchParams = new URLSearchParams({
      start: params.start,
      end: params.end,
    });
    if (params.type) searchParams.set('type', params.type);
    if (params.projectId) searchParams.set('projectId', params.projectId);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());

    const response = await api.get(`/events?${searchParams}`);
    return response.data;
  },

  // Get task deadlines as events
  getDeadlines: async (params: EventListParams): Promise<CalendarEvent[]> => {
    const searchParams = new URLSearchParams({
      start: params.start,
      end: params.end,
    });
    if (params.projectId) searchParams.set('projectId', params.projectId);

    const response = await api.get(`/events/deadlines?${searchParams}`);
    return response.data;
  },

  // Get single event
  get: async (id: string): Promise<CalendarEvent> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  // Create event
  create: async (input: CreateEventInput): Promise<CalendarEvent> => {
    const response = await api.post('/events', input);
    return response.data;
  },

  // Update event
  update: async (id: string, input: UpdateEventInput): Promise<CalendarEvent> => {
    const response = await api.patch(`/events/${id}`, input);
    return response.data;
  },

  // Delete event
  delete: async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  // Respond to event invitation
  respond: async (id: string, input: RespondToEventInput): Promise<CalendarEvent> => {
    const response = await api.post(`/events/${id}/respond`, input);
    return response.data;
  },
};

// Helper to convert CalendarEvent to react-big-calendar format
export interface BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: CalendarEvent;
}

export function toCalendarEvent(event: CalendarEvent): BigCalendarEvent {
  return {
    id: event.id,
    title: event.title,
    start: new Date(event.startTime),
    end: event.endTime ? new Date(event.endTime) : new Date(event.startTime),
    allDay: event.isAllDay,
    resource: event,
  };
}

export function toCalendarEvents(events: CalendarEvent[]): BigCalendarEvent[] {
  return events.map(toCalendarEvent);
}
