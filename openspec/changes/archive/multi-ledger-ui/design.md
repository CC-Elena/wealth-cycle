# Design: Multi-Ledger Management UI

## 1. 架构变更 (Architecture Changes)

### Frontend Store (`financeStore.ts`)
- 新增 `createLedgerOnServer(data: { name: string; icon?: string })`: 调用 `POST /finance/ledgers`。
- 修改 `switchLedger`: 确保在切换后正确刷新 `disposableIncome` 和所有财务列表。
- 增强 `initProfile`: 确保首次加载时从后端获取默认账本。

### Routing
- 新增路由 `/ledgers`: 账本列表与管理。

## 2. UI/UX 设计 (UI/UX Design)

### Profile Page (我的)
- 在“账户与安全”下方增加一个显著的 **Current Ledger** 卡片或列表项。
- 展示当前账本名称、图标及“切换/管理”按钮。

### Ledgers Page (账本管理)
- **列表展示**：卡片式展示所有账本。
- **核心指标**：每个卡片显示账本净资产、图标。
- **状态标识**：当前正在使用的账本标记为“当前”。
- **操作**：
  - 点击卡片切换（需 Loading 状态）。
  - 右上角“+”号或底部按钮触发 **Create Ledger**。

### Create Ledger (创建账本)
- 简易弹窗（antd-mobile Modal or Popup）。
- 输入：账本名称、图标（Emoji 选择器或预设列表）。

## 3. 接口调用说明 (API Integration)
- `GET /finance/ledgers`: 获取所有账本。
- `POST /finance/ledgers`: 创建新账本。
- `POST /finance/ledgers/switch`: 更新后端默认账本（虽然前端已通过 Header 切换，但更新默认值有助于持久化偏好）。

## 4. 关键交互 (Key Interactions)
- **切换原子化**：切换账本后，必须清空旧的流水、预算、库存缓存，防止数据交叉。
- **视觉反馈**：切换账本后，建议在 Dashboard 顶部短时间显示“已切换至 [账本名]”。
