import prisma from "../../../core/database/prisma";

export class AnalyticsRepo {
  async getAttendanceStats(instituteId: string) {
    // Attendance counts by status
    const statusDistribution = await prisma.attendance.groupBy({
      by: ['status'],
      where: { instituteId },
      _count: true,
    });

    // Recent trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentTrends = await prisma.attendance.groupBy({
      by: ['date'],
      where: {
        instituteId,
        date: { gte: sevenDaysAgo },
      },
      _count: {
        status: true,
      },
    });

    return { statusDistribution, recentTrends };
  }

  async getAssessmentPerformance(courseId: string) {
    const performance = await prisma.assessment.findMany({
      where: { courseId },
      include: {
        results: {
          select: {
            marks: true,
          }
        },
        _count: {
          select: {
            results: true,
          }
        }
      }
    });

    return (performance as any[]).map(a => ({
      title: a.title,
      averageMarks: a.results.reduce((acc: number, r: any) => acc + (Number(r.marks) || 0), 0) / (a._count.results || 1),
      maxMarks: a.maxMarks,
      studentsGraded: a._count.results,
    }));
  }
}

export default new AnalyticsRepo();
