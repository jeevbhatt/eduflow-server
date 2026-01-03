import studentRepo from "../repository/student.repo";
import firebaseStorage from "../../../core/services/firebaseStorage";

export class StudentService {
  async getStudentProfile(userId: string) {
    const student = await studentRepo.findByUserId(userId);
    if (!student) throw new Error("Student profile not found");
    return studentRepo.findWithProfile(student.id);
  }

  async getInstituteStudents(instituteId: string) {
    return studentRepo.findMany({ where: { instituteId } });
  }

  async getStudentById(id: string, instituteId: string) {
    return studentRepo.findFirst({ where: { id, instituteId } });
  }

  async createStudent(instituteId: string, data: any, file?: any) {
    let photoUrl = data.studentImage || "https://static.vecteezy.com/system/resources/thumbnails/001/840/618/small/picture-profile-icon-male-icon-human-or-people-sign-and-symbol-free-vector.jpg";

    if (file) {
      photoUrl = await firebaseStorage.uploadFile(
        file.buffer,
        `students/photos/${Date.now()}-${file.originalname}`,
        file.mimetype
      );
    }

    return studentRepo.create({
      ...data,
      instituteId,
      photo: photoUrl,
      enrolledDate: data.enrolledDate ? new Date(data.enrolledDate) : new Date(),
    });
  }

  async updateStudent(id: string, data: any, file?: any) {
    if (file) {
      data.photo = await firebaseStorage.uploadFile(
        file.buffer,
        `students/photos/${Date.now()}-${file.originalname}`,
        file.mimetype
      );
    }
    return studentRepo.update(id, data);
  }

  async deleteStudent(id: string, instituteId: string) {
    return studentRepo.deleteMany({ where: { id, instituteId } });
  }
}

export default new StudentService();
