/**
 * Prisma Migration Helper Service
 *
 * This service provides utilities for migrating from Sequelize to Prisma.
 * Use during the transition period when both ORMs are active.
 *
 * @example
 * // Convert Sequelize result to Prisma-compatible format
 * const prismaUser = migrationHelper.sequelizeToPrismaUser(sequelizeUser);
 */

import prisma from "../database/prisma";
import {
  UserRole,
  AccountStatus,
  SubscriptionTier,
  InstituteAccountStatus,
} from "../generated/prisma/enums";

// Type definitions for legacy Sequelize models
interface SequelizeUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  role: string;
  currentInstituteNumber?: string;
  mfaSecret?: string;
  mfaEnabled?: boolean;
  phone?: string;
  bio?: string;
  profileImage?: string;
  googleId?: string;
  microsoftId?: string;
  emailVerified?: boolean;
  verificationToken?: string;
  verificationExpires?: Date;
  verificationAttempts?: number;
  lastVerificationSent?: Date;
  phoneVerified?: boolean;
  phoneVerificationToken?: string;
  phoneVerificationExpires?: Date;
  accountStatus?: string;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;
  deletedBy?: string;
  deleteReason?: string;
  scheduledPermanentDelete?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

interface SequelizeInstitute {
  id: string;
  instituteName: string;
  subdomain: string;
  fullDomain?: string;
  instituteNumber: string;
  securityToken?: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  panNo?: string;
  vatNo?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  subscriptionTier?: string;
  subscriptionExpiresAt?: Date;
  trialStartedAt?: Date;
  trialRemindersSent?: number;
  lastReminderSentAt?: Date;
  profileCompletionPercent?: number;
  isActive?: boolean;
  accountStatus?: string;
  pausedAt?: Date;
  pausedBy?: string;
  pauseReason?: string;
  deletedBy?: string;
  deleteReason?: string;
  scheduledDataDeletion?: Date;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

/**
 * Maps Sequelize role string to Prisma UserRole enum
 */
function mapUserRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    admin: UserRole.admin,
    institute: UserRole.institute,
    "super-admin": UserRole.super_admin,
    student: UserRole.student,
    teacher: UserRole.teacher,
  };
  return roleMap[role] || UserRole.student;
}

/**
 * Maps Sequelize account status to Prisma AccountStatus enum
 */
function mapAccountStatus(status: string): AccountStatus {
  const statusMap: Record<string, AccountStatus> = {
    active: AccountStatus.active,
    suspended: AccountStatus.suspended,
    inactive: AccountStatus.inactive,
    pending_verification: AccountStatus.pending_verification,
  };
  return statusMap[status] || AccountStatus.pending_verification;
}

/**
 * Maps Sequelize subscription tier to Prisma SubscriptionTier enum
 */
function mapSubscriptionTier(tier: string): SubscriptionTier {
  const tierMap: Record<string, SubscriptionTier> = {
    trial: SubscriptionTier.trial,
    basic: SubscriptionTier.basic,
    pro: SubscriptionTier.pro,
    enterprise: SubscriptionTier.enterprise,
  };
  return tierMap[tier] || SubscriptionTier.trial;
}

/**
 * Maps Sequelize institute status to Prisma InstituteAccountStatus enum
 */
function mapInstituteStatus(status: string): InstituteAccountStatus {
  const statusMap: Record<string, InstituteAccountStatus> = {
    active: InstituteAccountStatus.active,
    trial: InstituteAccountStatus.trial,
    expired: InstituteAccountStatus.expired,
    suspended: InstituteAccountStatus.suspended,
    paused: InstituteAccountStatus.paused,
  };
  return statusMap[status] || InstituteAccountStatus.trial;
}

export const migrationHelper = {
  /**
   * Converts a Sequelize User to Prisma-compatible data
   */
  sequelizeToPrismaUser(sequelizeUser: SequelizeUser) {
    return {
      id: sequelizeUser.id,
      firstName: sequelizeUser.firstName,
      lastName: sequelizeUser.lastName,
      email: sequelizeUser.email,
      password: sequelizeUser.password,
      role: mapUserRole(sequelizeUser.role),
      currentInstituteNumber: sequelizeUser.currentInstituteNumber,
      mfaSecret: sequelizeUser.mfaSecret,
      mfaEnabled: sequelizeUser.mfaEnabled || false,
      phone: sequelizeUser.phone,
      bio: sequelizeUser.bio,
      profileImage: sequelizeUser.profileImage,
      googleId: sequelizeUser.googleId,
      microsoftId: sequelizeUser.microsoftId,
      emailVerified: sequelizeUser.emailVerified || false,
      verificationToken: sequelizeUser.verificationToken,
      verificationExpires: sequelizeUser.verificationExpires,
      verificationAttempts: sequelizeUser.verificationAttempts || 0,
      lastVerificationSent: sequelizeUser.lastVerificationSent,
      phoneVerified: sequelizeUser.phoneVerified || false,
      phoneVerificationToken: sequelizeUser.phoneVerificationToken,
      phoneVerificationExpires: sequelizeUser.phoneVerificationExpires,
      accountStatus: mapAccountStatus(
        sequelizeUser.accountStatus || "pending_verification"
      ),
      suspensionReason: sequelizeUser.suspensionReason,
      suspendedAt: sequelizeUser.suspendedAt,
      suspendedBy: sequelizeUser.suspendedBy,
      deletedBy: sequelizeUser.deletedBy,
      deleteReason: sequelizeUser.deleteReason,
      scheduledPermanentDelete: sequelizeUser.scheduledPermanentDelete,
      deletedAt: sequelizeUser.deletedAt,
    };
  },

  /**
   * Converts a Sequelize Institute to Prisma-compatible data
   */
  sequelizeToPrismaInstitute(sequelizeInstitute: SequelizeInstitute) {
    return {
      id: sequelizeInstitute.id,
      instituteName: sequelizeInstitute.instituteName,
      subdomain: sequelizeInstitute.subdomain,
      fullDomain: sequelizeInstitute.fullDomain,
      instituteNumber: sequelizeInstitute.instituteNumber,
      securityToken: sequelizeInstitute.securityToken,
      email: sequelizeInstitute.email,
      phone: sequelizeInstitute.phone,
      address: sequelizeInstitute.address,
      logo: sequelizeInstitute.logo,
      primaryColor: sequelizeInstitute.primaryColor,
      secondaryColor: sequelizeInstitute.secondaryColor,
      panNo: sequelizeInstitute.panNo,
      vatNo: sequelizeInstitute.vatNo,
      emailVerified: sequelizeInstitute.emailVerified || false,
      phoneVerified: sequelizeInstitute.phoneVerified || false,
      subscriptionTier: mapSubscriptionTier(
        sequelizeInstitute.subscriptionTier || "trial"
      ),
      subscriptionExpiresAt: sequelizeInstitute.subscriptionExpiresAt,
      trialStartedAt: sequelizeInstitute.trialStartedAt,
      trialRemindersSent: sequelizeInstitute.trialRemindersSent || 0,
      lastReminderSentAt: sequelizeInstitute.lastReminderSentAt,
      profileCompletionPercent:
        sequelizeInstitute.profileCompletionPercent || 0,
      isActive: sequelizeInstitute.isActive ?? true,
      accountStatus: mapInstituteStatus(
        sequelizeInstitute.accountStatus || "trial"
      ),
      pausedAt: sequelizeInstitute.pausedAt,
      pausedBy: sequelizeInstitute.pausedBy,
      pauseReason: sequelizeInstitute.pauseReason,
      deletedBy: sequelizeInstitute.deletedBy,
      deleteReason: sequelizeInstitute.deleteReason,
      scheduledDataDeletion: sequelizeInstitute.scheduledDataDeletion,
      ownerId: sequelizeInstitute.ownerId,
      deletedAt: sequelizeInstitute.deletedAt,
    };
  },

  /**
   * Migrate all users from Sequelize to Prisma
   * Run this once during the migration process
   */
  async migrateUsers(
    sequelizeUsers: SequelizeUser[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const user of sequelizeUsers) {
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          create: this.sequelizeToPrismaUser(user),
          update: this.sequelizeToPrismaUser(user),
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(`User ${user.email}: ${(error as Error).message}`);
      }
    }

    return { success, failed, errors };
  },

  /**
   * Migrate all institutes from Sequelize to Prisma
   * Run this once during the migration process
   */
  async migrateInstitutes(
    sequelizeInstitutes: SequelizeInstitute[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const institute of sequelizeInstitutes) {
      try {
        await prisma.institute.upsert({
          where: { id: institute.id },
          create: this.sequelizeToPrismaInstitute(institute),
          update: this.sequelizeToPrismaInstitute(institute),
        });
        success++;
      } catch (error) {
        failed++;
        errors.push(
          `Institute ${institute.instituteName}: ${(error as Error).message}`
        );
      }
    }

    return { success, failed, errors };
  },

  /**
   * Health check for Prisma connection
   */
  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { connected: true };
    } catch (error) {
      return { connected: false, error: (error as Error).message };
    }
  },

  /**
   * Get database statistics
   */
  async getDatabaseStats() {
    const [users, institutes, sessions, securityLogs] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.institute.count({ where: { deletedAt: null } }),
      prisma.session.count({ where: { isActive: true } }),
      prisma.securityLog.count(),
    ]);

    return {
      users,
      institutes,
      activeSessions: sessions,
      securityLogs,
    };
  },
};

export default migrationHelper;
