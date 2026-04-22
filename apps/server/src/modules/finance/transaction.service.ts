import { Injectable, Inject } from '@nestjs/common';
import { eq, desc, and, gte, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { CreateTransaction } from '@stock/shared';

const DEFAULT_USER_ID = 'default-local-user-1';

import { InventoryService } from './inventory.service';
import { AccountService } from './account.service';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
    private readonly inventoryService: InventoryService,
    private readonly accountService: AccountService,
  ) {}

  getTransactions(ledgerId?: string, limit = 50) {
    const filters = [eq(schema.transactions.userId, DEFAULT_USER_ID)];
    if (ledgerId) {
      filters.push(eq(schema.transactions.ledgerId, ledgerId));
    }

    return this.db.select()
      .from(schema.transactions)
      .where(and(...filters))
      .orderBy(desc(schema.transactions.date))
      .limit(limit)
      .all();
  }

  createTransaction(data: CreateTransaction) {
    const now = new Date();
    const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transactionDate = data.date ? new Date(data.date) : now;

    return this.db.transaction(async (tx) => {
      // 1. 确定来源账户及其归属账本
      const accountId = data.accountId || await this.accountService.ensureDefaultAccount();
      const account = await this.accountService.getAccountById(accountId);
      
      // 优先使用传入的 ledgerId，否则取账户关联的 ledgerId
      const ledgerId = data.ledgerId || account?.ledgerId;

      if (!ledgerId) {
        throw new Error('Transaction must be associated with a ledger');
      }

      tx.insert(schema.transactions).values({
        id,
        userId: DEFAULT_USER_ID,
        ledgerId,
        amount: data.amount,
        categoryId: data.categoryId,
        accountId: accountId,
        type: data.type ?? 'expense',
        memo: data.memo ?? null,
        paymentMethod: data.paymentMethod ?? null,
        date: transactionDate,
        createdAt: now,
        updatedAt: now,
      }).run();

      // 更新账户余额
      const balanceChange = data.type === 'income' ? data.amount : -data.amount;
      await this.accountService.updateBalance(accountId, balanceChange, tx);

      // Handle items if provided...

      // Handle items if provided
      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const itemId = `txi-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          tx.insert(schema.transactionItems).values({
            id: itemId,
            transactionId: id,
            name: item.name,
            quantity: item.quantity ?? 1,
            unit: item.unit ?? '个',
            unitPrice: item.unitPrice ?? null,
            amount: item.amount,
            shouldInventory: item.shouldInventory ?? false,
            isConsumable: item.isConsumable ?? true,
            createdAt: now,
          }).run();
        }
      }

      // Handle tags if provided
      if (data.tagIds && data.tagIds.length > 0) {
        for (const tagId of data.tagIds) {
          tx.insert(schema.transactionTags).values({
            transactionId: id,
            tagId,
          }).run();
        }
      }

      const result = tx.select().from(schema.transactions).where(eq(schema.transactions.id, id)).get();
      
      // 异步触发库存同步 (不阻塞交易主流程)
      this.inventoryService.autoInventory(id).catch(err => {
        console.error(`Failed to auto-inventory for transaction ${id}:`, err);
      });

      return result;
    });
  }
  getDailySpendingStats(ledgerId?: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const filters = [
      eq(schema.transactions.userId, DEFAULT_USER_ID),
      eq(schema.transactions.type, 'expense'),
      gte(schema.transactions.date, thirtyDaysAgo)
    ];

    if (ledgerId) {
      filters.push(eq(schema.transactions.ledgerId, ledgerId));
    }

    const stats = this.db.select({
      total: sql<number>`sum(${schema.transactions.amount})`
    })
    .from(schema.transactions)
    .where(and(...filters))
    .get();

    const totalSpent = stats?.total || 0;
    const meanDailySpend = totalSpent / 30;

    return {
      totalSpent30d: totalSpent,
      meanDailySpend: meanDailySpend || 1, // Avoid division by zero
    };
  }

  /**
   * 获取月度收支趋势 (过去 6 个月)
   */
  async getMonthlyTrend(ledgerId?: string, months = 6) {
    const filters = [eq(schema.transactions.userId, DEFAULT_USER_ID)];
    if (ledgerId) {
      filters.push(eq(schema.transactions.ledgerId, ledgerId));
    }

    const trend = this.db.select({
      month: sql<string>`strftime('%Y-%m', date / 1000, 'unixepoch')`,
      type: schema.transactions.type,
      total: sql<number>`sum(${schema.transactions.amount})`
    })
    .from(schema.transactions)
    .where(and(...filters))
    .groupBy(sql`month`, schema.transactions.type)
    .orderBy(sql`month`)
    .all();

    return trend;
  }

  /**
   * 获取分类支出占比
   */
  async getCategoryDistribution(ledgerId?: string, startDate?: Date, endDate?: Date) {
    const filters = [
      eq(schema.transactions.userId, DEFAULT_USER_ID),
      eq(schema.transactions.type, 'expense'),
    ];

    if (ledgerId) {
      filters.push(eq(schema.transactions.ledgerId, ledgerId));
    }

    if (startDate) {
      filters.push(gte(schema.transactions.date, startDate));
    }

    const query = this.db.select({
      categoryId: schema.transactions.categoryId,
      categoryName: schema.categories.name,
      categoryColor: schema.categories.color,
      categoryIcon: schema.categories.icon,
      total: sql<number>`sum(${schema.transactions.amount})`
    })
    .from(schema.transactions)
    .innerJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
    .where(and(...filters))
    .groupBy(schema.transactions.categoryId)
    .orderBy(sql`total desc`)
    .all();

    return query;
  }
}
