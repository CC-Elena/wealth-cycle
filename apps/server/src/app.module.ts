import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AgentModule } from './modules/agent/agent.module';

@Module({
  imports: [UserModule, FinanceModule, AgentModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
