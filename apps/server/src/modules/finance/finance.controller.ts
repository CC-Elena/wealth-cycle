import { Controller, Get, Post, Body, Query, UsePipes } from '@nestjs/common';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateCategorySchema, CreateTransactionSchema } from '@stock/shared';

@Controller()
export class FinanceController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly transactionService: TransactionService,
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
}
