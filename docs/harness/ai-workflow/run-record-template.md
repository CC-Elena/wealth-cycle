# Run Record Template

用于记录一次 AI 辅助开发执行过程。Small 任务可简写；Medium 及以上任务建议完整填写。

## 1. 基本信息

- 任务名称：
- Feature ID：
- OpenSpec Change：
- 执行日期：
- 执行人 / 工具：
- 状态：Success / Partial / Failed

## 2. 规则加载

- 任务复杂度：Small / Medium / Large / Risky / Failure
- 主 Skill：
- 辅助 Skill：
- 跳过的协议或 Skill：
- 升级加载原因：

## 3. Context Pack

| 等级 | 文件或资产 | 使用原因 | 是否已读取 |
|------|------------|----------|------------|
| P0 | | | |
| P1 | | | |
| P2 | | | |
| P3 | | | |

## 4. 执行摘要

说明本次完成了什么，哪些任务完成，哪些任务未完成。

## 5. 修改文件

| 文件 | 变更说明 | 对应任务 |
|------|----------|----------|
|      |          |          |

## 6. 验证记录

有代码变更时必须填写 `pnpm agent:check` 或跳过原因。UI 变更需记录截图、预览或无法截图原因。

| 验证项 | 命令或方式 | 结果 | 证据 | 跳过原因 / 风险 |
|--------|------------|------|------|----------------|
| Biome | `biome check .` 或 `pnpm agent:check` | | | |
| Build | `pnpm build` 或 `pnpm agent:check` | | | |
| UI Preview | 截图 / AssistantOverlay / 手工预览 | | | |
| API Check | 请求脚本 / 手工接口检查 | | | |

## 7. 结论

- 是否满足需求：
- 是否需要 RCA：
- 后续建议：
