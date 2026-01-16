import { NextFunction, Response } from "express";
import { IExtendedRequest } from "./type";
import { sanitizeTableSuffix, logSuspiciousQuery } from "../services/sqlSecurityService";

// Allowed subdomain pattern (alphanumeric and hyphens only)
const SAFE_SUBDOMAIN_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
const MAX_SUBDOMAIN_LENGTH = 63;
const RESERVED_SUBDOMAINS = ["www", "app", "student", "teacher", "admin", "super-admin", "api"];

/**
 * Middleware to resolve tenant (institute) from subdomain/host
 */
const tenantMiddleware = (req: IExtendedRequest, res: Response, next: NextFunction): void => {
    const host = req.headers.host;
    const baseDomain = process.env.BASE_DOMAIN || "eduflow.jeevanbhatt.com.np"; // Default for production

    if (!host) {
        next();
        return;
    }

    // Handle Localhost development (strict match)
    if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
        next();
        return;
    }

    // Robust subdomain extraction by stripping the base domain
    let subdomain = "";
    if (host.endsWith(baseDomain)) {
        subdomain = host.replace(`.${baseDomain}`, "").replace(baseDomain, "");
    }

    // Ignore if no subdomain or reserved word
    if (!subdomain || subdomain === 'www' || RESERVED_SUBDOMAINS.includes(subdomain)) {
        next();
        return;
    }

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
        const sanitizedTenant = sanitizeTableSuffix(subdomain.replace(/-/g, '_'));

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
