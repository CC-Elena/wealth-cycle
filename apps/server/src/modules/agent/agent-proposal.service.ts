import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { DB_CONNECTION } from '../../database/database.module';
import { agentProposals, transactions, transactionItems } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TransactionService } from '../finance/transaction.service';
import { BudgetService } from '../finance/budget.service';
import { InventoryService } from './inventory.service';
import { AccountService } from './account.service';
import { SavingsService } from './savings.service';
import { WishlistService } from '../finance/wishlist.service';

@Injectable()
export class AgentProposalService {
  constructor(
    @Inject(DB_CONNECTION) private readonly db: any,
    private readonly savingsService: SavingsService,
    private readonly wishlistService: WishlistService,
    private readonly governanceService: GovernanceService,
  ) {}

  async createProposal(userId: string, toolName: string, args: any, summary?: string) {
    const id = uuidv4();
    const now = new Date();
    
    await this.db.insert(agentProposals).values({
      id,
      userId,
      toolName,
      arguments: args,
      status: 'pending',
      summary: summary || `${toolName} 提议`,
      createdAt: now,
      updatedAt: now,
    });

    return id;
  }

  async getPendingProposals(userId: string, ledgerId: string) {
    return this.db
      .select()
      .from(agentProposals)
      .where(
        and(
          eq(agentProposals.userId, userId),
          eq(agentProposals.ledgerId, ledgerId),
          eq(agentProposals.status, 'pending')
        )
      )
      .orderBy(agentProposals.createdAt);
  }

  async executeProposal(userId: string, proposalId: string) {
    const [proposal] = await this.db
      .select()
      .from(agentProposals)
      .where(
        and(
          eq(agentProposals.userId, userId),
          eq(agentProposals.id, proposalId),
          eq(agentProposals.status, 'pending')
        )
      );

    if (!proposal) {
      throw new NotFoundException('提议不存在或已处理');
    }

    try {
      if (proposal.toolName === 'create_transaction') {
        const args = proposal.arguments as any;
        await this.transactionService.createTransaction({
          ledgerId: args.ledgerId, // 透传 ledgerId
          amount: args.amount,
          categoryId: args.categoryId,
          accountId: args.accountId,
          type: args.type,
          memo: args.memo,
          items: args.items,
        });
      } else if (proposal.toolName === 'reallocate_budget') {
        const args = proposal.arguments as any;
        await this.budgetService.reallocateBudget(args.fromBudgetId, args.toBudgetId, args.amount);
      } else if (proposal.toolName === 'consume_item') {
        const args = proposal.arguments as any;
        await this.inventoryService.consume(args.itemId, args.quantity);
      } else if (proposal.toolName === 'transfer_to_savings') {
        const args = proposal.arguments as any;
        await this.userService.updatePreferences(args); // 修正：现在由 UserService 处理
      } else if (proposal.toolName === 'withdraw_emergency_fund') {
        const args = proposal.arguments as any;
        await this.userService.updatePreferences(args); 
      } else if (proposal.toolName === 'transfer_funds') {
        const args = proposal.arguments as any;
        await this.accountService.transfer(args.fromAccountId, args.toAccountId, args.amount);
      } else if (proposal.toolName === 'add_to_wishlist') {
        const args = proposal.arguments as any;
        await this.wishlistService.createWishlistItem({
          ledgerId: args.ledgerId,
          name: args.name,
          amount: args.amount,
          categoryId: args.categoryId,
          reason: args.reason,
          coolingDays: args.coolingDays,
        });
      } else if (proposal.toolName === 'perform_health_check') {
        const args = proposal.arguments as any;
        const report = await this.governanceService.getSystemHealthReport(args.ledgerId);
        if (report.isHealthy) {
          // Healthy
        }
      } else if (proposal.toolName === 'reconcile_finance_data') {
        const args = proposal.arguments as any;
        await this.governanceService.reconcileBalances(args.ledgerId);
      } else {
        throw new BadRequestException(`不支持执行工具: ${proposal.toolName}`);
      }

      // 更新状态为已接受
      await this.db
        .update(agentProposals)
        .set({ status: 'accepted', updatedAt: new Date() })
        .where(eq(agentProposals.id, proposalId));

      return { success: true };
    } catch (error) {
      throw new BadRequestException(`执行提议失败: ${error.message}`);
    }
  }

  async rejectProposal(userId: string, proposalId: string) {
    await this.db
      .update(agentProposals)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(
        and(
          eq(agentProposals.userId, userId),
          eq(agentProposals.id, proposalId)
        )
      );
    return { success: true };
  }
}
