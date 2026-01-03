import { PostHog } from 'posthog-node';

let posthog: PostHog | null = null;

/**
 * Initialize PostHog analytics
 * Call this once at application startup
 */
export const initPostHog = () => {
  if (process.env.POSTHOG_API_KEY) {
    posthog = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 20, // Send events in batches of 20
      flushInterval: 10000, // Or every 10 seconds
    });
    console.log('PostHog analytics initialized');
  } else {
    console.log('PostHog not configured (POSTHOG_API_KEY not set)');
  }
};

/**
 * Shutdown PostHog gracefully
 * Call this when the server is shutting down
 */
export const shutdownPostHog = async () => {
  if (posthog) {
    await posthog.shutdown();
  }
};

/**
 * Track a custom event
 */
export const trackEvent = (
  userId: string,
  event: string,
  properties?: Record<string, any>
) => {
  if (!posthog) return;

  posthog.capture({
    distinctId: userId,
    event,
    properties: {
      timestamp: new Date().toISOString(),
      ...properties,
    }
  });
};

/**
 * Identify a user with their properties
 */
export const identifyUser = (userId: string, traits: Record<string, any>) => {
  if (!posthog) return;

  posthog.identify({
    distinctId: userId,
    properties: traits
  });
};

/**
 * Track user signup
 */
export const trackSignup = (userId: string, email: string, role: string) => {
  trackEvent(userId, 'user_signup', { email, role });
  identifyUser(userId, { email, role, signupDate: new Date().toISOString() });
};

/**
 * Track user login
 */
export const trackLogin = (userId: string, email: string, method: string = 'password') => {
  trackEvent(userId, 'user_login', { email, method, lastLogin: new Date().toISOString() });
};

/**
 * Track institute creation
 */
export const trackInstituteCreated = (userId: string, instituteId: string, instituteName: string) => {
  trackEvent(userId, 'institute_created', { instituteId, instituteName });
};

/**
 * Track student enrollment
 */
export const trackStudentEnrolled = (userId: string, instituteId: string, studentId: string) => {
  trackEvent(userId, 'student_enrolled', { instituteId, studentId });
};

/**
 * Track course creation
 */
export const trackCourseCreated = (userId: string, instituteId: string, courseId: string, courseName: string) => {
  trackEvent(userId, 'course_created', { instituteId, courseId, courseName });
};

/**
 * Track Google Sheets export
 */
export const trackSheetsExport = (userId: string, instituteId: string, exportType: string, recordCount: number) => {
  trackEvent(userId, 'sheets_export', { instituteId, exportType, recordCount });
};

/**
 * Track feature usage
 */
export const trackFeatureUsed = (userId: string, feature: string, metadata?: Record<string, any>) => {
  trackEvent(userId, 'feature_used', { feature, ...metadata });
};

/**
 * Track errors (non-Sentry, for analytics purposes)
 */
export const trackError = (userId: string | undefined, errorType: string, errorMessage: string) => {
  trackEvent(userId || 'anonymous', 'error_occurred', { errorType, errorMessage });
};

export default {
  init: initPostHog,
  shutdown: shutdownPostHog,
  track: trackEvent,
  identify: identifyUser,
  trackSignup,
  trackLogin,
  trackInstituteCreated,
  trackStudentEnrolled,
  trackCourseCreated,
  trackSheetsExport,
  trackFeatureUsed,
  trackError,
};
