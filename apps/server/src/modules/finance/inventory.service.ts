import { Injectable, Inject, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../../database/database.module';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../database/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
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
        id: uuidv4(),
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
    });
  }

  /**
   * 获取低库存预警
   */
  async getLowStockItems(userId: string, ledgerId: string) {
    return this.db
      .select()
      .from(schema.inventoryItems)
      .where(
        and(
          eq(schema.inventoryItems.userId, userId),
          eq(schema.inventoryItems.ledgerId, ledgerId),
          sql`${schema.inventoryItems.currentStock} <= ${schema.inventoryItems.minStock}`
        )
      );
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
      const id = uuidv4();
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
}
