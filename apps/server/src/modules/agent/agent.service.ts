import { Injectable, Inject, Logger } from '@nestjs/common';
import ky from 'ky';
import { CategoryService } from '../finance/category.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  
  // 环境变量占位，实际运行时需配置
  private readonly apiKey = process.env.ARK_API_KEY || '';
  private readonly endpoint = process.env.ARK_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
  private readonly modelId = process.env.ARK_MODEL_ID || 'doubao-pro-4k';

  constructor(
    private readonly categoryService: CategoryService,
  ) {}

  async chat(messages: any[]) {
    // 1. 获取核心上下文：分类树
    const categories = await this.categoryService.getAllCategories();
    const systemPrompt = this.generateSystemPrompt(categories);

    // 2. 组装消息
    const callMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // 3. 调用模型 (兼容 OpenAI 协议)
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

      return response;
    } catch (error) {
      this.logger.error('LLM Call Failed', error);
      throw error;
    }
  }

  private generateSystemPrompt(categories: any[]) {
    return `你是一个专业的财务助手，名字叫 TwinLedger。
你的任务是帮助用户管理个人财务，通过对话实现记账、查询和分析。

当前系统中存在的分类列表如下（ID: 名称）：
${categories.map(c => `- ${c.id}: ${c.name}`).join('\n')}

你的能力：
1. 分析用户的录入意图。如果用户说“昨天吃了顿火锅50元”，你应该识别出金额 50，类型 expense，并匹配最接近的分类 ID（如饮食相关的 ID）。
2. 如果信息不全，你可以反问用户（本版本暂不强制）。
3. 关键规则：当你识别到一个潜在的交易时，请调用 create_transaction 工具。你的回复中可以包含对该交易的解释，但核心动作必须通过工具发起。

回复风格：简洁、专业、带有适当的情绪价值（如：太棒了，你又存下了一笔钱！）。`;
  }

  private getTools() {
    return [
      {
        type: 'function',
        function: {
          name: 'create_transaction',
          description: '建议创建一笔交易记录（支出或收入）',
          parameters: {
            type: 'object',
            properties: {
              amount: { type: 'number', description: '交易的数值' },
              categoryId: { type: 'string', description: '匹配到的分类 ID' },
              type: { type: 'string', enum: ['expense', 'income'], description: '交易类型' },
              memo: { type: 'string', description: '交易的备注' },
            },
            required: ['amount', 'categoryId', 'type']
          }
        }
      }
    ];
  }
}
