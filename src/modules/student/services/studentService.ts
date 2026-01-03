import studentRepository from "../repository/studentRepository";

export class StudentService {
  async getStudentProfile(userId: string) {
    const student = await studentRepository.findByUserId(userId);
    if (!student) throw new Error("Student profile not found");
    return studentRepository.findWithProfile(student.id);
  }

  async updateStudent(id: string, data: any) {
    return studentRepository.update(id, data);
  }
}

export default new StudentService();
