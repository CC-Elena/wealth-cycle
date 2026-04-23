## 场景背景 (Context)

目前系统各模块（Finance, Inventory）运行良好，但反馈是异步的且被动的。用户无法实时得知预算超支或库存短缺，这违背了“智能管家” (Agent-First) 的核心设计理念。

## 目标与非目标 (Goals / Non-Goals)

**Goals:**
- 提供统一的通知存储、分发与消费机制。
- 实现预算超支、库存水位告警、发薪强提醒的自动化触发。
- 支持通知的持久化、未读计数及状态切换。
- 确保通知数据通过 `sync_logs` 协议支持多端同步。

**Non-Goals:**
- 不涉及第三方推送服务（如 FCM, Apple Push），仅限于应用内通知展示。
- 不涉及复杂的通知订阅管理（目前为系统全量推送）。

## 设计决策 (Decisions)

### 1. 数据库模型 (notifications)
在 `apps/server/src/database/schema.ts` 中新增：
- `id`: primary key
- `userId`, `ledgerId`: 关联用户与账本
- `type`: `budget_overdraft`, `inventory_alert`, `payroll_reminder`, `system`
- `title`, `message`: 展示文本
- `data`: 存储上下文（如 `budgetId`, `itemId`）的 JSON 字段
- `isRead`: boolean，默认为 false
- `createdAt`: 发生时间

### 2. 触发逻辑集成
- **预算监控**：在 `FinanceService.createTransaction` 执行后，调用 `NotificationService` 检查该分类对应的预算状态。若超支，生成 `budget_overdraft` 类型通知。
- **库存监控**：在 `InventoryService.consume` 执行后，检查 `currentStock < minStock`，若满足则生成 `inventory_alert` 通知。
- **发薪提醒**：实现一个简单的 Cron 或在用户会话开始时检查 `UserProfile.payday`，若匹配则触发。

### 3. 前端架构
- **NotificationStore**: 在 `apps/web/src/store` 中新增状态管理。
- **NotificationHub**: 在 Dashboard 或全局侧边栏顶部增加通知入口。
- **Toast 联动**: 重要的实时通知同步触发浏览器 Toast。

## 风险与权衡 (Risks / Trade-offs)

- **通知冗余 (Notification Fatigue)**：如果一小时内连续录入多笔超支交易，不应产生多条相同通知。
  - *策略*：同类型且同实体的通知在 24 小时内仅允许存在一条未读记录，新发生的将更新 `updatedAt` 而非新建。
- **同步压力**：通知数据随时间增长较快。
  - *策略*：定期清理 30 天前的已读通知，减轻本地 SQLite 负担。
