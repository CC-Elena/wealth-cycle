import { z } from 'zod';

// ─── Fixed Bills ───
export const FixedBillSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  amount: z.number().positive(),
  categoryId: z.string().optional(),
  type: z.enum(['expense', 'transfer']).default('expense'),
  isActive: z.boolean().default(true),
  dueDateNext: z.union([z.string().datetime(), z.date()]).optional(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const CreateFixedBillSchema = z.object({
  name: z.string().min(1),
  ledgerId: z.string().optional(),
  amount: z.number().positive(),
  categoryId: z.string().optional(),
  type: z.enum(['expense', 'transfer']).default('expense'),
  isActive: z.boolean().default(true),
});

export const UpdateFixedBillSchema = CreateFixedBillSchema.partial();

export type FixedBill = z.infer<typeof FixedBillSchema>;
export type CreateFixedBill = z.infer<typeof CreateFixedBillSchema>;
export type UpdateFixedBill = z.infer<typeof UpdateFixedBillSchema>;

// ─── Payroll Events ───
export const PayrollEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  salaryAmount: z.number().positive(),
  fixedBillsTotal: z.number().default(0),
  budgetReplenishmentTotal: z.number().default(0),
  disposableIncomeGenerated: z.number().default(0),
  date: z.union([z.string().datetime(), z.date()]),
  snapshot: z.record(z.any()).optional(), // 存储发薪时的各项状态
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const CreatePayrollEventSchema = z.object({
  salaryAmount: z.number().positive(),
  ledgerId: z.string().optional(),
  fixedBillIds: z.array(z.string()).optional(), // 本次发薪考虑的账单
  budgetReplenishment: z.record(z.number()).optional(), // 各个预算池的补足额度 {budgetId: amount}
});

export type PayrollEvent = z.infer<typeof PayrollEventSchema>;
export type CreatePayrollEvent = z.infer<typeof CreatePayrollEventSchema>;
