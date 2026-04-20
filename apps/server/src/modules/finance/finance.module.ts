import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';

@Module({
  controllers: [FinanceController],
  providers: [CategoryService, TransactionService],
  exports: [CategoryService, TransactionService],
})
export class FinanceModule {}
