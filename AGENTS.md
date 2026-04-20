# Stock 项目 Agentic 指南

**状态**：AI 优先的核心导航文档 (Pointer-based)
**目标**：保持极简上下文，将复杂性下沉到 Skill 和子文档。

---

## 1. 核心导航 (Navigation)
- **项目定义**：个人财务全生命周期管理系统 (Monorepo)。
- **架构决策记录**：查阅 `docs/adr/`。
- **任务管理中心**：查阅 `docs/harness/` (包括进度与功能清单)。
- **操作技能库**：查阅 `.agent/skills/` (包含任务周期、代码规范等)。

---


## 2. 启动协议 (Session Start Protocol)
**每次会话开始时，建议执行以下动作：**
1. **确认位置**：`pwd` 确认处于仓库根目录。
2. **参考上下文**：读取 `docs/harness/claude-progress.txt` 了解当前全局位置。
3. **环境自检**：执行 `pnpm agent:check` 确保基准代码可用。

---

## 3. 开发准则 (Coding Standards)
- **复用优先**：在创建新组件前，必须搜索 `apps/web/src/components` 和 `packages/shared`。
- **质量前置**：所有逻辑变更必须通过 `biome check`。
- **验证闭环**：UI 变更需通过截图或 AssistantOverlay 预览确认。

---

> 记住：你不是在堆砌代码，你是在设计环境。保持上下文整洁是第一要务。
