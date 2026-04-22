# ADR 0001: 技术栈选型 (Technology Stack Selection)

*   **状态**: 已接受 (Accepted)
*   **日期**: 2026-04-20
*   **决策人**: cc, Antigravity

## 上下文 (Context)

我们需要构建一个全周期的个人财务管理应用 (TwinLedger)。该应用要求：
1.  **跨端支持**：一套代码适配 PC Web 与 移动端 H5。
2.  **隐私优先**：核心数据必须在本地加密存储 (SQLCipher)，云端仅存脱敏统计。
3.  **AI Readiness**：架构需原生支持 Agent 消费（如 OpenAPI/Swagger 转化为 Tools）。
4.  **开发效率**：需要强类型的端到端校验（Zod）和高效的组件开发模式。

## 决策 (Decision)

我们选择基于 **pnpm Monorepo** 的全栈架构，具体选型如下：

### 1. 核心基础设施
- **Monorepo**: `pnpm workspace`。理由：统一管理 `apps/web` (前端)、`apps/server` (后端) 和 `packages/shared` (共享验证逻辑)。
- **工具链**: `Biome` (Lint/Format)、`Vitest` (测试)。理由：Biome 速度极快，替代传统的 ESLint/Prettier。

### 2. 前端栈 (Web/H5)
- **框架**: `React 19` + `Vite`。理由：使用 React 最新特性，Vite 提供极速 HMR。
- **UI/样式**: `shadcn/ui` + `Tailwind CSS v4`。理由：黑白极简风格契合 PRD，组件代码完全可控。
- **状态管理**: `TanStack Query v5` (服务端状态) + `ky` (HTTP Client)。理由：自动缓存与乐观更新，ky 轻量且支持拦截器。
- **验证**: `Zod` + `React Hook Form`。

### 3. 后端栈 (Server)
- **框架**: `NestJS v11`。理由：模块化架构，内建依赖注入、事件驱动和 Swagger 指控。
- **ORM**: `Drizzle ORM`。理由：类型安全，SQL-like 语法，零开销。
- **数据库**: **SQLCipher** (本地加密存储) + **PostgreSQL** (云端脱敏)。理由：满足强隐私要求的加密底座。
- **API**: `@nestjs/swagger` 自动生成 OpenAPI 3.1，供 Agent 直接作为 Function Calling 使用。

## 后果 (Consequences)

### 正面影响
*   **类型安全**: 通过 `@stock/shared` 共享 Zod Schema，实现真正的端到端类型校验。
*   **AI 友好**: 后端 API 定义即是 AI 工具定义。
*   **隐私性**: 本地整库加密确保数据主权。
*   **响应式**: 通过 Tailwind v4 和无头组件轻松实现跨端适配。

### 负面影响
*   **复杂度**: Monorepo 的配置和维护成本略高于单体工程。
*   **学习曲线**: NestJS 的依赖注入和模块化思想对纯前端开发者有一定门槛。
