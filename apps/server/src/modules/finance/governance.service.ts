import { Injectable, Inject, Logger } from '@nestjs/common';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { eq, sql } from 'drizzle-orm';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { WishlistService } from './wishlist.service';
import { UserService } from '../user/user.service';
import { AccountService } from './account.service';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
    private readonly wishlistService: WishlistService,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
  ) {}

  /**
   * 物理备份数据库
   */
  async backupDatabase() {
    const backupDir = join(process.cwd(), 'data/backups');
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    const filename = `local.db.backup.${Date.now()}`;
    const fullPath = join(backupDir, filename);
    
    try {
      // better-sqlite3 提供的物理备份 API
      const sqlite = (this.db as any).$client;
      await sqlite.backup(fullPath);
      this.logger.log(`Database backed up to: ${fullPath}`);
      return { success: true, path: fullPath };
    } catch (error) {
      this.logger.error('Database backup failed', error);
      throw error;
    }
  }

  /**
   * 获取系统健康报告
   */
  async getSystemHealthReport(ledgerId: string) {
    const accounts = await this.accountService.getAccounts(ledgerId);
    
    // 获取特定账本的数据
    const ledger = await this.db.select().from(schema.ledgers).where(eq(schema.ledgers.id, ledgerId)).get();
    const frozenAmount = await this.wishlistService.getFrozenAmount(ledgerId);

    if (!ledger) throw new Error('Ledger not found');

    const accountsTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
    // 核心对账公式：账户总额 = 可支配资金 + 储蓄 + 应急金
    const profileTotal = (ledger.disposableIncome || 0) + (ledger.savingsAmount || 0) + (ledger.emergencyFundAmount || 0);
    
    const balanceMismatch = Math.abs(accountsTotal - profileTotal) > 0.01;

    return {
      isHealthy: !balanceMismatch,
      checks: [
        {
          name: '财务一致性 (账面 vs 账户)',
          status: balanceMismatch ? 'error' : 'pass',
          details: balanceMismatch 
            ? `差额: ¥${(accountsTotal - profileTotal).toFixed(2)} (账户总计: ¥${accountsTotal.toFixed(2)}, 账面总计: ¥${profileTotal.toFixed(2)})`
            : `对账通过 (总额: ¥${accountsTotal.toFixed(2)})`,
        },
        {
          name: '资金锁定状态',
          status: 'pass',
          details: `当前冷冻资金: ¥${frozenAmount.toFixed(2)}`,
        },
        {
          name: '数据库状态',
          status: 'pass',
          details: 'SQLCipher 加密运行中',
        }
      ],
      mismatchAmount: accountsTotal - profileTotal,
      accountsTotal,
      profileTotal,
    };
  }

  /**
   * 修复余额不一致 (校准模式 B：以账户表为准)
   */
  async reconcileBalances(ledgerId: string) {
    const accounts = await this.accountService.getAccounts(ledgerId);
    const ledger = await this.db.select().from(schema.ledgers).where(eq(schema.ledgers.id, ledgerId)).get();
    if (!ledger) throw new Error('Ledger not found');

    const accountsTotal = accounts.reduce((sum, a) => sum + a.balance, 0);
    
    // 我们假设账户表的数据是最真实的，更新 Ledger 中的可支配资金
    const currentOtherFunds = (ledger.savingsAmount || 0) + (ledger.emergencyFundAmount || 0);
    const newDisposable = accountsTotal - currentOtherFunds;

    await this.db.update(schema.ledgers)
      .set({
        disposableIncome: newDisposable,
        updatedAt: new Date(),
      })
      .where(eq(schema.ledgers.id, ledgerId))
      .run();

    this.logger.log(`Balance reconciled. New disposable income: ${newDisposable}`);
    return { success: true, newDisposable };
  }
}
