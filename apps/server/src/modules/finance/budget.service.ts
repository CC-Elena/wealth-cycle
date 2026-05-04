import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateBudgetPlan, UpdateBudgetPlan } from '@stock/shared';
import { and, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

const DEFAULT_USER_ID = 'default-local-user-1';

@Injectable()
export class BudgetService {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: BetterSQLite3Database<typeof schema>,
  ) {}

  async getBudgetPlans(ledgerId?: string) {
    const plans = this.db
      .select()
      .from(schema.budgetPlans)
      .where(
        and(
          eq(schema.budgetPlans.userId, DEFAULT_USER_ID),
          ledgerId ? eq(schema.budgetPlans.ledgerId, ledgerId) : undefined,
        ),
      )
      .all();

    const plansWithProgress = [];

    for (const plan of plans) {
      // Get associated categories
      const linkedCategories = this.db
        .select()
        .from(schema.budgetCategories)
        .where(eq(schema.budgetCategories.budgetId, plan.id))
        .all();

      const categoryIds = linkedCategories.map((lc) => lc.categoryId);

      let spentAmount = 0;
      if (categoryIds.length > 0) {
        // Calculate spent amount based on transactions
        const start =
          plan.periodStart ||
          new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end =
          plan.periodEnd ||
          new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        const result = this.db
          .select({
            total: sql<number>`sum(${schema.transactions.amount})`,
          })
          .from(schema.transactions)
          .where(
            and(
              eq(schema.transactions.userId, DEFAULT_USER_ID),
              ledgerId ? eq(schema.transactions.ledgerId, ledgerId) : undefined,
              eq(schema.transactions.type, 'expense'),
              inArray(schema.transactions.categoryId, categoryIds),
              gte(schema.transactions.date, start),
              lte(schema.transactions.date, end),
            ),
          )
          .get();

        spentAmount = result?.total || 0;
      }

      plansWithProgress.push({
        ...plan,
        categoryIds,
        spentAmount,
      });
    }

    return plansWithProgress;
  }

  async createBudgetPlan(data: CreateBudgetPlan) {
    const now = new Date();
    const id = `budget-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Default period: current month
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.db
      .insert(schema.budgetPlans)
      .values({
        id,
        userId: DEFAULT_USER_ID,
        ledgerId: data.ledgerId,
        name: data.name,
        totalAmount: data.totalAmount,
        period: data.period ?? 'monthly',
        settlement: data.settlement ?? 'carry_over',
        icon: data.icon ?? '💰',
        color: data.color ?? '#6C5DD3',
        priority: data.priority ?? 0,
        isActive: true,
        periodStart,
        periodEnd,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    // Insert categories
    if (data.categoryIds && data.categoryIds.length > 0) {
      try {
        for (const catId of data.categoryIds) {
          this.db
            .insert(schema.budgetCategories)
            .values({
              budgetId: id,
              categoryId: catId,
            })
            .run();
        }
      } catch (err: any) {
        if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
          // 如果外键失败，必须先删除已经插入的 budget plan 以保持一致性
          this.db.delete(schema.budgetPlans).where(eq(schema.budgetPlans.id, id)).run();
          throw new BadRequestException('关联的分类 ID 不存在');
        }
        throw err;
      }
    }

    return this.getBudgetPlanById(id);
  }

  async getBudgetPlanById(id: string) {
    const plans = await this.getBudgetPlans();
    return plans.find((p) => p.id === id);
  }

  async checkBudgetStatus(categoryId: string, ledgerId: string) {
    // Find budget plan associated with this category
    const budgetCategory = this.db
      .select()
      .from(schema.budgetCategories)
      .where(eq(schema.budgetCategories.categoryId, categoryId))
      .get();

    if (!budgetCategory) return null;

    const plan = await this.getBudgetPlanById(budgetCategory.budgetId);
    if (!plan) return null;

    return {
      plan,
      isOverdraft: plan.spentAmount > plan.totalAmount,
      usagePercent:
        plan.totalAmount > 0 ? (plan.spentAmount / plan.totalAmount) * 100 : 0,
    };
  }

  async updateBudgetPlan(id: string, data: UpdateBudgetPlan) {
    const now = new Date();

    this.db
      .update(schema.budgetPlans)
      .set({
        ...data,
        updatedAt: now,
      } as any)
      .where(eq(schema.budgetPlans.id, id))
      .run();

    if (data.categoryIds) {
      // Re-sync categories
      this.db
        .delete(schema.budgetCategories)
        .where(eq(schema.budgetCategories.budgetId, id))
        .run();

      for (const catId of data.categoryIds) {
        this.db
          .insert(schema.budgetCategories)
          .values({
            budgetId: id,
            categoryId: catId,
          })
          .run();
      }
    }

    return this.getBudgetPlanById(id);
  }

  async reallocateBudget(fromId: string, toId: string, amount: number) {
    const fromPlan = await this.getBudgetPlanById(fromId);
    const toPlan = await this.getBudgetPlanById(toId);

    if (!fromPlan || !toPlan) {
      throw new Error('One or both budget plans not found');
    }

    if (fromPlan.ledgerId !== toPlan.ledgerId) {
      throw new Error('预算调剂仅限在同一账本内进行');
    }

    if (fromPlan.totalAmount < amount) {
      throw new Error('Insufficient budget in source plan to reallocate');
    }

    const now = new Date();

    // Update source
    this.db
      .update(schema.budgetPlans)
      .set({
        totalAmount: fromPlan.totalAmount - amount,
        updatedAt: now,
      })
      .where(eq(schema.budgetPlans.id, fromId))
      .run();

    // Update target
    this.db
      .update(schema.budgetPlans)
      .set({
        totalAmount: toPlan.totalAmount + amount,
        updatedAt: now,
      })
      .where(eq(schema.budgetPlans.id, toId))
      .run();

    return { success: true, fromId, toId, amount };
  }
}
