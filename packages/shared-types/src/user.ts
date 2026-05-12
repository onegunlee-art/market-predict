import { z } from 'zod';
import { IdSchema, TimestampsSchema } from './common';

export const AuthProviderSchema = z.enum(['EMAIL', 'KAKAO', 'GOOGLE']);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

export const UserRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'ANALYST',
  'VERIFIED_CREATOR',
  'USER',
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING']);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserSchema = z.object({
  id: IdSchema,
  email: z.string().email().nullable(),
  username: z.string().min(2).max(30).nullable(),
  displayName: z.string().min(1).max(50).nullable(),
  avatarUrl: z.string().url().nullable(),
  authProvider: AuthProviderSchema,
  kakaoId: z.string().nullable(),
  googleId: z.string().nullable(),
  balance: z.number().nonnegative(),
  reputationScore: z.number().int(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  emailVerified: z.boolean(),
  lastLoginAt: z.date().nullable(),
  ...TimestampsSchema.shape,
});

export type User = z.infer<typeof UserSchema>;

export const UserPublicSchema = UserSchema.pick({
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  reputationScore: true,
});

export type UserPublic = z.infer<typeof UserPublicSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(2).max(30).optional(),
  displayName: z.string().min(1).max(50).optional(),
  authProvider: AuthProviderSchema,
  kakaoId: z.string().optional(),
  googleId: z.string().optional(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  username: z.string().min(2).max(30).optional(),
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export const LoginCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

export const RegisterCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(2).max(30),
  displayName: z.string().min(1).max(50).optional(),
});

export type RegisterCredentials = z.infer<typeof RegisterCredentialsSchema>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  user: User;
  tokens: AuthTokens;
}
