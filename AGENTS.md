# Stock 项目 Agentic 指南

**状态**：AI 优先的核心导航文档 (Pointer-based)
**目标**：保持极简上下文，将复杂性下沉到 Skill 和子文档。

---

## 1. 核心导航 (Navigation)
- **项目定义**：个人财务全生命周期管理系统 (Monorepo)。
- **架构决策记录**：查阅 `docs/adr/`。
- **任务管理中心**：查阅 `docs/harness/` (包括进度与功能清单)。
- **操作技能库**：查阅 `.agent/skills/` (包含任务周期、代码规范等)。
- **轻量 AI 工作流**：查阅 `docs/harness/ai-workflow/`，用于规则加载、最小 Skill 路由、Context Pack、Run Record 与 RCA。

---


## 2. 启动协议 (Session Start Protocol)
**每次会话开始时，建议执行以下动作：**
1. **确认位置**：`pwd` 确认处于仓库根目录。
2. **参考上下文**：读取 `docs/harness/claude-progress.txt` 了解当前全局位置。
3. **规则预算**：读取 `docs/harness/ai-workflow/rule-loading-policy.md`，判断任务复杂度为 Small / Medium / Large / Risky / Failure。
4. **Skill 路由**：读取 `docs/harness/ai-workflow/skill-routing-minimal.md`，只选择 1 个主 Skill，最多 1 个辅助 Skill。
5. **环境自检**：有代码变更前后按需执行 `pnpm agent:check`；若跳过，必须在 Run Record 中说明原因和风险。

---

## 3. 开发准则 (Coding Standards)
- **复用优先**：在创建新组件前，必须搜索 `apps/web/src/components` 和 `packages/shared`。
- **质量前置**：所有逻辑变更必须通过 `biome check`。
- **验证闭环**：UI 变更需通过截图或 AssistantOverlay 预览确认。
- **轻量加载**：Small 任务不强制 OpenSpec 或完整评估；Medium 及以上任务应填写 Context Pack。
- **复盘触发**：验证失败、人工大幅修改、系统性 Review 问题或核心业务逻辑偏差时，使用 `docs/harness/ai-workflow/rca-template.md`。

---

> 记住：你不是在堆砌代码，你是在设计环境。保持上下文整洁是第一要务。
