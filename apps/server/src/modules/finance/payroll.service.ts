import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { CreatePayrollEvent, CreateFixedBill } from '@stock/shared';
import { BudgetService } from './budget.service';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class PayrollService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: BetterSQLite3Database<typeof schema>,
    private readonly budgetService: BudgetService,
  ) {}

  async getFixedBills() {
    return this.db.select()
      .from(schema.fixedBills)
      .where(eq(schema.fixedBills.userId, DEFAULT_USER_ID))
      .all();
  }

  async createFixedBill(data: CreateFixedBill) {
    const id = `bill-${Date.now()}`;
    const now = new Date();
    this.db.insert(schema.fixedBills).values({
      id,
      userId: DEFAULT_USER_ID,
      ...data,
      createdAt: now,
      updatedAt: now,
    }).run();
    return id;
  }

  async calculatePayrollPreview(salary: number) {
    const fixedBills = await this.getFixedBills();
    const activeFixedBills = fixedBills.filter(b => b.isActive);
    const fixedBillsTotal = activeFixedBills.reduce((sum, b) => sum + b.amount, 0);

    const budgets = await this.budgetService.getBudgetPlans();
    let budgetReplenishmentTotal = 0;
    const replenishmentDetails: Record<string, number> = {};

    for (const budget of budgets) {
      if (!budget.isActive) continue;

      let topUpAmount = 0;
      if (budget.settlement === 'carry_over') {
        const remaining = Math.max(0, budget.totalAmount - (budget.spentAmount || 0));
        topUpAmount = Math.max(0, budget.totalAmount - remaining);
      } else {
        topUpAmount = budget.totalAmount;
      }

      budgetReplenishmentTotal += topUpAmount;
      replenishmentDetails[budget.id] = topUpAmount;
    }

    const disposableIncomeGenerated = salary - fixedBillsTotal - budgetReplenishmentTotal;

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
    const preview = await this.calculatePayrollPreview(data.salaryAmount);
    const now = new Date();
    const eventId = `payroll-${Date.now()}`;

    // 1. Update User Profile
    const profile = this.db.select().from(schema.userProfiles).where(eq(schema.userProfiles.userId, DEFAULT_USER_ID)).get();
    if (profile) {
      this.db.update(schema.userProfiles)
        .set({
          netWorth: (profile.netWorth || 0) + data.salaryAmount,
          disposableIncome: (profile.disposableIncome || 0) + preview.disposableIncomeGenerated,
          lastPayday: now,
          updatedAt: now,
        })
        .where(eq(schema.userProfiles.userId, DEFAULT_USER_ID))
        .run();
    }

    // 2. Update Budget Period Dates (This resets spent calculation for next period)
    const budgets = await this.budgetService.getBudgetPlans();
    for (const budget of budgets) {
      const nextPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      this.db.update(schema.budgetPlans)
        .set({
          periodStart: now,
          periodEnd: nextPeriodEnd,
          updatedAt: now,
        })
        .where(eq(schema.budgetPlans.id, budget.id))
        .run();
    }

    // 3. Save Event Snapshot
    this.db.insert(schema.payrollEvents).values({
      id: eventId,
      userId: DEFAULT_USER_ID,
      salaryAmount: data.salaryAmount,
      fixedBillsTotal: preview.fixedBillsTotal,
      budgetReplenishmentTotal: preview.budgetReplenishmentTotal,
      disposableIncomeGenerated: preview.disposableIncomeGenerated,
      date: now,
      snapshot: {
        budgets,
        fixedBills: preview.activeFixedBills,
        replenishmentDetails: preview.replenishmentDetails
      },
      createdAt: now,
    }).run();

    return { id: eventId, ...preview };
  }
}
