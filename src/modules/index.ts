import express, { Router } from "express";

// Feature Routes
import authRoutes from "./auth/routes/index";
import courseRoutes from "./course/routes/index";
import teacherRoutes from "./teacher/routes/index";
import studentRoutes from "./student/routes/index";
import categoryRoutes from "./category/routes/index";
import analyticsRoutes from "./analytics/routes/index";
import libraryRoutes from "./library/routes/index";
import financeRoutes from "./finance/routes/index";
import forumRoutes from "./forum/routes/index";
import studyGroupRoutes from "./studyGroup/routes/index";
import supportRoutes from "./support/routes/index";
import notificationRoutes from "./notification/routes/index";
import instituteRoutes from "./institute/routes/index";

const router: Router = express.Router();

router.use("/auth", authRoutes);
router.use("/course", courseRoutes);
router.use("/teacher", teacherRoutes);
router.use("/student", studentRoutes);
router.use("/category", categoryRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/library", libraryRoutes);
router.use("/finance", financeRoutes);
router.use("/forum", forumRoutes);
router.use("/study-group", studyGroupRoutes);
router.use("/support", supportRoutes);
router.use("/notification", notificationRoutes);
router.use("/institute", instituteRoutes);

export default router;
