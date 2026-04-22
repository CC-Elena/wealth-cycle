import { z } from 'zod';

// ─── Transaction Item ───
export const TransactionItemSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  name: z.string(),
  quantity: z.number().default(1),
  unit: z.string().default('个'),
  unitPrice: z.number().optional().nullable(),
  amount: z.number(),
  shouldInventory: z.boolean().default(false),
  isConsumable: z.boolean().default(true),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const CreateTransactionItemSchema = z.object({
  name: z.string(),
  quantity: z.number().default(1),
  unit: z.string().default('个'),
  unitPrice: z.number().optional().nullable(),
  amount: z.number(),
  shouldInventory: z.boolean().default(false),
  isConsumable: z.boolean().default(true),
});

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
  items: z.array(TransactionItemSchema).optional(),
  createdAt: z.union([z.string().datetime(), z.date()]).optional(),
  updatedAt: z.union([z.string().datetime(), z.date()]).optional(),
});

export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  ledgerId: z.string().optional(),
  accountId: z.string().optional(),
  categoryId: z.string(),
  type: TransactionTypeEnum.default('expense'),
  memo: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(), // Deprecated but kept for compatibility
  date: z.string().datetime().optional(),
  tagIds: z.array(z.string()).optional(),
  items: z.array(CreateTransactionItemSchema).optional(),
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
export type TransactionItem = z.infer<typeof TransactionItemSchema>;
export type CreateTransactionItem = z.infer<typeof CreateTransactionItemSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type CreateTag = z.infer<typeof CreateTagSchema>;
