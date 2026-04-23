import { Controller, Delete, Get, Headers, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AgentProposalService } from './agent-proposal.service';

@ApiTags('Agent Proposals')
@Controller('agent/proposals')
export class AgentProposalController {
  constructor(private readonly agentProposalService: AgentProposalService) {}

  @Get()
  @ApiOperation({ summary: '获取待处理的提议' })
  async getPending(@Headers('x-ledger-id') ledgerId: string, @Request() req: any) {
    const userId = 'local-user'; // 简化版本：使用固定 ID
    return this.agentProposalService.getPendingProposals(userId, ledgerId);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: '执行并接受提议' })
  async execute(@Request() req: any, @Param('id') id: string) {
    const userId = 'local-user';
    return this.agentProposalService.executeProposal(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '拒绝并移除提议' })
  async reject(@Request() req: any, @Param('id') id: string) {
    const userId = 'local-user';
    return this.agentProposalService.rejectProposal(userId, id);
  }
}
