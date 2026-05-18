# Design: 自动化调剂实验 (Automated Adjustment Experiment)

## Technical Solution (技术方案)

### 1. 预测引擎 (Prediction Engine)
在 `FinanceService` 中新增 `predictCycleOutcome` 方法：
- **Input**: `currentSpent`, `daysElapsed`, `totalDays`, `historyMeanDailySpend`.
- **Algorithm**: `predictedAmount = currentSpent + (historyMeanDailySpend * (totalDays - daysElapsed))`.
- **Confidence**: 引入置信度模型，当周期已过 50% 时才触发调剂建议。

### 2. 调剂逻辑 (Adjustment Logic)
Agent 会轮询各 `BudgetBlock` 的健康状态：
- **At-Risk**: `spentAmount / totalAmount > daysElapsed / totalDays + 0.15` (偏离 15%).
- **Safe-Surplus**: `predictedTotal < totalAmount * 0.8`.
- **Action**: 生成 `InternalBudgetTransfer` 提议。

## Data Model / API Changes (数据模型与接口)

### API: `GET /finance/stats/prediction`
返回当前周期各分类的预测支出与风险等级。
```json
{
  "categoryId": "xxx",
  "predictedSpend": 1800,
  "budget": 2000,
  "status": "safe",
  "suggestedAdjustment": -200
}
```

### API: `POST /budgets/transfer`
实现预算块之间的资金划转（原子操作）。

## Storage & Privacy (存储与隐私)
- **存储方案**: 调剂日志（Transfer Logs）保存在本地数据库的 `budget_adjustments` 表中。
- **云端同步**: 仅同步最终调整后的 `budget_plans` 结果。调剂过程的原始预测指标不上传云端，仅在 Agent 上下文中使用。
- **合规性**: 预测数据属于脱敏衍生数据，完全符合本地优先的安全策略。
