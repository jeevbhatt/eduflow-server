import { Response } from "express";
import sequelize from "../../../database/connection";
import { IExtendedRequest } from "../../../middleware/type";
import { QueryTypes } from "sequelize";
import { buildTableName } from "../../../services/sqlSecurityService";

/**
 * Attendance Controller
 * SECURITY: All table names built using buildTableName() for SQL injection prevention
 */

// Bulk mark attendance for a course/section on a specific date
const markAttendance = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const attendanceTable = buildTableName('attendance_', instituteNumber);
    const { courseId, attendanceDate, students } = req.body; // students: [{id, status, remarks}]

    if (!courseId || !attendanceDate || !students || !Array.isArray(students)) {
        return res.status(400).json({
            message: "Provide courseId, attendanceDate, and an array of students with status"
        });
    }

    const t = await sequelize.transaction();

    try {
        for (const student of students) {
            // Check if record exists for this student, course, and date
            const existing: any = await sequelize.query(
                `SELECT id FROM \`${attendanceTable}\` WHERE studentId = ? AND courseId = ? AND attendanceDate = ?`,
                {
                    replacements: [student.id, courseId, attendanceDate],
                    type: QueryTypes.SELECT,
                    transaction: t
                }
            );

            if (existing.length > 0) {
                // Update
                await sequelize.query(
                    `UPDATE \`${attendanceTable}\` SET status = ?, remarks = ? WHERE id = ?`,
                    {
                        replacements: [student.status, student.remarks || null, existing[0].id],
                        type: QueryTypes.UPDATE,
                        transaction: t
                    }
                );
            } else {
                // Insert
                await sequelize.query(
                    `INSERT INTO \`${attendanceTable}\` (studentId, courseId, attendanceDate, status, remarks) VALUES (?, ?, ?, ?, ?)`,
                    {
                        replacements: [student.id, courseId, attendanceDate, student.status, student.remarks || null],
                        type: QueryTypes.INSERT,
                        transaction: t
                    }
                );
            }
        }

        await t.commit();
        res.status(200).json({ message: "Attendance recorded successfully" });
    } catch (err: any) {
        await t.rollback();
        console.error("Attendance error:", err);
        res.status(500).json({ message: "Error recording attendance", error: err.message });
    }
};

// Get attendance history for a specific student
const getStudentAttendance = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const attendanceTable = buildTableName('attendance_', instituteNumber);
    const courseTable = buildTableName('course_', instituteNumber);
    const { studentId } = req.params;

    try {
        const attendance = await sequelize.query(
            `SELECT a.*, c.courseName
             FROM \`${attendanceTable}\` as a
             JOIN \`${courseTable}\` as c ON a.courseId = c.id
             WHERE a.studentId = ?
             ORDER BY a.attendanceDate DESC`,
            {
                replacements: [studentId],
                type: QueryTypes.SELECT
            }
        );

        res.status(200).json({ message: "Student attendance fetched", data: attendance });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching attendance", error: err.message });
    }
};

export { markAttendance, getStudentAttendance };
