import { z } from 'zod';

// ─── Budget Plan ───
export const BudgetPeriodEnum = z.enum(['weekly', 'monthly', 'custom']);
export const BudgetSettlementEnum = z.enum(['carry_over', 'accumulate']);

export const BudgetPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  categoryIds: z.array(z.string()).min(1), // 绑定的分类 ID 列表
  totalAmount: z.number().positive(), // 目标额度
  spentAmount: z.number().default(0), // 已消耗额度（计算字段）
  period: BudgetPeriodEnum.default('monthly'),
  settlement: BudgetSettlementEnum.default('carry_over'),
  icon: z.string().default('💰'),
  color: z.string().default('#6C5DD3'),
  priority: z.number().int().default(0), // 优先级（缩减分配时用）
  isActive: z.boolean().default(true),
  periodStart: z.union([z.string().datetime(), z.date()]).optional(),
  periodEnd: z.union([z.string().datetime(), z.date()]).optional(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const CreateBudgetPlanSchema = z.object({
  name: z.string().min(1),
  ledgerId: z.string().optional(),
  categoryIds: z.array(z.string()).min(1),
  totalAmount: z.number().positive(),
  period: BudgetPeriodEnum.default('monthly'),
  settlement: BudgetSettlementEnum.default('carry_over'),
  icon: z.string().default('💰'),
  color: z.string().default('#6C5DD3'),
  priority: z.number().int().default(0),
});

export const UpdateBudgetPlanSchema = z.object({
  name: z.string().min(1).optional(),
  categoryIds: z.array(z.string()).min(1).optional(),
  totalAmount: z.number().positive().optional(),
  period: BudgetPeriodEnum.optional(),
  settlement: BudgetSettlementEnum.optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export type BudgetPlan = z.infer<typeof BudgetPlanSchema>;
export type CreateBudgetPlan = z.infer<typeof CreateBudgetPlanSchema>;
export type UpdateBudgetPlan = z.infer<typeof UpdateBudgetPlanSchema>;
