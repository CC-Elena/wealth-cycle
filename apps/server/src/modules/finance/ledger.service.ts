import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class LedgerService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  async getLedgers(userId: string = DEFAULT_USER_ID) {
    return this.db.select().from(schema.ledgers).where(eq(schema.ledgers.userId, userId)).all();
  }

  async createLedger(userId: string, data: { name: string; icon?: string }) {
    const id = uuidv4();
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
    const ledger = this.db.select().from(schema.ledgers)
      .where(and(eq(schema.ledgers.id, ledgerId), eq(schema.ledgers.userId, userId)))
      .get();

    if (!ledger) {
      throw new NotFoundException('账本不存在');
    }

    // 更新用户 Profile 指向
    this.db.update(schema.userProfiles)
      .set({ defaultLedgerId: ledgerId, updatedAt: new Date() })
      .where(eq(schema.userProfiles.userId, userId))
      .run();

    return { success: true, currentLedgerId: ledgerId };
  }

  async getLedgerById(ledgerId: string) {
    const ledger = this.db.select().from(schema.ledgers).where(eq(schema.ledgers.id, ledgerId)).get();
    if (!ledger) throw new NotFoundException('账本不存在');
    return ledger;
  }
}
