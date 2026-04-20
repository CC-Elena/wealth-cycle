import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './modules/user/user.module';
import { FinanceModule } from './modules/finance/finance.module';
import { AgentModule } from './modules/agent/agent.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DatabaseModule,
    UserModule,
    FinanceModule,
    AgentModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
