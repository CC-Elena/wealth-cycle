# Rule Loading Policy

本文件定义 Wealth Cycle 的轻量 AI 规则加载策略。目标是减少 token 消耗和上下文噪音，让 AI Coding 工具优先聚焦当前业务代码。

## 1. 原则

1. 默认轻量执行，不全量读取所有工作流和 Skill。
2. 先读取索引，再按场景打开具体 Skill。
3. 每个任务只选择 1 个主 Skill，最多 1 个辅助 Skill。
4. 只有复杂度、风险或失败状态升级时，才加载更多规则。
5. 不替换 OpenSpec / opsx 流程，只增强其上下文和记录质量。

## 2. 任务复杂度

| 类型 | 判断标准 | 规则预算 | OpenSpec | 记录要求 |
|------|----------|----------|----------|----------|
| Small | 单文件、小文案、低风险 UI、轻量 Bugfix | 直接文件 + 1 主 Skill | 不强制 | 简短 Run Record |
| Medium | 多文件、UI 行为、前后端轻量联动、需要截图或测试 | P0/P1 Context Pack + 1 主 + 可选 1 辅 Skill | 建议 | Run Record |
| Large | 跨模块、影响用户流程、复杂状态、同步、Agent 逻辑 | 分批 Context Pack | 必须 | Run Record + 评估结论 |
| Risky | 数据库 Schema、资金/预算核心逻辑、权限、安全、数据写入策略 | 先人工确认，再分阶段读取 | 必须 | Run Record + 必要评估 |
| Failure | 验证失败、人工大改、系统性 Review 问题、核心逻辑偏差 | 只读取失败证据和 RCA 相关文件 | 视情况 | RCA |

## 3. 默认加载集

### Small

读取：

1. 用户需求或相关 OpenSpec artifact。
2. 直接修改文件。
3. `docs/harness/ai-workflow/skill-routing-minimal.md`。
4. 1 个主 Skill。

跳过：

1. RCA 模板。
2. 完整评估记录。
3. 与当前任务无关的 `.agent/skills/*`。

### Medium

读取：

1. 相关 proposal / design / tasks，或轻量任务说明。
2. P0/P1 Context Pack。
3. 1 个主 Skill，必要时 1 个辅助 Skill。
4. 相关验证命令说明。

### Large / Risky

读取：

1. OpenSpec 变更 artifacts。
2. `docs/harness/claude-progress.txt`。
3. `docs/harness/feature-list.json`。
4. P0/P1/P2 Context Pack。
5. 主 Skill 和最多 1 个辅助 Skill。

要求：

1. 必须使用 OpenSpec。
2. 必须运行 `pnpm agent:check`，或记录无法运行的原因。
3. 必须归档 Run Record。

### Failure

读取：

1. 失败任务的 Run Record。
2. 验证输出、错误日志、相关 diff。
3. `docs/harness/ai-workflow/rca-template.md`。

跳过无关背景、无关 Skill 和完整理论文档。

## 4. 升级触发

| 信号 | 升级动作 |
|------|----------|
| 单文件变多文件 | Small -> Medium |
| 影响 `packages/shared` schema | Medium -> Large |
| 涉及 SQLite / Drizzle schema / 预算核心逻辑 | -> Risky |
| `pnpm agent:check` 失败 | -> Failure |
| 人工大幅修改 AI 输出 | -> Failure |
| UI 变更需要确认体验 | 增加截图或预览记录 |

## 5. 记录要求

Run Record 中必须记录：

```markdown
- 任务复杂度：
- 主 Skill：
- 辅助 Skill：
- 读取的 Context Pack：
- 跳过的协议或 Skill：
- 升级加载原因：
```
