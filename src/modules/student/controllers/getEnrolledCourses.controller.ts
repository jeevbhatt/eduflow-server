import { Response } from "express";
import { IExtendedRequest } from "../../../core/middleware/type";
import studentRepo from "../repository/student.repo";

export const getEnrolledCourses = async (req: IExtendedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const instituteId = req.instituteId;

    if (!userId) throw new Error("User ID not found");

    const student = await studentRepo.findByUserId(userId);
    if (!student) throw new Error("Student profile not found");

    const courses = await studentRepo.getEnrolledCourses(student.id);

    // Map to the expected format
    const formattedCourses = courses.map(sc => ({
      id: sc.course.id,
      title: sc.course.name,
      instructor: sc.course.teachers[0]?.teacher
        ? `${sc.course.teachers[0].teacher.firstName} ${sc.course.teachers[0].teacher.lastName}`
        : "Instructor",
      progress: 0, // Map from separate progress table if exists
      nextLesson: "Chapter 1",
      thumbnail: sc.course.thumbnail,
    }));

    res.json({ status: "success", data: formattedCourses });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};
