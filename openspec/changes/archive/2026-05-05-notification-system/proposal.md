## 核心动机 (Why)

实现 S3-F1 路线图要求。当前系统缺乏主动反馈机制，用户无法及时感知预算超支、库存告警等关键财务风险。发薪提醒能确保用户及时处理周期性账务，提升系统的“Agent 主动服务”体验。

## 变更内容 (What Changes)

1. **后端 Notification 核心**：新增 `NotificationModule`，支持通知的 CRUD、未读计数及批量标记已读。
2. **持久化支持**：在数据库中新增 `notifications` 表。
3. **预算告警联动**：扩展 `FinanceService`，在支出交易入库后，如果对应分类的预算已超支或接近阈值（如 90%），自动生成通知。
4. **库存水位联动**：扩展 `InventoryService`，在扣减库存后检测 `currentStock` 是否低于 `minStock`，若是则触发预警。
5. **发薪提醒逻辑**：基于 `UserProfile` 中的 `payday` 设置，在发薪日前夕或当天生成强提醒通知。
6. **前端通知中心**：在顶部导航或侧边栏增加通知入口，支持实时红点提醒与通知列表查看。

## 功能能力 (Capabilities)

### 新增能力 (New Capabilities)
- `notification-system`: 系统级通知分发与管理中心，支持多类型通知。
- `budget-monitoring`: 预算实时监控与告警，打通收支记录与预算引擎。
- `inventory-alerts`: 库存水位自动监测与告警。

### 变更能力 (Modified Capabilities)
- `finance-core`: 增加对预算状态的实时检测逻辑。
- `inventory-core`: 增加水位告警触发点。

## 影响评估 (Impact)

- **Database**: 新增 `notifications` 表。
- **Backend API**: 新增 `/api/notifications` 端点。
- **Backend Logic**: `FinanceService` 和 `InventoryService` 逻辑侵入，需保持解耦。
- **Frontend UI**: 新增通知列表组件与状态管理。
