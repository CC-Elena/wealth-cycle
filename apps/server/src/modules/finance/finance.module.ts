import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';
import { AccountService } from './account.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { FinanceController } from './finance.controller';
import { GovernanceService } from './governance.service';
import { InventoryService } from './inventory.service';
import { LedgerController } from './ledger.controller';
import { LedgerService } from './ledger.service';
import { PayrollService } from './payroll.service';
import { PredictionService } from './prediction.service';
import { ReviewService } from './review.service';
import { SavingsService } from './savings.service';
import { TransactionService } from './transaction.service';
import { WishlistService } from './wishlist.service';

@Module({
  imports: [UserModule, NotificationModule],

  controllers: [FinanceController, LedgerController],
  providers: [
    CategoryService,
    TransactionService,
    BudgetService,
    PayrollService,
    ReviewService,
    InventoryService,
    SavingsService,
    AccountService,
    WishlistService,
    GovernanceService,
    LedgerService,
    PredictionService,
  ],
  exports: [
    CategoryService,
    TransactionService,
    BudgetService,
    PayrollService,
    ReviewService,
    InventoryService,
    SavingsService,
    AccountService,
    WishlistService,
    GovernanceService,
    LedgerService,
    PredictionService,
  ],
})
export class FinanceModule {}
