## 新增需求 (ADDED Requirements)

### 需求 (Requirement): 持久化通知存储与状态管理
系统必须能够存储各模块生成的通知，并允许用户标记已读。通知应包含类型、标题、内容及关联的业务数据。

#### 场景 (Scenario): 成功创建并读取通知
- **GIVEN** 用户在一个账本中产生了一项触发通知的行为
- **WHEN** 系统生成一条通知并存入数据库
- **THEN** 前端通知中心应能查询到该通知且 `isRead` 为 false
- **AND** 用户点击标记已读后，`isRead` 更新为 true

### 需求 (Requirement): 预算实时超支监控
系统必须在每笔支出交易入库后实时校验分类预算。

#### 场景 (Scenario): 交易导致预算超支
- **GIVEN** 分类“餐饮”本月预算余额为 50 元
- **WHEN** 用户新增一笔金额为 60 元的“餐饮”支出
- **THEN** 系统应自动生成一条 `type: budget_overdraft` 的通知
- **AND** 通知内容应包含预算名称及超支金额

### 需求 (Requirement): 库存水位自动预警
系统必须在库存消耗后校验剩余量是否低于设定的安全水位。

#### 场景 (Scenario): 库存低于最小设定值
- **GIVEN** 物品“大米”的 `minStock` 为 2kg，当前 `currentStock` 为 3kg
- **WHEN** 用户记录消耗了 1.5kg 大米
- **THEN** `currentStock` 变为 1.5kg
- **AND** 系统应生成一条 `type: inventory_alert` 的通知，提示“大米库存不足”

