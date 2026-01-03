import * as express from "express";
import { Router } from "express";
import { isLoggedIn } from "../../../middleware/middleware";
import { academicAuditLog } from "../../../middleware/securityMiddleware";
import asyncErrorHandler from "../../../services/asyncErrorHandler";
import { getStudentAttendance, markAttendance } from "../../../controller/institute/attendance/attendanceController";
import { createAssessment, getAssessmentsByCourse } from "../../../controller/institute/assessment/assessmentController";
import { getStudentReportCard, postResults } from "../../../controller/institute/result/resultController";
import { getAttendanceStats, getAssessmentPerformance } from "../../../controller/institute/academic/analyticsController";
import { scheduleExam, getExamSchedules, deleteExamSchedule } from "../../../controller/institute/academic/examController";

const router: Router = express.Router();

// Attendance routes
router.route("/attendance").post(isLoggedIn, academicAuditLog, asyncErrorHandler(markAttendance));
router.route("/attendance/:studentId").get(isLoggedIn, asyncErrorHandler(getStudentAttendance));

// Assessment routes
router.route("/assessment").post(isLoggedIn, academicAuditLog, asyncErrorHandler(createAssessment));
router.route("/assessment/course/:courseId").get(isLoggedIn, asyncErrorHandler(getAssessmentsByCourse));

// Result routes
router.route("/result").post(isLoggedIn, academicAuditLog, asyncErrorHandler(postResults));
router.route("/result/student/:studentId").get(isLoggedIn, asyncErrorHandler(getStudentReportCard));

// Analytics routes
router.route("/analytics/attendance").get(isLoggedIn, asyncErrorHandler(getAttendanceStats));
router.route("/analytics/performance/:courseId").get(isLoggedIn, asyncErrorHandler(getAssessmentPerformance));

// Exam Scheduling
router.route("/exams")
    .post(isLoggedIn, academicAuditLog, asyncErrorHandler(scheduleExam))
    .get(isLoggedIn, asyncErrorHandler(getExamSchedules));

router.route("/exams/:id").delete(isLoggedIn, academicAuditLog, asyncErrorHandler(deleteExamSchedule));

export default router;
