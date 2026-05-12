import { z } from 'zod';
import { IdSchema, TimestampsSchema } from './common';
import { UserRoleSchema } from './user';

export const PermissionSchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string().nullable(),
  resource: z.string(),
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'MANAGE']),
});

export type Permission = z.infer<typeof PermissionSchema>;

export const RoleWithPermissionsSchema = z.object({
  role: UserRoleSchema,
  permissions: z.array(PermissionSchema),
});

export type RoleWithPermissions = z.infer<typeof RoleWithPermissionsSchema>;

export const MenuItemSchema = z.object({
  id: IdSchema,
  parentId: IdSchema.nullable(),
  label: z.string(),
  icon: z.string().nullable(),
  route: z.string().nullable(),
  order: z.number().int(),
  isEnabled: z.boolean(),
  requiredPermission: z.string().nullable(),
  visibleToRoles: z.array(UserRoleSchema),
  ...TimestampsSchema.shape,
});

export type MenuItem = z.infer<typeof MenuItemSchema>;

export interface MenuItemWithChildren extends MenuItem {
  children: MenuItemWithChildren[];
}

export const CreateMenuItemSchema = z.object({
  parentId: IdSchema.optional(),
  label: z.string().min(1).max(100),
  icon: z.string().optional(),
  route: z.string().optional(),
  order: z.number().int().default(0),
  isEnabled: z.boolean().default(true),
  requiredPermission: z.string().optional(),
  visibleToRoles: z.array(UserRoleSchema).default(['SUPER_ADMIN', 'ADMIN']),
});

export type CreateMenuItem = z.infer<typeof CreateMenuItemSchema>;

export const ModerationActionSchema = z.enum([
  'APPROVE',
  'REJECT',
  'FLAG',
  'UNFLAG',
  'SUSPEND',
  'UNSUSPEND',
  'BAN',
  'UNBAN',
  'DELETE',
  'RESTORE',
]);
export type ModerationAction = z.infer<typeof ModerationActionSchema>;

export const ModerationLogSchema = z.object({
  id: IdSchema,
  moderatorId: IdSchema,
  targetType: z.enum(['USER', 'MARKET', 'CONTENT', 'TRADE']),
  targetId: IdSchema,
  action: ModerationActionSchema,
  reason: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  ...TimestampsSchema.shape,
});

export type ModerationLog = z.infer<typeof ModerationLogSchema>;

export const AuditLogSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  action: z.string(),
  resource: z.string(),
  resourceId: IdSchema.nullable(),
  changes: z.record(z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.date(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export const AnnouncementSchema = z.object({
  id: IdSchema,
  title: z.string(),
  content: z.string(),
  type: z.enum(['INFO', 'WARNING', 'ALERT', 'MAINTENANCE']),
  isActive: z.boolean(),
  startsAt: z.date(),
  endsAt: z.date().nullable(),
  targetRoles: z.array(UserRoleSchema).nullable(),
  createdBy: IdSchema,
  ...TimestampsSchema.shape,
});

export type Announcement = z.infer<typeof AnnouncementSchema>;

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
  };
  markets: {
    total: number;
    active: number;
    pendingReview: number;
    resolved: number;
  };
  trades: {
    total: number;
    today: number;
    volume24h: number;
    volumeChange: number;
  };
  content: {
    total: number;
    pendingReview: number;
    approved: number;
  };
}

export interface FraudAlert {
  id: string;
  userId: string;
  alertType: 'UNUSUAL_VOLUME' | 'PATTERN_DETECTED' | 'MANIPULATION' | 'WASH_TRADING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  metadata: Record<string, unknown>;
  isResolved: boolean;
  createdAt: Date;
}
