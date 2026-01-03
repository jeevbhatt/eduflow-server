import academicRepo from "../repository/academic.repo";

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
}

export default new AcademicService();
