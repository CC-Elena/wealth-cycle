import { Global, Module, Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3-multiple-ciphers';
import * as schema from './schema';
import { renameSync, existsSync } from 'fs';
import { join } from 'path';

export const DB_CONNECTION = 'DB_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      useFactory: () => {
        const logger = new Logger('DatabaseModule');
        const dbPath = 'local.db';
        const dbKey = '131941';

        try {
          const sqlite = new Database(dbPath);
          // S4-F1: SQLCipher 加密配置
          sqlite.pragma(`key = '${dbKey}'`);
          
          // 测试连接是否有效（处理加密密钥不匹配的情况）
          sqlite.pragma('stats'); 
          
          return drizzle(sqlite, { schema });
        } catch (error) {
          logger.error('数据库连接失败，可能由于加密密钥不匹配。正在尝试备份并重建...', error);
          
          if (existsSync(dbPath)) {
            const backupPath = `${dbPath}.bak.${Date.now()}`;
            renameSync(dbPath, backupPath);
            logger.warn(`旧数据库已备份至: ${backupPath}`);
          }

          const sqlite = new Database(dbPath);
          sqlite.pragma(`key = '${dbKey}'`);
          return drizzle(sqlite, { schema });
        }
      },
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule {}
