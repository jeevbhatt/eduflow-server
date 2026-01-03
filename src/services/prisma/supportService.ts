/**
 * Support Ticket Service
 *
 * Handles support tickets and communication
 * Supports ticket creation, assignment, and resolution
 *
 * @module services/prisma/supportService
 */

import prisma from "../../database/prisma";
import {
  BasePrismaService,
  RLSContext,
  withRLSContext,
  PaginatedResult,
  PaginationOptions,
} from "./basePrismaService";
import {
  SupportTicket,
  SupportTicketMessage,
  TicketPriority,
  TicketStatus,
  Prisma,
} from "../../generated/prisma/client";

// ============================================
// SUPPORT TICKET SERVICE
// ============================================

class SupportTicketService extends BasePrismaService<
  SupportTicket,
  Prisma.SupportTicketCreateInput,
  Prisma.SupportTicketUpdateInput,
  Prisma.SupportTicketWhereInput,
  Prisma.SupportTicketOrderByWithRelationInput
> {
  protected modelName = "SupportTicket";

  protected getDelegate() {
    return prisma.supportTicket;
  }

  /**
   * Generate unique ticket number
   */
  private async generateTicketNumber(): Promise<string> {
    const count = await prisma.supportTicket.count();
    return `TKT-${String(count + 1).padStart(5, "0")}`;
  }

  /**
   * Get user's tickets
   */
  async getUserTickets(
    context: RLSContext,
    userId: string,
    options: PaginationOptions & {
      status?: TicketStatus;
    }
  ): Promise<PaginatedResult<SupportTicket>> {
    const where: Prisma.SupportTicketWhereInput = {
      userId,
    };

    if (options.status) {
      where.status = options.status;
    }

    return this.findMany(context, {
      ...options,
      where,
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    } as any);
  }

  /**
   * Get all tickets (admin view)
   */
  async getAllTickets(
    context: RLSContext,
    options: PaginationOptions & {
      status?: TicketStatus;
      priority?: TicketPriority;
      assignedTo?: string;
      unassigned?: boolean;
    }
  ): Promise<PaginatedResult<SupportTicket>> {
    const where: Prisma.SupportTicketWhereInput = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.priority) {
      where.priority = options.priority;
    }

    if (options.assignedTo) {
      where.assignedTo = options.assignedTo;
    }

    if (options.unassigned) {
      where.assignedTo = null;
    }

    return this.findMany(context, {
      ...options,
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    } as any);
  }

  /**
   * Create a support ticket
   */
  async createTicket(
    context: RLSContext,
    data: {
      userId: string;
      instituteId?: string;
      subject: string;
      description: string;
      category: string;
      priority?: TicketPriority;
    }
  ): Promise<SupportTicket> {
    const ticketNumber = await this.generateTicketNumber();

    return withRLSContext(context, async () => {
      return prisma.supportTicket.create({
        data: {
          ticketNumber,
          userId: data.userId,
          instituteId: data.instituteId,
          subject: data.subject,
          description: data.description,
          category: data.category,
          priority: data.priority || TicketPriority.medium,
          status: TicketStatus.open,
          // Create initial message with description
          messages: {
            create: {
              senderId: data.userId,
              content: data.description,
              isInternal: false,
            },
          },
        },
        include: {
          messages: true,
        },
      });
    });
  }

  /**
   * Get ticket details with messages
   */
  async getTicketDetails(
    context: RLSContext,
    ticketId: string,
    includeInternal: boolean = false
  ): Promise<SupportTicket | null> {
    return withRLSContext(context, async () => {
      return prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          messages: {
            where: includeInternal ? {} : { isInternal: false },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });
  }

  /**
   * Assign ticket to staff member
   */
  async assignTicket(
    context: RLSContext,
    ticketId: string,
    assigneeId: string
  ): Promise<SupportTicket> {
    return withRLSContext(context, async () => {
      return prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          assignedTo: assigneeId,
          status: TicketStatus.in_progress,
        },
      });
    });
  }

  /**
   * Update ticket status
   */
  async updateStatus(
    context: RLSContext,
    ticketId: string,
    status: TicketStatus
  ): Promise<SupportTicket> {
    const data: Prisma.SupportTicketUpdateInput = { status };

    if (status === TicketStatus.resolved || status === TicketStatus.closed) {
      data.resolvedAt = new Date();
    }

    return this.update(context, ticketId, data);
  }

  /**
   * Get ticket statistics (admin)
   */
  async getStatistics(context: RLSContext): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    averageResolutionTime: number | null;
    byPriority: Record<string, number>;
  }> {
    return withRLSContext(context, async () => {
      const [total, open, inProgress, resolved, byPriority] = await Promise.all(
        [
          prisma.supportTicket.count(),
          prisma.supportTicket.count({ where: { status: TicketStatus.open } }),
          prisma.supportTicket.count({
            where: { status: TicketStatus.in_progress },
          }),
          prisma.supportTicket.count({
            where: {
              status: { in: [TicketStatus.resolved, TicketStatus.closed] },
            },
          }),
          prisma.supportTicket.groupBy({
            by: ["priority"],
            _count: true,
          }),
        ]
      );

      // Calculate average resolution time
      const resolvedTickets = await prisma.supportTicket.findMany({
        where: { resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
        take: 100,
        orderBy: { resolvedAt: "desc" },
      });

      let averageResolutionTime: number | null = null;
      if (resolvedTickets.length > 0) {
        const totalTime = resolvedTickets.reduce((sum, ticket) => {
          const time =
            ticket.resolvedAt!.getTime() - ticket.createdAt.getTime();
          return sum + time;
        }, 0);
        averageResolutionTime =
          totalTime / resolvedTickets.length / (1000 * 60 * 60); // hours
      }

      return {
        total,
        open,
        inProgress,
        resolved,
        averageResolutionTime,
        byPriority: byPriority.reduce(
          (acc, item) => ({ ...acc, [item.priority]: item._count }),
          {}
        ),
      };
    });
  }
}

// ============================================
// TICKET MESSAGE SERVICE
// ============================================

class SupportTicketMessageService extends BasePrismaService<
  SupportTicketMessage,
  Prisma.SupportTicketMessageCreateInput,
  Prisma.SupportTicketMessageUpdateInput,
  Prisma.SupportTicketMessageWhereInput,
  Prisma.SupportTicketMessageOrderByWithRelationInput
> {
  protected modelName = "SupportTicketMessage";

  protected getDelegate() {
    return prisma.supportTicketMessage;
  }

  /**
   * Add a message to a ticket
   */
  async addMessage(
    context: RLSContext,
    data: {
      ticketId: string;
      senderId: string;
      content: string;
      isInternal?: boolean;
      attachments?: string[];
    }
  ): Promise<SupportTicketMessage> {
    return withRLSContext(context, async () => {
      const message = await prisma.supportTicketMessage.create({
        data: {
          ticketId: data.ticketId,
          senderId: data.senderId,
          content: data.content,
          isInternal: data.isInternal || false,
          attachments: data.attachments || [],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      // Update ticket's updatedAt
      await prisma.supportTicket.update({
        where: { id: data.ticketId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  }
}

// Export singleton instances
export const supportTicketService = new SupportTicketService();
export const supportTicketMessageService = new SupportTicketMessageService();
