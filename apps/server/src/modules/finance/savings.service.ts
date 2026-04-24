import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class SavingsService {
  private readonly logger = new Logger(SavingsService.name);

  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  /**
   * 划转至储蓄或应急金
   */
  async transferTo(
    userId: string,
    ledgerId: string,
    amount: number,
    category: 'savings' | 'emergency',
  ) {
    if (amount <= 0) throw new BadRequestException('划转金额必须大于 0');

    await this.db.transaction(async (tx) => {
      const ledger = await tx.query.ledgers.findFirst({
        where: and(
          eq(schema.ledgers.id, ledgerId),
          eq(schema.ledgers.userId, userId),
        ),
      });

      if (!ledger) throw new BadRequestException('账本不存在');
      if ((ledger.disposableIncome || 0) < amount) {
        throw new BadRequestException('可支配资金不足');
      }

      // 1. 扣减可支配
      await tx
        .update(schema.ledgers)
        .set({
          disposableIncome: (ledger.disposableIncome || 0) - amount,
          savingsAmount:
            category === 'savings'
              ? (ledger.savingsAmount || 0) + amount
              : ledger.savingsAmount,
          emergencyFundAmount:
            category === 'emergency'
              ? (ledger.emergencyFundAmount || 0) + amount
              : ledger.emergencyFundAmount,
          updatedAt: new Date(),
        })
        .where(eq(schema.ledgers.id, ledgerId));

      // 2. 记录日志
      await tx.insert(schema.savingsLogs).values({
        id: randomUUID(),
        userId,
        ledgerId,
        amount,
        type: 'transfer_in',
        category,
        date: new Date(),
        createdAt: new Date(),
      });
    });

    this.logger.log(`Transfer successful: ¥${amount} to ${category} in ledger ${ledgerId}`);
    return { success: true };
  }

  /**
   * 动用应急金（风控：强制理由）
   */
  async withdrawEmergency(userId: string, ledgerId: string, amount: number, reason: string) {
    if (amount <= 0) throw new BadRequestException('提取金额必须大于 0');
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException(
        '动用应急金必须提供详细理由（至少 5 个字）',
      );
    }

    await this.db.transaction(async (tx) => {
      const ledger = await tx.query.ledgers.findFirst({
        where: and(
          eq(schema.ledgers.id, ledgerId),
          eq(schema.ledgers.userId, userId),
        ),
      });

      if (!ledger) throw new BadRequestException('账本不存在');
      if ((ledger.emergencyFundAmount || 0) < amount) {
        throw new BadRequestException('应急金余额不足');
      }

      // 1. 扣减应急金，还回到可支配
      await tx
        .update(schema.ledgers)
        .set({
          emergencyFundAmount: (ledger.emergencyFundAmount || 0) - amount,
          disposableIncome: (ledger.disposableIncome || 0) + amount,
          updatedAt: new Date(),
        })
        .where(eq(schema.ledgers.id, ledgerId));

      // 2. 记录日志（包含强制理由）
      await tx.insert(schema.savingsLogs).values({
        id: randomUUID(),
        userId,
        ledgerId,
        amount,
        type: 'draw_emergency',
        category: 'emergency',
        reason,
        date: new Date(),
        createdAt: new Date(),
      });
    });

    this.logger.warn(`Emergency withdrawal: ¥${amount} for: ${reason} in ledger ${ledgerId}`);
    return { success: true };
  }

  /**
   * 更新应急金目标
   */
  async updateGoal(userId: string, ledgerId: string, amount: number) {
    await this.db
      .update(schema.ledgers)
      .set({
        emergencyFundGoal: amount,
        updatedAt: new Date(),
      })
      .where(and(
        eq(schema.ledgers.id, ledgerId),
        eq(schema.ledgers.userId, userId),
      ));

    return { success: true };
  }

  /**
   * 获取最近的储蓄动态
   */
  async getLogs(userId: string, ledgerId?: string, limit = 10) {
    return this.db.query.savingsLogs.findMany({
      where: and(
        eq(schema.savingsLogs.userId, userId),
        ledgerId ? eq(schema.savingsLogs.ledgerId, ledgerId) : undefined,
      ),
      orderBy: (logs, { desc }) => [desc(logs.date)],
      limit,
    });
  }
}
