import { BaseRepository } from "@core/repository/BaseRepository";
import { SupportTicket, SupportTicketMessage, TicketPriority, TicketStatus } from "@generated/prisma";
import prisma from "../../../core/database/prisma";

export class SupportRepo extends BaseRepository<SupportTicket> {
  constructor() {
    super("supportTicket");
  }

  async findByUser(userId: string, filters: any) {
    const { page = 1, limit = 20, status } = filters;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;

    return this.model.findMany({
      where,
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    });
  }

  async findTicketDetails(ticketId: string, includeInternal = false) {
    return this.model.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { firstName: true, email: true } },
        assignee: { select: { firstName: true } },
        messages: {
          where: includeInternal ? {} : { isInternal: false },
          include: { sender: { select: { firstName: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async createTicket(data: any) {
    return this.model.create({
      data: {
        ...data,
        ticketNumber: `TKT-${Date.now()}`, // Simple generator
        status: TicketStatus.open,
      },
    });
  }

  async addMessage(data: any) {
    return (prisma as any).supportTicketMessage.create({
      data,
    });
  }
}

export default new SupportRepo();
