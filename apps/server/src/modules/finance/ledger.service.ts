import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, eq } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class LedgerService {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  async getLedgers(userId: string = DEFAULT_USER_ID) {
    return this.db
      .select()
      .from(schema.ledgers)
      .where(eq(schema.ledgers.userId, userId))
      .all();
  }

  async createLedger(userId: string, data: { name: string; icon?: string }) {
    const id = randomUUID();
    const now = new Date();

    const newLedger = {
      id,
      userId,
      name: data.name,
      icon: data.icon || '📘',
      isDefault: false,
      disposableIncome: 0,
      savingsAmount: 0,
      emergencyFundAmount: 0,
      emergencyFundGoal: 0,
      emergencyFundEnabled: true,
      createdAt: now,
      updatedAt: now,
    };

    this.db.insert(schema.ledgers).values(newLedger).run();
    return newLedger;
  }

  async switchDefaultLedger(userId: string, ledgerId: string) {
    const ledger = this.db
      .select()
      .from(schema.ledgers)
      .where(
        and(eq(schema.ledgers.id, ledgerId), eq(schema.ledgers.userId, userId)),
      )
      .get();

    if (!ledger) {
      throw new NotFoundException('账本不存在');
    }

    // 更新用户 Profile 指向
    this.db
      .update(schema.userProfiles)
      .set({ defaultLedgerId: ledgerId, updatedAt: new Date() })
      .where(eq(schema.userProfiles.userId, userId))
      .run();

    return { success: true, currentLedgerId: ledgerId };
  }

  async getLedgerById(ledgerId: string) {
    const ledger = this.db
      .select()
      .from(schema.ledgers)
      .where(eq(schema.ledgers.id, ledgerId))
      .get();
    if (!ledger) throw new NotFoundException('账本不存在');
    return ledger;
  }

  /**
   * 跨账本调拨可支配资金 (原子操作)
   */
  async transferFundsBetweenLedgers(
    fromLedgerId: string,
    toLedgerId: string,
    amount: number,
  ) {
    const [fromLedger, toLedger] = await Promise.all([
      this.getLedgerById(fromLedgerId),
      this.getLedgerById(toLedgerId),
    ]);

    if (fromLedger.disposableIncome < amount) {
      throw new BadRequestException('来源账本可支配资金不足');
    }

    const now = new Date();

    // 1. 扣除来源资金
    this.db
      .update(schema.ledgers)
      .set({
        disposableIncome: (fromLedger.disposableIncome || 0) - amount,
        updatedAt: now,
      })
      .where(eq(schema.ledgers.id, fromLedgerId))
      .run();

    // 2. 增加目标资金
    this.db
      .update(schema.ledgers)
      .set({
        disposableIncome: (toLedger.disposableIncome || 0) + amount,
        updatedAt: now,
      })
      .where(eq(schema.ledgers.id, toLedgerId))
      .run();

    return { success: true, fromLedgerId, toLedgerId, amount };
  }
}
