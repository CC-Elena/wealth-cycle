import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../../database/database.module';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../database/schema';
import { eq, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SavingsService {
  private readonly logger = new Logger(SavingsService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  /**
   * 划转至储蓄或应急金
   */
  async transferTo(userId: string, amount: number, category: 'savings' | 'emergency') {
    if (amount <= 0) throw new BadRequestException('划转金额必须大于 0');

    await this.db.transaction(async (tx) => {
      const profile = await tx.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.userId, userId),
      });

      if (!profile) throw new BadRequestException('用户档案不存在');
      if ((profile.disposableIncome || 0) < amount) {
        throw new BadRequestException('可支配资金不足');
      }

      // 1. 扣减可支配
      await tx.update(schema.userProfiles)
        .set({ 
          disposableIncome: (profile.disposableIncome || 0) - amount,
          savingsAmount: category === 'savings' ? (profile.savingsAmount || 0) + amount : profile.savingsAmount,
          emergencyFundAmount: category === 'emergency' ? (profile.emergencyFundAmount || 0) + amount : profile.emergencyFundAmount,
          updatedAt: new Date()
        })
        .where(eq(schema.userProfiles.userId, userId));

      // 2. 记录日志
      await tx.insert(schema.savingsLogs).values({
        id: uuidv4(),
        userId,
        amount,
        type: 'transfer_in',
        category,
        date: new Date(),
        createdAt: new Date(),
      });
    });

    this.logger.log(`Transfer successful: ¥${amount} to ${category}`);
    return { success: true };
  }

  /**
   * 动用应急金（风控：强制理由）
   */
  async withdrawEmergency(userId: string, amount: number, reason: string) {
    if (amount <= 0) throw new BadRequestException('提取金额必须大于 0');
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('动用应急金必须提供详细理由（至少 5 个字）');
    }

    await this.db.transaction(async (tx) => {
      const profile = await tx.query.userProfiles.findFirst({
        where: eq(schema.userProfiles.userId, userId),
      });

      if (!profile) throw new BadRequestException('用户档案不存在');
      if ((profile.emergencyFundAmount || 0) < amount) {
        throw new BadRequestException('应急金余额不足');
      }

      // 1. 扣减应急金，还回到可支配（或者直接记录支出）
      // 这里逻辑设定为：应急金提取至可支配，供后续消费工具扣减，或直接冲抵消费。
      // 为了简化，我们将其变现为“可支配资金”增加。
      await tx.update(schema.userProfiles)
        .set({ 
          emergencyFundAmount: (profile.emergencyFundAmount || 0) - amount,
          disposableIncome: (profile.disposableIncome || 0) + amount,
          updatedAt: new Date()
        })
        .where(eq(schema.userProfiles.userId, userId));

      // 2. 记录日志（包含强制理由）
      await tx.insert(schema.savingsLogs).values({
        id: uuidv4(),
        userId,
        amount,
        type: 'draw_emergency',
        category: 'emergency',
        reason,
        date: new Date(),
        createdAt: new Date(),
      });
    });

    this.logger.warn(`Emergency withdrawal: ¥${amount} for: ${reason}`);
    return { success: true };
  }

  /**
   * 更新应急金目标
   */
  async updateGoal(userId: string, amount: number) {
    await this.db.update(schema.userProfiles)
      .set({ 
        emergencyFundGoal: amount,
        updatedAt: new Date()
      })
      .where(eq(schema.userProfiles.userId, userId));
    
    return { success: true };
  }

  /**
   * 获取最近的储蓄动态
   */
  async getLogs(userId: string, limit = 10) {
    return this.db.query.savingsLogs.findMany({
      where: eq(schema.savingsLogs.userId, userId),
      orderBy: (logs, { desc }) => [desc(logs.date)],
      limit,
    });
  }
}
