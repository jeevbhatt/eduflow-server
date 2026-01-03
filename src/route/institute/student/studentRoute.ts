import * as express from 'express'
import { Router } from 'express'
import asyncErrorHandler from '../../../services/asyncErrorHandler';
import { createStudent, deleteStudent, getStudents, getSingleStudent } from '../../../controller/institute/student/studentController';
import upload from '../../../middleware/multerUpload';
import { isLoggedIn } from '../../../middleware/middleware';
import { validate, studentSchemas } from '../../../services/validationService';
import { verifyInstituteResource, validateResourceId, rateLimitSensitiveOps } from '../../../services/apiSecurityService';

const router: Router = express.Router();

// List and create students
router.route("/")
  .get(isLoggedIn, asyncErrorHandler(getStudents))
  .post(
    isLoggedIn,
    upload.single('studentImage'),
    validate(studentSchemas.create),
    asyncErrorHandler(createStudent)
  );

// Single student operations with IDOR protection
router.route("/:id")
  .get(
    isLoggedIn,
    validateResourceId('id'),
    verifyInstituteResource('student', 'id'),
    asyncErrorHandler(getSingleStudent)
  )
  .delete(
    isLoggedIn,
    validateResourceId('id'),
    verifyInstituteResource('student', 'id'),
    rateLimitSensitiveOps('delete-student'),
    asyncErrorHandler(deleteStudent)
  );

export default router;
