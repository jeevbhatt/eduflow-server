import express from "express";
import { getMyInstitute, updateMyInstitute } from "../controllers/instituteController";

const router = express.Router();

router.get("/me", getMyInstitute);
router.put("/me", updateMyInstitute);

export default router;
