import { Inject, Injectable } from '@nestjs/common';
import { CreateFixedBill, CreatePayrollEvent } from '@stock/shared';
import { and, eq, sql } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { AccountService } from './account.service';
import { BudgetService } from './budget.service';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class PayrollService {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: BetterSQLite3Database<typeof schema>,
    private readonly budgetService: BudgetService,
    private readonly accountService: AccountService,
  ) {}

  async getFixedBills(ledgerId?: string) {
    return this.db
      .select()
      .from(schema.fixedBills)
      .where(
        and(
          eq(schema.fixedBills.userId, DEFAULT_USER_ID),
          ledgerId ? eq(schema.fixedBills.ledgerId, ledgerId) : undefined,
        ),
      )
      .all();
  }

  async createFixedBill(data: CreateFixedBill) {
    const id = `bill-${Date.now()}`;
    const now = new Date();
    this.db
      .insert(schema.fixedBills)
      .values({
        id,
        userId: DEFAULT_USER_ID,
        ledgerId: data.ledgerId,
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .run();
    return id;
  }

  async calculatePayrollPreview(ledgerId: string, salary: number) {
    const fixedBills = await this.getFixedBills(ledgerId);
    const activeFixedBills = fixedBills.filter((b) => b.isActive);
    const fixedBillsTotal = activeFixedBills.reduce(
      (sum, b) => sum + b.amount,
      0,
    );

    const budgets = await this.budgetService.getBudgetPlans(ledgerId);
    let budgetReplenishmentTotal = 0;
    const replenishmentDetails: Record<string, number> = {};

    for (const budget of budgets) {
      if (!budget.isActive) continue;

      let topUpAmount = 0;
      if (budget.settlement === 'carry_over') {
        const remaining = Math.max(
          0,
          budget.totalAmount - (budget.spentAmount || 0),
        );
        topUpAmount = Math.max(0, budget.totalAmount - remaining);
      } else {
        topUpAmount = budget.totalAmount;
      }

      budgetReplenishmentTotal += topUpAmount;
      replenishmentDetails[budget.id] = topUpAmount;
    }

    const disposableIncomeGenerated =
      salary - fixedBillsTotal - budgetReplenishmentTotal;

    return {
      salaryAmount: salary,
      fixedBillsTotal,
      budgetReplenishmentTotal,
      disposableIncomeGenerated,
      activeFixedBills,
      replenishmentDetails,
    };
  }

  async executePayroll(data: CreatePayrollEvent) {
    const ledgerId = data.ledgerId;
    if (!ledgerId) throw new Error('Ledger ID is required for payroll');

    const preview = await this.calculatePayrollPreview(
      ledgerId,
      data.salaryAmount,
    );
    const now = new Date();
    const eventId = `payroll-${Date.now()}`;

    // 1. Update Ledger Financials (净资产调增, 可支配资金调增)
    const ledger = this.db
      .select()
      .from(schema.ledgers)
      .where(eq(schema.ledgers.id, ledgerId))
      .get();
    if (ledger) {
      await this.db.transaction(async (tx) => {
        tx.update(schema.ledgers)
          .set({
            netWorth: (ledger.netWorth || 0) + data.salaryAmount,
            disposableIncome:
              (ledger.disposableIncome || 0) +
              preview.disposableIncomeGenerated,
            lastPayday: now,
            updatedAt: now,
          })
          .where(eq(schema.ledgers.id, ledgerId))
          .run();

        const accountId =
          data.accountId || (await this.accountService.ensureDefaultAccount());
        await this.accountService.updateBalance(
          accountId,
          preview.disposableIncomeGenerated,
          tx,
        );
      });
    }

    // 2. Update Budget Period Dates
    const budgets = await this.budgetService.getBudgetPlans(ledgerId);
    for (const budget of budgets) {
      const nextPeriodEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        now.getDate(),
      );
      this.db
        .update(schema.budgetPlans)
        .set({
          periodStart: now,
          periodEnd: nextPeriodEnd,
          updatedAt: now,
        })
        .where(eq(schema.budgetPlans.id, budget.id))
        .run();
    }

    // 3. Save Event Snapshot
    this.db
      .insert(schema.payrollEvents)
      .values({
        id: eventId,
        userId: DEFAULT_USER_ID,
        ledgerId,
        salaryAmount: data.salaryAmount,
        fixedBillsTotal: preview.fixedBillsTotal,
        budgetReplenishmentTotal: preview.budgetReplenishmentTotal,
        disposableIncomeGenerated: preview.disposableIncomeGenerated,
        date: now,
        snapshot: {
          budgets,
          fixedBills: preview.activeFixedBills,
          replenishmentDetails: preview.replenishmentDetails,
        },
        createdAt: now,
      })
      .run();

    return { id: eventId, ...preview };
  }

  async deleteFixedBill(id: string) {
    this.db.delete(schema.fixedBills).where(eq(schema.fixedBills.id, id)).run();
  }
}
