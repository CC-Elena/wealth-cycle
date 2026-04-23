import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';


import type { NotificationService } from '../notification/notification.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
    private readonly notificationService: NotificationService,
  ) {}



  /**
   * 自动同步交易项至库存 (由 TransactionService 或 AgentService 触发)
   */
  async autoInventory(transactionId: string) {
    const items = await this.db
      .select()
      .from(schema.transactionItems)
      .where(
        and(
          eq(schema.transactionItems.transactionId, transactionId),
          eq(schema.transactionItems.shouldInventory, true)
        )
      );

    if (items.length === 0) return;

    const transaction = await this.db.query.transactions.findFirst({
      where: eq(schema.transactions.id, transactionId),
    });

    if (!transaction) return;

    for (const item of items) {
      const inventoryItem = await this.getOrCreateInventoryItem(
        transaction.userId,
        transaction.ledgerId || '', // 注入账本ID
        item.name,
        item.categoryId,
        item.unit || '个',
        item.isConsumable ?? true
      );

      // 创建入库批次
      await this.db.insert(schema.inventoryBatches).values({
        id: randomUUID(),
        itemId: inventoryItem.id,
        transactionItemId: item.id,
        quantity: item.quantity || 1,
        remainingQuantity: item.quantity || 1,
        unitPrice: item.unitPrice,
        createdAt: new Date(),
      });

      // 更新实时库存缓存
      await this.updateCurrentStock(inventoryItem.id);
      this.logger.log(`Auto-inventoried item: ${item.name} (Batch added)`);
    }
  }

  /**
   * 手动或自动消耗库存
   */
  async consume(itemId: string, quantity: number) {
    if (quantity <= 0) return;

    await this.db.transaction(async (tx) => {
      // 查找该物项所有有余额的批次，按创建时间排序 (FIFO)
      const batches = await tx
        .select()
        .from(schema.inventoryBatches)
        .where(
          and(
            eq(schema.inventoryBatches.itemId, itemId),
            sql`${schema.inventoryBatches.remainingQuantity} > 0`
          )
        )
        .orderBy(asc(schema.inventoryBatches.createdAt));

      let remainingToConsume = quantity;

      for (const batch of batches) {
        if (remainingToConsume <= 0) break;

        const canTake = Math.min(batch.remainingQuantity, remainingToConsume);
        await tx
          .update(schema.inventoryBatches)
          .set({ remainingQuantity: batch.remainingQuantity - canTake })
          .where(eq(schema.inventoryBatches.id, batch.id));
        
        remainingToConsume -= canTake;
      }

      await this.updateCurrentStock(itemId, tx);

      // 触发低库存预警检测
      this.checkAndTriggerInventoryAlert(itemId).catch(err => {
        this.logger.error(`Failed to trigger inventory alert for ${itemId}:`, err);
      });
    });
  }

  private async checkAndTriggerInventoryAlert(itemId: string) {
    if (!this.notificationService) return;

    const item = await this.db.query.inventoryItems.findFirst({
      where: eq(schema.inventoryItems.id, itemId),
    });

    if (item && item.currentStock <= item.minStock && item.minStock > 0) {
      await this.notificationService.create({
        userId: item.userId,
        ledgerId: item.ledgerId || undefined,
        type: 'inventory_alert',
        title: '库存不足预警',
        message: `物品“${item.name}”当前库存为 ${item.currentStock}${item.unit}，已低于预警水位 ${item.minStock}${item.unit}。`,
        data: { itemId: item.id }
      });
    }
  }


  /**
   * 获取低库存预警
   */
  async getLowStockItems(userId: string, ledgerId?: string) {
    const filters = [
      eq(schema.inventoryItems.userId, userId),
      sql`${schema.inventoryItems.currentStock} <= ${schema.inventoryItems.minStock}`
    ];
    
    if (ledgerId && ledgerId !== 'global') {
      filters.push(eq(schema.inventoryItems.ledgerId, ledgerId));
    }

    return this.db
      .select()
      .from(schema.inventoryItems)
      .where(and(...filters));
  }

  private async getOrCreateInventoryItem(
    userId: string,
    ledgerId: string,
    name: string,
    categoryId: string,
    unit: string,
    isConsumable: boolean
  ) {
    let item = await this.db.query.inventoryItems.findFirst({
      where: and(
        eq(schema.inventoryItems.userId, userId),
        ledgerId ? eq(schema.inventoryItems.ledgerId, ledgerId) : sql`1=1`,
        eq(schema.inventoryItems.name, name)
      ),
    });

    if (!item) {
      const id = randomUUID();

      await this.db.insert(schema.inventoryItems).values({
        id,
        userId,
        ledgerId, // 绑定账本
        name,
        categoryId,
        unit,
        isConsumable,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      item = await this.db.query.inventoryItems.findFirst({
        where: eq(schema.inventoryItems.id, id),
      });
    }

    return item!;
  }

  private async updateCurrentStock(itemId: string, tx: any = this.db) {
    const total = await tx
      .select({
        total: sql`SUM(${schema.inventoryBatches.remainingQuantity})`,
      })
      .from(schema.inventoryBatches)
      .where(eq(schema.inventoryBatches.itemId, itemId));

    await tx
      .update(schema.inventoryItems)
      .set({ 
        currentStock: total[0]?.total || 0,
        updatedAt: new Date(),
      })
      .where(eq(schema.inventoryItems.id, itemId));
  }

  async getInventorySnapshot(userId: string, ledgerId: string) {
    const items = await this.db
      .select()
      .from(schema.inventoryItems)
      .where(and(
        eq(schema.inventoryItems.userId, userId),
        eq(schema.inventoryItems.ledgerId, ledgerId)
      ));
    
    return items;
  }
  /**
   * 记录浪费/报废
   */
  async recordWaste(userId: string, data: {
    itemId: string;
    quantity: number;
    reason: string;
    ledgerId?: string;
  }) {
    const item = await this.db.query.inventoryItems.findFirst({
      where: and(
        eq(schema.inventoryItems.id, data.itemId),
        eq(schema.inventoryItems.userId, userId)
      )
    });

    if (!item) throw new Error('Item not found');
    if (item.currentStock < data.quantity) throw new Error('Not enough stock');

    // 计算损失金额 (按批次平均单价估算)
    const batches = await this.db.select().from(schema.inventoryBatches).where(eq(schema.inventoryBatches.itemId, item.id)).all();
    const avgUnitPrice = batches.length > 0 
      ? batches.reduce((sum, b) => sum + (b.unitPrice || 0), 0) / batches.length 
      : 0;
    
    const lossAmount = avgUnitPrice * data.quantity;

    return await this.db.transaction(async (tx) => {
      // 1. 记录浪费
      await tx.insert(schema.wasteRecords).values({
        id: randomUUID(),
        userId,
        ledgerId: data.ledgerId || item.ledgerId,
        itemId: data.itemId,
        quantity: data.quantity,
        reason: data.reason,
        lossAmount,
        date: new Date(),
        createdAt: new Date(),
      });

      // 2. 更新库存
      await tx.update(schema.inventoryItems)
        .set({
          currentStock: sql`${schema.inventoryItems.currentStock} - ${data.quantity}`,
          updatedAt: new Date()
        })
        .where(eq(schema.inventoryItems.id, data.itemId));

      // 3. 消耗批次 (简单的 FIFO 逻辑)
      let remainingToConsume = data.quantity;
      const sortedBatches = batches.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      for (const batch of sortedBatches) {
        if (remainingToConsume <= 0) break;
        if (batch.remainingQuantity <= 0) continue;

        const consumedFromBatch = Math.min(batch.remainingQuantity, remainingToConsume);
        await tx.update(schema.inventoryBatches)
          .set({ remainingQuantity: sql`${schema.inventoryBatches.remainingQuantity} - ${consumedFromBatch}` })
          .where(eq(schema.inventoryBatches.id, batch.id));
        
        remainingToConsume -= consumedFromBatch;
      }

      return { lossAmount };
    });
  }
}

