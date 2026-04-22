import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { LedgerController } from './ledger.controller';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { PayrollService } from './payroll.service';
import { UserModule } from '../user/user.module';

import { ReviewService } from './review.service';
import { InventoryService } from './inventory.service';
import { SavingsService } from './savings.service';
import { AccountService } from './account.service';
import { WishlistService } from './wishlist.service';
import { GovernanceService } from './governance.service';
import { LedgerService } from './ledger.service';

@Module({
  imports: [UserModule],
  controllers: [FinanceController, LedgerController],
  providers: [CategoryService, TransactionService, BudgetService, PayrollService, ReviewService, InventoryService, SavingsService, AccountService, WishlistService, GovernanceService, LedgerService],
  exports: [CategoryService, TransactionService, BudgetService, PayrollService, ReviewService, InventoryService, SavingsService, AccountService, WishlistService, GovernanceService, LedgerService],
})
export class FinanceModule {}
