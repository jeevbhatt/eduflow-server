import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "institutes",
  modelName: "Institute",
  timestamps: true,
  paranoid: true, // Enable soft delete
})
class Institute extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare instituteName: string;

  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  declare subdomain: string; // e.g., 'harvard', 'mit'

  @Column({
    type: DataType.STRING,
  })
  declare fullDomain: string; // e.g., 'harvard.eduflow.com.np'

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare instituteNumber: string;

  @Column({
    type: DataType.TEXT,
  })
  declare securityToken: string; // For subdomain validation with Cloudflare

  @Column({
    type: DataType.STRING,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
  })
  declare phone: string;

  @Column({
    type: DataType.STRING,
  })
  declare address: string;

  @Column({
    type: DataType.STRING,
  })
  declare logo: string;

  @Column({
    type: DataType.STRING,
  })
  declare primaryColor: string;

  @Column({
    type: DataType.STRING,
  })
  declare secondaryColor: string;

  // ============================================
  // TAX/LEGAL (Profile Completion)
  // ============================================
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare panNo: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare vatNo: string;

  // ============================================
  // VERIFICATION STATUS
  // ============================================
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare emailVerified: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare phoneVerified: boolean;

  // ============================================
  // SUBSCRIPTION & TRIAL
  // ============================================
  @Column({
    type: DataType.ENUM("trial", "basic", "pro", "enterprise"),
    defaultValue: "trial",
  })
  declare subscriptionTier: string;

  @Column({
    type: DataType.DATE,
  })
  declare subscriptionExpiresAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare trialStartedAt: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare trialRemindersSent: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastReminderSentAt: Date;

  // ============================================
  // PROFILE COMPLETION
  // ============================================
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare profileCompletionPercent: number;

  // ============================================
  // ACCOUNT STATUS
  // ============================================
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.ENUM('active', 'trial', 'expired', 'suspended', 'paused'),
    defaultValue: 'trial',
  })
  declare accountStatus: string;

  // ============================================
  // SUPER-ADMIN CONTROLS (Pause)
  // ============================================
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare pausedAt: Date;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare pausedBy: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare pauseReason: string;

  // ============================================
  // SOFT DELETE
  // ============================================
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare deletedBy: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare deleteReason: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare scheduledDataDeletion: Date; // 30 days after expiry for data wipe

  // ============================================
  // OWNER
  // ============================================
  @Column({
    type: DataType.UUID,
  })
  declare ownerId: string; // FK to User who owns this institute
}

export default Institute;
