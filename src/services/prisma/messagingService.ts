/**
 * Messaging Service - Conversations & Messages
 * Matches Prisma schema: Conversation, ConversationParticipant, Message
 */

import prisma from "../../database/prisma";
import {
  RLSContext,
  withRLSContext,
  PaginatedResult,
  PaginationOptions,
} from "./basePrismaService";
import {
  Conversation,
  ConversationParticipant,
  Message,
  ConversationType,
  MessageType,
} from "../../generated/prisma/client";

// DTO Types
interface CreateConversationDTO {
  type?: ConversationType;
  title?: string;
  participantIds: string[];
  instituteId?: string;
}

interface SendMessageDTO {
  conversationId: string;
  content: string;
  type?: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
}

interface ConversationWithDetails extends Conversation {
  participants: (ConversationParticipant & {
    user?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      profileImage: string | null;
    };
  })[];
  messages?: Message[];
  _count?: { messages: number };
}

interface MessageWithSender extends Message {
  sender?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  };
}

// ===========================================
// CONVERSATIONS
// ===========================================

/**
 * Create a new conversation
 */
export async function createConversation(
  ctx: RLSContext,
  data: CreateConversationDTO
): Promise<Conversation> {
  return withRLSContext(ctx, async (tx) => {
    // Always include the current user as a participant
    const allParticipantIds = [
      ...new Set([ctx.userId, ...data.participantIds]),
    ];

    const conversation = await tx.conversation.create({
      data: {
        type: data.type || ConversationType.direct,
        title: data.title,
        instituteId: data.instituteId || ctx.instituteId,
        participants: {
          create: allParticipantIds.map((userId, index) => ({
            userId,
            isAdmin: index === 0, // First participant (creator) is admin
          })),
        },
      },
      include: {
        participants: {
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

    return conversation;
  });
}

/**
 * Get user's conversations with pagination
 */
export async function getUserConversations(
  ctx: RLSContext,
  options: PaginationOptions = {}
): Promise<PaginatedResult<ConversationWithDetails>> {
  return withRLSContext(ctx, async (tx) => {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const whereClause = {
      participants: {
        some: {
          userId: ctx.userId,
          leftAt: null,
        },
      },
    };

    const [conversations, total] = await Promise.all([
      tx.conversation.findMany({
        where: whereClause,
        include: {
          participants: {
            where: { leftAt: null },
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
          _count: { select: { messages: true } },
        },
        orderBy: { lastMessageAt: "desc" },
        skip,
        take: limit,
      }),
      tx.conversation.count({ where: whereClause }),
    ]);

    return {
      data: conversations,
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
 * Get a single conversation with messages
 */
export async function getConversation(
  ctx: RLSContext,
  conversationId: string,
  messageLimit = 50
): Promise<ConversationWithDetails | null> {
  return withRLSContext(ctx, async (tx) => {
    const conversation = await tx.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId: ctx.userId,
            leftAt: null,
          },
        },
      },
      include: {
        participants: {
          where: { leftAt: null },
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
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: messageLimit,
          include: {
            sender: {
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

    return conversation;
  });
}

/**
 * Get or create a direct conversation between two users
 */
export async function getOrCreateDirectConversation(
  ctx: RLSContext,
  otherUserId: string,
  instituteId?: string
): Promise<Conversation> {
  return withRLSContext(ctx, async (tx) => {
    // Check for existing direct conversation
    const existing = await tx.conversation.findFirst({
      where: {
        type: ConversationType.direct,
        AND: [
          { participants: { some: { userId: ctx.userId, leftAt: null } } },
          { participants: { some: { userId: otherUserId, leftAt: null } } },
        ],
      },
      include: {
        participants: {
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

    if (existing) return existing;

    // Create new direct conversation
    return tx.conversation.create({
      data: {
        type: ConversationType.direct,
        instituteId: instituteId || ctx.instituteId,
        participants: {
          create: [
            { userId: ctx.userId, isAdmin: true },
            { userId: otherUserId, isAdmin: false },
          ],
        },
      },
      include: {
        participants: {
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

// ===========================================
// MESSAGES
// ===========================================

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  ctx: RLSContext,
  data: SendMessageDTO
): Promise<Message> {
  return withRLSContext(ctx, async (tx) => {
    // Verify user is a participant
    const participant = await tx.conversationParticipant.findFirst({
      where: {
        conversationId: data.conversationId,
        userId: ctx.userId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new Error("Not a participant in this conversation");
    }

    const message = await tx.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: ctx.userId,
        content: data.content,
        type: data.type || MessageType.text,
        attachmentUrl: data.attachmentUrl,
        attachmentName: data.attachmentName,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    // Update conversation lastMessageAt
    await tx.conversation.update({
      where: { id: data.conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  });
}

/**
 * Get messages in a conversation with pagination
 */
export async function getMessages(
  ctx: RLSContext,
  conversationId: string,
  options: PaginationOptions & { before?: string } = {}
): Promise<PaginatedResult<MessageWithSender>> {
  return withRLSContext(ctx, async (tx) => {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = options.before ? 0 : (page - 1) * limit;

    // Verify user is a participant
    const participant = await tx.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: ctx.userId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new Error("Not a participant in this conversation");
    }

    const whereClause: any = {
      conversationId,
      deletedAt: null,
    };

    if (options.before) {
      whereClause.createdAt = { lt: new Date(options.before) };
    }

    const [messages, total] = await Promise.all([
      tx.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      tx.message.count({ where: { conversationId, deletedAt: null } }),
    ]);

    return {
      data: messages.reverse(), // Return in chronological order
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
 * Edit a message
 */
export async function editMessage(
  ctx: RLSContext,
  messageId: string,
  content: string
): Promise<Message> {
  return withRLSContext(ctx, async (tx) => {
    const message = await tx.message.findFirst({
      where: {
        id: messageId,
        senderId: ctx.userId,
        deletedAt: null,
      },
    });

    if (!message) {
      throw new Error("Message not found or not authorized");
    }

    return tx.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
    });
  });
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
  ctx: RLSContext,
  messageId: string
): Promise<Message> {
  return withRLSContext(ctx, async (tx) => {
    const message = await tx.message.findFirst({
      where: {
        id: messageId,
        senderId: ctx.userId,
        deletedAt: null,
      },
    });

    if (!message) {
      throw new Error("Message not found or not authorized");
    }

    return tx.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  });
}

// ===========================================
// PARTICIPANTS
// ===========================================

/**
 * Add participants to a group conversation
 */
export async function addParticipants(
  ctx: RLSContext,
  conversationId: string,
  userIds: string[]
): Promise<ConversationParticipant[]> {
  return withRLSContext(ctx, async (tx) => {
    // Verify user is an admin of the conversation
    const participant = await tx.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: ctx.userId,
        isAdmin: true,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new Error("Not authorized to add participants");
    }

    const participants = await Promise.all(
      userIds.map((userId) =>
        tx.conversationParticipant.create({
          data: {
            conversationId,
            userId,
          },
        })
      )
    );

    return participants;
  });
}

/**
 * Leave a conversation
 */
export async function leaveConversation(
  ctx: RLSContext,
  conversationId: string
): Promise<ConversationParticipant> {
  return withRLSContext(ctx, async (tx) => {
    const participant = await tx.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: ctx.userId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new Error("Not a participant in this conversation");
    }

    return tx.conversationParticipant.update({
      where: { id: participant.id },
      data: { leftAt: new Date() },
    });
  });
}

/**
 * Mark conversation as read
 */
export async function markAsRead(
  ctx: RLSContext,
  conversationId: string
): Promise<ConversationParticipant> {
  return withRLSContext(ctx, async (tx) => {
    const participant = await tx.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: ctx.userId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new Error("Not a participant in this conversation");
    }

    return tx.conversationParticipant.update({
      where: { id: participant.id },
      data: { lastReadAt: new Date() },
    });
  });
}

/**
 * Toggle mute for a conversation
 */
export async function toggleMute(
  ctx: RLSContext,
  conversationId: string
): Promise<ConversationParticipant> {
  return withRLSContext(ctx, async (tx) => {
    const participant = await tx.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: ctx.userId,
        leftAt: null,
      },
    });

    if (!participant) {
      throw new Error("Not a participant in this conversation");
    }

    return tx.conversationParticipant.update({
      where: { id: participant.id },
      data: { isMuted: !participant.isMuted },
    });
  });
}

/**
 * Get unread message count for a user
 */
export async function getUnreadCount(ctx: RLSContext): Promise<number> {
  return withRLSContext(ctx, async (tx) => {
    const participations = await tx.conversationParticipant.findMany({
      where: {
        userId: ctx.userId,
        leftAt: null,
      },
    });

    // Count messages newer than lastReadAt for each conversation
    let total = 0;
    for (const p of participations) {
      const unread = await tx.message.count({
        where: {
          conversationId: p.conversationId,
          createdAt: p.lastReadAt ? { gt: p.lastReadAt } : undefined,
          senderId: { not: ctx.userId },
          deletedAt: null,
        },
      });
      total += unread;
    }

    return total;
  });
}

// Export all functions as a service object
export const messagingService = {
  createConversation,
  getUserConversations,
  getConversation,
  getOrCreateDirectConversation,
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  addParticipants,
  leaveConversation,
  markAsRead,
  toggleMute,
  getUnreadCount,
};
