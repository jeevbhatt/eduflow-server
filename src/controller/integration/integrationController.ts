import { Response, NextFunction } from "express";
import sequelize from "../../database/connection";
import { IExtendedRequest } from "../../middleware/type";
import { QueryTypes } from "sequelize";

/**
 * Per-Institute Integration Credentials
 * Each institute stores their own OAuth tokens for Google Sheets, Microsoft, etc.
 */

interface IntegrationCredential {
    id: string;
    provider: 'google' | 'microsoft';
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    email: string;
    scope: string;
}

// Create integration credentials table for an institute
const createIntegrationTable = async (req: IExtendedRequest, res: Response, next: NextFunction) => {
    const instituteNumber = req.user?.currentInstituteNumber;

    await sequelize.query(`CREATE TABLE IF NOT EXISTS integration_credentials_${instituteNumber}(
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        provider ENUM('google', 'microsoft') NOT NULL,
        accessToken TEXT NOT NULL,
        refreshToken TEXT,
        expiresAt DATETIME,
        email VARCHAR(255),
        scope TEXT,
        sheetId VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

    next();
};

// Save OAuth credentials for an institute
const saveCredentials = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const { provider, accessToken, refreshToken, expiresAt, email, scope, sheetId } = req.body;

    if (!instituteNumber) {
        return res.status(400).json({ message: "Institute number is required" });
    }

    if (!provider || !accessToken) {
        return res.status(400).json({ message: "Provider and access token are required" });
    }

    try {
        // Check if credentials already exist for this provider
        const existing: any = await sequelize.query(
            `SELECT id FROM integration_credentials_${instituteNumber} WHERE provider = ?`,
            { replacements: [provider], type: QueryTypes.SELECT }
        );

        if (existing.length > 0) {
            // Update existing
            await sequelize.query(
                `UPDATE integration_credentials_${instituteNumber}
                 SET accessToken = ?, refreshToken = ?, expiresAt = ?, email = ?, scope = ?, sheetId = ?
                 WHERE provider = ?`,
                { replacements: [accessToken, refreshToken || null, expiresAt || null, email || null, scope || null, sheetId || null, provider] }
            );
        } else {
            // Insert new
            await sequelize.query(
                `INSERT INTO integration_credentials_${instituteNumber}
                 (provider, accessToken, refreshToken, expiresAt, email, scope, sheetId)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                { replacements: [provider, accessToken, refreshToken || null, expiresAt || null, email || null, scope || null, sheetId || null] }
            );
        }

        res.status(200).json({ message: `${provider} credentials saved successfully` });
    } catch (error: any) {
        res.status(500).json({ message: "Error saving credentials", error: error.message });
    }
};

// Get credentials for an institute (without exposing tokens fully)
const getCredentials = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const { provider } = req.params;

    if (!instituteNumber) {
        return res.status(400).json({ message: "Institute number is required" });
    }

    try {
        const credentials: any = await sequelize.query(
            `SELECT id, provider, email, scope, sheetId, expiresAt, createdAt
             FROM integration_credentials_${instituteNumber} WHERE provider = ?`,
            { replacements: [provider], type: QueryTypes.SELECT }
        );

        if (credentials.length === 0) {
            return res.status(404).json({ message: `No ${provider} credentials found. Please connect your account.` });
        }

        res.status(200).json({
            message: "Credentials retrieved",
            data: {
                ...credentials[0],
                connected: true,
                hasRefreshToken: !!credentials[0].refreshToken
            }
        });
    } catch (error: any) {
        // Table might not exist
        if (error.message.includes("doesn't exist")) {
            return res.status(200).json({
                message: "Not connected",
                data: { connected: false }
            });
        }
        res.status(500).json({ message: "Error retrieving credentials", error: error.message });
    }
};

// Get full credentials (internal use for API calls)
const getFullCredentials = async (instituteNumber: string, provider: string): Promise<IntegrationCredential | null> => {
    try {
        const credentials: any = await sequelize.query(
            `SELECT * FROM integration_credentials_${instituteNumber} WHERE provider = ?`,
            { replacements: [provider], type: QueryTypes.SELECT }
        );

        if (credentials.length === 0) return null;
        return credentials[0];
    } catch {
        return null;
    }
};

// Delete credentials
const deleteCredentials = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const { provider } = req.params;

    if (!instituteNumber) {
        return res.status(400).json({ message: "Institute number is required" });
    }

    try {
        await sequelize.query(
            `DELETE FROM integration_credentials_${instituteNumber} WHERE provider = ?`,
            { replacements: [provider], type: QueryTypes.DELETE }
        );

        res.status(200).json({ message: `${provider} credentials disconnected` });
    } catch (error: any) {
        res.status(500).json({ message: "Error deleting credentials", error: error.message });
    }
};

export {
    createIntegrationTable,
    saveCredentials,
    getCredentials,
    getFullCredentials,
    deleteCredentials
};
