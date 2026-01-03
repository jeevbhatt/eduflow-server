import { Response } from "express";
import { IExtendedRequest } from "../../../../middleware/type";
import sequelize from "../../../../database/connection";
import { QueryTypes } from "sequelize";

// Add a lesson to a chapter
const addLessonToChapter = async (req: IExtendedRequest, res: Response) => {
    const { chapterId } = req.params;
    const instituteNumber = req.user?.currentInstituteNumber;
    const { lessonName, lessonDescription, lessonDuration, lessonVideo, lessonOrder } = req.body;

    if (!lessonName || !chapterId) {
        return res.status(400).json({ message: "Provide lessonName and chapterId" });
    }

    try {
        await sequelize.query(
            `INSERT INTO chapter_lesson_${instituteNumber} (lessonName, lessonDescription, lessonDuration, lessonVideo, lessonOrder, chapterId) VALUES (?, ?, ?, ?, ?, ?)`,
            {
                replacements: [lessonName, lessonDescription || null, lessonDuration || null, lessonVideo || null, lessonOrder || 0, chapterId],
                type: QueryTypes.INSERT
            }
        );
        res.status(201).json({ message: "Lesson added successfully" });
    } catch (err: any) {
        console.error("Lesson error:", err);
        res.status(500).json({ message: "Error adding lesson", error: err.message });
    }
};

// Fetch all lessons for a chapter
const fetchChapterLessons = async (req: IExtendedRequest, res: Response) => {
    const { chapterId } = req.params;
    const instituteNumber = req.user?.currentInstituteNumber;

    try {
        const lessons = await sequelize.query(
            `SELECT * FROM chapter_lesson_${instituteNumber} WHERE chapterId = ? ORDER BY lessonOrder ASC`,
            {
                replacements: [chapterId],
                type: QueryTypes.SELECT
            }
        );
        res.status(200).json({ message: "Lessons fetched", data: lessons });
    } catch (err: any) {
        res.status(500).json({ message: "Error fetching lessons", error: err.message });
    }
};

export { addLessonToChapter, fetchChapterLessons };
