import * as express from "express"
import { Router } from "express"
import { isLoggedIn } from "../../../../middleware/middleware"
import asyncErrorHandler from "../../../../services/asyncErrorHandler"
import { addChapterToCourse, fetchCourseChapters } from "../../../../controller/teacher/courses/chapters/chapter-controller"

const router: Router = express.Router()

router.route("/course-chapter/:courseId")
    .post(isLoggedIn, asyncErrorHandler(addChapterToCourse))
    .get(isLoggedIn, asyncErrorHandler(fetchCourseChapters))

export default router
