# Tasks: 自动化调剂实验 (Automated Adjustment Experiment)

## Data Model & Backend (后端与模型)
- [x] **DB**: 新增 `budget_adjustments` 表记录调剂历史 (`fromId`, `toId`, `amount`, `reason`)
- [x] **Service**: 实现 `PredictionService` 核心算法逻辑
- [x] **Controller**: 暴露 `/finance/stats/prediction` 接口
- [x] **Engine**: 在 `BudgetService` 中实现原子 `transferBetweenBudgets` 方法
- [x] **Agent**: 注入新的 `get_prediction` 和 `apply_adjustment` 工具

## Frontend & UI (前端与交互)
- [x] **Store**: 在 `financeStore` 中接入预测 API 并维护 `predictionStats`
- [x] **Dashboard**: 新增“预算预警”卡片，展示预测超支的分类
- [x] **Agent**: 优化 ChatPanel，当存在调剂建议时，主动展示划转卡片
- [x] **Animation**: 实现资金划转时的视觉反馈逻辑

## Verification & Experiment (验证与实验)
- [x] **Unit Test**: 验证预测算法在不同消费曲线下的准确性
- [x] **E2E**: 模拟“饮食”中旬即将超支场景，验证 Agent 是否能准确从“购物”调拨
- [x] **Cleanup**: 确保所有调剂操作均通过 `Cloud Sync Shell` 实现多端同步
