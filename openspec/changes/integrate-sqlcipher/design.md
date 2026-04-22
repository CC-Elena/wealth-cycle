# Design: SQLCipher Implementation Details

## Technical Solution (技术方案)
- **Dependency Swap**: 使用 `better-sqlite3-multiple-ciphers` 代替 `better-sqlite3`。由于 API 完全兼容，对 Drizzle ORM 无需代码级重构。
- **Initialization**:
  ```typescript
  const sqlite = new Database('local.db');
  sqlite.pragma("key = '131941'");
  ```
- **Build Configuration**: 利用环境已有的 Python 环境完成原生模块的编译链接。

## Data Model & Interfaces (数据模型与接口变更)
- **Schema**: 保持不变。
- **Interface**: `DB_CONNECTION` Provider 的实现逻辑微调。

## Storage Strategy (存储策略)
- **Location**: 保持在 `apps/server/local.db`。
- **Security**: 采用全库加密。密码 `131941` 目前暂设为硬编码常量（S4-F1 阶段目标），未来版本将考虑与设备硬件信息或用户账号特征关联。

## Compliance (合规与脱敏)
- 原始流水明细仅存在于加密的 `local.db` 中。
- 同步上云的数据（如有）需在读取解密后进行统计级脱敏，不在本次 Design 范围内。
