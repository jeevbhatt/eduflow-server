import * as express from "express";
import { Router } from "express";
import {
    createFeeStructure,
    getFeeStructures,
    recordPayment,
    getStudentPayments,
    getFinanceStats
} from "../../../controller/institute/finance/feeController";
import asyncErrorHandler from "../../../services/asyncErrorHandler";
import { isLoggedIn, restrictTo } from "../../../middleware/middleware";
import { academicAuditLog } from "../../../middleware/securityMiddleware";
import { UserRole } from "../../../middleware/type";

const router: Router = express.Router();

router.route("/stats").get(isLoggedIn, asyncErrorHandler(getFinanceStats));

router.route("/structure")
    .post(isLoggedIn, restrictTo(UserRole.Institute), academicAuditLog, asyncErrorHandler(createFeeStructure))
    .get(isLoggedIn, asyncErrorHandler(getFeeStructures));

router.route("/payment")
    .post(isLoggedIn, restrictTo(UserRole.Institute), academicAuditLog, asyncErrorHandler(recordPayment));

router.route("/student/:studentId").get(isLoggedIn, asyncErrorHandler(getStudentPayments));

export default router;
