# Context Pack Template

Context Pack 用于记录 AI 执行任务前读取了哪些必要上下文。Medium、Large、Risky 任务必须填写；Small 任务可简写。

## 1. 基本信息

- 任务名称：
- Feature ID：
- OpenSpec Change：
- 任务复杂度：Small / Medium / Large / Risky / Failure
- 填写日期：

## 2. Context Pack

| 等级 | 文件或资产 | 使用原因 | 阶段 | 是否已读取 |
|------|------------|----------|------|------------|
| P0 | | 直接修改文件、Spec、OpenSpec tasks | Explore / Propose / Apply | |
| P1 | | 直接依赖模块、共享 schema、API、组件 | Apply / Verify | |
| P2 | | 相似实现、ADR、历史任务 | Explore / Propose | |
| P3 | | 工作流、Skill、验证协议 | Propose / Apply / Archive | |

## 3. Wealth Cycle 常见 P0/P1

| 任务类型 | 常见 P0/P1 |
|----------|------------|
| 前端 UI | `apps/web/src/*`、相关组件、样式和 API client |
| 后端 API | `apps/server/src/*`、Drizzle schema、service/controller |
| 共享类型 | `packages/shared/*`、前后端引用点 |
| 数据库变更 | Drizzle schema、migration、SQLite 本地验证说明 |
| Agent 功能 | Agent service、proposal buffer、前端确认流程 |

## 4. 跳过说明

| 跳过项 | 原因 | 风险 |
|--------|------|------|
|        |      |      |
