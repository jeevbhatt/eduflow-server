import Institute from '../database/models/instituteModel';
import User from '../database/models/userModel';
import sendMail from './sendMail';
import { Op } from 'sequelize';

/**
 * Trial Service - Manages 14-day trial, reminders, and expiration
 */

const TRIAL_DAYS = 14;
const REMINDER_START_DAY = 5; // Start reminders when 5 days left

/**
 * Set up trial for new institute
 */
export const initializeTrial = async (instituteId: string): Promise<void> => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  await Institute.update({
    subscriptionTier: 'trial',
    trialStartedAt: now,
    subscriptionExpiresAt: expiresAt,
    accountStatus: 'trial',
    isActive: true,
    trialRemindersSent: 0,
  }, { where: { id: instituteId } });
};

/**
 * Get days remaining in trial
 */
export const getTrialDaysRemaining = (expiresAt: Date): number => {
  const now = new Date();
  const diffTime = expiresAt.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get institutes that need trial reminders (last 5 days)
 */
export const getInstitutesNeedingReminder = async (): Promise<Institute[]> => {
  const now = new Date();
  const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  return Institute.findAll({
    where: {
      subscriptionTier: 'trial',
      isActive: true,
      accountStatus: 'trial',
      subscriptionExpiresAt: {
        [Op.between]: [now, fiveDaysFromNow],
      },
      // Only send once per day
      [Op.or]: [
        { lastReminderSentAt: null },
        { lastReminderSentAt: { [Op.lt]: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      ],
    },
  });
};

/**
 * Send trial reminder email
 */
export const sendTrialReminder = async (institute: Institute): Promise<void> => {
  const daysRemaining = getTrialDaysRemaining(institute.subscriptionExpiresAt);

  // Get owner email
  const owner = await User.findByPk(institute.ownerId);
  if (!owner) return;

  const urgencyLevel = daysRemaining <= 2 ? 'critical' : 'warning';
  const urgencyColor = daysRemaining <= 2 ? '#dc2626' : '#f59e0b';

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">⏰ Your Trial Expires in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}!</h2>
      </div>
      <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>Hi ${owner.firstName},</p>
        <p>Your trial for <strong>${institute.instituteName}</strong> is ending soon.</p>

        <div style="background: white; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 12px 0; color: #1f2937;">What happens when your trial ends?</h3>
          <ul style="color: #6b7280; padding-left: 20px;">
            <li>Your account will be set to inactive</li>
            <li>Students and teachers won't be able to access the platform</li>
            <li>Your data will be preserved for 30 days</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard/settings/billing"
             style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Upgrade Now
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px;">
          Questions? Reply to this email or visit our <a href="${process.env.FRONTEND_URL}/support">support center</a>.
        </p>
      </div>
    </div>
  `;

  await sendMail({
    to: owner.email,
    subject: `⏰ ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Left in Your EduFlow Trial`,
    html: emailContent,
  });

  // Update reminder tracking
  await Institute.update({
    trialRemindersSent: institute.trialRemindersSent + 1,
    lastReminderSentAt: new Date(),
  }, { where: { id: institute.id } });
};

/**
 * Get expired trial institutes
 */
export const getExpiredTrialInstitutes = async (): Promise<Institute[]> => {
  const now = new Date();

  return Institute.findAll({
    where: {
      subscriptionTier: 'trial',
      isActive: true,
      subscriptionExpiresAt: { [Op.lt]: now },
    },
  });
};

/**
 * Handle trial expiration
 */
export const handleTrialExpiration = async (institute: Institute): Promise<void> => {
  const owner = await User.findByPk(institute.ownerId);

  // Deactivate institute
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await Institute.update({
    isActive: false,
    accountStatus: 'expired',
    scheduledDataDeletion: thirtyDaysFromNow,
  }, { where: { id: institute.id } });

  // Send expiration email
  if (owner) {
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">Trial Expired</h2>
        </div>
        <div style="background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px;">
          <p>Hi ${owner.firstName},</p>
          <p>Your trial for <strong>${institute.instituteName}</strong> has expired.</p>

          <div style="background: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
            <h3 style="margin: 0 0 12px 0; color: #991b1b;">⚠️ Important</h3>
            <p style="color: #991b1b; margin: 0;">
              Your data will be permanently deleted in 30 days unless you upgrade your account.
            </p>
          </div>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard/settings/billing"
               style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Upgrade to Keep Your Data
            </a>
          </div>
        </div>
      </div>
    `;

    await sendMail({
      to: owner.email,
      subject: '⚠️ Your EduFlow Trial Has Expired',
      html: emailContent,
    });
  }
};

/**
 * Extend trial (super-admin action)
 */
export const extendTrial = async (instituteId: string, days: number, adminId: string): Promise<boolean> => {
  const institute = await Institute.findByPk(instituteId);
  if (!institute) return false;

  const currentExpiry = institute.subscriptionExpiresAt || new Date();
  const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
  const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

  await Institute.update({
    subscriptionExpiresAt: newExpiry,
    isActive: true,
    accountStatus: 'trial',
    scheduledDataDeletion: null,
  }, { where: { id: instituteId } });

  return true;
};

/**
 * Upgrade subscription
 */
export const upgradeSubscription = async (
  instituteId: string,
  tier: 'basic' | 'pro' | 'enterprise',
  durationMonths: number = 12
): Promise<boolean> => {
  const institute = await Institute.findByPk(instituteId);
  if (!institute) return false;

  const expiresAt = new Date(Date.now() + durationMonths * 30 * 24 * 60 * 60 * 1000);

  await Institute.update({
    subscriptionTier: tier,
    subscriptionExpiresAt: expiresAt,
    isActive: true,
    accountStatus: 'active',
    scheduledDataDeletion: null,
  }, { where: { id: instituteId } });

  return true;
};

export default {
  initializeTrial,
  getTrialDaysRemaining,
  getInstitutesNeedingReminder,
  sendTrialReminder,
  getExpiredTrialInstitutes,
  handleTrialExpiration,
  extendTrial,
  upgradeSubscription,
  TRIAL_DAYS,
  REMINDER_START_DAY,
};
