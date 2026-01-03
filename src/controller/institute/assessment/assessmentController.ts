import { Response } from "express";
import sequelize from "../../../database/connection";
import { IExtendedRequest } from "../../../middleware/type";
import { QueryTypes } from "sequelize";
import { buildTableName } from "../../../services/sqlSecurityService";

/**
 * Assessment Controller
 * SECURITY: All table names built using buildTableName() for SQL injection prevention
 */

// Create a new assessment (quiz, exam, etc.)
const createAssessment = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const assessmentTable = buildTableName('assessment_', instituteNumber);
    const { courseId, title, assessmentType, maxMarks, assessmentDate } = req.body;

    if (!courseId || !title || !maxMarks) {
        return res.status(400).json({ message: "Provide courseId, title, and maxMarks" });
    }

    try {
        await sequelize.query(
            `INSERT INTO \`${assessmentTable}\` (courseId, title, assessmentType, maxMarks, assessmentDate) VALUES (?, ?, ?, ?, ?)`,
            {
                replacements: [courseId, title, assessmentType || 'exam', maxMarks, assessmentDate || null],
                type: QueryTypes.INSERT
            }
        );
        res.status(201).json({ message: "Assessment created successfully" });
    } catch (err: any) {
        console.error("Assessment error:", err);
        res.status(500).json({ message: "Error creating assessment", error: err.message });
    }
};

// Get all assessments for a specific course
const getAssessmentsByCourse = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const assessmentTable = buildTableName('assessment_', instituteNumber);
    const { courseId } = req.params;

    try {
        const assessments = await sequelize.query(
            `SELECT * FROM \`${assessmentTable}\` WHERE courseId = ? ORDER BY assessmentDate ASC`,
            {
                replacements: [courseId],
                type: QueryTypes.SELECT
            }
        );
        res.status(200).json({ message: "Assessments fetched", data: assessments });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching assessments", error: err.message });
    }
};

export { createAssessment, getAssessmentsByCourse };
