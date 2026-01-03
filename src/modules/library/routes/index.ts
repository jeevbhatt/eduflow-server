import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getResources } from "../controllers/getResources.controller";
import { getResourceById } from "../controllers/getResourceById.controller";
import { createResource } from "../controllers/createResource.controller";
import { updateResource } from "../controllers/updateResource.controller";
import { deleteResource } from "../controllers/deleteResource.controller";
import { borrowResource } from "../controllers/borrowResource.controller";
import { returnResource } from "../controllers/returnResource.controller";
import { getStudentHistory } from "../controllers/getStudentHistory.controller";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/", authenticate, getResources);
router.get("/:id", authenticate, getResourceById);
router.post("/", authenticate, upload.single("thumbnail"), createResource);
router.put("/:id", authenticate, upload.single("thumbnail"), updateResource);
router.delete("/:id", authenticate, deleteResource);
router.post("/borrow", authenticate, borrowResource);
router.post("/return", authenticate, returnResource);
router.get("/history/:studentId", authenticate, getStudentHistory);

export default router;
