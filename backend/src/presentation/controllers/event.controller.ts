import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard.js';
import { PrismaService } from '../../infrastructure/persistence/prisma.service.js';
import { RRuleService } from '../../modules/calendar/rrule.service.js';
import {
  CreateEventDto,
  UpdateEventDto,
  EventListQueryDto,
  RespondToEventDto,
  type EventResponseDto,
  type EventListResponseDto,
} from '../../application/dto/event/event.dto.js';
import { UserRole, TaskStatus, EventType } from '@prisma/client';

@ApiTags('Calendar')
@ApiBearerAuth('JWT-auth')
@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventController {
  constructor(
    private prisma: PrismaService,
    private rruleService: RRuleService,
  ) {}

  @ApiOperation({ summary: 'List events with date range and filters' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated events including recurring occurrences',
  })
  @Get()
  async listEvents(
    @Query() query: EventListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<EventListResponseDto> {
    const { start, end, type, projectId, page = 1, limit = 50 } = query;

    const rangeStart = new Date(start);
    const rangeEnd = new Date(end);

    const where: Record<string, unknown> = {};

    // Date range filter - includes events that start OR end within range, OR span the range
    where.OR = [
      {
        startTime: { gte: rangeStart, lte: rangeEnd },
      },
      {
        endTime: { gte: rangeStart, lte: rangeEnd },
      },
      {
        AND: [
          { startTime: { lte: rangeStart } },
          { endTime: { gte: rangeEnd } },
        ],
      },
      {
        recurrence: { not: null },
        startTime: { lte: rangeEnd },
      },
    ];

    if (type) where.type = type;
    if (projectId) where.projectId = projectId;

    // User can see:
    // - Events they created
    // - Events they're attending
    // - Events from projects they're part of (if admin/PM)
    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;

    if (!isAdmin) {
      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        {
          OR: [
            { createdById: req.user.sub },
            { attendees: { some: { userId: req.user.sub } } },
            {
              project: {
                team: { some: { userId: req.user.sub } },
              },
            },
          ],
        },
      ];
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    }

    const [events] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: {
          project: { select: { id: true, dealCode: true, name: true } },
          createdBy: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          attendees: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    // Expand recurring events
    const expandedEvents: EventResponseDto[] = [];

    for (const event of events) {
      if (event.recurrence) {
        // Expand recurrence
        const occurrences = this.rruleService.expandRecurrence(
          event.recurrence,
          event.startTime,
          rangeStart,
          rangeEnd,
        );

        for (const occurrence of occurrences) {
          const duration = event.endTime
            ? event.endTime.getTime() - event.startTime.getTime()
            : 0;
          const occurrenceEnd =
            duration > 0 ? new Date(occurrence.getTime() + duration) : null;

          expandedEvents.push({
            ...this.mapToResponse(event),
            startTime: occurrence.toISOString(),
            endTime: occurrenceEnd?.toISOString() ?? null,
            isRecurringOccurrence: true,
            occurrenceDate: occurrence.toISOString(),
          });
        }
      } else {
        expandedEvents.push(this.mapToResponse(event));
      }
    }

    // Sort by start time and apply pagination
    expandedEvents.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const startIndex = (page - 1) * limit;
    const paginatedEvents = expandedEvents.slice(
      startIndex,
      startIndex + limit,
    );

    return {
      events: paginatedEvents,
      total: expandedEvents.length,
      page,
      limit,
      totalPages: Math.ceil(expandedEvents.length / limit),
    };
  }

  @ApiOperation({ summary: 'Get task deadlines as calendar events' })
  @ApiResponse({
    status: 200,
    description: 'Returns task deadlines in event format',
  })
  @Get('deadlines')
  async getDeadlines(
    @Query() query: EventListQueryDto,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<EventResponseDto[]> {
    const { start, end, projectId } = query;

    const rangeStart = new Date(start);
    const rangeEnd = new Date(end);

    const where: Record<string, unknown> = {
      deadline: {
        gte: rangeStart,
        lte: rangeEnd,
      },
      status: { not: TaskStatus.DONE },
    };

    if (projectId) where.projectId = projectId;

    // Access control
    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;
    if (!isAdmin) {
      where.OR = [
        { assignees: { some: { userId: req.user.sub } } },
        { createdById: req.user.sub },
        {
          project: {
            team: { some: { userId: req.user.sub } },
          },
        },
      ];
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    // Convert tasks to event format
    return tasks.map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      description: task.description,
      type: EventType.DEADLINE,
      startTime: task.deadline!.toISOString(),
      endTime: null,
      isAllDay: true,
      recurrence: null,
      location: null,
      meetingLink: null,
      projectId: task.projectId,
      taskId: task.id,
      reminderBefore: null,
      project: task.project,
      createdBy: task.createdBy,
      attendees: task.assignees.map((assignee, index) => ({
        id: `task-attendee-${task.id}-${index}`,
        userId: assignee.user.id,
        email: assignee.user.email,
        name: assignee.user.name,
        status: 'accepted' as const,
        user: assignee.user,
      })),
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));
  }

  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Returns event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @Get(':id')
  async getEvent(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    await this.checkEventAccess(event, req.user);

    return this.mapToResponse(event);
  }

  @ApiOperation({ summary: 'Create a new calendar event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid event data' })
  @Post()
  async createEvent(
    @Body() dto: CreateEventDto,
    @Req() req: { user: { sub: string } },
  ): Promise<EventResponseDto> {
    // Validate recurrence if provided
    if (dto.recurrence && !this.rruleService.isValidRRule(dto.recurrence)) {
      throw new BadRequestException('Invalid recurrence format');
    }

    // Validate end time is after start time
    if (dto.endTime && new Date(dto.endTime) <= new Date(dto.startTime)) {
      throw new BadRequestException('End time must be after start time');
    }

    // Check project access if projectId provided
    if (dto.projectId) {
      await this.checkProjectAccess(dto.projectId, req.user.sub);
    }

    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        startTime: new Date(dto.startTime),
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        isAllDay: dto.isAllDay ?? false,
        recurrence: dto.recurrence,
        location: dto.location,
        meetingLink: dto.meetingLink,
        projectId: dto.projectId,
        taskId: dto.taskId,
        reminderBefore: dto.reminderBefore,
        createdById: req.user.sub,
        attendees: {
          create: [
            // Add registered user attendees
            ...(dto.attendeeIds?.map((userId) => ({
              userId,
              status: 'pending',
            })) ?? []),
            // Add external email attendees
            ...(dto.attendeeEmails?.map((attendee) => ({
              email: attendee.email,
              name: attendee.name,
              status: 'pending',
            })) ?? []),
          ],
        },
      },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    return this.mapToResponse(event);
  }

  @ApiOperation({ summary: 'Update an existing event' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  @ApiResponse({ status: 403, description: 'Only creator can update' })
  @Patch(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Req() req: { user: { sub: string } },
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only creator can update
    if (event.createdById !== req.user.sub) {
      throw new ForbiddenException(
        'Only the event creator can update this event',
      );
    }

    // Validate recurrence if provided
    if (dto.recurrence && !this.rruleService.isValidRRule(dto.recurrence)) {
      throw new BadRequestException('Invalid recurrence format');
    }

    // Validate end time
    const startTime = dto.startTime ? new Date(dto.startTime) : event.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : event.endTime;
    if (endTime && endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // Update attendees if provided
    if (dto.attendeeIds || dto.attendeeEmails) {
      await this.prisma.eventAttendee.deleteMany({ where: { eventId: id } });
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        isAllDay: dto.isAllDay,
        recurrence: dto.recurrence,
        location: dto.location,
        meetingLink: dto.meetingLink,
        projectId: dto.projectId,
        reminderBefore: dto.reminderBefore,
        attendees:
          dto.attendeeIds || dto.attendeeEmails
            ? {
                create: [
                  ...(dto.attendeeIds?.map((userId) => ({
                    userId,
                    status: 'pending',
                  })) ?? []),
                  ...(dto.attendeeEmails?.map((attendee) => ({
                    email: attendee.email,
                    name: attendee.name,
                    status: 'pending',
                  })) ?? []),
                ],
              }
            : undefined,
      },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    return this.mapToResponse(updated);
  }

  @ApiOperation({ summary: 'Delete an event' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  @ApiResponse({ status: 403, description: 'Only creator or admin can delete' })
  @Delete(':id')
  async deleteEvent(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; role: string } },
  ): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Only creator or admin can delete
    const isAdmin =
      req.user.role === UserRole.SUPER_ADMIN ||
      req.user.role === UserRole.ADMIN;
    if (event.createdById !== req.user.sub && !isAdmin) {
      throw new ForbiddenException(
        'Only the event creator or admin can delete this event',
      );
    }

    await this.prisma.event.delete({ where: { id } });
  }

  @ApiOperation({ summary: 'Respond to an event invitation (accept/decline)' })
  @ApiResponse({ status: 200, description: 'Response recorded' })
  @ApiResponse({ status: 403, description: 'Not an attendee' })
  @Post(':id/respond')
  async respondToEvent(
    @Param('id') id: string,
    @Body() dto: RespondToEventDto,
    @Req() req: { user: { sub: string } },
  ): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        attendees: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Find the attendee record for this user
    const attendee = event.attendees.find((a) => a.userId === req.user.sub);
    if (!attendee) {
      throw new ForbiddenException('You are not an attendee of this event');
    }

    await this.prisma.eventAttendee.update({
      where: { id: attendee.id },
      data: { status: dto.status },
    });

    const updated = await this.prisma.event.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, dealCode: true, name: true } },
        createdBy: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        attendees: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    return this.mapToResponse(updated!);
  }

  // Helper methods
  private async checkEventAccess(
    event: {
      createdById: string;
      projectId: string | null;
      attendees: Array<{ userId: string | null }>;
    },
    user: { sub: string; role: string },
  ): Promise<void> {
    const isAdmin =
      user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN;
    if (isAdmin) return;

    const isCreator = event.createdById === user.sub;
    const isAttendee = event.attendees.some((a) => a.userId === user.sub);

    if (isCreator || isAttendee) return;

    // Check project team membership
    if (event.projectId) {
      const membership = await this.prisma.projectTeam.findFirst({
        where: {
          projectId: event.projectId,
          userId: user.sub,
        },
      });
      if (membership) return;
    }

    throw new ForbiddenException('You do not have access to this event');
  }

  private async checkProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { team: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isMember = project.team.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  private mapToResponse(event: {
    id: string;
    title: string;
    description: string | null;
    type: EventType;
    startTime: Date;
    endTime: Date | null;
    isAllDay: boolean;
    recurrence: string | null;
    location: string | null;
    meetingLink: string | null;
    projectId: string | null;
    taskId: string | null;
    reminderBefore: number | null;
    project?: { id: string; dealCode: string; name: string } | null;
    createdBy: {
      id: string;
      name: string;
      email: string;
      avatar: string | null;
    };
    attendees: Array<{
      id: string;
      userId: string | null;
      email: string | null;
      name: string | null;
      status: string;
      user?: {
        id: string;
        name: string;
        email: string;
        avatar: string | null;
      } | null;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): EventResponseDto {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime?.toISOString() ?? null,
      isAllDay: event.isAllDay,
      recurrence: event.recurrence,
      location: event.location,
      meetingLink: event.meetingLink,
      projectId: event.projectId,
      taskId: event.taskId,
      reminderBefore: event.reminderBefore,
      project: event.project ?? null,
      createdBy: event.createdBy,
      attendees: event.attendees.map((a) => ({
        id: a.id,
        userId: a.userId,
        email: a.email,
        name: a.name,
        status: a.status as 'pending' | 'accepted' | 'declined',
        user: a.user ?? null,
      })),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }
}
