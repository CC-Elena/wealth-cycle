import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { CreateTransactionSchema } from '@stock/shared';
import ky from 'ky';
import type { AccountService } from '../finance/account.service';
import type { BudgetService } from '../finance/budget.service';
import type { CategoryService } from '../finance/category.service';
import type { GovernanceService } from '../finance/governance.service';
import type { InventoryService } from '../finance/inventory.service';
import type { LedgerService } from '../finance/ledger.service';
import type { PayrollService } from '../finance/payroll.service';
import type { PredictionService } from '../finance/prediction.service';
import type { ReviewService } from '../finance/review.service';
import type { SavingsService } from '../finance/savings.service';
import type { TransactionService } from '../finance/transaction.service';
import type { WishlistService } from '../finance/wishlist.service';
import type { UserService } from '../user/user.service';
import { AgentProposalService } from './agent-proposal.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  
  // 环境变量占位，实际运行时需配置
  private readonly apiKey = process.env.ARK_API_KEY || '';
  private readonly endpoint = process.env.ARK_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
  private readonly modelId = process.env.ARK_MODEL_ID || 'doubao-pro-4k';

  constructor(
    private readonly categoryService: CategoryService,
    private readonly transactionService: TransactionService,
    private readonly budgetService: BudgetService,
    private readonly userService: UserService,
    private readonly payrollService: PayrollService,
    @Inject(forwardRef(() => AgentProposalService))
    private readonly agentProposalService: AgentProposalService,
    private readonly reviewService: ReviewService,
    private readonly inventoryService: InventoryService,
    private readonly savingsService: SavingsService,
    private readonly accountService: AccountService,
    private readonly governanceService: GovernanceService,
    private readonly wishlistService: WishlistService,
    private readonly ledgerService: LedgerService,
    private readonly predictionService: PredictionService,
  ) {}

  async chat(ledgerId: string, messages: any[]) {
    // 1. 获取核心上下文：分类树与财务快照
    const isGlobal = ledgerId === 'global';
    const [categories, snapshot] = await Promise.all([
      isGlobal ? this.categoryService.getAllCategories() : this.categoryService.getAllCategories(ledgerId),
      this.getFinancialSnapshot(ledgerId),
    ]);

    const ledgerName = isGlobal ? '所有账本' : (await this.ledgerService.getLedgerById(ledgerId))?.name || '未知账本';
    const systemPrompt = this.generateSystemPrompt(ledgerName, snapshot, isGlobal, categories);

    // 2. 组装初始消息
    const callMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    let retryCount = 0;
    const maxRetries = 1;
    const userId = 'local-user';

    // 3. 调用模型 (兼容 OpenAI 协议)
    while (retryCount <= maxRetries) {
      try {
        if (!this.apiKey) {
          return {
            choices: [{
              message: {
                role: 'assistant',
                content: '请先在后端配置 ARK_API_KEY 环境变量。'
              }
            }]
          };
        }

        const response = await ky.post(this.endpoint, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          json: {
            model: this.modelId,
            messages: callMessages,
            tools: this.getTools(),
            tool_choice: 'auto',
          },
          timeout: 45000,
        }).json<any>();

        const assistantMsg = response.choices?.[0]?.message;

        // M4-F2 & M4-F3 & M4-A3: 校验与提议暂存逻辑
        if (assistantMsg?.tool_calls) {
          let validationError = null;
          for (const toolCall of assistantMsg.tool_calls) {
            const toolName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);

            if (toolName === 'create_transaction') {
              try {
                CreateTransactionSchema.parse(args);
                
                // M4-F3: 判定是否为“复杂操作”并进入暂存区
                // M4-A3 Refinement: 如果是冲动消费 (isImpulse)，也强制进入
                const isComplex = (args.items && args.items.length > 0) || args.amount > 1000 || args.isImpulse;
                if (isComplex) {
                  const proposalId = await this.agentProposalService.createProposal(
                    userId, 
                    'create_transaction', 
                    { ...args, ledgerId }, // 注入 ledgerId
                    args.memo || `记账提议: ${args.type === 'expense' ? '支出' : '收入'} ¥${args.amount}${args.isImpulse ? ' [冲动消费警示]' : ''}`
                  );
                  toolCall.proposalId = proposalId;
                }
              } catch (error: any) {
                validationError = error;
                break;
              }
            } else if (toolName === 'reallocate_budget') {
              const proposalId = await this.agentProposalService.createProposal(
                userId,
                'reallocate_budget',
                { ...args, ledgerId },
                args.reason || `预算调剂提议: ¥${args.amount}`
              );
              toolCall.proposalId = proposalId;
            } else if (toolName === 'submit_review') {
              // 评价直接处理，前端触发
              this.logger.log(`LLM proposed a review submission for task: ${args.taskId}`);
            } else if (toolName === 'consume_item') {
              // 消耗项提议
              const proposalId = await this.agentProposalService.createProposal(
                userId,
                'consume_item',
                { ...args, ledgerId },
                `消耗库存: ${args.itemName} x ${args.quantity}`
              );
              toolCall.proposalId = proposalId;
            } else if (toolName === 'transfer_to_savings') {
              const proposalId = await this.agentProposalService.createProposal(
                userId,
                'transfer_to_savings',
                { ...args, ledgerId },
                `划转资金至${args.category === 'emergency' ? '应急金' : '储蓄'}: ¥${args.amount}`
              );
              toolCall.proposalId = proposalId;
            } else if (toolName === 'reallocate_budget') {
              const proposalId = await this.agentProposalService.createProposal(
                userId,
                'reallocate_budget',
                { ...args, ledgerId },
                `预算调剂建议: 从 ${args.fromBudgetId || '可支配收入'} 划转 ¥${args.amount} 至 ${args.toBudgetId} (理由: ${args.reason})`
              );
              toolCall.proposalId = proposalId;
            } else if (toolName === 'withdraw_emergency_fund') {
              const proposalId = await this.agentProposalService.createProposal(
                userId,
                'withdraw_emergency_fund',
                { ...args, ledgerId },
                `提取应急金: ¥${args.amount} (理由: ${args.reason})`
              );
              toolCall.proposalId = proposalId;
            } else if (toolName === 'transfer_funds') {
              const proposalId = await this.agentProposalService.createProposal(
                userId,
                'transfer_funds',
                { ...args, ledgerId },
                `内部转账提议: 从账户 ${args.fromAccountId} 划转 ¥${args.amount} 至账户 ${args.toAccountId}`
              );
              toolCall.proposalId = proposalId;
            } else if (toolName === 'perform_health_check') {
              const proposalId = await this.agentProposalService.createProposal(
                userId,
                'perform_health_check',
                {},
                `系统财务一致性检查`
              );
              toolCall.proposalId = proposalId;
            } else if (toolName === 'transfer_between_ledgers') {
              const proposalId = await this.agentProposalService.createProposal(
                userId,
                'transfer_between_ledgers',
                { ...args },
                args.reason || `跨账本资金调拨提议: 从账本 ${args.fromLedgerId} 划转 ¥${args.amount} 至账本 ${args.toLedgerId}`
              );
              toolCall.proposalId = proposalId;
            }
          }

          if (validationError && retryCount < maxRetries) {
            callMessages.push(assistantMsg);
            callMessages.push({
              role: 'user',
              content: `工具调用参数校验失败：${validationError.message}。请修正后重试。`
            });
            retryCount++;
            continue;
          }
        }

        return response;
      } catch (error) {
        this.logger.error('LLM Call Failed', error);
        throw error;
      }
    }
  }

  private async getFinancialSnapshot(ledgerId: string) {
    try {
      const userId = 'local-user';
      const isGlobal = ledgerId === 'global';
      
      let ledgerSummary = '';
      let activeLedger: any = null;
      let ledgers: any[] = [];

      if (isGlobal) {
        ledgers = await this.ledgerService.getLedgers(userId);
        const totalNetWorth = ledgers.reduce((sum, l) => sum + (l.netWorth || 0), 0);
        const totalDisposable = ledgers.reduce((sum, l) => sum + (l.disposableIncome || 0), 0);
        ledgerSummary = `### 全局财务概览\n- **总净资产**: ¥${totalNetWorth.toFixed(2)}\n- **总可支配资金**: ¥${totalDisposable.toFixed(2)}\n\n#### 账本列表:\n${ledgers.map(l => `- ${l.icon} ${l.name}: 净资产 ¥${(l.netWorth || 0).toFixed(2)}, 可支配 ¥${(l.disposableIncome || 0).toFixed(2)}`).join('\n')}`;
      } else {
        activeLedger = await this.ledgerService.getLedgerById(ledgerId);
        if (!activeLedger) return '### 财务快照\n账本未找到。';
        await this.reviewService.scanAndCreateTasks(userId, ledgerId);
        ledgerSummary = `### 账本状态: ${activeLedger.icon} ${activeLedger.name}\n- **净资产**: ¥${activeLedger.netWorth.toFixed(2)}\n- **可支配资金**: ¥${activeLedger.disposableIncome.toFixed(2)}`;
      }

      // 获取业务数据 (如果是 global 则传入 undefined)
      const serviceLedgerId = isGlobal ? undefined : ledgerId;

      const [budgets, bills, pendingReviews, lowStockItems, trendData, accounts] = await Promise.all([
        this.budgetService.getBudgetPlans(serviceLedgerId),
        this.payrollService.getFixedBills(serviceLedgerId),
        this.reviewService.getPendingTasks(userId, serviceLedgerId),
        this.inventoryService.getLowStockItems(userId, serviceLedgerId),
        this.transactionService.getMonthlyTrend(serviceLedgerId, 3),
        this.accountService.getAccounts(serviceLedgerId),
        serviceLedgerId ? this.predictionService.getBudgetPredictions(serviceLedgerId) : Promise.resolve([]),
      ]);

      const spendingStats = this.transactionService.getDailySpendingStats(serviceLedgerId);
      const inventoryLines = lowStockItems.map(i => `- ${i.name}: 剩余 ${i.currentStock}${i.unit} (警戒线: ${i.minStock})`).join('\n');
      
      const now = new Date();
      const monthProgress = Math.round((now.getDate() / new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()) * 100);

      const budgetLines = budgets.map(b => {
        const usage = Math.round((b.spentAmount || 0) / b.totalAmount * 100);
        const prediction = (predictions as any[]).find(p => p.budgetId === b.id);
        const status = prediction?.risk === 'high' ? '🚨 预计超支' : (usage > monthProgress ? '⚠️ 进度超前' : '✅ 正常');
        const predictionText = prediction ? ` | 预测月底: ¥${prediction.predictedEnd.toFixed(2)}` : '';
        return `- ${b.name} (ID: ${b.id}${isGlobal ? `, 账本ID: ${b.ledgerId}` : ''}): 已用 ¥${b.spentAmount || 0} / ¥${b.totalAmount} (${usage}%)${predictionText} [${status}]`;
      }).join('\n');

      const reviewLines = pendingReviews.map(t => 
        `- [待评价] ${t.itemName} (购买日期: ${new Date(t.purchaseDate).toLocaleDateString()}, ID: ${t.taskId})`
      ).join('\n');

      const billLines = bills.filter(b => b.isActive).map(b => 
        `- ${b.name}: ¥${b.amount}${isGlobal ? ` (来自账本: ${ledgers.find(l => l.id === b.ledgerId)?.name || b.ledgerId})` : ''}`
      ).join('\n');

      const survivalDays = Math.floor((isGlobal ? ledgers.reduce((sum, l) => sum + (l.disposableIncome || 0), 0) : (activeLedger.disposableIncome || 0)) / (spendingStats.meanDailySpend || 1));

      const trendSummary = (trendData as any[]).map(t => `${t.month} (${t.type}): ¥${t.total}`).join(', ');
      const accountLines = (accounts as any[]).map(a => `- ${a.name} (ID: ${a.id}, 余额: ¥${a.balance}${isGlobal ? `, 账本ID: ${a.ledgerId}` : ''})`).join('\n');

      return `
${ledgerSummary}

#### 资产账户
${accountLines || '无活跃账户'}

#### 预算进度 (本月进度: ${monthProgress}%)
${budgetLines || '无活跃预算'}

#### 待办事项
- 待支付固定账单: ${bills.length} 笔
- 待评价耐用品: ${pendingReviews.length} 项
${reviewLines || ''}
${billLines || ''}

#### 库存预警
${inventoryLines || '库存充足'}

#### 预测生存期
${survivalDays} 天 (基于整体可支配资金)

#### 近期收支趋势 (最近3个月)
${trendSummary || '暂无历史数据'}

#### 消费习惯
- 最近30天总支出: ¥${spendingStats.totalSpent30d.toFixed(2)}
- 平均每日支出: ¥${spendingStats.meanDailySpend.toFixed(2)}
      `.trim();
    } catch (error) {
      this.logger.error('Failed to generate snapshot', error);
      return '### 财务快照 (实时)\n数据加载失败。';
    }
  }

  private generateSystemPrompt(ledgerName: string, snapshot: string, isGlobal: boolean, categories: any[]) {
    const roleDesc = isGlobal 
      ? `你是一个专业的全能财务管家，名字叫 TwinLedger。目前处于“全局视角（Global View）”，你能够看到用户名下**所有账本**的数据，并致力于提供跨账本的财务优化建议。`
      : `你是一个专业的个人财务管家，名字叫 TwinLedger。目前正在协助用户管理“${ledgerName}”账本。`;

    return `${roleDesc}
你的目标是基于目前的财务快照，提供精准的记账建议、预算预警、库存提醒及财务分析。

${snapshot}

当前系统中的分类列表（ID: 名称）：
${categories.map(c => `- ${c.id}: ${c.name}`).join('\n')}

你的核心能力：
1. **跨账本调拨建议 (仅全局模式)**：如果你发现某个账本（如“应急金账本”）进度落后，而另一个账本（如“生活账本”）有大量结余，应提议使用 \`transfer_between_ledgers\` 进行跨账本优化。
2. **语义识别与自动分类**：分析用户意图并匹配分类。
3. **冷静期谈判 (The Negotiator)**：对超过警戒线的支出进行风险预警并建议进入冷静期。
4. **主动预算调剂 (Fluid Budgeter)**：基于时间进度建议偏差调整。
5. **反馈评价层 (M4-A4)**：对耐用品进行满意度回访。
6. **极简库存闭环 (Phase 3)**: 管理物资消耗。
7. **储蓄与应急金管理 (M6)**：
   - ⚠️ **安全感导向**：观察“存储状态”与“安全保障期”。
   - 如果应急金未达标，应建议通过 \`transfer_to_savings\` 划转。
8. **深度财务分析 (M8)**：基于“近期收支趋势”提供理财建议。
9. **结构化输出**：所有正式动作必须通过工具发起。

回复风格：简洁、专业、带有适当的情绪价值。`;
  }

  private getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'create_transaction',
          description: '建议创建一笔交易记录',
          parameters: {
            type: 'object',
            properties: {
              amount: { type: 'number' },
              categoryId: { type: 'string' },
              type: { type: 'string', enum: ['expense', 'income'] },
              memo: { type: 'string' },
              isImpulse: { type: 'boolean', description: '是否判定为冲动消费（大额且非必要）' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    amount: { type: 'number' },
                    quantity: { type: 'number' },
                    categoryId: { type: 'string', description: '子项分类ID' },
                    shouldInventory: { type: 'boolean', description: '是否存入库存' },
                  },
                  required: ['name', 'amount']
                }
              }
            },
            required: ['amount', 'categoryId', 'type']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'reallocate_budget',
          description: '在不同预算项目之间调拨金额',
          parameters: {
            type: 'object',
            properties: {
              fromBudgetId: { type: 'string' },
              toBudgetId: { type: 'string' },
              amount: { type: 'number' },
              reason: { type: 'string' }
            },
            required: ['fromBudgetId', 'toBudgetId', 'amount']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'submit_review',
          description: '发起满意度回访调查',
          parameters: {
            type: 'object',
            properties: {
              taskId: { type: 'string' },
              itemName: { type: 'string' }
            },
            required: ['taskId', 'itemName']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'check_inventory',
          description: '查询库存状态',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '物项名称（模糊搜索）' },
            },
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'consume_item',
          description: '记录库存消耗',
          parameters: {
            type: 'object',
            properties: {
              itemId: { type: 'string', description: '物项ID' },
              itemName: { type: 'string', description: '物项名称' },
              quantity: { type: 'number', description: '消耗数量' },
            },
            required: ['itemId', 'itemName', 'quantity'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'add_to_wishlist',
          description: '将心仪但非必需、或大额冲动消费项移入愿望清单冷静期',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '物项名称' },
              amount: { type: 'number', description: '预计金额' },
              categoryId: { type: 'string', description: '分类ID' },
              reason: { type: 'string', description: '购买动机或必要性说明' },
              coolingDays: { type: 'number', description: '冷静期天数（默认3-7天）' },
            },
            required: ['name', 'amount', 'categoryId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'transfer_to_savings',
          description: '将可支配资金划转至储蓄或应急金',
          parameters: {
            type: 'object',
            properties: {
              amount: { type: 'number' },
              category: { type: 'string', enum: ['savings', 'emergency'] },
            },
            required: ['amount', 'category'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'transfer_funds',
          description: '账户之间直接划转资金（内部转账）',
          parameters: {
            type: 'object',
            properties: {
              fromAccountId: { type: 'string', description: '来源账户ID' },
              toAccountId: { type: 'string', description: '目标账户ID' },
              amount: { type: 'number', description: '转账金额' },
              reason: { type: 'string', description: '转账备注' }
            },
            required: ['fromAccountId', 'toAccountId', 'amount'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'perform_health_check',
          description: '扫描系统财务一致性（对账）与底层状态，识别数据冲突并提议自愈',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'withdraw_emergency_fund',
          description: '从应急金中提取资金（需要正当理由）',
          parameters: {
            type: 'object',
            properties: {
              amount: { type: 'number' },
              reason: { type: 'string', description: '动用应急金的强制理由' },
            },
            required: ['amount', 'reason'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'transfer_between_ledgers',
          description: '建议在不同账本之间调拨可支配资金（仅全局模式使用）',
          parameters: {
            type: 'object',
            properties: {
              fromLedgerId: { type: 'string', description: '来源账本 ID' },
              toLedgerId: { type: 'string', description: '目标账本 ID' },
              amount: { type: 'number', description: '调拨金额' },
              reason: { type: 'string', description: '调拨原因' }
            },
            required: ['fromLedgerId', 'toLedgerId', 'amount'],
          },
        },
      }
    ];
  }
}
