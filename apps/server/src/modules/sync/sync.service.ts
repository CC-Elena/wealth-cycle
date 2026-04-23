import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, asc, eq, gt } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { syncLogs } from '../../database/schema';

export interface SyncChange {
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  changes: any;
  timestamp?: string;
  ledgerId?: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  /**
   * 记录一笔变更日志
   */
  async logChange(userId: string, change: SyncChange) {
    try {
      await this.db.insert(syncLogs).values({
        id: randomUUID(),
        userId,
        entityType: change.entityType,
        entityId: change.entityId,
        operation: change.operation,
        changes: change.changes,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Failed to log sync change for ${change.entityType}`, error);
    }
  }

  /**
   * 批量推送客户端变更并应用到数据库
   */
  async pushChanges(userId: string, changes: SyncChange[]) {
    this.logger.log(`Processing ${changes.length} synced changes from user ${userId}`);
    
    const results = [];
    for (const change of changes) {
      try {
        // 1. 应用实际变更
        await this.applyChange(userId, change);

        // 2. 录入同步日志（供其他设备拉取）
        await this.db.insert(syncLogs).values({
          id: randomUUID(),
          userId,
          entityType: change.entityType,
          entityId: change.entityId,
          operation: change.operation,
          changes: change.changes,
          timestamp: new Date(),
        });
        results.push({ entityId: change.entityId, status: 'success' });
      } catch (error) {
        this.logger.error(`Failed to apply/log change for ${change.entityId}`, error);
        results.push({ entityId: change.entityId, status: 'failed', error: error.message });
      }
    }
    return results;
  }

  private async applyChange(userId: string, change: SyncChange) {
    const { entityType, entityId, operation, changes, ledgerId } = change;
    
    // 映射实体类型到具体的表名
    const tableMap: Record<string, any> = {
      'transaction': schema.transactions,
      'budget': schema.budgetPlans,
      'fixed_bill': schema.fixedBills,
      'wishlist': schema.wishlistItems,
      'account': schema.accounts,
    };

    const table = tableMap[entityType];
    if (!table) {
      throw new Error(`Unsupported entity type: ${entityType}`);
    }

    if (operation === 'create') {
      await this.db.insert(table).values({
        ...changes,
        id: entityId,
        userId,
        ledgerId: ledgerId || changes.ledgerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: table.id,
        set: { ...changes, updatedAt: new Date() }
      });
    } else if (operation === 'update') {
      await this.db.update(table)
        .set({ ...changes, updatedAt: new Date() })
        .where(and(eq(table.id, entityId), eq(table.userId, userId)));
    } else if (operation === 'delete') {
      await this.db.delete(table)
        .where(and(eq(table.id, entityId), eq(table.userId, userId)));
    }
  }

  /**
   * 获取增量变更
   */
  async pullChanges(userId: string, lastSyncTime?: string) {
    const since = lastSyncTime ? new Date(lastSyncTime) : new Date(0);
    
    const logs = await this.db
      .select()
      .from(syncLogs)
      .where(
        and(
          eq(syncLogs.userId, userId),
          gt(syncLogs.timestamp, since)
        )
      )
      .orderBy(asc(syncLogs.timestamp));

    return logs.map(log => ({
      entityType: log.entityType,
      entityId: log.entityId,
      operation: log.operation,
      changes: log.changes,
      timestamp: log.timestamp.toISOString(),
    }));
  }
}
