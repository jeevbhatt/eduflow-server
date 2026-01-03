






import express,{Router} from 'express'
import asyncErrorHandler from '../../../services/asyncErrorHandler';
import { changeUserIdForTableName, isLoggedIn, restrictTo } from '../../../middleware/middleware';
import { UserRole } from '../../../middleware/type';
import { createStudentCourseOrder, studentCourseEsewaPaymentVerification, studentCoursePaymentVerification } from '../../../controller/student/order/student-order.controller';


const router:Router = express.Router()

router.route("/order").post(isLoggedIn, changeUserIdForTableName, restrictTo(UserRole.Student), asyncErrorHandler(createStudentCourseOrder))

router.route("/order/khalti/verify-transaction").post(isLoggedIn,changeUserIdForTableName,restrictTo(UserRole.Student),asyncErrorHandler(studentCoursePaymentVerification))
router.route("/order/esewa/verify-transaction").post(isLoggedIn,changeUserIdForTableName,restrictTo(UserRole.Student),asyncErrorHandler(studentCourseEsewaPaymentVerification))


export default router;