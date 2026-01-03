import { Request, Response, NextFunction } from 'express';
import Institute from '../database/models/instituteModel';
import User from '../database/models/userModel';
import { Op } from 'sequelize';
import sequelize from '../database/connection';
import sendMail from './sendMail';

/**
 * Soft Delete Service - Handles account deletion and data cleanup
 */

/**
 * Soft delete a user account
 */
export const softDeleteUser = async (
  userId: string,
  deletedBy: string,
  reason: string
): Promise<boolean> => {
  const user = await User.findByPk(userId);
  if (!user) return false;

  const permanentDeleteDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await user.update({
    deletedBy,
    deleteReason: reason,
    scheduledPermanentDelete: permanentDeleteDate,
    accountStatus: 'inactive',
  });

  // Soft delete (paranoid mode handles deletedAt)
  await user.destroy();

  return true;
};

/**
 * Soft delete an institute and all associated data
 */
export const softDeleteInstitute = async (
  instituteId: string,
  deletedBy: string,
  reason: string
): Promise<boolean> => {
  const institute = await Institute.findByPk(instituteId);
  if (!institute) return false;

  const permanentDeleteDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await institute.update({
    deletedBy,
    deleteReason: reason,
    scheduledDataDeletion: permanentDeleteDate,
    isActive: false,
    accountStatus: 'suspended',
  });

  // Soft delete (paranoid mode handles deletedAt)
  await institute.destroy();

  // Notify owner
  const owner = await User.findByPk(institute.ownerId);
  if (owner) {
    await sendMail({
      to: owner.email,
      subject: 'Account Deletion Scheduled - EduFlow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Account Deletion Scheduled</h2>
          <p>Hi ${owner.firstName},</p>
          <p>Your institute <strong>${institute.instituteName}</strong> has been scheduled for deletion.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Permanent deletion date:</strong> ${permanentDeleteDate.toLocaleDateString()}</p>
          <p>You have 30 days to contact support if you wish to restore your account.</p>
        </div>
      `,
    });
  }

  return true;
};

/**
 * Restore a soft-deleted user
 */
export const restoreUser = async (userId: string): Promise<boolean> => {
  const user = await User.findOne({
    where: { id: userId },
    paranoid: false, // Include soft-deleted
  });

  if (!user) return false;

  await user.restore();
  await user.update({
    deletedBy: null,
    deleteReason: null,
    scheduledPermanentDelete: null,
    accountStatus: 'active',
  });

  return true;
};

/**
 * Restore a soft-deleted institute
 */
export const restoreInstitute = async (instituteId: string): Promise<boolean> => {
  const institute = await Institute.findOne({
    where: { id: instituteId },
    paranoid: false,
  });

  if (!institute) return false;

  await institute.restore();
  await institute.update({
    deletedBy: null,
    deleteReason: null,
    scheduledDataDeletion: null,
    isActive: true,
    accountStatus: 'active',
  });

  return true;
};

/**
 * Permanently delete expired soft-deleted accounts
 */
export const cleanupExpiredAccounts = async (): Promise<{ users: number; institutes: number }> => {
  const now = new Date();

  // Find users scheduled for permanent deletion
  const expiredUsers = await User.findAll({
    where: {
      scheduledPermanentDelete: { [Op.lt]: now },
    },
    paranoid: false,
  });

  // Permanently delete
  for (const user of expiredUsers) {
    await user.destroy({ force: true });
  }

  // Find institutes scheduled for data deletion
  const expiredInstitutes = await Institute.findAll({
    where: {
      scheduledDataDeletion: { [Op.lt]: now },
    },
    paranoid: false,
  });

  // Delete institute data and tables
  for (const institute of expiredInstitutes) {
    await deleteInstituteData(institute.instituteNumber);
    await institute.destroy({ force: true });
  }

  return {
    users: expiredUsers.length,
    institutes: expiredInstitutes.length,
  };
};

/**
 * Delete all institute-specific tables and data
 */
export const deleteInstituteData = async (instituteNumber: string): Promise<void> => {
  const tables = [
    `students_${instituteNumber}`,
    `teachers_${instituteNumber}`,
    `library_${instituteNumber}`,
    `library_borrow_${instituteNumber}`,
    `courses_${instituteNumber}`,
    `categories_${instituteNumber}`,
    `attendance_${instituteNumber}`,
    `assessments_${instituteNumber}`,
    `results_${instituteNumber}`,
    `fees_${instituteNumber}`,
    `integration_credentials_${instituteNumber}`,
  ];

  for (const table of tables) {
    try {
      await sequelize.query(`DROP TABLE IF EXISTS \`${table}\``);
    } catch (error) {
      console.error(`Failed to drop table ${table}:`, error);
    }
  }
};

/**
 * Get soft-deleted accounts list
 */
export const getDeletedAccounts = async (): Promise<{
  users: User[];
  institutes: Institute[];
}> => {
  const users = await User.findAll({
    where: { deletedAt: { [Op.ne]: null } },
    paranoid: false,
    attributes: ['id', 'email', 'firstName', 'lastName', 'deletedAt', 'deleteReason', 'scheduledPermanentDelete'],
  });

  const institutes = await Institute.findAll({
    where: { deletedAt: { [Op.ne]: null } },
    paranoid: false,
    attributes: ['id', 'instituteName', 'email', 'deletedAt', 'deleteReason', 'scheduledDataDeletion'],
  });

  return { users, institutes };
};

export default {
  softDeleteUser,
  softDeleteInstitute,
  restoreUser,
  restoreInstitute,
  cleanupExpiredAccounts,
  deleteInstituteData,
  getDeletedAccounts,
};
