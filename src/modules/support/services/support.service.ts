import supportRepo from "../repository/support.repo";
import { TicketPriority, TicketStatus } from "@generated/prisma";

export class SupportService {
  async getMyTickets(userId: string, filters: any) {
    return supportRepo.findByUser(userId, filters);
  }

  async getTicketDetails(ticketId: string, isAdmin = false) {
    return supportRepo.findTicketDetails(ticketId, isAdmin);
  }

  async createTicket(data: { userId: string; instituteId?: string; subject: string; description: string; category: string; priority?: TicketPriority }) {
    const ticket = await supportRepo.createTicket(data);
    // Create initial message
    await supportRepo.addMessage({
      ticketId: ticket.id,
      senderId: data.userId,
      content: data.description,
      isInternal: false,
    });
    return ticket;
  }

  async addMessage(data: { ticketId: string; senderId: string; content: string; isInternal?: boolean; attachments?: string[] }) {
    const message = await supportRepo.addMessage(data);
    // Update ticket updatedAt
    await supportRepo.update(data.ticketId, { updatedAt: new Date() });
    return message;
  }

  async updateTicketStatus(ticketId: string, status: TicketStatus) {
    const data: any = { status };
    if (status === TicketStatus.resolved || status === TicketStatus.closed) {
      data.resolvedAt = new Date();
    }
    return supportRepo.update(ticketId, data);
  }
}

export default new SupportService();
