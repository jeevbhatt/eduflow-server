import { Request, Response } from 'express';
import Institute from '../../database/models/instituteModel';
import User from '../../database/models/userModel';
import trialService from '../../services/trialService';
import softDeleteService from '../../services/softDeleteService';
import profileCompletionService from '../../services/profileCompletionService';
import { Op } from 'sequelize';

// Extended request with user info
interface IExtendedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    currentInstituteNumber?: string;
  };
}

/**
 * Account Management Controller - Super Admin Controls
 */
class AccountManagementController {
  /**
   * Pause an institute account
   * POST /api/admin/institutes/:id/pause
   */
  public static pauseInstitute = async (req: IExtendedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    if (!reason) {
      return res.status(400).json({ message: 'Pause reason is required' });
    }

    try {
      const institute = await Institute.findByPk(id);
      if (!institute) {
        return res.status(404).json({ message: 'Institute not found' });
      }

      await institute.update({
        pausedAt: new Date(),
        pausedBy: adminId,
        pauseReason: reason,
        accountStatus: 'paused',
        isActive: false,
      });

      res.status(200).json({
        message: 'Institute paused successfully',
        institute: {
          id: institute.id,
          instituteName: institute.instituteName,
          pausedAt: institute.pausedAt,
          pauseReason: reason,
        }
      });

    } catch (error: any) {
      res.status(500).json({ message: 'Failed to pause institute', error: error.message });
    }
  };

  /**
   * Unpause an institute account
   * POST /api/admin/institutes/:id/unpause
   */
  public static unpauseInstitute = async (req: IExtendedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const institute = await Institute.findByPk(id);
      if (!institute) {
        return res.status(404).json({ message: 'Institute not found' });
      }

      await institute.update({
        pausedAt: null,
        pausedBy: null,
        pauseReason: null,
        accountStatus: institute.subscriptionTier === 'trial' ? 'trial' : 'active',
        isActive: true,
      });

      res.status(200).json({
        message: 'Institute unpaused successfully',
        institute: {
          id: institute.id,
          instituteName: institute.instituteName,
          accountStatus: institute.accountStatus,
        }
      });

    } catch (error: any) {
      res.status(500).json({ message: 'Failed to unpause institute', error: error.message });
    }
  };

  /**
   * Extend trial period
   * POST /api/admin/institutes/:id/extend-trial
   */
  public static extendTrial = async (req: IExtendedRequest, res: Response) => {
    const { id } = req.params;
    const { days } = req.body;
    const adminId = req.user?.id;

    if (!days || days < 1 || days > 365) {
      return res.status(400).json({ message: 'Days must be between 1 and 365' });
    }

    try {
      const success = await trialService.extendTrial(id, days, adminId!);
      if (!success) {
        return res.status(404).json({ message: 'Institute not found' });
      }

      const institute = await Institute.findByPk(id);

      res.status(200).json({
        message: `Trial extended by ${days} days`,
        newExpiryDate: institute?.subscriptionExpiresAt,
      });

    } catch (error: any) {
      res.status(500).json({ message: 'Failed to extend trial', error: error.message });
    }
  };

  /**
   * Force upgrade subscription tier
   * POST /api/admin/institutes/:id/upgrade
   */
  public static forceUpgrade = async (req: IExtendedRequest, res: Response) => {
    const { id } = req.params;
    const { tier, durationMonths = 12 } = req.body;

    if (!['basic', 'pro', 'enterprise'].includes(tier)) {
      return res.status(400).json({ message: 'Invalid subscription tier' });
    }

    try {
      const success = await trialService.upgradeSubscription(id, tier, durationMonths);
      if (!success) {
        return res.status(404).json({ message: 'Institute not found' });
      }

      res.status(200).json({
        message: `Subscription upgraded to ${tier}`,
        tier,
        durationMonths,
      });

    } catch (error: any) {
      res.status(500).json({ message: 'Failed to upgrade subscription', error: error.message });
    }
  };

  /**
   * Soft delete an institute
   * DELETE /api/admin/institutes/:id
   */
  public static deleteInstitute = async (req: IExtendedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user?.id;

    if (!reason) {
      return res.status(400).json({ message: 'Delete reason is required' });
    }

    try {
      const success = await softDeleteService.softDeleteInstitute(id, adminId!, reason);
      if (!success) {
        return res.status(404).json({ message: 'Institute not found' });
      }

      res.status(200).json({
        message: 'Institute scheduled for deletion',
        permanentDeletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

    } catch (error: any) {
      res.status(500).json({ message: 'Failed to delete institute', error: error.message });
    }
  };

  /**
   * Immediately delete institute data (permanent)
   * DELETE /api/admin/institutes/:id/data
   */
  public static deleteInstituteData = async (req: IExtendedRequest, res: Response) => {
    const { id } = req.params;
    const { confirmDelete } = req.body;

    if (confirmDelete !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        message: 'Must confirm deletion by sending confirmDelete: "DELETE_ALL_DATA"'
      });
    }

    try {
      const institute = await Institute.findOne({ where: { id }, paranoid: false });
      if (!institute) {
        return res.status(404).json({ message: 'Institute not found' });
      }

      // Delete all institute data
      await softDeleteService.deleteInstituteData(institute.instituteNumber);

      // Permanently delete institute record
      await institute.destroy({ force: true });

      res.status(200).json({ message: 'Institute data permanently deleted' });

    } catch (error: any) {
      res.status(500).json({ message: 'Failed to delete data', error: error.message });
    }
  };

  /**
   * Get list of deleted accounts
   * GET /api/admin/deleted-accounts
   */
  public static getDeletedAccounts = async (req: IExtendedRequest, res: Response) => {
    try {
      const deleted = await softDeleteService.getDeletedAccounts();
      res.status(200).json(deleted);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to get deleted accounts', error: error.message });
    }
  };

  /**
   * Restore a deleted account
   * POST /api/admin/accounts/:id/restore
   */
  public static restoreAccount = async (req: IExtendedRequest, res: Response) => {
    const { id } = req.params;
    const { type } = req.body; // 'user' or 'institute'

    if (!['user', 'institute'].includes(type)) {
      return res.status(400).json({ message: 'Type must be "user" or "institute"' });
    }

    try {
      const success = type === 'user'
        ? await softDeleteService.restoreUser(id)
        : await softDeleteService.restoreInstitute(id);

      if (!success) {
        return res.status(404).json({ message: `${type} not found` });
      }

      res.status(200).json({ message: `${type} restored successfully` });

    } catch (error: any) {
      res.status(500).json({ message: 'Failed to restore account', error: error.message });
    }
  };

  /**
   * Get all institutes with status info
   * GET /api/admin/institutes
   */
  public static getAllInstitutes = async (req: IExtendedRequest, res: Response) => {
    const { status, includeDeleted } = req.query;

    try {
      const where: any = {};

      if (status) {
        where.accountStatus = status;
      }

      const institutes = await Institute.findAll({
        where,
        paranoid: includeDeleted !== 'true',
        order: [['createdAt', 'DESC']],
        attributes: [
          'id', 'instituteName', 'subdomain', 'email',
          'subscriptionTier', 'subscriptionExpiresAt', 'accountStatus',
          'isActive', 'pausedAt', 'pauseReason', 'deletedAt',
          'profileCompletionPercent', 'trialRemindersSent',
          'createdAt'
        ],
      });

      // Add days remaining for trial
      const enriched = institutes.map(inst => ({
        ...inst.toJSON(),
        trialDaysRemaining: inst.subscriptionTier === 'trial' && inst.subscriptionExpiresAt
          ? trialService.getTrialDaysRemaining(inst.subscriptionExpiresAt)
          : null,
      }));

      res.status(200).json({ institutes: enriched });

    } catch (error: any) {
      res.status(500).json({ message: 'Failed to get institutes', error: error.message });
    }
  };

  /**
   * Get institute profile completion details
   * GET /api/admin/institutes/:id/completion
   */
  public static getInstituteCompletion = async (req: IExtendedRequest, res: Response) => {
    const { id } = req.params;

    try {
      const institute = await Institute.findByPk(id);
      if (!institute) {
        return res.status(404).json({ message: 'Institute not found' });
      }

      const completion = profileCompletionService.getCompletionDetails(institute);
      res.status(200).json(completion);

    } catch (error: any) {
      res.status(500).json({ message: 'Failed to get completion', error: error.message });
    }
  };
}

export default AccountManagementController;
