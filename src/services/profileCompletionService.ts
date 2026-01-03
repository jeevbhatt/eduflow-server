import Institute from '../database/models/instituteModel';
import User from '../database/models/userModel';

/**
 * Profile Completion Service
 * Calculates profile completion percentage for institutes
 */

// Field weights (must sum to 100)
const COMPLETION_WEIGHTS = {
  instituteName: 10,
  email: 5,
  emailVerified: 10,
  phone: 5,
  phoneVerified: 10,
  address: 10,
  logo: 10,
  panNo: 20,
  vatNo: 20,
};

/**
 * Calculate profile completion percentage
 */
export const calculateProfileCompletion = (institute: Institute): number => {
  let completion = 0;

  // instituteName (required, should always be present)
  if (institute.instituteName && institute.instituteName.trim()) {
    completion += COMPLETION_WEIGHTS.instituteName;
  }

  // email
  if (institute.email && institute.email.trim()) {
    completion += COMPLETION_WEIGHTS.email;
    if (institute.emailVerified) {
      completion += COMPLETION_WEIGHTS.emailVerified;
    }
  }

  // phone
  if (institute.phone && institute.phone.trim()) {
    completion += COMPLETION_WEIGHTS.phone;
    if (institute.phoneVerified) {
      completion += COMPLETION_WEIGHTS.phoneVerified;
    }
  }

  // address
  if (institute.address && institute.address.trim()) {
    completion += COMPLETION_WEIGHTS.address;
  }

  // logo
  if (institute.logo && institute.logo.trim()) {
    completion += COMPLETION_WEIGHTS.logo;
  }

  // PAN Number
  if (institute.panNo && institute.panNo.trim()) {
    completion += COMPLETION_WEIGHTS.panNo;
  }

  // VAT Number
  if (institute.vatNo && institute.vatNo.trim()) {
    completion += COMPLETION_WEIGHTS.vatNo;
  }

  return Math.min(completion, 100);
};

/**
 * Get detailed completion status
 */
export const getCompletionDetails = (institute: Institute): {
  percentage: number;
  completed: string[];
  pending: string[];
  nextStep: string | null;
} => {
  const completed: string[] = [];
  const pending: string[] = [];

  // Check each field
  if (institute.instituteName?.trim()) {
    completed.push('instituteName');
  } else {
    pending.push('instituteName');
  }

  if (institute.email?.trim()) {
    completed.push('email');
    if (institute.emailVerified) {
      completed.push('emailVerified');
    } else {
      pending.push('emailVerified');
    }
  } else {
    pending.push('email');
  }

  if (institute.phone?.trim()) {
    completed.push('phone');
    if (institute.phoneVerified) {
      completed.push('phoneVerified');
    } else {
      pending.push('phoneVerified');
    }
  } else {
    pending.push('phone');
  }

  if (institute.address?.trim()) {
    completed.push('address');
  } else {
    pending.push('address');
  }

  if (institute.logo?.trim()) {
    completed.push('logo');
  } else {
    pending.push('logo');
  }

  if (institute.panNo?.trim()) {
    completed.push('panNo');
  } else {
    pending.push('panNo');
  }

  if (institute.vatNo?.trim()) {
    completed.push('vatNo');
  } else {
    pending.push('vatNo');
  }

  // Determine next step
  let nextStep = null;
  if (pending.length > 0) {
    // Priority order
    const priority = ['emailVerified', 'phone', 'phoneVerified', 'address', 'logo', 'panNo', 'vatNo'];
    for (const step of priority) {
      if (pending.includes(step)) {
        nextStep = step;
        break;
      }
    }
  }

  return {
    percentage: calculateProfileCompletion(institute),
    completed,
    pending,
    nextStep,
  };
};

/**
 * Update profile completion in database
 */
export const updateProfileCompletion = async (instituteId: string): Promise<number> => {
  const institute = await Institute.findByPk(instituteId);
  if (!institute) return 0;

  const percentage = calculateProfileCompletion(institute);

  await Institute.update(
    { profileCompletionPercent: percentage },
    { where: { id: instituteId } }
  );

  return percentage;
};

/**
 * Get user's profile completion (for students/teachers)
 */
export const getUserProfileCompletion = (user: User): number => {
  let completion = 0;
  const weights = {
    firstName: 20,
    lastName: 20,
    email: 15,
    emailVerified: 15,
    phone: 10,
    phoneVerified: 10,
    profileImage: 10,
  };

  if (user.firstName?.trim()) completion += weights.firstName;
  if (user.lastName?.trim()) completion += weights.lastName;
  if (user.email?.trim()) completion += weights.email;
  if (user.emailVerified) completion += weights.emailVerified;
  if (user.phone?.trim()) completion += weights.phone;
  if (user.phoneVerified) completion += weights.phoneVerified;
  if (user.profileImage?.trim()) completion += weights.profileImage;

  return Math.min(completion, 100);
};

export default {
  calculateProfileCompletion,
  getCompletionDetails,
  updateProfileCompletion,
  getUserProfileCompletion,
  COMPLETION_WEIGHTS,
};
