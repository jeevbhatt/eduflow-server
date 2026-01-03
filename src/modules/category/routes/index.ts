import { Router } from "express";
import { authenticate } from "../../../core/middleware/authenticate";
import { getAll, create, deleteCategory } from "../controllers";

const router = Router();

router.get("/", authenticate, getAll);
router.post("/", authenticate, create);
router.delete("/:id", authenticate, deleteCategory);

export default router;
