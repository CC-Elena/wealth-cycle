import { Controller, Get, Post, Body, Query, UsePipes, Put, Param, Delete } from '@nestjs/common';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { PayrollService } from './payroll.service';
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
  ) {}

  // ─── Categories ───

  @Get('categories')
  getCategories() {
    return this.categoryService.getAllCategories();
  }

  @Post('categories')
  @UsePipes(new ZodValidationPipe(CreateCategorySchema))
  createCategory(@Body() body: any) {
    return this.categoryService.createCategory(body);
  }

  // ─── Transactions ───

  @Get('transactions')
  getTransactions(@Query('limit') limit?: string) {
    return this.transactionService.getTransactions(limit ? parseInt(limit, 10) : 50);
  }

  @Post('transactions')
  @UsePipes(new ZodValidationPipe(CreateTransactionSchema))
  createTransaction(@Body() body: any) {
    return this.transactionService.createTransaction(body);
  }

  // ─── Budgets ───

  @Get('budgets')
  getBudgets() {
    return this.budgetService.getBudgetPlans();
  }

  @Post('budgets')
  @UsePipes(new ZodValidationPipe(CreateBudgetPlanSchema))
  createBudget(@Body() body: any) {
    return this.budgetService.createBudgetPlan(body);
  }

  @Put('budgets/:id')
  @UsePipes(new ZodValidationPipe(UpdateBudgetPlanSchema))
  updateBudget(@Param('id') id: string, @Body() body: any) {
    return this.budgetService.updateBudgetPlan(id, body);
  }

  // ─── Fixed Bills ───

  @Get('fixed-bills')
  getFixedBills() {
    return this.payrollService.getFixedBills();
  }

  @Post('fixed-bills')
  @UsePipes(new ZodValidationPipe(CreateFixedBillSchema))
  createFixedBill(@Body() body: any) {
    return this.payrollService.createFixedBill(body);
  }

  // ─── Payroll ───

  @Post('payroll/preview')
  getPayrollPreview(@Body('salary') salary: number) {
    return this.payrollService.calculatePayrollPreview(salary);
  }

  @Post('payroll/execute')
  @UsePipes(new ZodValidationPipe(CreatePayrollEventSchema))
  executePayroll(@Body() body: any) {
    return this.payrollService.executePayroll(body);
  }
}
