# S3-F2: 数据导出 (Data Export)

## 目标
实现一键导出系统中所有的财务数据，支持用户备份或迁移数据。

## 技术实现
1. **后端 (Backend)**:
   - 在 `GovernanceService` 中实现全量数据聚合逻辑。
   - 导出内容包括：
     - 账本 (Ledgers)
     - 分类 (Categories)
     - 交易流水 (Transactions)
     - 预算方案 (Budget Plans)
     - 库存数据 (Inventory)
     - 愿望清单 (Wishlist)
   - 提供一个返回 JSON 文件的 API 接口。

2. **前端 (Frontend)**:
   - 在 `GovernanceService` 的 UI（Dashboard 的审计弹窗或 Profile 页面）增加“导出数据”按钮。
   - 调用后端 API 并触发浏览器下载。

## 任务列表
- [ ] 1. 后端实现 `GovernanceService.exportAllData`。
- [ ] 2. 后端新增 `FinanceController` 导出接口。
- [ ] 3. 前端 `financeStore` 增加导出方法。
- [ ] 4. 前端 UI 增加导出按钮并实现下载逻辑。
- [ ] 5. 验证导出的 JSON 文件格式完整性。
