import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getAll, getOne, create, update, deleteCourse } from "../controllers";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getOne);
router.post("/", authenticate, upload.single("thumbnail"), create);
router.put("/:id", authenticate, upload.single("thumbnail"), update);
router.delete("/:id", authenticate, deleteCourse);

export default router;
