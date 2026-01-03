import { Table, Column, Model, DataType } from "sequelize-typescript";

@Table({
  tableName: "users",
  modelName: "User",
  timestamps: true,
  paranoid: true, // Enable soft delete
})

class User extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING,
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @Column({
    type: DataType.ENUM("admin", "institute", "super-admin", "student", "teacher"),
    defaultValue: "student",
  })
  declare role: string;

  @Column({
    type: DataType.STRING
  })
  declare currentInstituteNumber: string;

  // MFA
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare mfaSecret: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare mfaEnabled: boolean;

  // Profile
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare phone: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare bio: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare profileImage: string;

  // OAuth
  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  declare googleId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  declare microsoftId: string;

  // ============================================
  // EMAIL VERIFICATION
  // ============================================
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare emailVerified: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare verificationToken: string; // Hashed OTP

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare verificationExpires: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare verificationAttempts: number; // Rate limiting

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastVerificationSent: Date;

  // ============================================
  // PHONE VERIFICATION
  // ============================================
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare phoneVerified: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare phoneVerificationToken: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare phoneVerificationExpires: Date;

  // ============================================
  // ACCOUNT STATUS
  // ============================================
  @Column({
    type: DataType.ENUM('active', 'suspended', 'inactive', 'pending_verification'),
    defaultValue: 'pending_verification',
  })
  declare accountStatus: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare suspensionReason: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare suspendedAt: Date;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare suspendedBy: string;

  // ============================================
  // SOFT DELETE (paranoid mode handles deletedAt)
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
  declare scheduledPermanentDelete: Date; // 30 days after soft delete
}

export default User;
