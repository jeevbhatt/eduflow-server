import courseRepo from "../repository/course.repo";
import { Course } from "@prisma/client";
import firebaseStorage from "../../../core/services/firebaseStorage";
import { Express } from "express";

export class CourseService {
  async getAllCourses(instituteId: string) {
    return courseRepo.findByInstitute(instituteId);
  }

  async getCourseById(courseId: string) {
    return courseRepo.findWithDetails(courseId);
  }

  async createCourse(data: any, thumbnail?: Express.Multer.File) {
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

  async updateCourse(courseId: string, data: any, thumbnail?: Express.Multer.File) {
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
}

export default new CourseService();
