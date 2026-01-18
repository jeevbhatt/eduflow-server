import attendanceRepo from "../repository/attendance.repo";
import notificationService from "../../notification/services/notification.service";
import { NotificationType } from "@prisma/client";

export class AttendanceService {
  async markAttendance(data: any) {
    const attendance = await attendanceRepo.markAttendance(data);

    // If student is absent, trigger a notification for parents/system
    if (data.status === "absent" && data.studentId) {
      await notificationService.createNotification({
        userId: data.studentId, // In a real scenario, this might be the linked parent's ID
        type: NotificationType.INFO,
        title: "Absence Alert",
        message: `Student was marked absent on ${new Date().toLocaleDateString()}.`,
        category: "attendance"
      });
    }

    return attendance;
  }

  async getAttendance(filters: any) {
    return attendanceRepo.getAttendance(filters);
  }
}

export default new AttendanceService();
