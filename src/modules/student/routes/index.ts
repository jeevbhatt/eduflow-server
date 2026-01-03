import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getProfile } from "../controllers/getProfile.controller";
import { getStudents } from "../controllers/getStudents.controller";
import { getStudentById } from "../controllers/getStudentById.controller";
import { createStudent } from "../controllers/createStudent.controller";
import { updateProfile } from "../controllers/updateProfile.controller";
import { deleteStudent } from "../controllers/deleteStudent.controller";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/profile", authenticate, getProfile);
router.get("/", authenticate, getStudents);
router.get("/:id", authenticate, getStudentById);
router.post("/", authenticate, upload.single("studentImage"), createStudent);
router.put("/:id", authenticate, upload.single("studentImage"), updateProfile);
router.delete("/:id", authenticate, deleteStudent);

export default router;
