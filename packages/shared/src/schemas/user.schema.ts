import { z } from 'zod';

export const LedgerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  icon: z.string().default('📗'),
  isDefault: z.boolean().default(false),
  payday: z.number().min(1).max(31).nullable(),
  budgetMode: z.enum(['carry_over', 'accumulate']).default('carry_over'),
  disposableIncome: z.number().default(0),
  savingsAmount: z.number().default(0),
  emergencyFundAmount: z.number().default(0),
  emergencyFundGoal: z.number().default(0),
  emergencyFundEnabled: z.boolean().default(true),
  netWorth: z.number().default(0),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const UserProfileSchema = z.object({
  userId: z.string(),
  avatarUrl: z.string().url().optional().nullable(),
  defaultLedgerId: z.string().optional().nullable(),
  // 聚合字段 (从当前账本映射)
  payday: z.number().min(1).max(31).nullable(),
  budgetMode: z.enum(['carry_over', 'accumulate']).default('carry_over'),
  netWorth: z.number().default(0),
  disposableIncome: z.number().default(0),
  savingsAmount: z.number().default(0),
  emergencyFundAmount: z.number().default(0),
  emergencyFundGoal: z.number().default(0),
  emergencyFundEnabled: z.boolean().default(true),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const UserPreferencesUpdateSchema = z.object({
  avatarUrl: z.string().url().optional(),
  payday: z.number().min(1).max(31).optional(),
  budgetMode: z.enum(['carry_over', 'accumulate']).optional(),
  disposableIncome: z.number().optional(),
  savingsAmount: z.number().optional(),
  emergencyFundAmount: z.number().optional(),
  emergencyFundGoal: z.number().optional(),
  emergencyFundEnabled: z.boolean().optional(),
});

export type Ledger = z.infer<typeof LedgerSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserPreferencesUpdate = z.infer<typeof UserPreferencesUpdateSchema>;
