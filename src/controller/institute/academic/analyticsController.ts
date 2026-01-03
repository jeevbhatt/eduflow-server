import { Response } from "express";
import sequelize from "../../../database/connection";
import { IExtendedRequest } from "../../../middleware/type";
import { QueryTypes } from "sequelize";
import { buildTableName } from "../../../services/sqlSecurityService";

/**
 * Analytics Controller
 * SECURITY: All table names built using buildTableName() for SQL injection prevention
 */

// Get overall attendance trends for the institute
const getAttendanceStats = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const attendanceTable = buildTableName('attendance_', instituteNumber);

    try {
        // Attendance counts by status
        const statusDistribution = await sequelize.query(
            `SELECT status, COUNT(*) as count
             FROM \`${attendanceTable}\`
             GROUP BY status`,
            { type: QueryTypes.SELECT }
        );

        // Attendance over the last 7 days
        const recentTrends = await sequelize.query(
            `SELECT attendanceDate,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
             FROM \`${attendanceTable}\`
             WHERE attendanceDate >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY attendanceDate
             ORDER BY attendanceDate ASC`,
            { type: QueryTypes.SELECT }
        );

        res.status(200).json({
            message: "Attendance stats fetched",
            data: { statusDistribution, recentTrends }
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching attendance stats", error: err.message });
    }
};

// Get performance analytics for a specific course/assessment
const getAssessmentPerformance = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const assessmentTable = buildTableName('assessment_', instituteNumber);
    const resultTable = buildTableName('result_', instituteNumber);
    const { courseId } = req.params;

    try {
        // Performance across assessments in this course
        const assessmentPerformance = await sequelize.query(
            `SELECT a.title,
                    AVG(r.marksObtained) as averageMarks,
                    a.maxMarks,
                    COUNT(r.id) as studentsGraded
             FROM \`${assessmentTable}\` as a
             LEFT JOIN \`${resultTable}\` as r ON a.id = r.assessmentId
             WHERE a.courseId = ?
             GROUP BY a.id`,
            {
                replacements: [courseId],
                type: QueryTypes.SELECT
            }
        );

        res.status(200).json({
            message: "Assessment performance fetched",
            data: assessmentPerformance
        });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching assessment performance", error: err.message });
    }
};

export { getAttendanceStats, getAssessmentPerformance };
