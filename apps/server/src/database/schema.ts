import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  phone: text('phone').unique(),
  passwordHash: text('password_hash'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const userProfiles = sqliteTable('user_profiles', {
  userId: text('user_id').primaryKey().references(() => users.id),
  payday: integer('payday'), // 1-31
  budgetMode: text('budget_mode').default('carry_over'), // carry_over, accumulate
  netWorth: real('net_worth').default(0),
  emergencyFundEnabled: integer('emergency_fund_enabled', { mode: 'boolean' }).default(true),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  parentId: text('parent_id'), // null if root category
  type: text('type').notNull(), // income, expense, transfer
  icon: text('icon').default('📁').notNull(),
  isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  amount: real('amount').notNull(),
  categoryId: text('category_id').references(() => categories.id).notNull(),
  type: text('type').notNull(), // income, expense, refund
  memo: text('memo'),
  paymentMethod: text('payment_method'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const transactionItems = sqliteTable('transaction_items', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').references(() => transactions.id).notNull(),
  name: text('name').notNull(),
  quantity: real('quantity').default(1),
  unit: text('unit').default('个'),
  unitPrice: real('unit_price'),
  amount: real('amount').notNull(),
  shouldInventory: integer('should_inventory', { mode: 'boolean' }).default(false),
  isConsumable: integer('is_consumable', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const transactionTags = sqliteTable('transaction_tags', {
  transactionId: text('transaction_id').references(() => transactions.id).notNull(),
  tagId: text('tag_id').references(() => tags.id).notNull(),
});
