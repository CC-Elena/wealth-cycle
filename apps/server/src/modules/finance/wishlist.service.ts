import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, eq, gte, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class WishlistService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  async createWishlistItem(data: {
    name: string;
    amount: number;
    categoryId?: string;
    reason?: string;
    coolingDays?: number;
    ledgerId: string;
  }) {
    const id = `wish-${Date.now()}`;
    const now = new Date();
    const coolingDays = data.coolingDays ?? (data.amount > 5000 ? 7 : 3);
    const coolingEnd = new Date(now.getTime() + coolingDays * 24 * 60 * 60 * 1000);

    await this.db.insert(schema.wishlistItems).values({
      id,
      userId: DEFAULT_USER_ID,
      ledgerId: data.ledgerId,
      name: data.name,
      amount: data.amount,
      categoryId: data.categoryId,
      status: 'cooling',
      coolingEnd,
      reason: data.reason,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  }

  async getWishlistItems(ledgerId?: string) {
    return this.db.select()
      .from(schema.wishlistItems)
      .where(and(
        eq(schema.wishlistItems.userId, DEFAULT_USER_ID),
        ledgerId ? eq(schema.wishlistItems.ledgerId, ledgerId) : undefined
      ))
      .orderBy(schema.wishlistItems.createdAt)
      .all();
  }

  async getFrozenAmount(ledgerId: string) {
    const result = this.db.select({
      total: sql<number>`sum(${schema.wishlistItems.amount})`
    })
    .from(schema.wishlistItems)
    .where(
      and(
        eq(schema.wishlistItems.userId, DEFAULT_USER_ID),
        ledgerId ? eq(schema.wishlistItems.ledgerId, ledgerId) : undefined,
        eq(schema.wishlistItems.status, 'cooling')
      )
    )
    .get();

    return result?.total || 0;
  }

  async updateStatus(id: string, status: 'approved' | 'rejected' | 'bought') {
    await this.db.update(schema.wishlistItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.wishlistItems.id, id));
  }

  /**
   * 评估项目评分
   */
  async evaluateItem(id: string, scores: {
    need: number;
    joy: number;
    finance: number;
    utility: number;
    alternative: number;
  }) {
    // 总分计算逻辑 (简单加权平均)
    // Need: 30%, Joy: 20%, Finance: 20%, Utility: 20%, Alternative: 10%
    const total = (
      scores.need * 0.3 + 
      scores.joy * 0.2 + 
      scores.finance * 0.2 + 
      scores.utility * 0.2 + 
      scores.alternative * 0.1
    );

    await this.db.update(schema.wishlistItems)
      .set({
        scoreNeed: scores.need,
        scoreJoy: scores.joy,
        scoreFinance: scores.finance,
        scoreUtility: scores.utility,
        scoreAlternative: scores.alternative,
        scoreTotal: total,
        updatedAt: new Date(),
      })
      .where(eq(schema.wishlistItems.id, id));

    return { total };
  }
}

