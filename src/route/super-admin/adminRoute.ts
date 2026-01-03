import * as express from "express";
import { Router, Request, Response } from "express";
import AccountManagementController from "../../controller/super-admin/accountManagementController";
import asyncErrorHandler from "../../services/asyncErrorHandler";
import { isLoggedIn, restrictTo } from "../../middleware/middleware";
import { UserRole } from "../../middleware/type";
import schedulerService from "../../services/schedulerService";

const router: Router = express.Router();

// All routes require super-admin role
router.use(isLoggedIn);
router.use(restrictTo(UserRole.SuperAdmin));

// ============================================
// INSTITUTE MANAGEMENT
// ============================================
// Get all institutes
router.get("/institutes", asyncErrorHandler(AccountManagementController.getAllInstitutes));

// Get single institute completion
router.get("/institutes/:id/completion", asyncErrorHandler(AccountManagementController.getInstituteCompletion));

// Pause/Unpause institute
router.post("/institutes/:id/pause", asyncErrorHandler(AccountManagementController.pauseInstitute));
router.post("/institutes/:id/unpause", asyncErrorHandler(AccountManagementController.unpauseInstitute));

// Trial management
router.post("/institutes/:id/extend-trial", asyncErrorHandler(AccountManagementController.extendTrial));
router.post("/institutes/:id/upgrade", asyncErrorHandler(AccountManagementController.forceUpgrade));

// Delete institute
router.delete("/institutes/:id", asyncErrorHandler(AccountManagementController.deleteInstitute));
router.delete("/institutes/:id/data", asyncErrorHandler(AccountManagementController.deleteInstituteData));

// ============================================
// DELETED ACCOUNTS MANAGEMENT
// ============================================
router.get("/deleted-accounts", asyncErrorHandler(AccountManagementController.getDeletedAccounts));
router.post("/accounts/:id/restore", asyncErrorHandler(AccountManagementController.restoreAccount));

// ============================================
// SCHEDULER CONTROL (Manual triggers for testing)
// ============================================
router.post("/scheduler/trigger", asyncErrorHandler(async (req: Request, res: Response) => {
  const { job } = req.body;

  if (!['reminder', 'expiration', 'cleanup'].includes(job)) {
    res.status(400).json({ message: 'Invalid job name. Use: reminder, expiration, cleanup' });
    return;
  }

  await schedulerService.runManualJob(job);
  res.status(200).json({ message: `Job "${job}" completed successfully` });
}));

export default router;
