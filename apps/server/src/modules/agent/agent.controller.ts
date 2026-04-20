import { Controller, Post, Body } from '@nestjs/common';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  async chat(@Body('messages') messages: any[]) {
    return this.agentService.chat(messages);
  }
}
