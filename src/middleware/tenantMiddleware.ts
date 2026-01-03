import { NextFunction, Response } from "express";
import { IExtendedRequest } from "./type";
import { sanitizeTableSuffix, logSuspiciousQuery } from "../services/sqlSecurityService";

// Allowed subdomain pattern (alphanumeric and hyphens only)
const SAFE_SUBDOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const MAX_SUBDOMAIN_LENGTH = 63; // DNS label limit

/**
 * Middleware to resolve tenant (institute) from subdomain/host
 * Example: school-a.localhost -> school-a
 *
 * SECURITY: Validates subdomain format to prevent injection attacks
 */
const tenantMiddleware = (req: IExtendedRequest, res: Response, next: NextFunction): void => {
    const host = req.headers.host; // e.g., "nepal.localhost:4000"

    if (!host) {
        next();
        return;
    }

    // Split by '.' to get subdomains
    // localhost format: subdomain.localhost:port
    const parts = host.split('.');

    // Default cases (localhost without subdomain)
    if (parts.length < 2 || parts[0] === 'localhost' || parts[0] === 'www') {
        next();
        return;
    }

    const subdomain = parts[0]; // e.g., "nepal"

    // SECURITY: Validate subdomain format
    if (subdomain.length > MAX_SUBDOMAIN_LENGTH) {
        logSuspiciousQuery(undefined, 'INVALID_SUBDOMAIN', `Subdomain too long: ${subdomain.length} chars`);
        res.status(400).json({
            message: 'Invalid tenant identifier',
            code: 'INVALID_TENANT'
        });
        return;
    }

    if (!SAFE_SUBDOMAIN_REGEX.test(subdomain)) {
        logSuspiciousQuery(undefined, 'INVALID_SUBDOMAIN', `Unsafe characters in subdomain: ${subdomain}`);
        res.status(400).json({
            message: 'Invalid tenant identifier',
            code: 'INVALID_TENANT'
        });
        return;
    }

    try {
        // Sanitize for use as table suffix
        const sanitizedTenant = sanitizeTableSuffix(subdomain.replace(/-/g, '_'));

        // Attach sanitized tenant to request
        (req as any).tenant = {
            subdomain,
            sanitizedId: sanitizedTenant
        };

        next();
    } catch (error: any) {
        logSuspiciousQuery(undefined, 'SUBDOMAIN_SANITIZATION_FAILED', error.message);
        res.status(400).json({
            message: 'Invalid tenant identifier',
            code: 'INVALID_TENANT'
        });
    }
};

export { tenantMiddleware };

