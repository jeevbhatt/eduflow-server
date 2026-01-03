import * as express from 'express'
import { Router } from 'express'
import { isLoggedIn } from '../../../middleware/middleware'
import asyncErrorHandler from '../../../services/asyncErrorHandler'
import { createCourse, deleteCourse, getAllCourse, getSingleCourse } from '../../../controller/institute/course/courseController'
import upload from '../../../middleware/multerUpload'

const router:Router = express.Router()

router.route("/").post(isLoggedIn, upload.single('courseThumbnail'), asyncErrorHandler(createCourse)).get(isLoggedIn, asyncErrorHandler(getAllCourse))

router.route("/:id").get(isLoggedIn, asyncErrorHandler(getSingleCourse)).delete(isLoggedIn, asyncErrorHandler(deleteCourse))

export default router
