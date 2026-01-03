/**
 * Schedule Service
 * Matches Prisma schema: ScheduleEvent, ScheduleEventAttendee
 */

import prisma from "../../database/prisma";
import {
  RLSContext,
  withRLSContext,
  PaginatedResult,
  PaginationOptions,
} from "./basePrismaService";
import {
  ScheduleEvent,
  ScheduleEventAttendee,
  ScheduleEventType,
  ScheduleAttendeeStatus,
} from "../../generated/prisma/client";

// DTO Types
interface CreateEventDTO {
  instituteId: string;
  title: string;
  description?: string;
  type: ScheduleEventType;
  startTime: Date;
  endTime: Date;
  isAllDay?: boolean;
  location?: string;
  color?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  courseId?: string;
  teacherId?: string;
  attendeeIds?: string[];
}

interface UpdateEventDTO {
  title?: string;
  description?: string;
  type?: ScheduleEventType;
  startTime?: Date;
  endTime?: Date;
  isAllDay?: boolean;
  location?: string;
  color?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  courseId?: string;
  teacherId?: string;
}

interface EventFilters {
  instituteId?: string;
  type?: ScheduleEventType;
  startDate?: Date;
  endDate?: Date;
  courseId?: string;
  teacherId?: string;
}

interface EventWithAttendees extends ScheduleEvent {
  attendees?: (ScheduleEventAttendee & {
    user?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      profileImage: string | null;
    };
  })[];
}

// ===========================================
// EVENT CRUD
// ===========================================

/**
 * Create a schedule event
 */
export async function createEvent(
  ctx: RLSContext,
  data: CreateEventDTO
): Promise<ScheduleEvent> {
  return withRLSContext(ctx, async (tx) => {
    const event = await tx.scheduleEvent.create({
      data: {
        instituteId: data.instituteId,
        title: data.title,
        description: data.description,
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        isAllDay: data.isAllDay || false,
        location: data.location,
        color: data.color,
        isRecurring: data.isRecurring || false,
        recurrenceRule: data.recurrenceRule,
        courseId: data.courseId,
        teacherId: data.teacherId,
        createdBy: ctx.userId,
        ...(data.attendeeIds && data.attendeeIds.length > 0
          ? {
              attendees: {
                create: data.attendeeIds.map((userId) => ({
                  userId,
                })),
              },
            }
          : {}),
      },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });

    return event;
  });
}

/**
 * Get event by ID
 */
export async function getEvent(
  ctx: RLSContext,
  eventId: string
): Promise<EventWithAttendees | null> {
  return withRLSContext(ctx, async (tx) => {
    return tx.scheduleEvent.findUnique({
      where: { id: eventId },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  });
}

/**
 * Update event
 */
export async function updateEvent(
  ctx: RLSContext,
  eventId: string,
  data: UpdateEventDTO
): Promise<ScheduleEvent> {
  return withRLSContext(ctx, async (tx) => {
    return tx.scheduleEvent.update({
      where: { id: eventId },
      data,
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
    });
  });
}

/**
 * Delete event
 */
export async function deleteEvent(
  ctx: RLSContext,
  eventId: string
): Promise<ScheduleEvent> {
  return withRLSContext(ctx, async (tx) => {
    // Delete attendees first due to cascade
    await tx.scheduleEventAttendee.deleteMany({
      where: { eventId },
    });

    return tx.scheduleEvent.delete({
      where: { id: eventId },
    });
  });
}

// ===========================================
// QUERIES
// ===========================================

/**
 * Get events with filters
 */
export async function getEvents(
  ctx: RLSContext,
  filters: EventFilters = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<EventWithAttendees>> {
  return withRLSContext(ctx, async (tx) => {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (filters.instituteId) whereClause.instituteId = filters.instituteId;
    if (filters.type) whereClause.type = filters.type;
    if (filters.courseId) whereClause.courseId = filters.courseId;
    if (filters.teacherId) whereClause.teacherId = filters.teacherId;

    if (filters.startDate || filters.endDate) {
      whereClause.OR = [
        {
          startTime: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {}),
          },
        },
        {
          endTime: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {}),
          },
        },
      ];
    }

    const [events, total] = await Promise.all([
      tx.scheduleEvent.findMany({
        where: whereClause,
        include: {
          attendees: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: { startTime: "asc" },
        skip,
        take: limit,
      }),
      tx.scheduleEvent.count({ where: whereClause }),
    ]);

    return {
      data: events,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  });
}

/**
 * Get events for a date range (calendar view)
 */
export async function getEventsForDateRange(
  ctx: RLSContext,
  instituteId: string,
  startDate: Date,
  endDate: Date
): Promise<EventWithAttendees[]> {
  return withRLSContext(ctx, async (tx) => {
    return tx.scheduleEvent.findMany({
      where: {
        instituteId,
        OR: [
          { startTime: { gte: startDate, lte: endDate } },
          { endTime: { gte: startDate, lte: endDate } },
          {
            AND: [
              { startTime: { lte: startDate } },
              { endTime: { gte: endDate } },
            ],
          },
        ],
      },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
  });
}

/**
 * Get user's events (as attendee)
 */
export async function getUserEvents(
  ctx: RLSContext,
  startDate?: Date,
  endDate?: Date
): Promise<EventWithAttendees[]> {
  return withRLSContext(ctx, async (tx) => {
    const whereClause: any = {
      attendees: {
        some: {
          userId: ctx.userId,
        },
      },
    };

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = startDate;
      if (endDate) whereClause.startTime.lte = endDate;
    }

    return tx.scheduleEvent.findMany({
      where: whereClause,
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
  });
}

/**
 * Get upcoming events for user
 */
export async function getUpcomingUserEvents(
  ctx: RLSContext,
  limit = 10
): Promise<EventWithAttendees[]> {
  return withRLSContext(ctx, async (tx) => {
    return tx.scheduleEvent.findMany({
      where: {
        attendees: {
          some: {
            userId: ctx.userId,
          },
        },
        startTime: { gte: new Date() },
      },
      include: {
        attendees: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
      take: limit,
    });
  });
}

// ===========================================
// ATTENDEES
// ===========================================

/**
 * Add attendees to an event
 */
export async function addAttendees(
  ctx: RLSContext,
  eventId: string,
  userIds: string[]
): Promise<ScheduleEventAttendee[]> {
  return withRLSContext(ctx, async (tx) => {
    const attendees = await Promise.all(
      userIds.map((userId) =>
        tx.scheduleEventAttendee.create({
          data: {
            eventId,
            userId,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        })
      )
    );

    return attendees;
  });
}

/**
 * Remove attendee from event
 */
export async function removeAttendee(
  ctx: RLSContext,
  eventId: string,
  userId: string
): Promise<void> {
  return withRLSContext(ctx, async (tx) => {
    await tx.scheduleEventAttendee.deleteMany({
      where: {
        eventId,
        userId,
      },
    });
  });
}

/**
 * Update attendee status (RSVP)
 */
export async function updateAttendeeStatus(
  ctx: RLSContext,
  eventId: string,
  status: ScheduleAttendeeStatus
): Promise<ScheduleEventAttendee> {
  return withRLSContext(ctx, async (tx) => {
    const attendee = await tx.scheduleEventAttendee.findFirst({
      where: {
        eventId,
        userId: ctx.userId,
      },
    });

    if (!attendee) {
      throw new Error("Not an attendee of this event");
    }

    return tx.scheduleEventAttendee.update({
      where: { id: attendee.id },
      data: { status },
    });
  });
}

/**
 * Get event attendees
 */
export async function getEventAttendees(
  ctx: RLSContext,
  eventId: string
): Promise<ScheduleEventAttendee[]> {
  return withRLSContext(ctx, async (tx) => {
    return tx.scheduleEventAttendee.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });
  });
}

// ===========================================
// COURSE SCHEDULE
// ===========================================

/**
 * Get schedule for a course
 */
export async function getCourseSchedule(
  ctx: RLSContext,
  courseId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ScheduleEvent[]> {
  return withRLSContext(ctx, async (tx) => {
    const whereClause: any = { courseId };

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = startDate;
      if (endDate) whereClause.startTime.lte = endDate;
    }

    return tx.scheduleEvent.findMany({
      where: whereClause,
      orderBy: { startTime: "asc" },
    });
  });
}

/**
 * Get schedule for a teacher
 */
export async function getTeacherSchedule(
  ctx: RLSContext,
  teacherId: string,
  startDate?: Date,
  endDate?: Date
): Promise<ScheduleEvent[]> {
  return withRLSContext(ctx, async (tx) => {
    const whereClause: any = { teacherId };

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = startDate;
      if (endDate) whereClause.startTime.lte = endDate;
    }

    return tx.scheduleEvent.findMany({
      where: whereClause,
      orderBy: { startTime: "asc" },
    });
  });
}

// Export all functions as a service object
export const scheduleService = {
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getEventsForDateRange,
  getUserEvents,
  getUpcomingUserEvents,
  addAttendees,
  removeAttendee,
  updateAttendeeStatus,
  getEventAttendees,
  getCourseSchedule,
  getTeacherSchedule,
};
