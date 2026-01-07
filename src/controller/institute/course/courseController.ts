import connection from "../../../database/connection";
import { QueryTypes } from "sequelize";
import { buildTableName } from "../../../core/services/sqlSecurityService";
import { Response } from "express";
import { IExtendedRequest as Request } from "../../../core/middleware/type";

export const createCourse = async (req: Request, res: Response) => {
  const instituteNumber = req.user?.currentInstituteNumber as string;
  const courseTable = buildTableName("course_", instituteNumber);
  const {
    coursePrice,
    courseName,
    courseDescription,
    courseDuration,
    courseLevel,
    categoryId,
  } = req.body as any;

  if (
    !coursePrice ||
    !courseName ||
    !courseDescription ||
    !courseDuration ||
    !courseLevel ||
    !categoryId
  ) {
    return res.status(400).json({
      message:
        "Please provide coursePrice, courseName, courseDescription, courseDuration, courseLevel, categoryId",
    });
  }

  const courseThumbnail = req.file
    ? (req.file as any).path
    : (req.body && req.body.courseThumbnail) || null;

  await connection.query(
    `INSERT INTO \`${courseTable}\` (coursePrice, courseName, courseDescription, courseDuration, courseLevel, courseThumbnail, categoryId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    {
      type: QueryTypes.INSERT,
      replacements: [
        coursePrice,
        courseName,
        courseDescription,
        courseDuration,
        courseLevel,
        courseThumbnail,
        categoryId,
      ],
    }
  );

  res.status(200).json({ message: "Course created successfully" });
};

export const deleteCourse = async (req: Request, res: Response) => {
  const instituteNumber = req.user?.currentInstituteNumber as string;
  const courseTable = buildTableName("course_", instituteNumber);
  const { id: courseId } = req.params;

  const courseData = await connection.query(
    `SELECT * FROM \`${courseTable}\` WHERE id = ?`,
    {
      replacements: [courseId],
      type: QueryTypes.SELECT,
    }
  );

  if ((courseData as any[]).length === 0) {
    return res.status(404).json({ message: "Course not found" });
  }

  await connection.query(`DELETE FROM \`${courseTable}\` WHERE id = ?`, {
    replacements: [courseId],
    type: QueryTypes.DELETE,
  });

  res.status(200).json({ message: "Course deleted successfully" });
};

export const getAllCourse = async (req: Request, res: Response) => {
  const instituteNumber = req.user?.currentInstituteNumber as string;
  const courseTable = buildTableName("course_", instituteNumber);
  const categoryTable = buildTableName("category_", instituteNumber);
  const courses = await connection.query(
    `SELECT c.id, c.courseName FROM \`${courseTable}\` AS c JOIN \`${categoryTable}\` AS cat ON c.categoryId = cat.id`,
    { type: QueryTypes.SELECT }
  );
  res.status(200).json({ message: "Courses fetched", data: courses });
};

export const getSingleCourse = async (req: Request, res: Response) => {
  const instituteNumber = req.user?.currentInstituteNumber as string;
  const courseTable = buildTableName("course_", instituteNumber);
  const { id: courseId } = req.params;
  const course = await connection.query(
    `SELECT * FROM \`${courseTable}\` WHERE id = ?`,
    {
      replacements: [courseId],
      type: QueryTypes.SELECT,
    }
  );
  res.status(200).json({ message: "Course fetched", data: course });
};
