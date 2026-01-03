import analyticsRepo from "../repository/analytics.repo";

export class AnalyticsService {
  async getAttendanceStats(instituteId: string) {
    const { statusDistribution, recentTrends } = await analyticsRepo.getAttendanceStats(instituteId);

    const processedStatus = statusDistribution.map(s => ({
      status: s.status,
      count: s._count,
    }));

    return { statusDistribution: processedStatus, recentTrends };
  }

  async getAssessmentPerformance(courseId: string) {
    return analyticsRepo.getAssessmentPerformance(courseId);
  }
}

export default new AnalyticsService();
