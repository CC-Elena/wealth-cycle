import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentProposalController } from './agent-proposal.controller';
import { AgentProposalService } from './agent-proposal.service';
import { FinanceModule } from '../finance/finance.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [FinanceModule, UserModule],
  controllers: [AgentController, AgentProposalController],
  providers: [AgentService, AgentProposalService],
  exports: [AgentService, AgentProposalService],
})
export class AgentModule {}
