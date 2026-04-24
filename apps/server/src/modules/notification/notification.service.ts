import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, desc, eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(DB_CONNECTION)
    private db: BetterSQLite3Database<typeof schema>,
  ) {}

  async create(data: {
    userId: string;
    ledgerId?: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    const id = randomUUID();
    const now = new Date();

    // 检查是否已有同类型且同业务实体的未读通知，避免重复发送
    // 例如：同一预算分类 24 小时内只发一次超支提醒
    if (data.type === 'budget_overdraft' && data.data?.budgetId) {
      const existing = await this.db.query.notifications.findFirst({
        where: and(
          eq(schema.notifications.userId, data.userId),
          eq(schema.notifications.type, data.type),
          eq(schema.notifications.isRead, false),
        ),
      });

      if (existing) {
        const contextData = existing.data as any;
        if (contextData?.budgetId === data.data.budgetId) {
          // 更新时间而不新建
          return await this.db
            .update(schema.notifications)
            .set({ updatedAt: now, message: data.message })
            .where(eq(schema.notifications.id, existing.id))
            .returning();
        }
      }
    }

    return await this.db
      .insert(schema.notifications)
      .values({
        id,
        ...data,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
  }

  async findAll(userId: string, ledgerId?: string, onlyUnread = false) {
    let whereClause = eq(schema.notifications.userId, userId);

    if (ledgerId && ledgerId !== 'global') {
      whereClause = and(
        whereClause,
        eq(schema.notifications.ledgerId, ledgerId),
      ) as any;
    }

    if (onlyUnread) {
      whereClause = and(
        whereClause,
        eq(schema.notifications.isRead, false),
      ) as any;
    }

    return await this.db.query.notifications.findMany({
      where: whereClause,
      orderBy: [desc(schema.notifications.createdAt)],
      limit: 50,
    });
  }

  async markAsRead(id: string, userId: string) {
    return await this.db
      .update(schema.notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(
        and(
          eq(schema.notifications.id, id),
          eq(schema.notifications.userId, userId),
        ),
      )
      .returning();
  }

  async markAllAsRead(userId: string, ledgerId?: string) {
    let whereClause = and(
      eq(schema.notifications.userId, userId),
      eq(schema.notifications.isRead, false),
    );

    if (ledgerId && ledgerId !== 'global') {
      whereClause = and(
        whereClause,
        eq(schema.notifications.ledgerId, ledgerId),
      ) as any;
    }

    return await this.db
      .update(schema.notifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(whereClause)
      .returning();
  }

  async getUnreadCount(userId: string, ledgerId?: string) {
    const notifications = await this.findAll(userId, ledgerId, true);
    return notifications.length;
  }
}
