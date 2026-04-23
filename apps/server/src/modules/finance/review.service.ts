import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, eq, gt, isNull, lt, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  /**
   * 扫描 7 天前后的耐用品交易，生成待评价任务
   */
  async scanAndCreateTasks(userId: string, ledgerId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 查找耐用品且购买超过 7 天，且尚未生成过评价任务的项目
    const items = await this.db
      .select({
        itemId: schema.transactionItems.id,
        name: schema.transactionItems.name,
        date: schema.transactions.date,
      })
      .from(schema.transactionItems)
      .innerJoin(schema.transactions, eq(schema.transactionItems.transactionId, schema.transactions.id))
      .leftJoin(schema.reviewTasks, eq(schema.transactionItems.id, schema.reviewTasks.transactionItemId))
      .where(
        and(
          eq(schema.transactions.userId, userId),
          eq(schema.transactions.ledgerId, ledgerId),
          eq(schema.transactionItems.isConsumable, false),
          lt(schema.transactions.date, sevenDaysAgo),
          isNull(schema.reviewTasks.id)
        )
      );

    for (const item of items) {
      await this.db.insert(schema.reviewTasks).values({
        id: randomUUID(),
        userId,
        ledgerId, // 绑定账本
        transactionItemId: item.itemId,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      this.logger.log(`Created review task for item: ${item.name}`);
    }

    return items.length;
  }

  async getPendingTasks(userId: string, ledgerId?: string) {
    const filters = [
      eq(schema.reviewTasks.userId, userId),
      eq(schema.reviewTasks.status, 'pending')
    ];

    if (ledgerId && ledgerId !== 'global') {
      filters.push(eq(schema.reviewTasks.ledgerId, ledgerId));
    }

    return this.db
      .select({
        taskId: schema.reviewTasks.id,
        itemName: schema.transactionItems.name,
        purchaseDate: schema.transactions.date,
      })
      .from(schema.reviewTasks)
      .innerJoin(schema.transactionItems, eq(schema.reviewTasks.transactionItemId, schema.transactionItems.id))
      .innerJoin(schema.transactions, eq(schema.transactionItems.transactionId, schema.transactions.id))
      .where(and(...filters));
  }

  async submitReview(taskId: string, rating: number, usageFrequency: string, comment?: string) {
    await this.db.transaction(async (tx) => {
      await tx.insert(schema.reviewResults).values({
        id: randomUUID(),
        taskId,
        rating,
        usageFrequency,
        comment,
        createdAt: new Date(),
      });

      await tx
        .update(schema.reviewTasks)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(schema.reviewTasks.id, taskId));
    });
  }
}
