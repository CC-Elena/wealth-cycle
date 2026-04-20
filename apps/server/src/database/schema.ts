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
  disposableIncome: real('disposable_income').default(0),
  lastPayday: integer('last_payday', { mode: 'timestamp' }),
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

export const budgetPlans = sqliteTable('budget_plans', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  totalAmount: real('total_amount').notNull(),
  period: text('period').default('monthly').notNull(), // weekly, monthly, custom
  settlement: text('settlement').default('carry_over').notNull(), // carry_over, accumulate
  icon: text('icon').default('💰').notNull(),
  color: text('color').default('#6C5DD3').notNull(),
  priority: integer('priority').default(0).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  periodStart: integer('period_start', { mode: 'timestamp' }),
  periodEnd: integer('period_end', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const budgetCategories = sqliteTable('budget_categories', {
  budgetId: text('budget_id').references(() => budgetPlans.id).notNull(),
  categoryId: text('category_id').references(() => categories.id).notNull().unique(),
});

export const fixedBills = sqliteTable('fixed_bills', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  type: text('type').default('expense').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  dueDateNext: integer('due_date_next', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const payrollEvents = sqliteTable('payroll_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  salaryAmount: real('salary_amount').notNull(),
  fixedBillsTotal: real('fixed_bills_total').default(0),
  budgetReplenishmentTotal: real('budget_replenishment_total').default(0),
  disposableIncomeGenerated: real('disposable_income_generated').default(0),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  snapshot: text('snapshot', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
