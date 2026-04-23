# Proposal: Integrate SQLCipher for Local Storage Encryption

## Intent (原因意图)
为了落实项目“隐私优先”的核心目标，我们需要对本地 SQLite 数据库进行整库加密。目前使用的 `better-sqlite3` 驱动不支持加密，因此需要更换为支持 SQLCipher 的驱动，以确保敏感财务流水在终端被安全存储。

## Scope (影响边界)
- **后端服务**: `apps/server` 的数据库初始化模块。
- **构建环境**: 涉及原生模块编译。
- **数据迁移**: 集成后会导致未加密的旧数据库文件不可用（将采取重新初始化策略）。

## Approach (方案方向)
1. **驱动更换**: 将 `better-sqlite3` 替换为 `better-sqlite3-multiple-ciphers`，这是一个高度兼容且支持 SQLCipher 的稳定驱动。
2. **连接初始化**: 在 `DatabaseModule` 中配置连接密码 `131941`。
3. **容错处理**: 增加数据库连接失败时的逻辑，若因加密导致读取失败，则自动备份并重建数据库。

## Impact on Financial Loop (财务闭环影响)
本次变更不涉及业务逻辑调整，主要是增强数据底座的安全性。确保后续 Agent 录入的敏感流水即便在物理文件泄露的情况下也无法被第三方直接读取。
