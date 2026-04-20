---
name: task-workflow-manager
description: 项目任务流管理专家。负责协调 Harness (全局路线图) 与 OpenSpec (局部任务执行) 的混合模式，确保开发节奏既有上帝视角又有执行深度。
version: 2.0.0
---

# Task Workflow Manager (Hybrid Mode)

此 Skill 规范了 Agent 如何在“全局规划”与“具体执行”之间进行调度。

## 1. 核心分工策略

项目采用 **“大纲入 Harness，执行入 OpenSpec”** 的双层架构：

- **Harness (`docs/harness/`)**: 存储项目的长期记忆。
  - `feature-list.json`: 仅记录 Milestone (M*) 和核心 Feature 的骨架。
  - `claude-progress.txt`: 记录会话间的宏观进度切换。
- **OpenSpec (`openspec/`)**: 存储具体功能的深度执行细节。
  - 适用于：中大型新功能开发、重构、或逻辑复杂的变更。

## 2. 操作流程 (SOP)

### 会话开始 (Session Start)
1. **参考上下文**：读取 `docs/harness/claude-progress.txt` 了解当前所处的 Milestone。
2. **定位里程碑**：查阅 `docs/harness/feature-list.json`，了解当前及后续的任务方向，但不强制受其束缚。

### 任务启动 (Implementation Start)
1. **评估粒度**：
   - **大/中型变更**：调用 `openspec-propose` 创建变更。这会生成 Proposal, Design 和 Tasks。
   - **小型微调/Bug修复**：直接使用 Planning Mode 的 `implementation_plan.md` 执行，无需启动 OpenSpec。
2. **原子化执行**：无论使用哪种方式，一次只处理一个特定 ID 的 Feature。

### 任务完成 (Task Wrap-up)
1. **归档执行上下文**：如果使用了 OpenSpec，必须运行 `openspec-archive-change`。
2. **同步全局状态**：更新 `docs/harness/feature-list.json` 中对应项的状态为 `done`。
3. **沉淀跨会话信息**：在 `docs/harness/claude-progress.txt` 中简要叙述刚才完成了什么，遗留了什么，以及对下一个接手 Agent 的建议。
4. **质量门禁**：运行 `pnpm agent:check`。

## 3. 约束事项
- 严禁在未更新 Harness 的情况下结束会话。
- 对于涉及数据库 Schema 或核心业务逻辑的变更，**必须**使用 OpenSpec 流程以保留设计决策。
