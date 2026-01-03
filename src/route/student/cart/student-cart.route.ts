


import express,{Router} from 'express'
import asyncErrorHandler from '../../../services/asyncErrorHandler';

import { deleteStudentCartItem, fetchStudentCartItems, insertIntoCartTableOfStudent } from '../../../controller/student/cart/student-cart-controller';
import { changeUserIdForTableName, isLoggedIn, restrictTo } from '../../../middleware/middleware';
import { UserRole } from '../../../middleware/type';

const router:Router = express.Router()

router.route("/cart").post(isLoggedIn,changeUserIdForTableName, restrictTo(UserRole.Student), asyncErrorHandler(insertIntoCartTableOfStudent)).get(isLoggedIn,changeUserIdForTableName,restrictTo(UserRole.Student),asyncErrorHandler(fetchStudentCartItems))

router.route("/cart/:id").delete(isLoggedIn,restrictTo(UserRole.Student)).delete(asyncErrorHandler(deleteStudentCartItem))


export default router;