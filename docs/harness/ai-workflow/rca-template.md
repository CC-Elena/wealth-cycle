# RCA Template

仅在验证失败、人工大幅修改、系统性 Review 问题或核心业务逻辑偏差时使用。

## 1. 基本信息

- 任务名称：
- Feature ID：
- OpenSpec Change：
- 日期：
- 状态：Open / Done

## 2. 失败现象

- 发生了什么：
- 影响范围：
- 发现方式：

## 3. 根因分类

| 分类 | 是否命中 | 说明 |
|------|----------|------|
| Requirement Gap | | 需求或验收不清 |
| Context Gap | | 漏读关键文件、schema、ADR 或 OpenSpec |
| Skill / Workflow Gap | | 规则加载或流程选择不当 |
| Implementation Gap | | 实现方式不符合架构或业务规则 |
| Verification Gap | | 验证不足或记录不真实 |
| Human Alignment Gap | | 应人工确认但未提前确认 |

## 4. 修复动作

| 动作 | 文件 | 状态 |
|------|------|------|
|      |      |      |

## 5. 反哺项

| 反哺项 | 目标文件 | 验证方式 | Owner |
|--------|----------|----------|-------|
|        |          |          |       |

## 6. 防复发检查

1. 是否需要更新 `docs/harness/ai-workflow/workflow-defect-register.md`？
2. 是否需要更新 `.agent/workflows/*`？
3. 是否需要更新 OpenSpec artifact？
4. 是否需要补充 `docs/harness/feature-list.json` 或 `claude-progress.txt`？
