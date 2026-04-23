import { Body, Controller, Headers, Post } from '@nestjs/common';
import type { ReviewService } from '../finance/review.service';
import type { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly reviewService: ReviewService,
  ) {}

  @Post('chat')
  async chat(@Headers('x-ledger-id') ledgerId: string, @Body('messages') messages: any[]) {
    return this.agentService.chat(ledgerId, messages);
  }

  @Post('reviews')
  async submitReview(@Body() body: { taskId: string; rating: number; usageFrequency: string; comment?: string }) {
    return this.reviewService.submitReview(body.taskId, body.rating, body.usageFrequency, body.comment);
  }
}
