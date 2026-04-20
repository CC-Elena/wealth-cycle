import { z } from 'zod';

// ─── Transaction ───
export const TransactionTypeEnum = z.enum(['expense', 'income', 'refund']);
export type TransactionType = z.infer<typeof TransactionTypeEnum>;

export const TransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number().positive(),
  categoryId: z.string(),
  type: TransactionTypeEnum,
  memo: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  date: z.union([z.string().datetime(), z.date()]),
  tagIds: z.array(z.string()).optional(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string(),
  type: TransactionTypeEnum.default('expense'),
  memo: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  date: z.string().datetime().optional(),
  tagIds: z.array(z.string()).optional(),
});

// ─── Tag ───
export const TagSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().min(1),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const CreateTagSchema = z.object({
  name: z.string().min(1),
});

export type Transaction = z.infer<typeof TransactionSchema>;
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type CreateTag = z.infer<typeof CreateTagSchema>;
