import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './database/database.module';
import { AgentModule } from './modules/agent/agent.module';
import { FinanceModule } from './modules/finance/finance.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SyncModule } from './modules/sync/sync.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DatabaseModule,
    UserModule,
    FinanceModule,
    AgentModule,
    SyncModule,
    NotificationModule,
  ],

  controllers: [],
  providers: [],
})
export class AppModule {}
