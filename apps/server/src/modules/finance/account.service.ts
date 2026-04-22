import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class AccountService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>
  ) {}

  /**
   * 初始化默认账户 (用于数据迁移)
   */
  async ensureDefaultAccount() {
    const existing = this.db.select()
      .from(schema.accounts)
      .where(and(
        eq(schema.accounts.userId, DEFAULT_USER_ID),
        // 若没有明确查询 ledger，寻找该用户下的第一个默认账户
        sql`${schema.accounts.ledgerId} IS NOT NULL`
      ))
      .get();

    if (!existing) {
      const now = new Date();
      this.db.insert(schema.accounts).values({
        id: 'acc-default',
        userId: DEFAULT_USER_ID,
        name: '我的钱包',
        type: 'cash',
        balance: 0,
        isDefault: true,
        createdAt: now,
        updatedAt: now,
      }).run();
      return 'acc-default';
    }
    return existing.id;
  }

  getAccounts(ledgerId?: string) {
    const filters = [eq(schema.accounts.userId, DEFAULT_USER_ID)];
    if (ledgerId) {
      filters.push(eq(schema.accounts.ledgerId, ledgerId));
    }

    return this.db.select()
      .from(schema.accounts)
      .where(and(...filters))
      .all();
  }

  getAccountById(id: string) {
    const account = this.db.select()
      .from(schema.accounts)
      .where(eq(schema.accounts.id, id))
      .get();
    
    if (!account) throw new NotFoundException('账户未找到');
    return account;
  }

  /**
   * 原子化更新余额
   */
  async updateBalance(accountId: string, amount: number, txHost?: any) {
    const db = txHost || this.db;
    const now = new Date();
    
    const result = db.update(schema.accounts)
      .set({
        balance: sql`${schema.accounts.balance} + ${amount}`,
        updatedAt: now,
      })
      .where(eq(schema.accounts.id, accountId))
      .run();

    if (result.changes === 0) {
      throw new BadRequestException('更新账户余额失败');
    }
  }

  /**
   * 内部转账
   */
  async transfer(fromId: string, toId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('转账金额必须大于0');
    
    return this.db.transaction(async (tx) => {
      const fromAccount = await this.getAccountById(fromId);
      const toAccount = await this.getAccountById(toId);

      if (fromAccount.ledgerId !== toAccount.ledgerId) {
        throw new BadRequestException('目前不支持跨账本转账');
      }

      await this.updateBalance(fromId, -amount, tx);
      await this.updateBalance(toId, amount, tx);
      
      const now = new Date();
      const ledgerId = fromAccount.ledgerId;

      tx.insert(schema.transactions).values({
        id: `tx-transfer-${Date.now()}`,
        userId: DEFAULT_USER_ID,
        ledgerId,
        amount,
        categoryId: 'cat-transfer',
        accountId: fromId,
        type: 'expense',
        memo: `转账至账户: ${toId}`,
        date: now,
        createdAt: now,
        updatedAt: now,
      }).run();

      tx.insert(schema.transactions).values({
        id: `tx-transfer-in-${Date.now()}`,
        userId: DEFAULT_USER_ID,
        ledgerId,
        amount,
        categoryId: 'cat-transfer',
        accountId: toId,
        type: 'income',
        memo: `收到转账，自账户: ${fromId}`,
        date: now,
        createdAt: now,
        updatedAt: now,
      }).run();
    });
  }
}
