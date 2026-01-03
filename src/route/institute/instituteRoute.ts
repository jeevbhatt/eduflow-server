import * as express from "express";
import { Router } from "express";

import {
  createCategoryTable,
  createChapterLessonTable,
  createCourseChapterTable,
  createCourseTable,
  createInstitute,
  createStudentTable,
  createTeacherTable,
  createAttendanceTable,
  createAssessmentTable,
  createResultTable,
  createFeeTables,
  createExamScheduleTable,
  createSecurityLogsTable,
  createLibraryTables,
} from "../../controller/institute/instituteController";
import asyncErrorHandler from "../../services/asyncErrorHandler";
import { isLoggedIn, restrictTo } from "../../middleware/middleware";
import { UserRole } from "../../middleware/type";

const router: Router = express.Router();

router.route("/").post(isLoggedIn, createInstitute);

export default router;
