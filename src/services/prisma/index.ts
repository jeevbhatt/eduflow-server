/**
 * Prisma Services Index
 *
 * Central export point for all Prisma-based services
 * All services use RLS context for multi-tenant security
 *
 * @module services/prisma
 */

// Base service and types
export {
  BasePrismaService,
  RLSContext,
  withRLSContext,
  PaginatedResult,
  PaginationOptions,
} from "./basePrismaService";

// Messaging
export { messagingService } from "./messagingService";

// Notifications
export { notificationService } from "./notificationService";

// Schedule
export { scheduleService } from "./scheduleService";

// Assignments
export {
  assignmentService,
  assignmentSubmissionService,
} from "./assignmentService";

// Forum
export {
  forumCategoryService,
  forumTopicService,
  forumPostService,
} from "./forumService";

// Study Groups
export { studyGroupService } from "./studyGroupService";

// Support
export {
  supportTicketService,
  supportTicketMessageService,
} from "./supportService";

// Progress & Achievements
export {
  studentProgressService,
  achievementService,
  learningStreakService,
} from "./progressService";

// Payments
export { paymentService } from "./paymentService";

// Library
export {
  libraryCategoryService,
  libraryResourceService,
  libraryBorrowService,
  libraryFavoriteService,
} from "./libraryService";

// Feature Flags & Experiments
export { featureFlagService, experimentService } from "./experimentService";
