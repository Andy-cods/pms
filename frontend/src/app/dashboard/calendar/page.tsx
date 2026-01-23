'use client';

import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useEvents, useDeadlines } from '@/hooks/use-events';
import {
  type CalendarEvent,
  type EventType,
  EventTypeLabels,
  EventTypeCalendarColors,
  toCalendarEvents,
  type BigCalendarEvent,
} from '@/lib/api/events';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EventFormModal } from '@/components/calendar/event-form-modal';
import { EventDetailModal } from '@/components/calendar/event-detail-modal';

// Date-fns localizer for react-big-calendar
const locales = { 'vi': vi };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Vietnamese messages for calendar
const messages = {
  today: 'Hôm nay',
  previous: 'Trước',
  next: 'Tiếp',
  month: 'Tháng',
  week: 'Tuần',
  day: 'Ngày',
  agenda: 'Lịch biểu',
  date: 'Ngày',
  time: 'Giờ',
  event: 'Sự kiện',
  noEventsInRange: 'Không có sự kiện trong khoảng thời gian này.',
  showMore: (total: number) => `+${total} sự kiện khác`,
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  // Calculate date range for query
  const dateRange = useMemo(() => {
    const start = subDays(startOfMonth(currentDate), 7);
    const end = addDays(endOfMonth(currentDate), 7);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [currentDate]);

  // Fetch events
  const { data: eventsData, isLoading: eventsLoading } = useEvents({
    ...dateRange,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    limit: 200,
  });

  // Fetch task deadlines
  const { data: deadlines, isLoading: deadlinesLoading } = useDeadlines(dateRange);

  // Combine events and deadlines
  const calendarEvents = useMemo(() => {
    const events = eventsData?.events || [];
    const allEvents = [...events, ...(deadlines || [])];
    return toCalendarEvents(allEvents);
  }, [eventsData, deadlines]);

  // Event style getter
  const eventStyleGetter = useCallback((event: BigCalendarEvent) => {
    const color = EventTypeCalendarColors[event.resource.type];
    return {
      style: {
        backgroundColor: color,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: BigCalendarEvent) => {
    setSelectedEvent(event.resource);
    setShowEventDetail(true);
  }, []);

  // Handle slot selection (create new event)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
    setShowEventForm(true);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  // Handle view change
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
  }, []);

  const isLoading = eventsLoading || deadlinesLoading;

  // Upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const weekFromNow = addDays(now, 7);
    return calendarEvents
      .filter((e) => e.start >= now && e.start <= weekFromNow)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 5);
  }, [calendarEvents]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Calendar */}
        <div className="flex-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center gap-4">
                <CardTitle className="text-2xl font-bold">Lịch</CardTitle>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as EventType | 'all')}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Lọc theo loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="MEETING">{EventTypeLabels.MEETING}</SelectItem>
                    <SelectItem value="DEADLINE">{EventTypeLabels.DEADLINE}</SelectItem>
                    <SelectItem value="MILESTONE">{EventTypeLabels.MILESTONE}</SelectItem>
                    <SelectItem value="REMINDER">{EventTypeLabels.REMINDER}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => {
                setSelectedSlot(null);
                setShowEventForm(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo sự kiện
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[600px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-[600px]">
                  <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    view={view}
                    onView={handleViewChange}
                    date={currentDate}
                    onNavigate={handleNavigate}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    popup
                    messages={messages}
                    eventPropGetter={eventStyleGetter}
                    views={['month', 'week', 'day', 'agenda']}
                    components={{
                      toolbar: (props) => (
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => props.onNavigate('PREV')}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => props.onNavigate('TODAY')}
                            >
                              Hôm nay
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => props.onNavigate('NEXT')}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <span className="text-lg font-semibold ml-4">
                              {format(props.date, 'MMMM yyyy', { locale: vi })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant={view === 'month' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => props.onView('month')}
                            >
                              <CalendarIcon className="h-4 w-4 mr-1" />
                              Tháng
                            </Button>
                            <Button
                              variant={view === 'week' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => props.onView('week')}
                            >
                              Tuần
                            </Button>
                            <Button
                              variant={view === 'day' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => props.onView('day')}
                            >
                              Ngày
                            </Button>
                            <Button
                              variant={view === 'agenda' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => props.onView('agenda')}
                            >
                              <List className="h-4 w-4 mr-1" />
                              Lịch biểu
                            </Button>
                          </div>
                        </div>
                      ),
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Upcoming Events */}
        <div className="w-full lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sự kiện sắp tới</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Không có sự kiện nào trong 7 ngày tới
                </p>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedEvent(event.resource);
                        setShowEventDetail(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {event.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {format(event.start, 'EEEE, dd/MM', { locale: vi })}
                            {!event.allDay && (
                              <> - {format(event.start, 'HH:mm')}</>
                            )}
                          </p>
                        </div>
                        <Badge
                          style={{ backgroundColor: EventTypeCalendarColors[event.resource.type] }}
                          className="text-white text-xs"
                        >
                          {EventTypeLabels[event.resource.type]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Chú thích</h4>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(EventTypeLabels) as EventType[]).map((type) => (
                    <div key={type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: EventTypeCalendarColors[type] }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {EventTypeLabels[type]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Form Modal */}
      <EventFormModal
        open={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setSelectedSlot(null);
        }}
        initialDate={selectedSlot?.start}
      />

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          eventId={selectedEvent.id}
          open={showEventDetail}
          onClose={() => {
            setShowEventDetail(false);
            setSelectedEvent(null);
          }}
        />
      )}
    </div>
  );
}
