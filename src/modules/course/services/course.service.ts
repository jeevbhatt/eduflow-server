import courseRepo from "../repository/course.repo";
import { Course, LessonType } from "@prisma/client";
import firebaseStorage from "../../../core/services/firebaseStorage";

export class CourseService {
  async getAllCourses(instituteId: string) {
    return courseRepo.findByInstitute(instituteId);
  }

  async getCourseById(courseId: string) {
    return courseRepo.findWithDetails(courseId);
  }

  async createCourse(data: any, thumbnail?: any) {
    let thumbnailUrl = null;
    if (thumbnail) {
      thumbnailUrl = await firebaseStorage.uploadFile(
        thumbnail.buffer,
        `courses/thumbnails/${Date.now()}-${thumbnail.originalname}`,
        thumbnail.mimetype
      );
    }

    return courseRepo.create({
      ...data,
      thumbnail: thumbnailUrl,
    });
  }

  async updateCourse(courseId: string, data: any, thumbnail?: any) {
    const existing = await courseRepo.findById(courseId);
    if (!existing) throw new Error("Course not found");

    let thumbnailUrl = existing.thumbnail;
    if (thumbnail) {
      if (existing.thumbnail) {
        await firebaseStorage.deleteFile(existing.thumbnail);
      }
      thumbnailUrl = await firebaseStorage.uploadFile(
        thumbnail.buffer,
        `courses/thumbnails/${Date.now()}-${thumbnail.originalname}`,
        thumbnail.mimetype
      );
    }

    return courseRepo.update(courseId, {
      ...data,
      thumbnail: thumbnailUrl,
    });
  }

  async deleteCourse(courseId: string) {
    const existing = await courseRepo.findById(courseId);
    if (existing?.thumbnail) {
      await firebaseStorage.deleteFile(existing.thumbnail);
    }
    return courseRepo.delete(courseId);
  }

  async createLesson(data: any, file?: any) {
    let contentUrl = data.contentUrl;

    if (file && (data.type === LessonType.pdf || data.type === LessonType.document)) {
      contentUrl = await firebaseStorage.uploadFile(
        file.buffer,
        `courses/lessons/${Date.now()}-${file.originalname}`,
        file.mimetype
      );
    }

    return courseRepo.createLesson({
      ...data,
      contentUrl,
    });
  }

  async updateLesson(lessonId: string, data: any, file?: any) {
    let contentUrl = data.contentUrl;

    if (file && (data.type === LessonType.pdf || data.type === LessonType.document)) {
      contentUrl = await firebaseStorage.uploadFile(
        file.buffer,
        `courses/lessons/${Date.now()}-${file.originalname}`,
        file.mimetype
      );
    }

    return courseRepo.updateLesson(lessonId, {
      ...data,
      contentUrl,
    });
  }
}

export default new CourseService();
