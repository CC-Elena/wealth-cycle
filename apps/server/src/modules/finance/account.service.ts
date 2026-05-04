import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class AccountService {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  /**
   * 初始化默认账户 (用于数据迁移)
   */
  ensureDefaultAccount() {
    // 默认账本ID通常为 default-ledger-1，这里尝试获取
    const defaultLedgerId = 'default-ledger-1';

    const existing = this.db
      .select()
      .from(schema.accounts)
      .where(
        and(
          eq(schema.accounts.userId, DEFAULT_USER_ID),
          // 若没有明确查询 ledger，寻找该用户下的第一个默认账户
          sql`${schema.accounts.ledgerId} IS NOT NULL`,
        ),
      )
      .get();

    if (!existing) {
      const now = new Date();
      this.db
        .insert(schema.accounts)
        .values({
          id: 'acc-default',
          userId: DEFAULT_USER_ID,
          ledgerId: defaultLedgerId, // 补充 ledgerId
          name: '我的钱包',
          type: 'cash',
          balance: 0,
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      return 'acc-default';
    }
    return existing.id;
  }

  createAccount(data: any, ledgerId: string) {
    const now = new Date();
    const id = `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    this.db
      .insert(schema.accounts)
      .values({
        id,
        userId: DEFAULT_USER_ID,
        ledgerId: data.ledgerId || ledgerId || 'default-ledger-1',
        name: data.name,
        type: data.type || 'cash',
        balance: data.balance || 0,
        isDefault: data.isDefault || false,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return this.getAccountById(id);
  }

  getAccounts(ledgerId?: string) {
    const filters = [eq(schema.accounts.userId, DEFAULT_USER_ID)];
    if (ledgerId) {
      filters.push(eq(schema.accounts.ledgerId, ledgerId));
    }

    return this.db
      .select()
      .from(schema.accounts)
      .where(and(...filters))
      .all();
  }

  getAccountById(id: string) {
    const account = this.db
      .select()
      .from(schema.accounts)
      .where(eq(schema.accounts.id, id))
      .get();

    if (!account) throw new NotFoundException('账户未找到');
    return account;
  }

  /**
   * 原子化更新余额
   */
  updateBalance(accountId: string, amount: number, txHost?: any) {
    const db = txHost || this.db;
    const now = new Date();

    const result = db
      .update(schema.accounts)
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
  transfer(fromId: string, toId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('转账金额必须大于0');

    return this.db.transaction((tx) => {
      const fromAccount = this.getAccountById(fromId);
      const toAccount = this.getAccountById(toId);

      if (fromAccount.ledgerId !== toAccount.ledgerId) {
        throw new BadRequestException('目前不支持跨账本转账');
      }

      this.updateBalance(fromId, -amount, tx);
      this.updateBalance(toId, amount, tx);

      const now = new Date();
      const ledgerId = fromAccount.ledgerId;

      tx.insert(schema.transactions)
        .values({
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
        })
        .run();

      tx.insert(schema.transactions)
        .values({
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
        })
        .run();
    });
  }
}
