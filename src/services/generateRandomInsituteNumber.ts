import { randomUUID } from 'crypto';

/**
 * Generates a UUID-based institute identifier.
 * Removes hyphens to make it SQL table-name safe.
 *
 * Example output: "a1b2c3d4e5f67890a1b2c3d4e5f67890" (32 chars)
 */
const generateRandomInsituteNumber = (): string => {
    // Generate UUID and remove hyphens for SQL compatibility
    const uuid = randomUUID().replace(/-/g, '');
    return uuid;
};

export default generateRandomInsituteNumber;
