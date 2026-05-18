## 1. 数据库与数据模型 (Database)

- [x] 1.1 在 `apps/server/src/database/schema.ts` 中新增 `notifications` 表定义。
- [x] 1.2 更新数据库结构以包含新表。

## 2. 后端核心功能 (Backend Notification Module)

- [x] 2.1 创建 `apps/server/src/modules/notification` 目录，并初始化 Module, Controller, Service。
- [x] 2.2 实现通知查询接口：支持按 `ledgerId` 过滤、分页及状态筛选（全部/未读）。
- [x] 2.3 实现通知状态更新接口：支持单条或批量标记为已读。
- [x] 2.4 在 `AppModule` 中注册 `NotificationModule`。

## 3. 业务逻辑联动 (Integration Hooks)

- [x] 3.1 修改 `FinanceService`：在新增交易后增加预算超支检测，并调用 `NotificationService.create`。
- [x] 3.2 修改 `InventoryService`：在库存消耗后增加水位检测告警逻辑。
- [x] 3.3 实现发薪提醒触发器：在用户登录或每日首次访问时检查 `UserProfile.payday`。

## 4. 前端展示与交互 (Frontend UI)

- [x] 4.1 在 `apps/web/src/store` 中创建 `notificationStore`，管理通知列表与未读总数。
- [x] 4.2 开发 `NotificationHub` 组件（Popover 形式），展示最近通知列表。
- [x] 4.3 在 `Dashboard` 或 `TabBar` 中集成通知入口，并显示未读红点。
- [x] 4.4 集成 Toast 反馈 (通过 antd-mobile)。

## 5. 验证与测试 (Verification)

- [x] 5.1 模拟超支交易，验证是否产生通知。
- [x] 5.2 模拟库存不足，验证预警逻辑。
- [x] 5.3 检查 PWA 离线状态下的通知存储表现。
