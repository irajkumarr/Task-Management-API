import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const AuthProvider = {
  LOCAL: 'local',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
} as const;

export const Role = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];
export type Role = (typeof Role)[keyof typeof Role];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullName!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true, select: false })
  password?: string;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider!: AuthProvider;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ nullable: true })
  verificationToken?: string;

  @Column({ nullable: true })
  verificationTokenExpiry?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  hashedRefreshToken?: string;

  @Column({ nullable: true })
  passwordResetToken?: string;

  @Column({ nullable: true })
  passwordResetExpiry?: Date;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
