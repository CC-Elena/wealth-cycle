import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { DB_CONNECTION } from '../../database/database.module';
import * as schema from '../../database/schema';

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  constructor(@Inject(DB_CONNECTION) private readonly db: any) {}

  /**
   * 获取当前周期各预算块的支出预测与风险评估
   */
  async getBudgetPredictions(ledgerId: string) {
    const budgets = await this.db.select().from(schema.budgetPlans)
      .where(and(eq(schema.budgetPlans.ledgerId, ledgerId), eq(schema.budgetPlans.isActive, true)));

    const results = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysElapsed = Math.floor((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = endOfMonth.getDate();

    for (const budget of budgets) {
      try {
        // 1. 获取关联分类
        const budgetCats = await this.db.select().from(schema.budgetCategories)
          .where(eq(schema.budgetCategories.budgetId, budget.id));
        
        const catIds = budgetCats.map(c => c.categoryId);
        if (catIds.length === 0) continue;

        // 2. 计算本周期支出
        const txs = await this.db.select({
          total: sql<number>`sum(${schema.transactions.amount})`
        }).from(schema.transactions)
          .where(and(
            eq(schema.transactions.ledgerId, ledgerId),
            inArray(schema.transactions.categoryId, catIds),
            sql`${schema.transactions.date} >= ${startOfMonth.getTime()}`
          ));
        
        const spent = Number(txs[0]?.total || 0);

        // 3. 预测算法 (线性预测 + 置信度考量)
        const dailyRate = spent / daysElapsed;
        const predictedEnd = dailyRate * totalDays;
        
        // 判定风险位
        let risk: 'high' | 'medium' | 'safe' = 'safe';
        if (predictedEnd > budget.totalAmount) {
          risk = 'high';
        } else if (predictedEnd > budget.totalAmount * 0.85) {
          risk = 'medium';
        }

        results.push({
          budgetId: budget.id,
          name: budget.name,
          spent,
          budget: budget.totalAmount,
          predictedEnd,
          risk,
          daysElapsed,
          totalDays
        });
      } catch (error) {
        this.logger.error(`Error predicting for budget ${budget.id}`, error);
      }
    }
    
    return results;
  }

  /**
   * 执行跨预算块的资金调剂
   */
  async transferFunds(userId: string, ledgerId: string, fromId: string | null, toId: string, amount: number, reason: string) {
    return await this.db.transaction(async (tx: any) => {
      // 1. 记录调剂日志
      const adjustmentId = randomUUID();
      await tx.insert(schema.budgetAdjustments).values({
        id: adjustmentId,
        userId,
        ledgerId,
        fromBudgetId: fromId,
        toBudgetId: toId,
        amount,
        reason,
        date: new Date(),
        createdAt: new Date(),
      });

      // 2. 更新目标预算块
      const toBudget = await tx.select().from(schema.budgetPlans).where(eq(schema.budgetPlans.id, toId)).get();
      if (!toBudget) throw new Error('Target budget not found');
      
      await tx.update(schema.budgetPlans)
        .set({ 
          totalAmount: Number(toBudget.totalAmount) + amount,
          updatedAt: new Date()
        })
        .where(eq(schema.budgetPlans.id, toId));

      // 3. 更新来源预算块 (如果是从另一个预算块划转)
      if (fromId) {
        const fromBudget = await tx.select().from(schema.budgetPlans).where(eq(schema.budgetPlans.id, fromId)).get();
        if (!fromBudget) throw new Error('Source budget not found');
        
        await tx.update(schema.budgetPlans)
          .set({ 
            totalAmount: Number(fromBudget.totalAmount) - amount,
            updatedAt: new Date()
          })
          .where(eq(schema.budgetPlans.id, fromId));
      } else {
        // 如果是从可支配收入划入，更新账本余额
        const ledger = await tx.select().from(schema.ledgers).where(eq(schema.ledgers.id, ledgerId)).get();
        if (ledger) {
          await tx.update(schema.ledgers)
            .set({ 
              disposableIncome: Number(ledger.disposableIncome) - amount,
              updatedAt: new Date()
            })
            .where(eq(schema.ledgers.id, ledgerId));
        }
      }

      return { adjustmentId, status: 'success' };
    });
  }
}
