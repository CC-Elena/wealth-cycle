import { Injectable, Inject, Logger } from '@nestjs/common';
import ky from 'ky';
import { CategoryService } from '../finance/category.service';
import { TransactionService } from '../finance/transaction.service';
import { BudgetService } from '../finance/budget.service';
import { UserService } from '../user/user.service';
import { PayrollService } from '../finance/payroll.service';
import { AgentProposalService } from './agent-proposal.service';
import { CreateTransactionSchema } from '@stock/shared';
import { ReviewService } from '../finance/review.service';
import { InventoryService } from '../finance/inventory.service';
import { SavingsService } from '../finance/savings.service';
import { AccountService } from '../finance/account.service';
import { GovernanceService } from '../finance/governance.service';
import { WishlistService } from '../finance/wishlist.service';

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
  ) {}

  async chat(ledgerId: string, messages: any[]) {
    // 1. 获取核心上下文：分类树与财务快照
    const [categories, snapshot] = await Promise.all([
      this.categoryService.getAllCategories(ledgerId),
      this.getFinancialSnapshot(ledgerId),
    ]);

    const systemPrompt = this.generateSystemPrompt(categories, snapshot);

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
      await this.reviewService.scanAndCreateTasks(userId, ledgerId);

      const [ledger, budgets, bills, pendingReviews, lowStockItems, trendData, accounts] = await Promise.all([
        this.userService.getLedgerById(ledgerId),
        this.budgetService.getBudgetPlans(ledgerId),
        this.payrollService.getFixedBills(ledgerId),
        this.reviewService.getPendingTasks(userId, ledgerId),
        this.inventoryService.getLowStockItems(userId, ledgerId),
        this.transactionService.getMonthlyTrend(ledgerId, 3),
        this.accountService.getAccounts(ledgerId),
      ]);

      if (!ledger) return '### 财务快照\n账本未找到。';

      const spendingStats = this.transactionService.getDailySpendingStats(ledgerId);
      const inventoryLines = lowStockItems.map(i => `- ${i.name}: 剩余 ${i.currentStock}${i.unit} (警戒线: ${i.minStock})`).join('\n');
      
      const now = new Date();
      const day = now.getDate();
      const month = now.getMonth() + 1;
      const daysInMonth = new Date(now.getFullYear(), month, 0).getDate();
      const monthProgress = Math.round((day / daysInMonth) * 100);

      const budgetLines = budgets.map(b => {
        const usage = Math.round((b.spentAmount || 0) / b.totalAmount * 100);
        const status = usage > monthProgress ? '⚠️ 进度超前' : '✅ 正常';
        return `- ${b.name} (ID: ${b.id}): 总额 ¥${b.totalAmount}, 已用 ¥${b.spentAmount || 0} (${usage}%) [${status}]`;
      }).join('\n');

      const reviewLines = pendingReviews.map(t => 
        `- [待评价] ${t.itemName} (购买日期: ${new Date(t.purchaseDate).toLocaleDateString()}, ID: ${t.taskId})`
      ).join('\n');

      const billLines = bills.filter(b => b.isActive).map(b => 
        `- ${b.name}: ¥${b.amount}`
      ).join('\n');

      const wishlistItems = await this.wishlistService.getWishlistItems(ledgerId);
      const frozenAmount = wishlistItems.filter(i => i.status === 'cooling').reduce((sum, it) => sum + it.amount, 0);
      const wishlistLines = wishlistItems
        .filter(i => i.status === 'cooling')
        .map(i => `- [冷静中] ${i.name}: ¥${i.amount} (到期日: ${new Date(i.coolingEnd).toLocaleDateString()})`)
        .join('\n');

      const survivalDays = Math.floor((ledger.disposableIncome || 0) / (spendingStats.meanDailySpend || 1));
      const impulseThreshold = Math.round((ledger.disposableIncome || 0) * 0.8);

      const trendSummary = (trendData as any[]).map(t => `${t.month} (${t.type}): ¥${t.total}`).join(', ');
      const accountLines = (accounts as any[]).map(a => `- ${a.name} (ID: ${a.id}, 类型: ${a.type}): ¥${a.balance}`).join('\n');

      return `
### 财务快照 (实时 - 账本: ${ledger.name})
- **当前日期**: ${now.toLocaleDateString()} (本月进度: ${monthProgress}%)
- **账本资产**: ¥${ledger.netWorth} | **可支配资金**: ¥${ledger.disposableIncome}
- **冷冻资金 (冷静期内)**: ¥${frozenAmount}
- **可用可支配资金 (Scheme B)**: ¥${(ledger.disposableIncome || 0) - frozenAmount}
- **冲动消费警戒线**: ¥${impulseThreshold}
- **预测生存期**: ${survivalDays} 天 (基于可支配资金)
- **待处理愿望清单**:
${wishlistLines || '无'}
- **储蓄状态**:
    - **通用储蓄**: ¥${ledger.savingsAmount}
    - **应急准备金**: ¥${ledger.emergencyFundAmount} / 目标 ¥${ledger.emergencyFundGoal} [${Math.round(((ledger.emergencyFundAmount || 0) / (ledger.emergencyFundGoal || 1)) * 100)}%]
    - **安全保障期**: ${Math.floor((ledger.emergencyFundAmount || 0) / (spendingStats.meanDailySpend || 1))} 天 (仅应急金)
- **待评价耐用品**: 
${reviewLines || '暂无待评价项'}
- **库存水位报警**: 
${inventoryLines || '库存充足'}
- **预算执行情况**:
${budgetLines || '暂无活跃预算'}
- **待支付固定账单**:
${billLines || '暂无待支付账单'}
- **账户分布**:
${accountLines || '暂无账户数据'}
- **近期收支趋势 (3个月)**: 
${trendSummary || '暂无历史数据'}
`;
    } catch (error) {
      this.logger.error('Failed to generate snapshot', error);
      return '### 财务快照 (实时)\n数据加载失败。';
    }
  }

  private generateSystemPrompt(categories: any[], snapshot: string) {
    return `你是一个专业的财务助手，名字叫 TwinLedger。
你的任务是帮助用户管理个人财务，通过对话实现记账、查询和分析。

${snapshot}

当前系统中存在的分类列表如下（ID: 名称）：
${categories.map(c => `- ${c.id}: ${c.name}`).join('\n')}

你的核心能力：
1. **语义识别与自动分类**：分析用户意图并匹配分类。
2. **冷静期谈判 (The Negotiator)**：对超过警戒线的支出进行风险预警并建议进入冷静期。
3. **主动预算调剂 (Fluid Budgeter)**：基于时间进度建议偏差调整。
4. **反馈评价层 (M4-A4)**：对耐用品进行满意度回访。
5. **极简库存闭环 (Phase 3)**: 管理物资消耗。
6. **储蓄与应急金管理 (M6)**：
   - ⚠️ **安全感导向**：观察“存储状态”与“安全保障期”。
   - 如果应急准备金未达标，应在用户收入增加或有大额结余时提议 transfer_to_savings。
   - 当用户因为突发状况（如医疗、意外）需要用钱时，引导其使用 withdraw_emergency_fund。
   - 动用应急金必须有正当理由。
7. **深度财务分析 (M8)**：基于“近期收支趋势”提供理财建议，识别不合理的支出增长。
8. **系统治理 (Governance)**：定期执行 perform_health_check 确保账目一致性。
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
      }
    ];
  }
}
