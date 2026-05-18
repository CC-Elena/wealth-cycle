# Minimal Skill Routing

本文件用于在 Wealth Cycle 中选择最小必要 Skill，避免每个任务都读取完整 `.agent/skills/`。

## 1. 规则

1. 每个任务只选择 1 个主 Skill。
2. 只有跨场景任务才选择 1 个辅助 Skill。
3. 不因为任务是代码任务就默认读取所有 Skill。
4. 失败、人工大改或规则反哺时才读取 RCA / 复盘相关内容。

## 2. 主 Skill

| 场景 | 主 Skill | 读取时机 |
|------|----------|----------|
| 探索需求、理解方案、比较选项 | `.agent/skills/openspec-explore/SKILL.md` | `/opsx:explore` 或需求尚未成型 |
| 创建中大型变更方案 | `.agent/skills/openspec-propose/SKILL.md` | 需要 OpenSpec proposal/design/tasks |
| 实现 OpenSpec 任务 | `.agent/skills/openspec-apply-change/SKILL.md` | `/opsx:apply` 或执行已确认变更 |
| 归档完成的 OpenSpec 变更 | `.agent/skills/openspec-archive-change/SKILL.md` | `/opsx:archive` |
| 协调 Harness 与 OpenSpec | `.agent/skills/task-workflow-manager/SKILL.md` | 涉及 `docs/harness` 状态同步 |

## 3. 辅助 Skill

| 触发条件 | 辅助 Skill |
|----------|------------|
| 任务需要更新全局进度或 feature-list | `.agent/skills/task-workflow-manager/SKILL.md` |
| 变更完成后需要归档 | `.agent/skills/openspec-archive-change/SKILL.md` |
| 执行中发现设计缺口，需要更新 proposal/design/tasks | `.agent/skills/openspec-propose/SKILL.md` |

## 4. 默认不读

默认不读取所有 `.agent/skills/*`。只在以下情况打开具体 Skill 正文：

1. 用户明确进入对应 opsx 流程。
2. 当前任务复杂度要求 OpenSpec。
3. 当前阶段需要该 Skill 的输出格式或约束。
4. 失败或归档时需要对应流程说明。

## 5. 使用记录

```markdown
## Skill Loading

- 主 Skill：
- 辅助 Skill：
- 未读取但相关的 Skill：
- 跳过原因：
```
