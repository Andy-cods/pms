'use client';

import { useState, useEffect, useMemo, startTransition } from 'react';
import { format } from 'date-fns';
import { Loader2, X, UserCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useCreateEvent, useUpdateEvent } from '@/hooks/use-events';
import { useAdminUsers } from '@/hooks/use-admin-users';
import {
  type EventType,
  type CalendarEvent,
  EventTypeLabels,
  RecurrencePatterns,
} from '@/lib/api/events';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EventFormModalProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  initialDate?: Date;
}

export function EventFormModal({
  open,
  onClose,
  event,
  initialDate,
}: EventFormModalProps) {
  const isEditing = !!event;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<EventType>('MEETING');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [showUserPicker, setShowUserPicker] = useState(false);

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const { data: usersData } = useAdminUsers({ limit: 100 });

  const allUsers = usersData?.users || [];

  const filteredUsers = useMemo(() => {
    const search = userSearch.toLowerCase().trim();
    return allUsers
      .filter((u) => !attendeeIds.includes(u.id))
      .filter(
        (u) =>
          !search ||
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search),
      );
  }, [allUsers, attendeeIds, userSearch]);

  const selectedUsers = useMemo(
    () => allUsers.filter((u) => attendeeIds.includes(u.id)),
    [allUsers, attendeeIds],
  );

  const toggleAttendee = (userId: string) => {
    setAttendeeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const removeAttendee = (userId: string) => {
    setAttendeeIds((prev) => prev.filter((id) => id !== userId));
  };

  // Initialize form with event data or defaults
  useEffect(() => {
    if (event) {
      startTransition(() => {
        setTitle(event.title);
        setDescription(event.description || '');
        setType(event.type);
        setStartDate(format(new Date(event.startTime), 'yyyy-MM-dd'));
        setStartTime(format(new Date(event.startTime), 'HH:mm'));
        if (event.endTime) {
          setEndDate(format(new Date(event.endTime), 'yyyy-MM-dd'));
          setEndTime(format(new Date(event.endTime), 'HH:mm'));
        } else {
          setEndDate('');
          setEndTime('');
        }
        setIsAllDay(event.isAllDay);
        setRecurrence(event.recurrence || '');
        setLocation(event.location || '');
        setMeetingLink(event.meetingLink || '');
        setAttendeeIds(
          event.attendees
            ?.filter((a) => a.userId)
            .map((a) => a.userId as string) || [],
        );
      });
    } else if (initialDate) {
      startTransition(() => {
        setTitle('');
        setDescription('');
        setType('MEETING');
        setStartDate(format(initialDate, 'yyyy-MM-dd'));
        setStartTime(format(initialDate, 'HH:mm'));
        setEndDate(format(initialDate, 'yyyy-MM-dd'));
        setEndTime(format(new Date(initialDate.getTime() + 60 * 60 * 1000), 'HH:mm'));
        setIsAllDay(false);
        setRecurrence('');
        setLocation('');
        setMeetingLink('');
        setAttendeeIds([]);
      });
    } else {
      // Reset to defaults
      const now = new Date();
      startTransition(() => {
        setTitle('');
        setDescription('');
        setType('MEETING');
        setStartDate(format(now, 'yyyy-MM-dd'));
        setStartTime(format(now, 'HH:mm'));
        setEndDate(format(now, 'yyyy-MM-dd'));
        setEndTime(format(new Date(now.getTime() + 60 * 60 * 1000), 'HH:mm'));
        setIsAllDay(false);
        setRecurrence('');
        setLocation('');
        setMeetingLink('');
        setAttendeeIds([]);
      });
    }
  }, [event, initialDate, open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề sự kiện');
      return;
    }

    if (!startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu');
      return;
    }

    try {
      const startDateTime = isAllDay
        ? new Date(`${startDate}T00:00:00`)
        : new Date(`${startDate}T${startTime || '00:00'}`);

      let endDateTime: Date | undefined;
      if (endDate) {
        endDateTime = isAllDay
          ? new Date(`${endDate}T23:59:59`)
          : new Date(`${endDate}T${endTime || startTime || '00:00'}`);
      }

      const eventData = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime?.toISOString(),
        isAllDay,
        recurrence: recurrence || undefined,
        location: location.trim() || undefined,
        meetingLink: meetingLink.trim() || undefined,
        attendeeIds: attendeeIds.length > 0 ? attendeeIds : undefined,
      };

      if (isEditing && event) {
        await updateEvent.mutateAsync({ id: event.id, input: eventData });
        toast.success('Đã cập nhật sự kiện');
      } else {
        await createEvent.mutateAsync(eventData);
        toast.success('Đã tạo sự kiện mới');
      }

      onClose();
    } catch {
      toast.error('Không thể lưu sự kiện. Vui lòng thử lại.');
    }
  };

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Cập nhật thông tin sự kiện'
              : 'Điền thông tin để tạo sự kiện mới'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề *</Label>
            <Input
              id="title"
              placeholder="Nhập tiêu đề sự kiện"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Loại sự kiện</Label>
            <Select value={type} onValueChange={(v) => setType(v as EventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EventTypeLabels) as EventType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {EventTypeLabels[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="allDay">Cả ngày</Label>
            <Switch
              id="allDay"
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
            />
          </div>

          {/* Date/Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Ngày bắt đầu *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            {!isAllDay && (
              <div className="space-y-2">
                <Label htmlFor="startTime">Giờ bắt đầu</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">Ngày kết thúc</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {!isAllDay && (
              <div className="space-y-2">
                <Label htmlFor="endTime">Giờ kết thúc</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label htmlFor="recurrence">Lặp lại</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger>
                <SelectValue placeholder="Không lặp lại" />
              </SelectTrigger>
              <SelectContent>
                {RecurrencePatterns.map((pattern) => (
                  <SelectItem key={pattern.value} value={pattern.value || 'none'}>
                    {pattern.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Địa điểm</Label>
            <Input
              id="location"
              placeholder="Nhập địa điểm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Meeting Link */}
          {type === 'MEETING' && (
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Link họp trực tuyến</Label>
              <Input
                id="meetingLink"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          )}

          {/* Attendees / Participants */}
          <div className="space-y-2">
            <Label>
              <Users className="inline h-4 w-4 mr-1" />
              Người tham gia
            </Label>

            {/* Selected attendees */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    <UserCircle className="h-3 w-3" />
                    {user.name}
                    <button
                      type="button"
                      onClick={() => removeAttendee(user.id)}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* User picker */}
            <Popover open={showUserPicker} onOpenChange={setShowUserPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-muted-foreground"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {selectedUsers.length > 0
                    ? `${selectedUsers.length} người được chọn - Thêm người`
                    : 'Chọn người tham gia...'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-2" align="start">
                <Input
                  placeholder="Tìm theo tên hoặc email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      Không tìm thấy người dùng
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => toggleAttendee(user.id)}
                        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent text-left"
                      >
                        <UserCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{user.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Nhập mô tả sự kiện"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? 'Cập nhật' : 'Tạo sự kiện'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
