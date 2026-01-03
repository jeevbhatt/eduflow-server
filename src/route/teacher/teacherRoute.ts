import * as express from 'express'
import { Router } from 'express'
import asyncErrorHandler from '../../services/asyncErrorHandler'
import { teacherLogin } from '../../controller/teacher/teacherController'

const router:Router = express.Router()

router.route("/login").post(asyncErrorHandler(teacherLogin))

export default router
