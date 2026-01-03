import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

/**
 * Generates a secure random password for a teacher, hashes it, and returns both versions.
 * Uses cryptographically secure random bytes and includes the teacher's name for uniqueness.
 */
const generateRandomPassword = (teacherName: string) => {
    // Generate a secure random 5-digit number
    const randomNumber = randomBytes(3).readUIntBE(0, 3) % 90000 + 10000;
    // Combine with teacher name for the plain password
    const plainVersion = `${randomNumber}_${teacherName}`;
    // Hash the password with bcrypt
    const hashedVersion = bcrypt.hashSync(plainVersion, 10);

    return {
        hashedVersion, // Store in DB
        plainVersion   // Send to teacher via email
    };
};

export default generateRandomPassword;
