import express from "express";
import { getProfile, updateProfile } from "../controllers/studentController";

const router = express.Router();

router.get("/profile", getProfile);
router.put("/profile/:id", updateProfile);

export default router;
