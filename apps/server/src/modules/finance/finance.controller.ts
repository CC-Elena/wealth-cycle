import { Controller, Get, Post, Body, Query, UsePipes, Put, Param, Delete, Headers } from '@nestjs/common';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { PayrollService } from './payroll.service';
import { UserService } from '../user/user.service';
import { AccountService } from './account.service';
import { WishlistService } from './wishlist.service';
import { GovernanceService } from './governance.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { 
  CreateCategorySchema, 
  CreateTransactionSchema, 
  CreateBudgetPlanSchema, 
  UpdateBudgetPlanSchema,
  CreateFixedBillSchema,
  CreatePayrollEventSchema
} from '@stock/shared';

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
  ) {}

  @Get('accounts')
  getAccounts(@Headers('x-ledger-id') ledgerId: string) {
    return this.accountService.getAccounts(ledgerId === 'global' ? undefined : ledgerId);
  }

  @Get('health/stats')
  async getHealthStats(@Headers('x-ledger-id') ledgerId: string) {
    const isGlobal = ledgerId === 'global';
    const targetId = isGlobal ? undefined : ledgerId;
    
    const spendingStats = this.transactionService.getDailySpendingStats(targetId);
    
    let disposableIncome = 0;
    if (isGlobal) {
      // 聚合所有账本的可支配收入
      const ledgers = await this.userService.getMyLedgers();
      disposableIncome = ledgers.reduce((sum, l) => sum + (l.disposableIncome || 0), 0);
    } else {
      const ledger = await this.userService.getLedgerById(ledgerId);
      disposableIncome = ledger?.disposableIncome || 0;
    }
    
    // 生存天数计算：总可支配资金 / 过去30天总日均支出
    const survivalDays = Math.floor(disposableIncome / spendingStats.meanDailySpend);
    
    return {
      ...spendingStats,
      disposableIncome,
      survivalDays,
    };
  }

  @Get('finance/wishlist')
  getWishlist(@Headers('x-ledger-id') ledgerId: string) {
    return this.wishlistService.getWishlistItems(ledgerId === 'global' ? undefined : ledgerId);
  }

  @Post('finance/wishlist/:id/status')
  updateWishlistStatus(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected' | 'bought'
  ) {
    return this.wishlistService.updateStatus(id, status);
  }

  @Get('finance/health/report')
  getHealthReport(@Headers('x-ledger-id') ledgerId: string) {
    return this.governanceService.getSystemHealthReport(ledgerId === 'global' ? undefined : ledgerId);
  }

  @Post('finance/health/reconcile')
  reconcile(@Headers('x-ledger-id') ledgerId: string) {
    return this.governanceService.reconcileBalances(ledgerId === 'global' ? undefined : ledgerId);
  }

  @Post('finance/health/backup')
  backup() {
    return this.governanceService.backupDatabase();
  }

  @Get('finance/stats/trend')
  getMonthlyTrend(
    @Headers('x-ledger-id') ledgerId: string,
    @Query('months') months?: string
  ) {
    return this.transactionService.getMonthlyTrend(
      ledgerId === 'global' ? undefined : ledgerId, 
      months ? parseInt(months, 10) : 6
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
    return this.categoryService.getAllCategories(ledgerId === 'global' ? undefined : ledgerId);
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
    @Query('limit') limit?: string
  ) {
    return this.transactionService.getTransactions(
      ledgerId === 'global' ? undefined : ledgerId, 
      limit ? parseInt(limit, 10) : 50
    );
  }

  @Post('transactions')
  @UsePipes(new ZodValidationPipe(CreateTransactionSchema))
  createTransaction(@Headers('x-ledger-id') ledgerId: string, @Body() body: any) {
    return this.transactionService.createTransaction({ ...body, ledgerId });
  }

  // ─── Budgets ───

  @Get('budgets')
  getBudgets(@Headers('x-ledger-id') ledgerId: string) {
    return this.budgetService.getBudgetPlans(ledgerId === 'global' ? undefined : ledgerId);
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
    return this.payrollService.getFixedBills(ledgerId === 'global' ? undefined : ledgerId);
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
    @Body('salary') salary: number
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
}
