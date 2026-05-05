# Workflow Defect Register

用于持续记录 Wealth Cycle AI 工作流自身的问题，避免规则过载、漏读上下文、验证缺证据等问题反复出现。

## 1. 当前关注缺陷

| ID | 缺陷 | 风险 | 当前策略 | 状态 |
|----|------|------|----------|------|
| D1 | 规则和 Skill 过载 | Token 消耗高、输出变慢、代码判断被噪音干扰 | 使用 `rule-loading-policy.md` 和 `skill-routing-minimal.md` | Watching |
| D2 | Context Pack 缺失 | AI 漏读 `packages/shared`、schema、ADR 或相关模块 | Medium 及以上任务使用 Context Pack | Watching |
| D3 | 验证缺证据 | Run Record 写 Success 但没有 `pnpm agent:check` 或截图/API 证据 | Run Record 必填验证记录或跳过原因 | Watching |
| D4 | OpenSpec 与 Harness 状态不同步 | 已实现功能未反映到 `feature-list.json` 或 `claude-progress.txt` | 归档时检查 Harness 状态 | Watching |
| D5 | RCA 漏触发 | 验证失败或人工大改后没有反哺 | Failure 场景使用 RCA 模板 | Watching |

## 2. 后续优化项

| ID | 优化项 | 触发条件 | 优先级 |
|----|--------|----------|--------|
| O1 | 失败样本 RCA 演练 | 第一次出现验证失败或人工大改 | P1 |
| O2 | 轻量结构检查器 | Run Record / Context Pack 开始增多 | P2 |
| O3 | 模板填写成本复查 | Small 任务感觉文档负担过重 | P1 |
| O4 | Context Pack 质量复盘 | 出现漏读 schema、API 或共享类型 | P1 |

## 3. 复查问题

1. 是否遵守 1 个主 Skill、最多 1 个辅助 Skill？
2. 是否读取了 P0/P1 Context Pack？
3. 代码变更是否记录了 `pnpm agent:check` 或跳过原因？
4. UI 变更是否有截图、预览或无法截图原因？
5. 失败或人工大改是否生成 RCA？
