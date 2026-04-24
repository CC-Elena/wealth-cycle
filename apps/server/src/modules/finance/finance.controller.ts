import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Request,
  UsePipes,
} from '@nestjs/common';
import {
  CreateBudgetPlanSchema,
  CreateCategorySchema,
  CreateFixedBillSchema,
  CreatePayrollEventSchema,
  CreateTransactionSchema,
  UpdateBudgetPlanSchema,
} from '@stock/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { UserService } from '../user/user.service';
import { AccountService } from './account.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { GovernanceService } from './governance.service';
import { InventoryService } from './inventory.service';
import { PayrollService } from './payroll.service';
import { PredictionService } from './prediction.service';
import { TransactionService } from './transaction.service';
import { WishlistService } from './wishlist.service';
import { LedgerService } from './ledger.service';

@Controller()
export class FinanceController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly transactionService: TransactionService,
    private readonly budgetService: BudgetService,
    private readonly payrollService: PayrollService,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly wishlistService: WishlistService,
    private readonly governanceService: GovernanceService,
    private readonly predictionService: PredictionService,
    private readonly inventoryService: InventoryService,
    private readonly ledgerService: LedgerService,
  ) {}

  @Get('finance/stats/prediction')
  getPredictions(@Headers('x-ledger-id') ledgerId: string) {
    return this.predictionService.getBudgetPredictions(ledgerId);
  }

  @Post('finance/budgets/transfer')
  transferBudgets(
    @Headers('x-ledger-id') ledgerId: string,
    @Body() body: {
      fromId: string | null;
      toId: string;
      amount: number;
      reason: string;
    },
  ) {
    // 这里暂时使用 mock userId 1，实际应从 Auth 获取
    return this.predictionService.transferFunds(
      '1',
      ledgerId,
      body.fromId,
      body.toId,
      body.amount,
      body.reason,
    );
  }

  @Get('accounts')
  getAccounts(@Headers('x-ledger-id') ledgerId: string) {
    return this.accountService.getAccounts(
      ledgerId === 'global' ? undefined : ledgerId,
    );
  }

  @Get('health/stats')
  async getHealthStats(@Headers('x-ledger-id') ledgerId: string) {
    // 异步触发发薪提醒检查
    this.governanceService
      .checkPaydayReminders('default-local-user-1')
      .catch(() => {});

    const isGlobal = ledgerId === 'global';

    const targetId = isGlobal ? undefined : ledgerId;

    const spendingStats =
      this.transactionService.getDailySpendingStats(targetId);

    let disposableIncome = 0;
    if (isGlobal) {
      // 聚合所有账本的可支配收入
      const ledgers = await this.ledgerService.getLedgers();
      disposableIncome = ledgers.reduce(
        (sum: number, l: any) => sum + (l.disposableIncome || 0),
        0,
      );
    } else {
      const ledger = await this.ledgerService.getLedgerById(ledgerId);
      disposableIncome = ledger?.disposableIncome || 0;
    }

    // 生存天数计算：总可支配资金 / 过去30天总日均支出
    const survivalDays = Math.floor(
      disposableIncome / spendingStats.meanDailySpend,
    );

    return {
      ...spendingStats,
      disposableIncome,
      survivalDays,
    };
  }

  @Get('finance/wishlist')
  getWishlist(@Headers('x-ledger-id') ledgerId: string) {
    return this.wishlistService.getWishlistItems(
      ledgerId === 'global' ? undefined : ledgerId,
    );
  }

  @Post('finance/wishlist/:id/status')
  updateWishlistStatus(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected' | 'bought',
  ) {
    return this.wishlistService.updateStatus(id, status);
  }

  @Post('finance/wishlist/:id/evaluate')
  evaluateWishlistItem(
    @Param('id') id: string,
    @Body() scores: {
      need: number;
      joy: number;
      finance: number;
      utility: number;
      alternative: number;
    },
  ) {
    return this.wishlistService.evaluateItem(id, scores);
  }

  @Get('finance/health/report')
  getHealthReport(@Headers('x-ledger-id') ledgerId: string) {
    return this.governanceService.getSystemHealthReport(
      ledgerId === 'global' ? (undefined as any) : ledgerId,
    );
  }

  @Post('finance/health/reconcile')
  reconcile(@Headers('x-ledger-id') ledgerId: string) {
    return this.governanceService.reconcileBalances(
      ledgerId === 'global' ? (undefined as any) : ledgerId,
    );
  }

  @Post('finance/health/backup')
  backup() {
    return this.governanceService.backupDatabase();
  }

  @Get('finance/export')
  exportData() {
    return this.governanceService.exportAllData('default-local-user-1');
  }

  @Get('finance/stats/trend')
  getMonthlyTrend(
    @Headers('x-ledger-id') ledgerId: string,
    @Query('months') months?: string,
  ) {
    return this.transactionService.getMonthlyTrend(
      ledgerId === 'global' ? undefined : ledgerId,
      months ? parseInt(months, 10) : 6,
    );
  }

  @Get('finance/stats/categories')
  getCategoryDistribution(
    @Headers('x-ledger-id') ledgerId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    return this.transactionService.getCategoryDistribution(
      ledgerId === 'global' ? undefined : ledgerId,
      start ? new Date(start) : undefined,
      end ? new Date(end) : undefined,
    );
  }

  // ─── Categories ───

  @Get('categories')
  getCategories(@Headers('x-ledger-id') ledgerId: string) {
    return this.categoryService.getAllCategories(
      ledgerId === 'global' ? (undefined as any) : ledgerId,
    );
  }

  @Post('categories')
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  createCategory(@Headers('x-ledger-id') ledgerId: string, @Body() body: any) {
    return this.categoryService.createCategory({ ...body, ledgerId });
  }

  // ─── Transactions ───

  @Get('transactions')
  getTransactions(
    @Headers('x-ledger-id') ledgerId: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionService.getTransactions(
      ledgerId === 'global' ? (undefined as any) : ledgerId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('transactions')
  @UsePipes(new ZodValidationPipe(CreateTransactionSchema))
  createTransaction(
    @Headers('x-ledger-id') ledgerId: string,
    @Body() body: any,
  ) {
    return this.transactionService.createTransaction({ ...body, ledgerId });
  }

  // ─── Budgets ───

  @Get('budgets')
  getBudgets(@Headers('x-ledger-id') ledgerId: string) {
    return this.budgetService.getBudgetPlans(
      ledgerId === 'global' ? (undefined as any) : ledgerId,
    );
  }

  @Post('budgets')
  @UsePipes(new ZodValidationPipe(CreateBudgetPlanSchema))
  createBudget(@Headers('x-ledger-id') ledgerId: string, @Body() body: any) {
    return this.budgetService.createBudgetPlan({ ...body, ledgerId });
  }

  @Put('budgets/:id')
  @UsePipes(new ZodValidationPipe(UpdateBudgetPlanSchema))
  updateBudget(@Param('id') id: string, @Body() body: any) {
    return this.budgetService.updateBudgetPlan(id, body);
  }

  // ─── Fixed Bills ───

  @Get('fixed-bills')
  getFixedBills(@Headers('x-ledger-id') ledgerId: string) {
    return this.payrollService.getFixedBills(
      ledgerId === 'global' ? undefined : ledgerId,
    );
  }

  @Post('fixed-bills')
  @UsePipes(new ZodValidationPipe(CreateFixedBillSchema))
  createFixedBill(@Headers('x-ledger-id') ledgerId: string, @Body() body: any) {
    return this.payrollService.createFixedBill({ ...body, ledgerId });
  }

  // ─── Payroll ───

  @Post('payroll/preview')
  getPayrollPreview(
    @Headers('x-ledger-id') ledgerId: string,
    @Body('salary') salary: number,
  ) {
    return this.payrollService.calculatePayrollPreview(ledgerId, salary);
  }

  @Post('payroll/execute')
  @UsePipes(new ZodValidationPipe(CreatePayrollEventSchema))
  executePayroll(@Headers('x-ledger-id') ledgerId: string, @Body() body: any) {
    return this.payrollService.executePayroll({ ...body, ledgerId });
  }

  @Delete('fixed-bills/:id')
  deleteFixedBill(@Param('id') id: string) {
    return this.payrollService.deleteFixedBill(id);
  }

  // ─── Inventory ───

  @Get('inventory/items')
  getInventoryItems(@Headers('x-ledger-id') ledgerId: string) {
    return this.inventoryService.getInventoryItems(
      'default-local-user-1',
      ledgerId === 'global' ? (undefined as any) : ledgerId,
    );
  }

  @Post('inventory/waste')
  recordWaste(
    @Headers('x-ledger-id') ledgerId: string,
    @Body() body: { itemId: string; quantity: number; reason: string },
  ) {
    return this.inventoryService.recordWaste('default-local-user-1', {
      ...body,
      ledgerId,
    });
  }
}
