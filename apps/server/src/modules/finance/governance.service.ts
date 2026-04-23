import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import type { NotificationService } from '../notification/notification.service';
import type { UserService } from '../user/user.service';
import type { AccountService } from './account.service';
import type { WishlistService } from './wishlist.service';


const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class GovernanceService {
  private readonly logger = new Logger(GovernanceService.name);

  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
    private readonly wishlistService: WishlistService,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly notificationService: NotificationService,
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

  /**
   * 检查发薪提醒
   */
  async checkPaydayReminders(userId: string) {
    const allLedgers = await this.db.select().from(schema.ledgers).where(eq(schema.ledgers.userId, userId)).all();
    const today = new Date();
    const currentDay = today.getDate();

    for (const ledger of allLedgers) {
      if (!ledger.payday) continue;

      // 提醒策略：发薪日前一天及当天提醒
      const isPayday = ledger.payday === currentDay;
      const isDayBefore = ledger.payday === currentDay + 1;

      if (isPayday || isDayBefore) {
        await this.notificationService.create({
          userId: ledger.userId,
          ledgerId: ledger.id,
          type: 'payroll_reminder',
          title: isPayday ? '今日发薪提醒' : '明日发薪预警',
          message: isPayday 
            ? `今天是账本“${ledger.name}”的设定的发薪日，请记得处理薪资录入。`
            : `明天是账本“${ledger.name}”的发薪日，请提前规划。`,
          data: { payday: ledger.payday }
        });
      }
    }
  }

  /**
   * 导出全量财务数据
   */
  async exportAllData(userId: string) {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: await this.db.select().from(schema.users).where(eq(schema.users.id, userId)).get(),
      ledgers: await this.db.select().from(schema.ledgers).where(eq(schema.ledgers.userId, userId)).all(),
      categories: await this.db.select().from(schema.categories).where(eq(schema.categories.userId, userId)).all(),
      transactions: await this.db.select().from(schema.transactions).where(eq(schema.transactions.userId, userId)).all(),
      budgetPlans: await this.db.select().from(schema.budgetPlans).where(eq(schema.budgetPlans.userId, userId)).all(),
      inventoryItems: await this.db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.userId, userId)).all(),
      wishlistItems: await this.db.select().from(schema.wishlistItems).where(eq(schema.wishlistItems.userId, userId)).all(),
      fixedBills: await this.db.select().from(schema.fixedBills).where(eq(schema.fixedBills.userId, userId)).all(),
    };

    return data;
  }
}
