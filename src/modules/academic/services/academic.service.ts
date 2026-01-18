import academicRepo from "../repository/academic.repo";
import { getGradeFromPercentage, calculateGPA } from "../utils/grading.utils";

export class AcademicService {
  async createAssessment(data: any) {
    return academicRepo.create(data);
  }

  async getAssessments(courseId: string) {
    return academicRepo.getAssessments(courseId);
  }

  async submitResult(data: any) {
    return academicRepo.submitResult(data);
  }

  async getResults(assessmentId: string) {
    return academicRepo.getResults(assessmentId);
  }

  async getStudentGPA(studentId: string, terminalId: string) {
    const results = await academicRepo.getResultsByStudentTerminal(studentId, terminalId);
    if (!results || results.length === 0) return { gpa: 0, status: "No Results" };

    const subjectGPAs = results.map((r: any) => {
      const percentage = (r.obtainedMarks / r.totalMarks) * 100;
      return getGradeFromPercentage(percentage).gpa;
    });

    const gpa = calculateGPA(subjectGPAs);
    return {
      gpa,
      status: gpa === 0 ? "NG" : "Graded",
      subjectCount: results.length
    };
  }
}

export default new AcademicService();
