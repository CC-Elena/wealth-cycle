import { z } from 'zod';

// ─── Category ───
export const CategoryTypeEnum = z.enum(['expense', 'income', 'transfer']);
export type CategoryType = z.infer<typeof CategoryTypeEnum>;

export const CategorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  parentId: z.string().nullable(),
  type: CategoryTypeEnum,
  icon: z.string().default('📁'),
  isSystem: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1),
  parentId: z.string().nullable().optional(),
  type: CategoryTypeEnum.default('expense'),
  icon: z.string().default('📁'),
  sortOrder: z.number().int().default(0),
});

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategory = z.infer<typeof CreateCategorySchema>;
