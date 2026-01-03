import progressRepo from "../repository/progress.repo";

export class ProgressService {
  async updateProgress(data: any) {
    return progressRepo.updateProgress(data);
  }

  async getProgress(studentId: string, courseId: string) {
    return progressRepo.getProgress(studentId, courseId);
  }

  async getAchievements(studentId: string) {
    return progressRepo.getAchievements(studentId);
  }
}

export default new ProgressService();
