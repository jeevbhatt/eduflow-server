import { Response } from "express";
import sequelize from "../../../database/connection";
import { IExtendedRequest } from "../../../middleware/type";
import { QueryTypes } from "sequelize";
import { buildTableName } from "../../../services/sqlSecurityService";

/**
 * Course Controller
 * SECURITY: All table names are built using buildTableName() to prevent SQL injection
 */

const createCourse = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const courseTable = buildTableName('course_', instituteNumber);

    const { coursePrice, courseName, courseDescription, courseDuration, courseLevel, categoryId } = req.body;

    if (!coursePrice || !courseName || !courseDescription || !courseDuration || !courseLevel || !categoryId) {
        return res.status(400).json({
            message: "Please provide coursePrice, courseName, courseDescription, courseDuration, courseLevel, categoryId"
        });
    }

    const courseThumbnail = req.file ? req.file.path : null;

    await sequelize.query(
        `INSERT INTO \`${courseTable}\` (coursePrice, courseName, courseDescription, courseDuration, courseLevel, courseThumbnail, categoryId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        {
            type: QueryTypes.INSERT,
            replacements: [coursePrice, courseName, courseDescription, courseDuration, courseLevel, courseThumbnail, categoryId]
        }
    );

    res.status(200).json({
        message: 'Course created successfully'
    });
};

const deleteCourse = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const courseTable = buildTableName('course_', instituteNumber);
    const { id: courseId } = req.params;

    // Check if course exists
    const courseData = await sequelize.query(
        `SELECT * FROM \`${courseTable}\` WHERE id = ?`,
        {
            replacements: [courseId],
            type: QueryTypes.SELECT
        }
    );

    if (courseData.length === 0) {
        return res.status(404).json({
            message: "Course not found"
        });
    }

    await sequelize.query(
        `DELETE FROM \`${courseTable}\` WHERE id = ?`,
        {
            replacements: [courseId],
            type: QueryTypes.DELETE
        }
    );

    res.status(200).json({
        message: "Course deleted successfully"
    });
};

const getAllCourse = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const courseTable = buildTableName('course_', instituteNumber);
    const categoryTable = buildTableName('category_', instituteNumber);

    const courses = await sequelize.query(
        `SELECT c.id, c.courseName FROM \`${courseTable}\` AS c JOIN \`${categoryTable}\` AS cat ON c.categoryId = cat.id`,
        { type: QueryTypes.SELECT }
    );

    res.status(200).json({
        message: "Courses fetched",
        data: courses
    });
};

const getSingleCourse = async (req: IExtendedRequest, res: Response) => {
    const instituteNumber = req.user?.currentInstituteNumber;
    const courseTable = buildTableName('course_', instituteNumber);
    const { id: courseId } = req.params;

    const course = await sequelize.query(
        `SELECT * FROM \`${courseTable}\` WHERE id = ?`,
        {
            replacements: [courseId],
            type: QueryTypes.SELECT
        }
    );

    res.status(200).json({
        message: "Course fetched",
        data: course
    });
};

export { createCourse, deleteCourse, getSingleCourse, getAllCourse };
