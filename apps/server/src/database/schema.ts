import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique(),
  phone: text('phone').unique(),
  passwordHash: text('password_hash'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const ledgers = sqliteTable('ledgers', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  icon: text('icon').default('📗').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' })
    .default(false)
    .notNull(),
  // 财务核心字段（从 user_profiles 移入）
  payday: integer('payday'),
  budgetMode: text('budget_mode').default('carry_over'),
  disposableIncome: real('disposable_income').default(0).notNull(),
  savingsAmount: real('savings_amount').default(0).notNull(),
  emergencyFundAmount: real('emergency_fund_amount').default(0).notNull(),
  emergencyFundGoal: real('emergency_fund_goal').default(0).notNull(),
  emergencyFundEnabled: integer('emergency_fund_enabled', { mode: 'boolean' })
    .default(true)
    .notNull(),
  lastPayday: integer('last_payday', { mode: 'timestamp' }),
  netWorth: real('net_worth').default(0), // 本账本净资产
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id), // 允许为空以支持平滑迁移
  name: text('name').notNull(),
  type: text('type').notNull(), // bank, digital, cash, credit
  balance: real('balance').default(0).notNull(),
  icon: text('icon').default('💳').notNull(),
  color: text('color').default('#6C5DD3').notNull(),
  isDefault: integer('is_default', { mode: 'boolean' })
    .default(false)
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const userProfiles = sqliteTable('user_profiles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => users.id),
  avatarUrl: text('avatar_url'),
  defaultLedgerId: text('default_ledger_id').references(() => ledgers.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const savingsLogs = sqliteTable('savings_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  amount: real('amount').notNull(),
  type: text('type').notNull(), // transfer_in, transfer_out, draw_emergency, goals_update
  category: text('category').notNull(), // savings, emergency
  reason: text('reason'), // Mandatory for draw_emergency
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  name: text('name').notNull(),
  parentId: text('parent_id'), // null if root category
  type: text('type').notNull(), // income, expense, transfer
  icon: text('icon').default('📁').notNull(),
  isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  color: text('color'),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  amount: real('amount').notNull(),
  categoryId: text('category_id')
    .references(() => categories.id)
    .notNull(),
  accountId: text('account_id').references(() => accounts.id), // Nullable for now to allow migration
  type: text('type').notNull(), // income, expense, refund
  memo: text('memo'),
  paymentMethod: text('payment_method'), // Deprecated in favor of account_id
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const transactionItems = sqliteTable('transaction_items', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id')
    .references(() => transactions.id)
    .notNull(),
  name: text('name').notNull(),
  quantity: real('quantity').default(1),
  unit: text('unit').default('个'),
  unitPrice: real('unit_price'),
  amount: real('amount').notNull(),
  shouldInventory: integer('should_inventory', { mode: 'boolean' }).default(
    false,
  ),
  isConsumable: integer('is_consumable', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const transactionTags = sqliteTable('transaction_tags', {
  transactionId: text('transaction_id')
    .references(() => transactions.id)
    .notNull(),
  tagId: text('tag_id')
    .references(() => tags.id)
    .notNull(),
});

export const budgetPlans = sqliteTable('budget_plans', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
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
  budgetId: text('budget_id')
    .references(() => budgetPlans.id)
    .notNull(),
  categoryId: text('category_id')
    .references(() => categories.id)
    .notNull()
    .unique(),
});

export const fixedBills = sqliteTable('fixed_bills', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
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
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  salaryAmount: real('salary_amount').notNull(),
  fixedBillsTotal: real('fixed_bills_total').default(0),
  budgetReplenishmentTotal: real('budget_replenishment_total').default(0),
  disposableIncomeGenerated: real('disposable_income_generated').default(0),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  snapshot: text('snapshot', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const agentProposals = sqliteTable('agent_proposals', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  toolName: text('tool_name').notNull(), // e.g. 'create_transaction'
  arguments: text('arguments', { mode: 'json' }).notNull(),
  status: text('status').default('pending').notNull(), // pending, accepted, rejected
  summary: text('summary'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const reviewTasks = sqliteTable('review_tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  transactionItemId: text('transaction_item_id')
    .references(() => transactionItems.id)
    .notNull(),
  status: text('status').default('pending').notNull(), // pending, completed, skipped
  dueDate: integer('due_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const reviewResults = sqliteTable('review_results', {
  id: text('id').primaryKey(),
  taskId: text('task_id')
    .references(() => reviewTasks.id)
    .notNull(),
  rating: integer('rating').notNull(), // 1-5
  usageFrequency: text('usage_frequency').notNull(), // high, medium, low, never
  comment: text('comment'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  unit: text('unit').default('个').notNull(),
  isConsumable: integer('is_consumable', { mode: 'boolean' })
    .default(true)
    .notNull(),
  minStock: real('min_stock').default(0).notNull(),
  currentStock: real('current_stock').default(0).notNull(),
  icon: text('icon').default('📦').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const inventoryBatches = sqliteTable('inventory_batches', {
  id: text('id').primaryKey(),
  itemId: text('item_id')
    .references(() => inventoryItems.id)
    .notNull(),
  transactionItemId: text('transaction_item_id').references(
    () => transactionItems.id,
  ),
  quantity: real('quantity').notNull(),
  remainingQuantity: real('remaining_quantity').notNull(),
  unitPrice: real('unit_price'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const wishlistItems = sqliteTable('wishlist_items', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  status: text('status').default('cooling').notNull(), // cooling, approved, rejected, bought
  coolingEnd: integer('cooling_end', { mode: 'timestamp' }).notNull(),
  reason: text('reason'),
  // 5因子评分模型 (1-5分)
  scoreNeed: integer('score_need').default(3),
  scoreJoy: integer('score_joy').default(3),
  scoreFinance: integer('score_finance').default(3),
  scoreUtility: integer('score_utility').default(3),
  scoreAlternative: integer('score_alternative').default(3),
  scoreTotal: real('score_total').default(0),
  negotiationLog: text('negotiation_log', { mode: 'json' }),

  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const syncLogs = sqliteTable('sync_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  entityType: text('entity_type').notNull(), // 'transaction', 'budget', 'wishlist', etc.
  entityId: text('entity_id').notNull(),
  operation: text('operation').notNull(), // 'create', 'update', 'delete'
  changes: text('changes', { mode: 'json' }), // Delta or full object payload
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const budgetAdjustments = sqliteTable('budget_adjustments', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  fromBudgetId: text('from_budget_id').references(() => budgetPlans.id),
  toBudgetId: text('to_budget_id')
    .references(() => budgetPlans.id)
    .notNull(),
  amount: real('amount').notNull(),
  reason: text('reason'),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  type: text('type').notNull(), // budget_overdraft, inventory_alert, payroll_reminder, system
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: text('data', { mode: 'json' }), // context data e.g. { budgetId: 'xxx' }
  isRead: integer('is_read', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const wasteRecords = sqliteTable('waste_records', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.id)
    .notNull(),
  ledgerId: text('ledger_id').references(() => ledgers.id),
  itemId: text('item_id')
    .references(() => inventoryItems.id)
    .notNull(),
  quantity: real('quantity').notNull(),
  reason: text('reason').notNull(), // expired, broken, lost, etc.
  date: integer('date', { mode: 'timestamp' }).notNull(),
  lossAmount: real('loss_amount'), // estimated financial loss
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
