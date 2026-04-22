# Tasks: Multi-Ledger Management UI

- [ ] **T1: Store 增强**
  - 在 `financeStore.ts` 中实现 `createLedgerOnServer` Action。
  - 检查 `switchLedger` 逻辑，确保切换后所有 `fetch*` 函数被触发。
  - 修复 `initProfile` 中可能的账本状态同步问题。

- [ ] **T2: Profile 页面入口开发**
  - 修改 `apps/web/src/pages/Profile/index.tsx`。
  - 在页面头部或“账户与安全”前增加“当前账本”展示项。
  - 点击跳转至 `/ledgers`。

- [ ] **T3: 账本管理页面 (`/ledgers`) 实现**
  - 创建 `apps/web/src/pages/Ledgers` 目录及组件。
  - 实现账本列表渲染（使用 `store.ledgers`）。
  - 实现切换逻辑（使用 `store.switchLedger`）。
  - 处理 Loading 与成功提示。

- [ ] **T4: 创建账本交互**
  - 在 `Ledgers` 页面增加“创建新账本”功能。
  - 使用 `antd-mobile` 的 `Modal` 或 `ActionSheet` 收集名称和图标。
  - 调用 `createLedgerOnServer` 并刷新列表。

- [ ] **T5: 路由与导航配置**
  - 在 `apps/web/src/router/index.tsx` 中添加 `/ledgers` 路由。

- [ ] **T6: 全局验证**
  - 验证切换账本后，Dashboard 是否显示该账本的净资产。
  - 验证 AI Agent 是否感应到新的账本上下文（通过 `Header`）。
