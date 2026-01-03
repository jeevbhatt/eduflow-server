import { Request, Response } from "express";
import sequelize from "../../database/connection";
import { IExtendedRequest } from "../../middleware/type";
import { QueryTypes } from "sequelize";
import { getFullCredentials } from "./integrationController";

/**
 * Google Sheets Integration Controller
 * Uses per-institute OAuth credentials for realtime data sync
 * Each institute connects their own Google account
 */

class GoogleSheetsController {
    // Exchange authorization code for tokens (OAuth flow)
    public static exchangeCode = async (req: IExtendedRequest, res: Response) => {
        const instituteNumber = req.user?.currentInstituteNumber;
        const { authorizationCode, redirectUri } = req.body;

        if (!instituteNumber) {
            return res.status(400).json({ message: "Institute number is required" });
        }

        if (!authorizationCode) {
            return res.status(400).json({ message: "Authorization code is required" });
        }

        try {
            // Exchange code for tokens with Google
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    code: authorizationCode,
                    client_id: process.env.GOOGLE_SHEETS_CLIENT_ID || '',
                    client_secret: process.env.GOOGLE_SHEETS_CLIENT_SECRET || '',
                    redirect_uri: redirectUri || process.env.GOOGLE_SHEETS_REDIRECT_URI || '',
                    grant_type: 'authorization_code'
                })
            });

            const tokens = await tokenResponse.json();

            if (tokens.error) {
                return res.status(400).json({ message: "Failed to exchange code", error: tokens.error_description });
            }

            // Get user email from Google
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { 'Authorization': `Bearer ${tokens.access_token}` }
            });
            const userInfo = await userInfoRes.json();

            // Ensure table exists
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

            // Calculate expiry
            const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

            // Save credentials
            const existing: any = await sequelize.query(
                `SELECT id FROM integration_credentials_${instituteNumber} WHERE provider = 'google'`,
                { type: QueryTypes.SELECT }
            );

            if (existing.length > 0) {
                await sequelize.query(
                    `UPDATE integration_credentials_${instituteNumber}
                     SET accessToken = ?, refreshToken = ?, expiresAt = ?, email = ?, scope = ?
                     WHERE provider = 'google'`,
                    { replacements: [tokens.access_token, tokens.refresh_token || null, expiresAt, userInfo.email, tokens.scope] }
                );
            } else {
                await sequelize.query(
                    `INSERT INTO integration_credentials_${instituteNumber}
                     (provider, accessToken, refreshToken, expiresAt, email, scope)
                     VALUES ('google', ?, ?, ?, ?, ?)`,
                    { replacements: [tokens.access_token, tokens.refresh_token || null, expiresAt, userInfo.email, tokens.scope] }
                );
            }

            res.status(200).json({
                message: "Google Sheets connected successfully",
                data: {
                    email: userInfo.email,
                    connected: true
                }
            });
        } catch (error: any) {
            console.error('Google Sheets OAuth error:', error);
            res.status(500).json({ message: "Error connecting Google Sheets", error: error.message });
        }
    };

    // Helper to get valid access token (refresh if expired)
    private static getValidToken = async (instituteNumber: string): Promise<string | null> => {
        const creds = await getFullCredentials(instituteNumber, 'google');
        if (!creds) return null;

        // Check if token is expired
        if (creds.expiresAt && new Date(creds.expiresAt) < new Date()) {
            // Refresh token
            if (!creds.refreshToken) return null;

            try {
                const response = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: process.env.GOOGLE_SHEETS_CLIENT_ID || '',
                        client_secret: process.env.GOOGLE_SHEETS_CLIENT_SECRET || '',
                        refresh_token: creds.refreshToken,
                        grant_type: 'refresh_token'
                    })
                });

                const tokens = await response.json();
                if (tokens.error) return null;

                // Update token in database
                const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));
                await sequelize.query(
                    `UPDATE integration_credentials_${instituteNumber}
                     SET accessToken = ?, expiresAt = ? WHERE provider = 'google'`,
                    { replacements: [tokens.access_token, expiresAt] }
                );

                return tokens.access_token;
            } catch {
                return null;
            }
        }

        return creds.accessToken;
    };

    // Export students to Google Sheets (realtime)
    public static exportStudents = async (req: IExtendedRequest, res: Response) => {
        const instituteNumber = req.user?.currentInstituteNumber;
        const { spreadsheetId, sheetName } = req.body;

        if (!instituteNumber) {
            return res.status(400).json({ message: "Institute number is required" });
        }

        try {
            const accessToken = await GoogleSheetsController.getValidToken(String(instituteNumber));
            if (!accessToken) {
                return res.status(401).json({
                    message: "Google Sheets not connected. Please connect your account first.",
                    needsAuth: true
                });
            }

            // Fetch students from database
            const students: any[] = await sequelize.query(
                `SELECT id, firstName, lastName, studentEmail, studentPhoneNo, studentAddress, enrolledDate
                 FROM student_${instituteNumber}`,
                { type: QueryTypes.SELECT }
            );

            if (!spreadsheetId) {
                // Return data preview without writing
                return res.status(200).json({
                    message: "Data ready for export. Provide spreadsheetId to write to Google Sheets.",
                    data: {
                        recordCount: students.length,
                        columns: ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Enrolled Date'],
                        preview: students.slice(0, 5)
                    }
                });
            }

            // Prepare data for Google Sheets
            const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Address', 'Enrolled Date'];
            const values = [
                headers,
                ...students.map(s => [
                    s.id,
                    s.firstName,
                    s.lastName,
                    s.studentEmail,
                    s.studentPhoneNo || '',
                    s.studentAddress || '',
                    s.enrolledDate ? new Date(s.enrolledDate).toLocaleDateString() : ''
                ])
            ];

            // Write to Google Sheets API
            const range = sheetName ? `${sheetName}!A1` : 'Sheet1!A1';
            const sheetsResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ values })
                }
            );

            const sheetsResult = await sheetsResponse.json();

            if (sheetsResult.error) {
                return res.status(400).json({ message: "Failed to write to Sheets", error: sheetsResult.error.message });
            }

            res.status(200).json({
                message: "Students exported to Google Sheets successfully",
                data: {
                    spreadsheetId,
                    recordCount: students.length,
                    updatedCells: sheetsResult.updatedCells
                }
            });
        } catch (error: any) {
            res.status(500).json({ message: "Error exporting students", error: error.message });
        }
    };

    // Export attendance to Google Sheets
    public static exportAttendance = async (req: IExtendedRequest, res: Response) => {
        const instituteNumber = req.user?.currentInstituteNumber;
        const { spreadsheetId, sheetName, startDate, endDate } = req.body;

        if (!instituteNumber) {
            return res.status(400).json({ message: "Institute number is required" });
        }

        try {
            const accessToken = await GoogleSheetsController.getValidToken(String(instituteNumber));
            if (!accessToken) {
                return res.status(401).json({ message: "Google Sheets not connected", needsAuth: true });
            }

            let query = `SELECT a.*, s.firstName, s.lastName, c.courseName
                         FROM attendance_${instituteNumber} a
                         JOIN student_${instituteNumber} s ON a.studentId = s.id
                         JOIN course_${instituteNumber} c ON a.courseId = c.id`;

            const replacements: any[] = [];
            if (startDate && endDate) {
                query += ` WHERE a.date BETWEEN ? AND ?`;
                replacements.push(startDate, endDate);
            }
            query += ` ORDER BY a.date DESC`;

            const attendance: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            if (!spreadsheetId) {
                return res.status(200).json({
                    message: "Data ready for export",
                    data: { recordCount: attendance.length, preview: attendance.slice(0, 10) }
                });
            }

            const headers = ['Date', 'Student Name', 'Course', 'Status'];
            const values = [
                headers,
                ...attendance.map(a => [
                    new Date(a.date).toLocaleDateString(),
                    `${a.firstName} ${a.lastName}`,
                    a.courseName,
                    a.status
                ])
            ];

            const range = sheetName ? `${sheetName}!A1` : 'Attendance!A1';
            await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values })
                }
            );

            res.status(200).json({
                message: "Attendance exported successfully",
                data: { spreadsheetId, recordCount: attendance.length }
            });
        } catch (error: any) {
            res.status(500).json({ message: "Error exporting attendance", error: error.message });
        }
    };

    // Export results/marks to Google Sheets
    public static exportResults = async (req: IExtendedRequest, res: Response) => {
        const instituteNumber = req.user?.currentInstituteNumber;
        const { spreadsheetId, sheetName, courseId } = req.body;

        if (!instituteNumber) {
            return res.status(400).json({ message: "Institute number is required" });
        }

        try {
            const accessToken = await GoogleSheetsController.getValidToken(String(instituteNumber));
            if (!accessToken) {
                return res.status(401).json({ message: "Google Sheets not connected", needsAuth: true });
            }

            let query = `SELECT r.*, s.firstName, s.lastName, a.title as assessmentTitle, c.courseName
                         FROM result_${instituteNumber} r
                         JOIN student_${instituteNumber} s ON r.studentId = s.id
                         JOIN assessment_${instituteNumber} a ON r.assessmentId = a.id
                         JOIN course_${instituteNumber} c ON a.courseId = c.id`;

            const replacements: any[] = [];
            if (courseId) {
                query += ` WHERE a.courseId = ?`;
                replacements.push(courseId);
            }
            query += ` ORDER BY s.lastName, a.title`;

            const results: any[] = await sequelize.query(query, {
                replacements,
                type: QueryTypes.SELECT
            });

            if (!spreadsheetId) {
                return res.status(200).json({
                    message: "Data ready for export",
                    data: { recordCount: results.length, preview: results.slice(0, 10) }
                });
            }

            const headers = ['Student Name', 'Course', 'Assessment', 'Score', 'Max Score', 'Percentage'];
            const values = [
                headers,
                ...results.map(r => [
                    `${r.firstName} ${r.lastName}`,
                    r.courseName,
                    r.assessmentTitle,
                    r.score,
                    r.maxScore,
                    r.maxScore ? `${((r.score / r.maxScore) * 100).toFixed(1)}%` : ''
                ])
            ];

            const range = sheetName ? `${sheetName}!A1` : 'Results!A1';
            await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
                {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ values })
                }
            );

            res.status(200).json({
                message: "Results exported successfully",
                data: { spreadsheetId, recordCount: results.length }
            });
        } catch (error: any) {
            res.status(500).json({ message: "Error exporting results", error: error.message });
        }
    };

    // Get sync status
    public static getSyncStatus = async (req: IExtendedRequest, res: Response) => {
        const instituteNumber = req.user?.currentInstituteNumber;

        if (!instituteNumber) {
            return res.status(400).json({ message: "Institute number is required" });
        }

        try {
            const creds = await getFullCredentials(String(instituteNumber), 'google');

            // Get record counts
            const [students] = await sequelize.query(
                `SELECT COUNT(*) as count FROM student_${instituteNumber}`,
                { type: QueryTypes.SELECT }
            ) as any;

            const [courses] = await sequelize.query(
                `SELECT COUNT(*) as count FROM course_${instituteNumber}`,
                { type: QueryTypes.SELECT }
            ) as any;

            res.status(200).json({
                message: "Sync status retrieved",
                data: {
                    connected: !!creds,
                    email: creds?.email || null,
                    hasRefreshToken: !!(creds?.refreshToken),
                    expiresAt: creds?.expiresAt || null,
                    recordCounts: {
                        students: students?.count || 0,
                        courses: courses?.count || 0
                    }
                }
            });
        } catch (error: any) {
            res.status(500).json({ message: "Error getting sync status", error: error.message });
        }
    };

    // Import students from Google Sheets
    public static importStudents = async (req: IExtendedRequest, res: Response) => {
        const instituteNumber = req.user?.currentInstituteNumber;
        const { spreadsheetId, sheetName, range } = req.body;

        if (!instituteNumber) {
            return res.status(400).json({ message: "Institute number is required" });
        }

        if (!spreadsheetId) {
            return res.status(400).json({ message: "Spreadsheet ID is required" });
        }

        try {
            const accessToken = await GoogleSheetsController.getValidToken(String(instituteNumber));
            if (!accessToken) {
                return res.status(401).json({ message: "Google Sheets not connected", needsAuth: true });
            }

            // Read from Google Sheets
            const sheetRange = range || (sheetName ? `${sheetName}!A:G` : 'Sheet1!A:G');
            const sheetsResponse = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetRange}`,
                {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                }
            );

            const sheetsData = await sheetsResponse.json();

            if (sheetsData.error) {
                return res.status(400).json({ message: "Failed to read from Sheets", error: sheetsData.error.message });
            }

            const values = sheetsData.values || [];
            if (values.length <= 1) {
                return res.status(400).json({ message: "No data found in sheet (only headers or empty)" });
            }

            // Skip header row
            const dataRows = values.slice(1);
            let imported = 0;
            let failed = 0;

            for (const row of dataRows) {
                try {
                    // Assuming columns: First Name, Last Name, Email, Phone, Address, Enrolled Date
                    const [firstName, lastName, email, phone, address, enrolledDate] = row;

                    if (!firstName || !lastName) continue;

                    await sequelize.query(
                        `INSERT INTO student_${instituteNumber}
                         (firstName, lastName, studentEmail, studentPhoneNo, studentAddress, enrolledDate)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        {
                            replacements: [
                                firstName,
                                lastName,
                                email || null,
                                phone || null,
                                address || null,
                                enrolledDate || new Date().toISOString().split('T')[0]
                            ],
                            type: QueryTypes.INSERT
                        }
                    );
                    imported++;
                } catch {
                    failed++;
                }
            }

            res.status(200).json({
                message: "Import completed",
                data: {
                    total: dataRows.length,
                    imported,
                    failed,
                    spreadsheetId
                }
            });
        } catch (error: any) {
            res.status(500).json({ message: "Error importing students", error: error.message });
        }
    };
}

export default GoogleSheetsController;
