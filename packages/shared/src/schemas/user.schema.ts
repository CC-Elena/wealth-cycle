import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const UserProfileSchema = z.object({
  userId: z.string(),
  payday: z.number().min(1).max(31).nullable(),
  budgetMode: z.enum(['carry_over', 'accumulate']).default('carry_over'),
  netWorth: z.number().default(0),
  emergencyFundEnabled: z.boolean().default(true),
  avatarUrl: z.string().url().optional().nullable(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const UserPreferencesUpdateSchema = z.object({
  payday: z.number().min(1).max(31).optional(),
  budgetMode: z.enum(['carry_over', 'accumulate']).optional(),
  emergencyFundEnabled: z.boolean().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserPreferencesUpdate = z.infer<typeof UserPreferencesUpdateSchema>;
