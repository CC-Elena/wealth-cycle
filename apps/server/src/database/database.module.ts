import { Global, Module } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

export const DB_CONNECTION = 'DB_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      useFactory: () => {
        // 在实际应用中此处可能需配置加密驱动或环境变量，在此预留本地数据库文件
        const sqlite = new Database('local.db');
        return drizzle(sqlite, { schema });
      },
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule {}
