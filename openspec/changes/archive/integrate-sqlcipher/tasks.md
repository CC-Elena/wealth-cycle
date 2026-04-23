# Tasks: SQLCipher Integration

## 基础设施 [Server]
- [ ] 卸载标准驱动: `pnpm filter server remove better-sqlite3`
- [ ] 安装加密驱动: `pnpm filter server add better-sqlite3-multiple-ciphers`
- [ ] 确认 `@types/better-sqlite3` 是否仍兼容
- [ ] 修改 `apps/server/src/database/database.module.ts` 确保 PRAGMA key 正确执行

## 可靠性与故障恢复 [Server]
- [ ] 在数据库初始化处添加 `try-catch` 逻辑
- [ ] 实现旧数据备份与空库重建逻辑，防止启动崩溃

## 验证与测试
- [ ] 运行 `pnpm run build` 确认原生模块编译成功
- [ ] 启动应用并写入一条数据
- [ ] 手动尝试通过普通 SQLite Viewer (如 DB Browser for SQLite) 打开 `local.db`，确认提示“Encrypted”或格式报错
- [ ] 运行 `pnpm agent:check` 确保系统基准功能可用
