import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"
import { Exclude } from "class-transformer"

export enum UserRole {
  PLAYER = "player",
  ADMIN = "admin",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  @Index()
  email: string

  @Column()
  @Exclude()
  password: string

  @Column({ nullable: true })
  @Index()
  walletAddress: string

  @Column({ nullable: true })
  username: string

  @Column({ nullable: true })
  bio: string

  @Column({ nullable: true })
  avatarUrl: string

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  role: UserRole

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus

  @Column({ default: false })
  emailVerified: boolean

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string

  @Column({ nullable: true })
  @Exclude()
  passwordResetToken: string

  @Column({ nullable: true })
  @Exclude()
  passwordResetExpires: Date

  @Column({ nullable: true })
  lastLoginAt: Date

  @Column({ default: 0 })
  loginAttempts: number

  @Column({ nullable: true })
  lockedUntil: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  // Virtual property to check if account is locked
  get isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date())
  }
}
