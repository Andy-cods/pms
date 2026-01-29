'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MapPin,
  Link as LinkIcon,
  Users,
  Edit,
  Trash2,
  Loader2,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { useEvent, useDeleteEvent, useRespondToEvent } from '@/hooks/use-events';
import { useAuth } from '@/hooks/use-auth';
import {
  EventTypeLabels,
  EventTypeCalendarColors,
  AttendeeStatusLabels,
  AttendeeStatusColors,
  type AttendeeStatus,
} from '@/lib/api/events';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EventFormModal } from './event-form-modal';

interface EventDetailModalProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
}

export function EventDetailModal({
  eventId,
  open,
  onClose,
}: EventDetailModalProps) {
  const { user } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const { data: event, isLoading } = useEvent(eventId, { enabled: open });
  const deleteEvent = useDeleteEvent();
  const respondToEvent = useRespondToEvent();

  const isCreator = event?.createdBy.id === user?.id;
  const isTaskDeadline = eventId.startsWith('task-');

  // Find current user's attendance status
  const userAttendance = event?.attendees.find((a) => a.userId === user?.id);

  const handleDelete = async () => {
    try {
      await deleteEvent.mutateAsync(eventId);
      toast.success('Đã xóa sự kiện');
      onClose();
    } catch {
      toast.error('Không thể xóa sự kiện');
    }
  };

  const handleRespond = async (status: 'accepted' | 'declined') => {
    try {
      await respondToEvent.mutateAsync({ id: eventId, input: { status } });
      toast.success(status === 'accepted' ? 'Đã xác nhận tham gia' : 'Đã từ chối lời mời');
    } catch {
      toast.error('Không thể phản hồi lời mời');
    }
  };

  const formatDateTime = (startTime: string, endTime: string | null, isAllDay: boolean) => {
    const start = new Date(startTime);

    if (isAllDay) {
      if (endTime) {
        const end = new Date(endTime);
        if (start.toDateString() === end.toDateString()) {
          return format(start, 'EEEE, dd MMMM yyyy', { locale: vi });
        }
        return `${format(start, 'dd/MM')} - ${format(end, 'dd/MM/yyyy', { locale: vi })}`;
      }
      return format(start, 'EEEE, dd MMMM yyyy', { locale: vi });
    }

    if (endTime) {
      const end = new Date(endTime);
      if (start.toDateString() === end.toDateString()) {
        return `${format(start, 'EEEE, dd MMMM yyyy', { locale: vi })}, ${format(start, 'HH:mm')} - ${format(end, 'HH:mm')}`;
      }
      return `${format(start, 'dd/MM HH:mm')} - ${format(end, 'dd/MM/yyyy HH:mm', { locale: vi })}`;
    }

    return `${format(start, 'EEEE, dd MMMM yyyy', { locale: vi })}, ${format(start, 'HH:mm')}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-lg">
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : event ? (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-xl">{event.title}</DialogTitle>
                    {event.project && (
                      <p className="text-sm text-muted-foreground">
                        {event.project.dealCode} - {event.project.name}
                      </p>
                    )}
                  </div>
                  <Badge
                    style={{ backgroundColor: EventTypeCalendarColors[event.type] }}
                    className="text-white"
                  >
                    {EventTypeLabels[event.type]}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Date/Time */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {formatDateTime(event.startTime, event.endTime, event.isAllDay)}
                    </p>
                    {event.recurrence && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <RefreshCw className="h-3 w-3" />
                        Sự kiện lặp lại
                      </p>
                    )}
                  </div>
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <p>{event.location}</p>
                  </div>
                )}

                {/* Meeting Link */}
                {event.meetingLink && (
                  <div className="flex items-start gap-3">
                    <LinkIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <a
                      href={event.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Tham gia cuộc họp
                    </a>
                  </div>
                )}

                {/* Description */}
                {event.description && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Mô tả</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>
                  </>
                )}

                {/* Attendees */}
                {event.attendees.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Người tham gia ({event.attendees.length})
                      </h4>
                      <div className="space-y-2">
                        {event.attendees.map((attendee) => (
                          <div
                            key={attendee.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {(attendee.user?.name || attendee.name || attendee.email || '?')
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {attendee.user?.name || attendee.name || attendee.email}
                                </p>
                                {attendee.user?.email && (
                                  <p className="text-xs text-muted-foreground">
                                    {attendee.user.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge
                              className={AttendeeStatusColors[attendee.status as AttendeeStatus]}
                            >
                              {AttendeeStatusLabels[attendee.status as AttendeeStatus]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* RSVP Actions for attendees */}
                {userAttendance && !isCreator && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Phản hồi lời mời</h4>
                      <div className="flex gap-2">
                        <Button
                          variant={userAttendance.status === 'accepted' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleRespond('accepted')}
                          disabled={respondToEvent.isPending}
                        >
                          {respondToEvent.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          Tham gia
                        </Button>
                        <Button
                          variant={userAttendance.status === 'declined' ? 'destructive' : 'outline'}
                          size="sm"
                          onClick={() => handleRespond('declined')}
                          disabled={respondToEvent.isPending}
                        >
                          {respondToEvent.isPending ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-1" />
                          )}
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Creator Info */}
                <Separator />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Tạo bởi {event.createdBy.name}
                  </span>
                  <span>
                    {format(new Date(event.createdAt), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>

                {/* Actions for creator */}
                {isCreator && !isTaskDeadline && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowEditForm(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xóa
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy sự kiện
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sự kiện</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa sự kiện này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEvent.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Form */}
      {event && (
        <EventFormModal
          open={showEditForm}
          onClose={() => setShowEditForm(false)}
          event={event}
        />
      )}
    </>
  );
}
