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
1. **确认全局状态**：读取 `docs/harness/claude-progress.txt`，重点关注 `Active` 区域，检查是否有正在进行的任务或未归档的 OpenSpec 变更。
2. **定位里程碑**：查阅 `docs/harness/feature-list.json`，了解当前及后续的任务方向。若有中断的 `in_progress` 任务，优先接手。

### 任务启动 (Implementation Start)
1. **显式关联 Feature ID**：任何变更（包含 UI Gap 修复或 Bugfix）必须关联至少一个 `feature-list.json` 中的 Feature ID。如果是历史遗留补漏，可将其状态从 `done` 改回 `in_progress`，或在 JSON 中新增一条修复 Feature。
2. **状态即时同步（核心！）**：在启动任务前（如调用 `openspec-propose`），**必须立即**更新 `docs/harness/claude-progress.txt` 的 `Active` 区域，清晰写明当前正在进行的 Feature ID、任务简述及 OpenSpec 变更目录路径。
3. **评估粒度**：
   - **大/中型变更**：调用 `openspec-propose` 创建变更。
   - **小型微调/Bug修复**：直接使用 Planning Mode 的 `implementation_plan.md` 执行，无需启动 OpenSpec。

### 任务完成 (Task Wrap-up)
1. **归档执行上下文**：如果使用了 OpenSpec，必须运行 `openspec-archive-change`。
2. **同步全局状态**：更新 `docs/harness/feature-list.json` 中对应项的状态为 `done`。
3. **清理 Active 状态**：在 `docs/harness/claude-progress.txt` 中将该任务从 `Active` 移入 `已完成`，并简要叙述遗留了什么，以及对下一个接手 Agent 的建议。
4. **质量门禁**：运行 `pnpm agent:check`。

## 3. 约束事项
- 严禁在未更新 Harness 的情况下结束会话。
- 对于涉及数据库 Schema 或核心业务逻辑的变更，**必须**使用 OpenSpec 流程以保留设计决策。
