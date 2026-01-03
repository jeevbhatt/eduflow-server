import { Response, NextFunction } from "express";
import { IExtendedRequest } from "./type";
import sequelize from "../database/connection";
import { QueryTypes } from "sequelize";

// Middleware to log sensitive academic actions
export const academicAuditLog = async (req: IExtendedRequest, res: Response, next: NextFunction) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const userId = req.user?.id;
    const { method, originalUrl, body } = req;

    // We only log write operations to academic tables
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        // Intercept completion to log success/failure?
        // For now, we log the attempt. In a full system, we'd log the result too.

        try {
            await sequelize.query(
                `INSERT INTO security_logs_${instituteNumber} (userId, action, details, timestamp)
                 VALUES (?, ?, ?, NOW())`,
                {
                    replacements: [
                        userId,
                        `${method} ${originalUrl}`,
                        JSON.stringify(body).slice(0, 1000) // Truncate large payloads
                    ],
                    type: QueryTypes.INSERT
                }
            );
        } catch (err) {
            console.error("Audit log failed:", err);
            // Don't block the actual request if logging fails, but alert in logs
        }
    }

    next();
};
