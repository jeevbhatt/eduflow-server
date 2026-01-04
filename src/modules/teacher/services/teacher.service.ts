import teacherRepo from "../repository/teacher.repo";
import { Teacher } from "@prisma/client";

export class TeacherService {
  async getTeacherByEmail(email: string, instituteId: string) {
    return teacherRepo.findByEmail(email, instituteId);
  }

  async getTeacherProfile(userId: string) {
    return teacherRepo.findByUserId(userId);
  }

  async updateTeacherProfile(teacherId: string, data: Partial<Teacher>) {
    return teacherRepo.update(teacherId, data);
  }

  async getAllTeachers(instituteId: string) {
    return teacherRepo.findMany({
      where: { instituteId },
      orderBy: { createdAt: "desc" },
    });
  }
}

export default new TeacherService();
