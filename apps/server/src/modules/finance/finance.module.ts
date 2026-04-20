import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { PayrollService } from './payroll.service';

@Module({
  controllers: [FinanceController],
  providers: [CategoryService, TransactionService, BudgetService, PayrollService],
  exports: [CategoryService, TransactionService, BudgetService, PayrollService],
})
export class FinanceModule {}
