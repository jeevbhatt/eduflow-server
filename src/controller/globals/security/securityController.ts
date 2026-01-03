import { Response } from "express";
import sequelize from "../../../database/connection";
import { QueryTypes } from "sequelize";
import { IExtendedRequest } from "../../../middleware/type";

export class SecurityController {
    /**
     * Fetch audit logs for the current institute
     */
    public static getAuditLogs = async (req: IExtendedRequest, res: Response) => {
        const instituteNumber = req.user?.currentInstituteNumber;

        try {
            const logs = await sequelize.query(
                `SELECT l.*, u.email as userEmail
                 FROM security_logs_${instituteNumber} l
                 LEFT JOIN users u ON l.userId = u.id
                 ORDER BY l.timestamp DESC
                 LIMIT 100`,
                {
                    type: QueryTypes.SELECT
                }
            );

            res.status(200).json({
                success: true,
                data: logs
            });
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error while fetching logs"
            });
        }
    };

    /**
     * Clear audit logs (Optional - for super-admins or high-level admins)
     */
    public static clearAuditLogs = async (req: IExtendedRequest, res: Response) => {
        const instituteNumber = req.user?.currentInstituteNumber;

        try {
            await sequelize.query(`DROP TABLE IF EXISTS security_logs_${instituteNumber}`, {
                type: QueryTypes.DELETE
            });

            // Re-create the table (empty)
            await sequelize.query(`CREATE TABLE security_logs_${instituteNumber}(
                id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
                userId VARCHAR(36),
                action VARCHAR(255) NOT NULL,
                details TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);

            res.status(200).json({
                success: true,
                message: "Audit logs cleared successfully"
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to clear logs"
            });
        }
    };
}
