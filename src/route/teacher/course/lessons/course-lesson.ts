import * as express from "express"
import { Router } from "express"
import { isLoggedIn } from "../../../../middleware/middleware"
import asyncErrorHandler from "../../../../services/asyncErrorHandler"
import { addLessonToChapter, fetchChapterLessons } from "../../../../controller/teacher/courses/lessons/lesson-controller"

const router: Router = express.Router()

router.route("/course-lesson/:chapterId")
    .post(isLoggedIn, asyncErrorHandler(addLessonToChapter))
    .get(isLoggedIn, asyncErrorHandler(fetchChapterLessons))

export default router
