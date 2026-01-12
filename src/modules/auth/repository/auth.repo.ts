import { BaseRepository } from "@core/repository/BaseRepository";
import { User } from "@prisma/client";
import crypto from "crypto";

export class AuthRepo extends BaseRepository<User> {
  constructor() {
    super("user");
  }

  async findByEmail(email: string): Promise<any | null> {
    return this.model.findUnique({
      where: { email },
      include: {
        ownedInstitutes: {
          select: { subdomain: true, instituteName: true, id: true }
        },
        studentProfiles: {
          include: { institute: { select: { subdomain: true, id: true } } }
        },
        teacherProfiles: {
          include: { institute: { select: { subdomain: true, id: true } } }
        }
      }
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.model.update({
      where: { id: userId },
      data: { updatedAt: new Date() },
    });
  }

  async createWithProfile(data: any): Promise<User> {
    return this.model.create({
      data,
    });
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<User | null> {
    return this.model.findFirst({
      where: { verificationToken: token },
    });
  }

  /**
   * Generate a new verification token and save it
   */
  async setVerificationToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.model.update({
      where: { id: userId },
      data: {
        verificationToken: token,
        verificationExpires: expires,
        lastVerificationSent: new Date(),
        verificationAttempts: { increment: 1 },
      },
    });

    return token;
  }

  /**
   * Verify email - set verified and clear token
   */
  async verifyEmail(userId: string): Promise<User> {
    return this.model.update({
      where: { id: userId },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
        accountStatus: "active",
      },
    });
  }

  /**
   * Check if user can request a new verification email (rate limiting)
   * Returns null if allowed, or seconds to wait if not
   */
  async canResendVerification(email: string): Promise<{ allowed: boolean; waitSeconds?: number }> {
    const user = await this.findByEmail(email);

    if (!user) {
      return { allowed: false };
    }

    if (user.emailVerified) {
      return { allowed: false };
    }

    // Rate limit: 60 seconds between resends
    if (user.lastVerificationSent) {
      const secondsSinceLastSent = Math.floor((Date.now() - user.lastVerificationSent.getTime()) / 1000);
      if (secondsSinceLastSent < 60) {
        return { allowed: false, waitSeconds: 60 - secondsSinceLastSent };
      }
    }

    // Max 5 verification attempts per day
    if (user.verificationAttempts >= 5) {
      const lastSent = user.lastVerificationSent || new Date(0);
      const hoursSinceLastSent = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastSent < 24) {
        return { allowed: false, waitSeconds: Math.floor((24 - hoursSinceLastSent) * 3600) };
      }
      // Reset attempts after 24 hours
      await this.model.update({
        where: { id: user.id },
        data: { verificationAttempts: 0 },
      });
    }

    return { allowed: true };
  }
}

export default new AuthRepo();

