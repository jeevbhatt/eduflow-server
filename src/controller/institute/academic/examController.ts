import { Response } from "express";
import sequelize from "../../../database/connection";
import { IExtendedRequest } from "../../../middleware/type";
import { QueryTypes } from "sequelize";
import { buildTableName } from "../../../services/sqlSecurityService";

/**
 * Exam Controller
 * SECURITY: All table names built using buildTableName() for SQL injection prevention
 */

// Schedule an exam for an existing assessment
const scheduleExam = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const scheduleTable = buildTableName('exam_schedule_', instituteNumber);
    const { assessmentId, examDate, startTime, endTime, roomId, invigilatorId, instructions } = req.body;

    if (!assessmentId || !examDate || !startTime || !endTime) {
        return res.status(400).json({ message: "AssessmentId, Date, Start Time, and End Time are required" });
    }

    try {
        // Check for room conflicts
        if (roomId) {
            const conflict: any = await sequelize.query(
                `SELECT id FROM \`${scheduleTable}\`
                 WHERE roomId = ? AND examDate = ?
                 AND ((startTime <= ? AND endTime > ?) OR (startTime < ? AND endTime >= ?))`,
                {
                    replacements: [roomId, examDate, startTime, startTime, endTime, endTime],
                    type: QueryTypes.SELECT
                }
            );

            if (conflict.length > 0) {
                return res.status(409).json({ message: "Room conflict: Another exam is already scheduled in this room at this time." });
            }
        }

        await sequelize.query(
            `INSERT INTO \`${scheduleTable}\`
            (assessmentId, examDate, startTime, endTime, roomId, invigilatorId, instructions)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            {
                replacements: [assessmentId, examDate, startTime, endTime, roomId || null, invigilatorId || null, instructions || null],
                type: QueryTypes.INSERT
            }
        );

        res.status(201).json({ message: "Exam scheduled successfully" });
    } catch (err: any) {
        res.status(500).json({ message: "Error scheduling exam", error: err.message });
    }
};

// Get all exam schedules with assessment and course details
const getExamSchedules = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const scheduleTable = buildTableName('exam_schedule_', instituteNumber);
    const assessmentTable = buildTableName('assessment_', instituteNumber);
    const courseTable = buildTableName('course_', instituteNumber);
    const teacherTable = buildTableName('teacher_', instituteNumber);

    try {
        const schedules = await sequelize.query(
            `SELECT s.*, a.title as assessmentTitle, c.courseName, t.teacherName as invigilatorName
             FROM \`${scheduleTable}\` as s
             JOIN \`${assessmentTable}\` as a ON s.assessmentId = a.id
             JOIN \`${courseTable}\` as c ON a.courseId = c.id
             LEFT JOIN \`${teacherTable}\` as t ON s.invigilatorId = t.id
             ORDER BY s.examDate ASC, s.startTime ASC`,
            { type: QueryTypes.SELECT }
        );
        res.status(200).json({ data: schedules });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching exam schedules", error: err.message });
    }
};

// Delete an exam schedule
const deleteExamSchedule = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const scheduleTable = buildTableName('exam_schedule_', instituteNumber);
    const { id } = req.params;

    try {
        await sequelize.query(
            `DELETE FROM \`${scheduleTable}\` WHERE id = ?`,
            { replacements: [id], type: QueryTypes.DELETE }
        );
        res.status(200).json({ message: "Exam schedule deleted successfully" });
    } catch (err: any) {
        res.status(500).json({ message: "Error deleting exam schedule", error: err.message });
    }
};

export { scheduleExam, getExamSchedules, deleteExamSchedule };
