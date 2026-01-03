import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getFeeStructures } from "../controllers/getFeeStructures.controller";
import { createFeeStructure } from "../controllers/createFeeStructure.controller";
import { recordPayment } from "../controllers/recordPayment.controller";
import { getStudentPayments } from "../controllers/getStudentPayments.controller";
import { getFinanceStats } from "../controllers/getFinanceStats.controller";

const router = Router();

router.get("/fee-structures", authenticate, getFeeStructures);
router.post("/fee-structures", authenticate, createFeeStructure);
router.post("/payments", authenticate, recordPayment);
router.get("/payments/student/:studentId", authenticate, getStudentPayments);
router.get("/stats", authenticate, getFinanceStats);

export default router;
