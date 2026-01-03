import * as cron from 'node-cron';
import trialService from './trialService';
import softDeleteService from './softDeleteService';

/**
 * Scheduler Service - CRON jobs for automated tasks
 * Runs daily maintenance tasks for trial management and cleanup
 */

let isInitialized = false;

// Store job references (use ReturnType to get correct type)
type ScheduledTask = ReturnType<typeof cron.schedule>;
let trialReminderJob: ScheduledTask | null = null;
let trialExpirationJob: ScheduledTask | null = null;
let cleanupJob: ScheduledTask | null = null;

/**
 * Initialize all scheduled jobs
 */
export const initScheduler = (): void => {
  if (isInitialized) {
    console.log('[Scheduler] Already initialized');
    return;
  }

  // Only start scheduler in production or if enabled
  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
    console.log('[Scheduler] Starting scheduled jobs...');

    // Daily trial reminder job - Runs at 9:00 AM
    trialReminderJob = cron.schedule('0 9 * * *', async () => {
      console.log('[Scheduler] Running trial reminder job...');

      try {
        const institutes = await trialService.getInstitutesNeedingReminder();
        console.log(`[Scheduler] Found ${institutes.length} institutes needing reminders`);

        for (const institute of institutes) {
          try {
            await trialService.sendTrialReminder(institute);
            console.log(`[Scheduler] Sent reminder to ${institute.instituteName}`);
          } catch (error) {
            console.error(`[Scheduler] Failed to send reminder to ${institute.instituteName}:`, error);
          }
        }
      } catch (error) {
        console.error('[Scheduler] Trial reminder job failed:', error);
      }
    });

    // Trial expiration job - Runs at midnight
    trialExpirationJob = cron.schedule('0 0 * * *', async () => {
      console.log('[Scheduler] Running trial expiration job...');

      try {
        const expiredInstitutes = await trialService.getExpiredTrialInstitutes();
        console.log(`[Scheduler] Found ${expiredInstitutes.length} expired trial institutes`);

        for (const institute of expiredInstitutes) {
          try {
            await trialService.handleTrialExpiration(institute);
            console.log(`[Scheduler] Handled expiration for ${institute.instituteName}`);
          } catch (error) {
            console.error(`[Scheduler] Failed to handle expiration for ${institute.instituteName}:`, error);
          }
        }
      } catch (error) {
        console.error('[Scheduler] Trial expiration job failed:', error);
      }
    });

    // Cleanup job - Runs at 3:00 AM
    cleanupJob = cron.schedule('0 3 * * *', async () => {
      console.log('[Scheduler] Running cleanup job...');

      try {
        const result = await softDeleteService.cleanupExpiredAccounts();
        console.log(`[Scheduler] Cleanup complete: ${result.users} users, ${result.institutes} institutes deleted`);
      } catch (error) {
        console.error('[Scheduler] Cleanup job failed:', error);
      }
    });

    isInitialized = true;
    console.log('[Scheduler] All jobs started successfully');
  } else {
    console.log('[Scheduler] Skipped in development (set ENABLE_SCHEDULER=true to enable)');
  }
};

/**
 * Stop all scheduled jobs
 */
export const stopScheduler = (): void => {
  if (trialReminderJob) trialReminderJob.stop();
  if (trialExpirationJob) trialExpirationJob.stop();
  if (cleanupJob) cleanupJob.stop();
  isInitialized = false;
  console.log('[Scheduler] All jobs stopped');
};

/**
 * Manually trigger jobs (for testing/admin)
 */
export const runManualJob = async (jobName: 'reminder' | 'expiration' | 'cleanup'): Promise<void> => {
  switch (jobName) {
    case 'reminder':
      console.log('[Scheduler] Manually triggering trial reminder job...');
      const reminderInstitutes = await trialService.getInstitutesNeedingReminder();
      for (const inst of reminderInstitutes) {
        await trialService.sendTrialReminder(inst);
      }
      break;
    case 'expiration':
      console.log('[Scheduler] Manually triggering expiration job...');
      const expiredInstitutes = await trialService.getExpiredTrialInstitutes();
      for (const inst of expiredInstitutes) {
        await trialService.handleTrialExpiration(inst);
      }
      break;
    case 'cleanup':
      console.log('[Scheduler] Manually triggering cleanup job...');
      await softDeleteService.cleanupExpiredAccounts();
      break;
  }
};

export default {
  initScheduler,
  stopScheduler,
  runManualJob,
};
