import { Response } from "express";
import sequelize from "../../../database/connection";
import { IExtendedRequest } from "../../../middleware/type";
import { QueryTypes } from "sequelize";
import { buildTableName } from "../../../services/sqlSecurityService";

/**
 * Result Controller
 * SECURITY: All table names built using buildTableName() for SQL injection prevention
 */

// Post results for an assessment (bulk)
const postResults = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const resultTable = buildTableName('result_', instituteNumber);
    const { assessmentId, results } = req.body; // results: [{studentId, marksObtained, remarks}]

    if (!assessmentId || !results || !Array.isArray(results)) {
        return res.status(400).json({ message: "Provide assessmentId and an array of student results" });
    }

    const t = await sequelize.transaction();
    try {
        for (const resItem of results) {
            const existing: any = await sequelize.query(
                `SELECT id FROM \`${resultTable}\` WHERE studentId = ? AND assessmentId = ?`,
                {
                    replacements: [resItem.studentId, assessmentId],
                    type: QueryTypes.SELECT,
                    transaction: t
                }
            );

            if (existing.length > 0) {
                await sequelize.query(
                    `UPDATE \`${resultTable}\` SET marksObtained = ?, remarks = ? WHERE id = ?`,
                    {
                        replacements: [resItem.marksObtained, resItem.remarks || null, existing[0].id],
                        type: QueryTypes.UPDATE,
                        transaction: t
                    }
                );
            } else {
                await sequelize.query(
                    `INSERT INTO \`${resultTable}\` (studentId, assessmentId, marksObtained, remarks) VALUES (?, ?, ?, ?)`,
                    {
                        replacements: [resItem.studentId, assessmentId, resItem.marksObtained, resItem.remarks || null],
                        type: QueryTypes.INSERT,
                        transaction: t
                    }
                );
            }
        }
        await t.commit();
        res.status(200).json({ message: "Results posted successfully" });
    } catch (err: any) {
        await t.rollback();
        console.error("Result error:", err);
        res.status(500).json({ message: "Error posting results", error: err.message });
    }
};

// Get results for a student (report card view)
const getStudentReportCard = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const resultTable = buildTableName('result_', instituteNumber);
    const assessmentTable = buildTableName('assessment_', instituteNumber);
    const courseTable = buildTableName('course_', instituteNumber);
    const { studentId } = req.params;

    try {
        const results = await sequelize.query(
            `SELECT r.*, a.title as assessmentTitle, a.maxMarks, a.assessmentType, c.courseName
             FROM \`${resultTable}\` as r
             JOIN \`${assessmentTable}\` as a ON r.assessmentId = a.id
             JOIN \`${courseTable}\` as c ON a.courseId = c.id
             WHERE r.studentId = ?
             ORDER BY a.assessmentDate DESC`,
            {
                replacements: [studentId],
                type: QueryTypes.SELECT
            }
        );
        res.status(200).json({ message: "Student report card fetched", data: results });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching report card", error: err.message });
    }
};

export { postResults, getStudentReportCard };
