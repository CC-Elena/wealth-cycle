# AGENTS.md

**版本**：2.2（2025-03-04） | **兼容性**：Claude、Cursor、Copilot、Cline、Aider 及所有兼容 AGENTS.md 的工具  
**状态**：AI 辅助开发的权威单文件指南

---

## 目录

1. [合规与核心规则](#1-合规与核心规则)
2. [会话启动](#2-会话启动)
   - [压缩协议](#压缩协议会话中上下文保持)
3. [Memory Bank](#3-memory-bank)
4. [状态机](#4-状态机)
5. [任务契约与预算](#5-任务契约与预算)
6. [质量与文档](#6-质量与文档)
7. [示例工作流](#7-示例工作流)
8. [故障排查](#8-故障排查)

---

## 1. 合规与核心规则

### 启动合规（每个会话都要输出）

```
COMPLIANCE CONFIRMED: Reuse over creation

⚠️  GIGO PREVENTION - User Responsibilities:
📋 Clear task objectives | 🔗 Historical context | 🎯 Success criteria
⚙️  Architectural constraints | 🎖️ You lead - clear input = excellent output

[Continue with Memory Bank loading...]
```

### 四条神圣规则

| 规则 | 要求 | 验证方式 |
|------|------|----------|
| ❌ **未完成复用分析不得新建文件** | 搜索代码库，列出无法扩展的文件，并给出充分理由 | 新建前必须说明：“已分析 X/Y/Z，因[技术原因]无法扩展” |
| ❌ **可重构时不得重写** | 优先增量改造，需说明为何重构不可行 | “X 无法重构，原因是[具体限制]” |
| ❌ **不得给泛泛建议** | 必须引用 `file:line`，说明实际接入点，并含迁移策略 | 每条建议都带 `file:line` |
| ❌ **不得忽略现有架构** | 变更前先加载既有模式，扩展已有服务/组件，合并重复能力 | “扩展了 `file:line` 的既有模式” |

### 复用校验清单（新建文件前）

```markdown
- [ ] 已搜索：[搜索词] → 发现：[文件列表]
- [ ] 已分析扩展可能：
  - [ ] `existing/file1.ext` - 无法扩展原因：[具体技术原因]
  - [ ] `existing/file2.ext` - 无法扩展原因：[具体技术原因]
- [ ] 已检查模式：`systemPatterns.md#[section]`
- [ ] 结论：必须新建文件，原因：[完整论证]
```

### 不可协商项

- **审批门禁**：未经用户明确批准，不得修改文件
- **引用规范**：代码统一 `file:line`；Memory Bank 统一 `file.md#Section`
- **沙盒优先**：所有编辑在分支/临时克隆中进行，禁止直接改主分支
- **优先 MCP**：记忆、仓库操作、QA 优先用 MCP，而非粗暴堆上下文
- **禁止伪数据**：生产环境不得使用模拟/伪造数据，不得用空壳函数顶替实现
- **上下文工程**：工作上下文始终聚焦当前任务

---

## 2. 会话启动

### 加载优先级（按任务复杂度选择）

**每个会话必做**：
1. 输出合规声明（第 1 节）
2. 连接 MCP：若存在，读取 `.brain/mcp.config.json` 或 `.mcp.json`
3. 按模式加载 Memory Bank
4. 记录会话日志：`{"ts":"2025-10-25T10:30Z","mode":"fast|standard|deep","mb_v":"2024-10"}`

**Fast Track**（小修复、小改动）：
```
- [ ] 读取当月 README：`memory-bank/tasks/YYYY-MM/README.md`
- [ ] 查看最近完成项与下一优先级
- [ ] 需要时读取 `quick-start.md`
```

**Standard Discovery**（功能、测试、质量关键）：
```
- [ ] 当月 README
- [ ] 核心文件：projectbrief.md、systemPatterns.md、techContext.md、activeContext.md、progress.md
- [ ] 扫描 docs/ 最近更新
- [ ] 扫描根目录 instructions.md、ai_instructions.md
- [ ] 校验 toc.md 与 activeContext.md 是否最新
```

**Deep Dive**（架构/遗留系统调查）：
```
- [ ] Standard Discovery 全部内容
- [ ] 调查历史问题时读取对应月份 README
- [ ] 读取 decisions.md 获取架构上下文
- [ ] 与当前工作模式交叉验证
```

### 会话日志（操作日志，独立于 Memory Bank）

追加式 JSONL：
```json
{"timestamp":"2025-10-25T10:30:00Z","session_id":"uuid","mode":"standard","mb_version":"2024-10"}
{"timestamp":"2025-10-25T10:35:00Z","session_id":"uuid","event":"state_transition","from":"PLAN","to":"BUILD"}
{"timestamp":"2025-10-25T11:00:00Z","session_id":"uuid","event":"approval_requested","state":"APPROVAL"}
```

### 压缩协议（会话中上下文保持）

上下文压缩可能随时发生：系统自动触发、用户 `/compact` 触发或平台管理触发。**Agent 无法控制触发时机，也可能无提前通知。** 因此，状态持久化必须持续进行，不能等“压缩前”再做。

#### 持续状态持久化（每次状态切换都执行）

在每次状态切换（`PLAN → BUILD → DIFF → QA → APPROVAL → APPLY → DOCS`）时，写入 Memory Bank：

1. **状态机位置**：在 `activeContext.md` 更新当前状态、子状态、工作上下文
2. **任务进度**：向 `tasks/YYYY-MM/README.md` 追加 `[IN-PROGRESS]` 状态
3. **决策记录**：将新增架构决策追加到 `decisions.md`
4. **记录切换日志**：
   ```json
   {"timestamp":"...","session_id":"uuid","event":"state_transition","from":"PLAN","to":"BUILD"}
   ```
5. **会话散落信息**：把仅存在对话中的信息（用户偏好、口头要求、待确认问题）写入 `activeContext.md`

这样即使无预警压缩，Memory Bank 也已反映最新状态。

#### 压缩后恢复

检测到上下文被压缩（如早期对话细节丢失，或执行 `/compact` 后）：

1. 回到**会话启动**（第 2 节），使用 **Fast Track** 模式
2. 从 `activeContext.md` 确认状态机位置
3. 从已保存状态恢复，不得从头重做当前任务
4. 输出恢复确认：
   ```
   COMPACTION RECOVERY: Resumed [STATE] for [task name]
   Context restored from: activeContext.md, tasks/YYYY-MM/README.md
   ```

#### 规则

- 状态持久化发生在**每次切换**，而不是“压缩前”
- 发现压缩后，执行任何操作前必须先重读 Memory Bank
- 若当前状态是 `APPROVAL` 或 `DIFF`，差异摘要应已写入 `activeContext.md`
- 压缩不重置预算，循环/Token/分钟计数需从操作日志续接

---

## 3. Memory Bank

### 结构

```
memory-bank/
├── toc.md
├── projectbrief.md
├── productContext.md
├── systemPatterns.md
├── techContext.md
├── activeContext.md
├── progress.md
├── projectRules.md
├── decisions.md
├── quick-start.md
├── database-schema.md
├── build-deployment.md
├── testing-patterns.md
└── tasks/
    ├── YYYY-MM/
    │   ├── README.md
    │   └── DDMMDD_*.md
    └── YYYY-MM/README.md
```

### 文件用途表

| 文件 | 用途 | 何时读取 | 何时更新 |
|------|------|----------|----------|
| `toc.md` | 索引/导航 | 新增文件后 | 新增任务/文件后 |
| `projectbrief.md` | 核心需求 | 复杂任务前 | 重大方向变更 |
| `productContext.md` | 用户目标/市场 | 复杂任务前 | 季度或策略变化 |
| `systemPatterns.md` | 架构模式 | 架构改动前 | 发现新模式时 |
| `techContext.md` | 技术栈决策 | 会话开始 | 引入新技术时 |
| `activeContext.md` | 当前焦点 | 每次会话 | 每周/里程碑 |
| `progress.md` | 当前状态 | 会话开始 | 完成重大功能时 |
| `projectRules.md` | 编码规范 | 不确定时 | 新模式出现时 |
| `decisions.md` | 决策依据 | 架构选择前 | 产生架构决策时 |
| `tasks/*/README.md` | 月度摘要 | 月度相关工作 | 月末/里程碑 |
| `tasks/*/*.md` | 任务文档 | 问题调查 | 仅审批后创建 |

### 读写路径

- **读（高频）**：会话启动、架构决策前、不确定时、问题调查时
- **写（低频，需审批）**：重大功能完成、模式发现、架构决策、里程碑完成、用户明确要求

---

## 4. 状态机

### 概览

**主状态**：`PLAN → BUILD → DIFF → QA → APPROVAL → APPLY → DOCS`  
**子状态**：`CODING`（编码中）、`WAITING_TOOL`（等待权限/工具）、`RUNNING`（QA 执行中）、`IDLE`

```
PLAN [approve] → BUILD → DIFF → QA [pass] → APPROVAL [approve] → APPLY → DOCS → END
  ↑               ↑______↓______↓_____[fail/changes]______________↓
  └───────────────────────────────────[major changes needed]─────┘
```

### PLAN

**输入**：任务契约 + MB 上下文  
**输出**：实施计划  
**退出条件**：用户批准

必须包含：
- 已分析内容（代码与 MB 引用）
- 复用策略（优先扩展现有文件）
- 实施步骤（含集成点）
- 风险与缓解
- 测试策略（单测/集成/手测）

退出关键词示例：`approved`、`proceed`、`looks good`

### BUILD

**输入**：已批准计划  
**输出**：拟议 diff（未应用）  
**子状态**：`CODING`

动作：
1. 在沙盒分支/临时克隆中工作
2. 按批准计划改动文件
3. 用最小改动达成目标
4. 遵循 `projectRules.md`
5. 同步补测试
6. 生成统一 diff
7. **不得应用**

### DIFF

**输入**：BUILD 完成  
**输出**：差异 + 变更理由 + MB 引用  
**退出条件**：可进入 QA

必须呈现：
- 文件变更统计
- 关键 diff
- 每项改动理由与复用依据
- 集成点与破坏性评估
- 新建文件的技术必要性论证

### QA

**输入**：DIFF 完成  
**输出**：结构化测试结果  
**子状态**：`RUNNING`

执行：
1. 测试套件
2. Lint/代码质量检查
3. 覆盖率检查
4. 构建验证
5. 结构化报告

通过条件：测试通过、无 lint error、覆盖率达标、构建成功。  
若失败：回 BUILD 做最小修复并重试。

重试协议：
- 第 1 次失败：分析输出，最小修复后重测
- 第 2 次失败：复审方案与环境后重测
- 第 3 次失败：**STALL DETECTED**，请求用户介入或切换 agent

### APPROVAL（人工门禁）

**输入**：QA 通过  
**输出**：用户决策  
**退出条件**：用户明确批准

需展示：
- 改动文件清单
- diff 摘要
- 测试/Lint/覆盖率/构建结果
- 评审门禁（测试、安全、Lint、文档计划）
- 用户可回复指令（批准/改动/回滚）

批准关键词示例：`approved`、`looks good`、`document it`、`apply it`、`ship it`

### APPLY

**输入**：用户批准  
**输出**：应用成功或回滚结果

动作：
1. 将已提议改动应用到沙盒分支
2. 验证应用结果
3. 可选快速冒烟测试
4. 成功则进入 DOCS；失败则回滚并回 BUILD

### DOCS

**输入**：APPLY 成功且代码已获批准  
**输出**：任务文档 + MB 更新  
**退出条件**：文档完成

必须执行：
1. 创建任务文档 `memory-bank/tasks/YYYY-MM/DDMMDD_task-name.md`
2. 更新月度 README
3. 若有新模式，更新 `projectRules.md`
4. 若有架构决策，更新 `decisions.md`
5. 如新增 MB 文件，更新 `toc.md`
6. 开文档 PR（或按用户偏好提交）

---

## 5. 任务契约与预算

### 任务契约模板

```markdown
## 任务：[清晰且具体的目标]

### 背景
- **仓库**：[路径或 monorepo 位置]
- **关联工作**：[历史任务、MB 条目]
- **约束**：[架构规则、安全、性能]
- **影响系统**：[组件、服务、模块]

### 预期结果
- **验收标准**：
  1. [可测试标准]
  2. [可测试标准]
- **成功指标**：[如何衡量完成]
- **完成定义**：[何时算真正完成]

### 历史引用
- **历史任务**：[`tasks/YYYY-MM/DDMMDD_*.md`]
- **架构决策**：[`decisions.md` 相关条目]
- **关联模式**：[`systemPatterns.md`、`projectRules.md`]

### 架构约束
- **必须遵循**：[MB 中指定模式]
- **必须扩展**：[指定现有文件]
- **禁止**：[反模式/禁用方案]
- **安全**：[安全注意事项]

### 指令
先提交大纲等待批准。批准后实施。代码未获最终批准前，不做文档沉淀。
```

### 预算系统

预算类型：
- **Cycles**：BUILD→QA 最大迭代次数（默认 3）
- **Tokens**：上下文 Token 上限（默认按 agent 限制）
- **Minutes**：墙钟时间上限（标准任务默认 30 分钟）

超预算动作：
- Cycles 超限：判定 STALL，需用户介入
- Tokens 超限：切最小上下文模式或切换 agent
- Minutes 超限：汇报进度并申请延期

延期必须用户批准，申请需包含：当前进度、超时原因、预计新增资源、替代方案。

### 停滞检测（Stall Detection）

判定条件：连续两次 diff 完全相同（同文件、同改动）。

处理方式：
1. 输出诊断（原因、已尝试动作、阻塞点）
2. 提出建议（补充上下文/技术替代/切换 agent）
3. 请求用户给出方向

### 上下文管理

上下文分区：
1. **Core**：任务契约、相关 MB、当前状态（常驻）
2. **Task**：当前改动文件、直接依赖、相关测试
3. **Reference**：架构模式、相似实现、历史决策（按需）

状态切换后进行上下文轮转：丢弃 Task 区，仅加载下一状态所需内容；Core 保持。每次切换都按压缩协议持久化。

---

## 6. 质量与文档

### 绝对禁止项

| 禁止行为 | 后果 |
|----------|------|
| ❌ 在生产代码中使用伪造/模拟数据 | 回滚并重启流程 |
| ❌ 以 stub 函数冒充完成实现 | 回滚并重启流程 |
| ❌ 忽略测试失败 | 回滚并重启流程 |
| ❌ “防御式堆补丁”而不修根因 | 回滚并重启流程 |
| ❌ 未经批准直接应用变更 | 回滚并重启流程 |

说明：测试夹具与测试 mock 允许；生产伪数据一律不允许。

### 代码复用强制规则

新建文件前必须：
1. 在代码库搜索相似功能
2. 在 `systemPatterns.md` 查找对应模式
3. 评估现有架构扩展点
4. 若声称无法扩展，必须写明技术原因

### 安全审查（APPROVAL 组成部分）

检查清单：
- [ ] **认证/授权**：无硬编码凭据；敏感操作前有鉴权；边界有授权校验；会话管理遵循既有模式
- [ ] **数据处理**：外部输入校验；输出编码防注入；敏感数据按需加密（传输/静态）
- [ ] **错误处理**：错误中不泄露敏感信息；日志等级与内容合理；具备优雅降级
- [ ] **依赖治理**：无已知漏洞；版本受控；许可证兼容

任一项失败，必须先修复再进入 APPROVAL。

### Lint 与代码质量

- APPROVAL 前必须 **0 error**
- warning 可接受，但需有理由
- 遵循项目 lint 规则与语言惯用法
- 命名一致、函数单一职责、嵌套尽量不超 3-4 层、复杂逻辑才注释

### 测试要求

- 新函数有单测
- 工作流有集成测试
- 关键路径覆盖边界条件
- 测试命名清晰、确定性高、相互独立、执行快速、可维护

### 文档规范

下列文件创建/更新需审批：
- `memory-bank/tasks/*/` 任务文档
- `memory-bank/tasks/*/README.md` 月度汇总
- `memory-bank/decisions.md` ADR
- `memory-bank/projectRules.md` 新模式
- 任意版本控制提交

下列内容通常不需额外审批：
- 应用代码、测试、配置更新、操作日志

审批门流程：
1. 代码阶段完成（BUILD→DIFF→QA）
2. 进入 APPROVAL 展示结果
3. **等待**用户回复
4. 批准后：APPLY→DOCS
5. 要求修改：回 BUILD
6. 要求回滚：丢弃改动

引用格式：
- 代码：`path/file.ext:42`、`path/file.ext:42-58`、`path/file.ext:functionName()`
- MB：`memory-bank/systemPatterns.md#Section`、`memory-bank/decisions.md#2025-10-15-decision`

### 版本与回滚

- 不得杜撰发布/里程碑 ID；若需新里程碑，输出 Proposal 由用户定 ID
- 回滚触发：APPLY 失败、用户要求回滚、关键错误、安全漏洞
- 回滚协议：定位最近可用状态 → 恢复文件 → 验证 → 记日志 → 向用户报告（原因/范围/当前状态/建议）

---

## 7. 示例工作流

### 任务：完成引导后发送欢迎邮件通知

#### PLAN

- 分析：
  - `services/onboarding.ext`：当前完成逻辑
  - `services/notification.ext`：既有通知服务
  - `systemPatterns.md#Event-Driven`：事件驱动模式
- 复用策略：
  - 在引导完成点发出 `onboarding_completed` 事件
  - 在通知服务增加事件监听
  - 邮件模板遵循现有模板结构
- 测试：
  - 单测：事件发射与监听
  - 集成：引导完成到邮件送达链路

用户回复：`approved`

#### BUILD

- 修改引导服务：增加事件发射
- 扩展通知服务：增加监听器
- 新增模板与对应测试
- 生成 diff，不应用

#### DIFF

- 呈现文件统计、关键改动片段、复用理由、集成关系
- 说明无破坏性 API 变更

#### QA

- 测试通过、Lint 通过、覆盖率达标、构建成功
- 结论：可进入 APPROVAL

#### APPROVAL

- 呈现文件清单与质量门结果
- 等待用户明确批准

用户回复：`looks good`

#### APPLY

- 在沙盒分支应用改动
- 快速验证通过

#### DOCS

- 创建任务文档
- 更新当月 README
- 若未产生新模式，可不改规则文档

---

## 8. 故障排查

### 决策树：Agent 卡住时

```
卡住? → Cycles ≥3?
         ↓ 是
       diff 是否重复?
         ↓ 是 → 增加 MB 上下文 / 切换 agent
         ↓ 否
       QA 是否同类失败?
         ↓ 是 → 环境问题或需求歧义
         ↓ 否
       分析失败模式并调整策略
```

### 常见问题

| 问题 | 症状 | 解决 |
|------|------|------|
| 循环停滞 | 多次同 diff、QA 反复失败、3+ 轮无进展 | 查预算 → 补 MB 上下文 → 澄清需求 → 检查环境 → 切换 agent |
| 上下文超限 | Token 接近上限、响应变慢/截断、遗忘前文 | 依压缩协议恢复 → 轮转上下文 → 只保留必要摘要 → 拆子任务 |
| CI 与本地不一致 | 本地过、CI 不过 | 对齐环境/依赖版本，检查时序与并发、状态清理；必要时记录豁免 |
| 安全失败 | 清单未通过、敏感信息泄露、鉴权绕过 | 严禁绕过；回 BUILD 修复并重测，必要时沉淀新模式 |

### 停滞处理协议

1. 检测：比较当前 diff 与上次 diff
2. 记录：写入操作日志
3. 停止：暂停 BUILD 尝试
4. 报告：向用户给出诊断
5. 请求：让用户选择补充上下文/替代方案/切换 agent

### 恢复流程

**完全重置**（严重失控）：
1. 记录当前状态
2. 丢弃未提交改动
3. 回到最近可用状态
4. 启动新会话
5. 以 Standard Discovery 全量加载 MB
6. 重新分析

**局部回滚**（近期回归）：
1. 定位最后可用状态
2. 仅回滚问题改动
3. 保留正常改动
4. 重测稳定性
5. 从 DIFF 或 BUILD 继续

**切换 Agent**（能力不匹配）：
1. 在当前状态形成干净边界
2. 记录进度
3. 准备聚焦上下文（任务契约 + 相关 MB + 当前状态）
4. 拉起专用 agent 完成子任务
5. 合并结果回主流程

---

## 快速参考

### 状态流转

`PLAN [用户批准] → BUILD → DIFF → QA [通过] → APPROVAL [用户批准] → APPLY → DOCS`

失败迭代：`BUILD ← DIFF ← QA ← APPROVAL`  
重大变更：返回 `PLAN`

### 关键规则

1. 🚫 未完成复用分析，不得新建文件
2. 🚫 未经用户批准，不得应用改动
3. 🚫 代码未批准，不得做文档沉淀
4. 🚫 生产环境不得使用伪数据
5. ✅ 代码引用统一 `file:line`，MB 引用统一 `file.md#Section`
6. ✅ 始终在沙盒工作，禁止直改主分支
7. ✅ 始终先验证复用机会，再考虑新增

### 卡住时优先动作

1. 看循环次数（>3 视为停滞）
2. 检查是否出现重复 diff
3. 加载更多 MB 上下文
4. 拆分更小子任务
5. 请求用户介入
6. 评估切换 agent

### 未经批准不得创建

- `memory-bank/tasks/*/`（任务文档）
- `memory-bank/tasks/*/README.md`（月度汇总）
- 任何版本控制提交

---

**每个会话都是全新开始。Memory Bank 是唯一持久记忆，请精确维护。**

**使命**：尊重既有架构，遵循既有模式，增量改进软件。复用优先于创建，质量优先于速度，审批优先于假设。**

**让我们一起更聪明地构建。**

你是一名 JavaScript、Rsbuild 和 Web 应用开发专家。你编写的代码应具备良好的可维护性、高性能和可访问性。

## 命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产环境应用
- `npm run preview` - 在本地预览生产构建结果

## 文档

- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt

## 工具

### Biome

- 运行 `npm run lint` 对代码进行静态检查
- 运行 `npm run format` 对代码进行格式化
# AGENTS.md

**Version**: 2.2 (2025-03-04) | **Compatibility**: Claude, Cursor, Copilot, Cline, Aider, all AGENTS.md-compatible tools
**Status**: Canonical single-file guide for AI-assisted development

---

## Table of Contents

1. [Compliance & Core Rules](#1-compliance--core-rules)
2. [Session Startup](#2-session-startup)
   - [Compaction Protocol](#compaction-protocol-mid-session-context-preservation)
3. [Memory Bank](#3-memory-bank)
4. [State Machine](#4-state-machine)
5. [Task Contract & Budgets](#5-task-contract--budgets)
6. [Quality & Documentation](#6-quality--documentation)
7. [Example Workflow](#7-example-workflow)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Compliance & Core Rules

### Startup Compliance (Output Every Session)

```
COMPLIANCE CONFIRMED: Reuse over creation

⚠️  GIGO PREVENTION - User Responsibilities:
📋 Clear task objectives | 🔗 Historical context | 🎯 Success criteria
⚙️  Architectural constraints | 🎖️ You lead - clear input = excellent output

[Continue with Memory Bank loading...]
```

### The Four Sacred Rules

| Rule | Requirement | Validation |
|------|-------------|------------|
| ❌ **No new files without reuse analysis** | Search codebase, reference files that cannot be extended, provide exhaustive justification | Before creating: "Analyzed X, Y, Z. Cannot extend because [technical reason]" |
| ❌ **No rewrites when refactoring possible** | Prefer incremental improvements, justify why refactoring won't work | "Refactoring X impossible because [specific limitation]" |
| ❌ **No generic advice** | Cite `file:line`, show concrete integration points, include migration strategies | Every suggestion includes `file:line` citation |
| ❌ **No ignoring existing architecture** | Load patterns before changes, extend existing services/components, consolidate duplicates | "Extends existing pattern at `file:line`" |

### Reuse Validation Checklist (Before Creating Files)

```markdown
- [ ] Searched: [search terms] → found: [list files]
- [ ] Analyzed extension:
  - [ ] `existing/file1.ext` - Cannot extend: [specific technical reason]
  - [ ] `existing/file2.ext` - Cannot extend: [specific technical reason]
- [ ] Checked patterns: `systemPatterns.md#[section]`
- [ ] Justification: New file needed because [exhaustive reasoning]
```

### Non-Negotiables

- **Approval Gates**: No file changes without explicit user approval
- **Citations**: Always `file:line` for code, `file.md#Section` for Memory Bank
- **Sandbox First**: All edits in branch/temp clone, never main
- **MCP Preferred**: Use MCP servers for memory, repo ops, QA over brute-force context
- **No Mock Data**: Never fake/simulated data in production; never stub functions
- **Context Engineering**: Keep working context focused on current task

---

## 2. Session Startup

### Load Priority (Choose Based on Task Complexity)

**Every Session** (mandatory):
1. Output compliance statement (Section 1)
2. Attach MCP servers: Read `.brain/mcp.config.json` or `.mcp.json` if present
3. Load Memory Bank per mode below
4. Log session: `{"ts":"2025-10-25T10:30Z","mode":"fast|standard|deep","mb_v":"2024-10"}`

**Fast Track** (bug fixes, small changes):
```
- [ ] Load current month README: `memory-bank/tasks/YYYY-MM/README.md`
- [ ] Check recent achievements and next priorities
- [ ] Load `quick-start.md` if needed
```

**Standard Discovery** (features, tests, quality-critical work):
```
- [ ] Current month README
- [ ] Core files: projectbrief.md, systemPatterns.md, techContext.md, activeContext.md, progress.md
- [ ] Scan docs/ for recent updates
- [ ] Scan root for instructions.md, ai_instructions.md
- [ ] Verify toc.md and activeContext.md current
```

**Deep Dive** (architecture, legacy investigation):
```
- [ ] Standard Discovery files
- [ ] Specific month README when investigating legacy
- [ ] decisions.md for architectural context
- [ ] Cross-reference with current work patterns
```

### Session Logging (Operational Log - Separate from Memory Bank)

Append-only JSONL format:
```json
{"timestamp":"2025-10-25T10:30:00Z","session_id":"uuid","mode":"standard","mb_version":"2024-10"}
{"timestamp":"2025-10-25T10:35:00Z","session_id":"uuid","event":"state_transition","from":"PLAN","to":"BUILD"}
{"timestamp":"2025-10-25T11:00:00Z","session_id":"uuid","event":"approval_requested","state":"APPROVAL"}
```

### Compaction Protocol (Mid-Session Context Preservation)

Compaction (context compression) can happen at any time — triggered by the system automatically, by the user via `/compact`, or by platform-level context management. **The agent does not control compaction timing and may not get advance notice.** Therefore, state persistence must be continuous, not deferred to a pre-compaction moment.

#### Continuous State Persistence (At Every State Transition)

At each state transition (`PLAN → BUILD → DIFF → QA → APPROVAL → APPLY → DOCS`), persist the following to the Memory Bank:

1. **State machine position**: Update `activeContext.md` with current state, substate, and working context
2. **Task progress**: Append current status to `tasks/YYYY-MM/README.md` with `[IN-PROGRESS]` tag
3. **Decisions**: Append any new architectural decisions to `decisions.md`
4. **Log transition** to operational log:
   ```json
   {"timestamp":"...","session_id":"uuid","event":"state_transition","from":"PLAN","to":"BUILD"}
   ```
5. **Loose context**: Capture any information that exists only in conversation (user preferences, verbal requirements, pending questions) into `activeContext.md`

This ensures that when compaction occurs — without warning — the Memory Bank already reflects the latest state.

#### After Compaction (Recovery)

When context has been compressed (detected by loss of earlier conversation detail, or after `/compact`):

1. Re-enter **Session Startup** (Section 2) using **Fast Track** mode — the Memory Bank was just updated via continuous persistence, so full discovery is unnecessary
2. Confirm state machine position from `activeContext.md`
3. Resume from saved state — do not restart the current task from scratch
4. Output recovery confirmation:
   ```
   COMPACTION RECOVERY: Resumed [STATE] for [task name]
   Context restored from: activeContext.md, tasks/YYYY-MM/README.md
   ```

#### Rules

- State persistence happens at every transition, not "before compaction" — you cannot rely on advance notice
- After detecting compaction, always re-read Memory Bank before taking any action
- If the current state is `APPROVAL` or `DIFF`, the diff summary should already be in `activeContext.md` from the transition save
- Compaction does not reset budgets — carry forward cycle/token/minute counts from the operational log

---

## 3. Memory Bank

### Structure

```
memory-bank/
├── toc.md                    # Index (update after new files/tasks)
├── projectbrief.md           # Vision, goals (rarely change)
├── productContext.md         # User goals, market (quarterly)
├── systemPatterns.md         # Architecture (pattern discovery)
├── techContext.md            # Tech stack (new tech adoption)
├── activeContext.md          # Current sprint (weekly/milestone)
├── progress.md               # Status, blockers (major features)
├── projectRules.md           # Coding standards (new patterns)
├── decisions.md              # ADRs (architectural decisions)
├── quick-start.md            # Common patterns, session data
├── database-schema.md        # Data models (if applicable)
├── build-deployment.md       # Build/deploy procedures
├── testing-patterns.md       # Test strategies
└── tasks/
    ├── YYYY-MM/
    │   ├── README.md         # Monthly summary (month end)
    │   └── DDMMDD_*.md       # Task docs (after approval)
    └── YYYY-MM/README.md
```

### File Reference Table

| File | Purpose | Load When | Update When |
|------|---------|-----------|-------------|
| `toc.md` | Index/navigation | After adding files | After new files/tasks |
| `projectbrief.md` | Core requirements | Complex tasks | Major pivots |
| `productContext.md` | User goals, market | Complex tasks | Quarterly/strategy shifts |
| `systemPatterns.md` | Architecture patterns | Before arch changes | Pattern discovery |
| `techContext.md` | Tech stack decisions | Session start | New tech adoption |
| `activeContext.md` | Current focus | Every session | Weekly/milestones |
| `progress.md` | Current state | Session start | Major features done |
| `projectRules.md` | Coding standards | When uncertain | New patterns emerge |
| `decisions.md` | Why X over Y | Arch decisions | Arch decisions made |
| `tasks/*/README.md` | Monthly summary | Month-specific work | Month end/milestone |
| `tasks/*/*.md` | Task documentation | Investigating issues | After approval only |

### Read vs Write Paths

**Read** (frequent): Session startup, before arch decisions, when uncertain, investigating issues
**Write** (infrequent, requires approval): After major features, pattern discovery, arch decisions, milestone completion, user requests

---

## 4. State Machine

### Overview

**States**: `PLAN → BUILD → DIFF → QA → APPROVAL → APPLY → DOCS`
**Substates**: `CODING` (building), `WAITING_TOOL` (permissions), `RUNNING` (QA), `IDLE`

```
PLAN [approve] → BUILD → DIFF → QA [pass] → APPROVAL [approve] → APPLY → DOCS → END
  ↑               ↑______↓______↓_____[fail/changes]______________↓
  └───────────────────────────────────[major changes needed]─────┘
```

---

### PLAN

**In**: Task contract + MB context | **Out**: Implementation plan | **Exit**: User approves

**Required Content**:
```markdown
## Plan: [Task Name]

**Analyzed**:
- `path/file.ext:50-100` - Current implementation of X
- `memory-bank/systemPatterns.md#Pattern` - Established pattern for Y
- `path/service.ext` - Service handling Z

**Reuse Strategy**:
- Extend `file.ext` - Add method for [functionality]
- Integrate `service.ext:line` - New behavior at [point]
- Cannot reuse [component] because: [specific technical reason]

**Steps**:
1. [Action] - extends pattern at `file:line`
2. [Action] - integrates with [component]
3. [Action] - adds tests mirroring `test.ext`

**Integration**: [Component A] calls via [method] | [Service B] update at `file:line`
**Risks**: [Risk] → mitigation: [approach]
**Tests**: Unit: [scenarios] | Integration: [flows] | Manual: [paths]
```

**Exit**: User responds "approved", "proceed", "looks good"
**Failures**: Insufficient reuse → load more MB | Ambiguous → ask user | Rejected → iterate

---

### BUILD

**In**: Approved plan | **Out**: Proposed diff (NOT APPLIED) | **Exit**: All changes complete, diff generated

**Substate**: Set to `CODING`

**Actions**:
1. Work in branch/temp clone (never main)
2. Create/modify files per approved plan
3. Implement minimal changes achieving objective
4. Follow patterns from `projectRules.md`
5. Add tests alongside implementation
6. Generate unified diff
7. **DO NOT APPLY**

**Context Management**:
- Keep only task-relevant files in working context
- Reference MB as needed, don't load entire codebase
- Focused search/grep for patterns
- Parallelize independent file operations

**Agentic Primitives** (reusable building blocks):
- Extend class/module following established patterns
- Integrate component at defined integration points
- Add test coverage mirroring existing test structure
- Update config following existing patterns
- Add error handling using project's patterns

**Exit**: All planned changes done, tests written, no syntax errors, diff generated, **NOT APPLIED**
**Failures**: Compilation errors → fix, stay in BUILD | Pattern violations → review `projectRules.md` | Integration conflicts → review `systemPatterns.md` | Two identical diffs → STALL DETECTED

---

### DIFF

**In**: BUILD complete | **Out**: Rationale + diff | **Exit**: Ready for QA

**Present**:
```markdown
## Proposed Changes

**Files**:
```
path/file1.ext    | 50 +++++++++---------
path/file2.ext    | 120 +++++++++++++++++++
tests/test.ext    | 200 +++++++++++++++++++++++++++
3 files, 370 insertions(+), 10 deletions(-)
```

**Diff**: [unified diff output]

**Rationale**:
- Modified `file1.ext` to extend per `systemPatterns.md#Pattern`
- Created `file2.ext` because [specific technical reason]
- Tests follow pattern from `existing_test.ext`

**Integration**: `component.ext:45` calls new method | `service.ext:120` updated | No breaking API changes

**MB References**: `systemPatterns.md#Architecture` | `decisions.md#2025-09-15-strategy`
```

**Exit**: Changes presented with rationale, MB references, new file justification (if any)
**Failures**: Cannot justify new file → return to BUILD, refactor | Missing MB refs → add explicit refs | Unclear integration → clarify

---

### QA

**In**: DIFF complete | **Out**: Structured test results | **Exit**: Tests pass OR user waiver

**Substate**: Set to `RUNNING`

**Execute**:
1. Test suite (via MCP or project command)
2. Linters and code quality checks
3. Coverage checks
4. Build verification
5. Report structured results

**Report Format**:
```markdown
## QA Results

**Tests**: ✅ PASS | ❌ FAIL | Total: 145 | Passed: 145 | Failed: 0 | Duration: 23.5s
**Linter**: ✅ PASS | ⚠️  WARNINGS | ❌ FAIL | Errors: 0 | Warnings: 2 (non-blocking)
**Coverage**: Overall: 87.3% (+2.1%) | New code: 95.2% | Below threshold: None
**Build**: ✅ SUCCESS | ❌ FAILURE | Duration: 12.3s

**Verdict**: ✅ Ready for APPROVAL | ❌ Return to BUILD
```

**Exit (PASS)**: All tests passing, no lint errors (warnings OK with justification), coverage meets threshold, build succeeds
**Exit (CONDITIONAL)**: Tests fail with documented waiver OR user grants waiver

**Failures**: Tests fail → synthesize minimal patch, return to BUILD | Lint errors → fix, retry | Build fails → diagnose, return to BUILD

**Retry Protocol**:
- 1st fail: Analyze output, minimal fix, re-test
- 2nd fail: Re-analyze approach, check environment, fix, re-test
- 3rd fail: **STALL DETECTED** → request user input or agent swap

---

### APPROVAL (HUMAN GATE)

**In**: QA passed | **Out**: User decision | **Exit**: User approves explicitly

**Present**:
```markdown
## Ready for Approval

Code changes complete. Ready for review.

**Files modified**:
- `path/file1.ext` (+50, -10 lines)
- `path/file2.ext` (+120, -5 lines)
- `tests/test.ext` (+200, -0 lines)

**Git diff**: [git diff --stat if in repo]

**Test Results**:
✅ 145 tests passing | ✅ Linter clean | ✅ Coverage: 87.3% (+2.1%) | ✅ Build successful

**Review Gates**:
- ✅ Tests pass
- ✅ Security reviewed (no sensitive data, validated inputs, safe errors, follows auth patterns)
- ✅ Linter clean
- ✅ Documentation plan: Will create `tasks/2025-10/251025_task-name.md` + update monthly README

**Next Steps After Approval**:
1. Apply changes to sandbox branch
2. Create task documentation
3. Update monthly README
4. Update relevant MB files (if applicable)

---

**Please review. Reply with**:
- "approved" | "looks good" | "document it" → Proceed to APPLY
- "change X" | "fix Y" → Return to BUILD with changes
- "revert" → Discard all changes
```

**Exit**: User responds with approval keywords: "approved", "looks good", "document it", "apply it", "ship it"
**Alternative Paths**: User requests changes → BUILD | User requests revert → discard, return to START | User requests info → provide details, stay in APPROVAL
**Failures**: Ambiguous response → ask for explicit approval | Approval without gates passing → warn, request waiver | Long wait → stay IDLE, do not proceed

---

### APPLY

**In**: User approved | **Out**: Changes applied or rollback | **Exit**: Applied successfully OR rolled back

**Actions**:
1. Apply all proposed changes to sandbox branch
2. Verify application successful
3. Optional: Quick smoke test
4. Report success or initiate rollback

**Success**:
```markdown
## Changes Applied

✅ All changes applied to sandbox branch
✅ 3 files modified
✅ Quick verification passed

Ready for DOCS.
```

**Failure**:
```markdown
## Apply Failed - Rolling Back

❌ Failed: [error]
🔄 Rolling back to previous state
📝 Sandbox restored

Diagnosis: [technical reason]
Recommendation: [fix or alternative]

Returning to BUILD.
```

**Exit (Success)**: All changes applied, sandbox updated, optional smoke test passed
**Exit (Failure)**: Rollback complete, sandbox restored, error diagnosed
**Failures**: File conflicts → resolve, retry | Permission errors → check perms, retry | Verification fail → rollback, return to BUILD | Rollback fails → **CRITICAL** → user intervention

---

### DOCS

**In**: APPLY succeeded + user approved code | **Out**: Task docs, MB updates | **Exit**: All docs complete

**CRITICAL**: Only enter after user approved code changes (from APPROVAL state)

**Create**:
1. Task doc: `memory-bank/tasks/YYYY-MM/DDMMDD_task-name.md`
2. Update monthly README: `memory-bank/tasks/YYYY-MM/README.md`
3. Update `projectRules.md` if new patterns
4. Update `decisions.md` if arch decisions
5. Update `toc.md` if new MB files
6. Open documentation PR (or commit if user prefers)

**Task Doc Template**:
```markdown
# YYMMDD_task-name

## Objective
[What was accomplished]

## Outcome
- ✅ Tests: 145 passing (+10 new)
- ✅ Coverage: 87.3% (+2.1%)
- ✅ Build: Successful
- ✅ Review: Approved

## Files Modified
- `file1.ext` - Added [functionality]
- `file2.ext` - Extended [service] for [scenario]
- `tests/test.ext` - Tests for [functionality]

## Patterns Applied
- `systemPatterns.md#Pattern`
- Updated `projectRules.md#ErrorHandling` (added: log at integration boundaries)

## Integration Points
- `component.ext:45` via new method
- `service.ext:120` updated for new data flow

## Architectural Decisions
- Decision: Event-driven for async updates
- Rationale: Loose coupling per `decisions.md#2025-09-01-event-driven`
- Trade-offs: Higher complexity, better scalability

## Artifacts
- PR: [link]
- Diff: [link]
```

**Monthly README Update**:
```markdown
## Tasks Completed

### 2025-10-25: [Task Name]
- Implemented [brief description]
- Files: `file1.ext`, `file2.ext`
- Pattern: Extended [existing pattern]
- See: [251025_task-name.md](./251025_task-name.md)
```

**MB Updates**:

`projectRules.md`:
```markdown
### [New Pattern]
**Context**: Discovered during [task]
**Pattern**: [description]
**Implementation**: [how to apply]
**Example**: `file.ext:line-range`
```

`decisions.md`:
```markdown
### YYYY-MM-DD: [Decision]
**Status**: Approved
**Context**: [why needed]
**Decision**: [what decided]
**Alternatives**: [other options, why not]
**Consequences**: [positive/negative outcomes]
**References**: `tasks/YYYY-MM/DDMMDD_task-name.md`
```

**Exit**: Task doc created, monthly README updated, relevant MB files updated, docs PR opened
**Failures**: Template violations → correct format | Missing references → add explicit refs | Incomplete updates → ensure all MB files updated

---

## 5. Task Contract & Budgets

### Task Contract Format

```markdown
## Task: [Clear, specific objective]

### Context
- **Repository**: [path or monorepo location]
- **Related Work**: [prior tasks, MB entries]
- **Constraints**: [arch rules, security, performance]
- **Affected Systems**: [components, services, modules]

### Expected Outcomes
- **Acceptance Criteria**:
  1. [Specific, testable criterion]
  2. [Specific, testable criterion]
- **Success Metrics**: [how to measure completion]
- **Definition of Done**: [when truly complete]

### Historical Reference
- **Prior Tasks**: [links to `tasks/YYYY-MM/DDMMDD_*.md`]
- **Arch Decisions**: [links to `decisions.md` entries]
- **Related Patterns**: [refs to `systemPatterns.md`, `projectRules.md`]

### Architectural Constraints
- **Must Follow**: [specific patterns from MB]
- **Must Extend**: [specific existing files]
- **Must Not**: [anti-patterns, approaches to avoid]
- **Security**: [specific security considerations]

### Instructions
Create outline for approval. After approval, do work. Do not document until I approve completion.
```

### Budget System

**Budget Types**:
- **Cycles**: Max BUILD → QA iterations (default: 3)
- **Tokens**: Max context tokens (default: agent-specific limits)
- **Minutes**: Max wall-clock time (default: 30 min for standard tasks)

**Tracking**:
```json
{
  "task_id": "251025_task",
  "budgets": {
    "cycles": {"allocated": 3, "consumed": 1, "remaining": 2},
    "tokens": {"allocated": 100000, "consumed": 45000, "remaining": 55000},
    "minutes": {"allocated": 30, "consumed": 12, "remaining": 18}
  },
  "status": "within_budget"
}
```

**Budget Exceeded Actions**:
- Cycles exceeded → STALL DETECTED → user intervention
- Tokens exceeded → minimal context mode or agent swap
- Minutes exceeded → present progress, request extension

**Extension**: User approval only. Request with: current progress, reason for overrun, estimated additional resources, alternatives

### Stall Detection

**Condition**: Two consecutive identical diffs (same files, same changes)

**Response**:
```markdown
## STALL DETECTED

⚠️  Two identical diffs - unable to progress

**Diagnosis**:
- Cause: [specific technical reason]
- Attempted: [what was tried]
- Blocker: [what prevents progress]

**Recommendations**:
1. More Context: Load [specific MB files/codebase areas]
2. Alternative: [different technical strategy]
3. Agent Swap: Switch to [specialized agent] for subtask

**Request**: Provide direction or choose recommendation

**Budgets**: Cycles: 3/3 ⚠️ | Tokens: 85K/100K | Minutes: 28/30 ⚠️
```

### Context Management

**Context Zones**:
1. **Core** (always): Task contract, relevant MB files, current state
2. **Task** (current task): Files being modified, direct dependencies, related tests
3. **Reference** (on-demand): Arch patterns, similar implementations, historical decisions

**Context Rotation**: After each state transition, drop Task Context, reload only what's needed for next state. Keep Core Context persistent. State is persisted to Memory Bank at every transition per **Compaction Protocol** (Section 2), so compaction recovery is automatic.

**Parallel Execution**:
```
Task decomposition:
1. [Independent A] - parallel
2. [Independent B] - parallel
3. [Dependent C] - requires A+B

Execution: Spawn parallel agents for A+B with focused context → Wait → Execute C with results
```

---

## 6. Quality & Documentation

### Absolute Prohibitions

| Prohibition | Consequence |
|-------------|-------------|
| ❌ No fake/simulated/mock data in production code | Rollback + restart |
| ❌ No stubbed functions marked complete | Rollback + restart |
| ❌ No ignoring test failures | Rollback + restart |
| ❌ No "defensive programming" (fix root cause) | Rollback + restart |
| ❌ No applying changes without approval | Rollback + restart |

Test fixtures and test mocks are acceptable. Production fake data is never acceptable.

### Code Reuse Enforcement

**Before creating any new file**:
1. Search codebase for similar functionality
2. Check `systemPatterns.md` for patterns
3. Review existing architecture for extension points
4. Document why extension impossible (if claiming so)

**Validation** (see Section 1 checklist)

### Security Review (Part of APPROVAL State)

**Checklist**:
- [ ] **Auth/Authz**: No hardcoded creds | Auth checked before sensitive ops | Authz at boundaries | Session mgmt follows patterns
- [ ] **Data Handling**: Input validation on external data | Output encoding prevents injection | Sensitive data encrypted (rest/transit if applicable)
- [ ] **Error Handling**: No sensitive data in errors | Errors logged appropriately | Graceful degradation
- [ ] **Dependencies**: No known vulnerabilities | Versions pinned | Licenses compatible

If any item fails, address before APPROVAL state.

### Linting & Code Quality

**Requirements**: Zero errors before APPROVAL | Warnings OK with justification | Follow project's linting rules

**Standards**: Language idioms | Consistent naming (from `projectRules.md`) | Single-purpose functions | Max 3-4 nesting levels | Comment complex logic only

### Testing Requirements

**Coverage**: Unit tests for all new functions | Integration tests for workflows | Edge case coverage for critical paths | Clear test names

**Quality**: Deterministic (no flaky tests) | Independent (no shared state) | Fast (optimize slow tests) | Maintainable (clear, readable)

### Documentation Standards

**Files Requiring Approval Before Creation**:
- Any `memory-bank/tasks/*/` files (task docs)
- Updates to `memory-bank/tasks/*/README.md` (monthly summaries)
- Updates to `memory-bank/decisions.md` (ADRs)
- Updates to `memory-bank/projectRules.md` (patterns)
- Any commits to version control

**Files NOT Requiring Approval**: App code, tests, config updates, operational logs

**Approval Gate Workflow**:
1. Complete code changes (BUILD → DIFF → QA)
2. Present in APPROVAL state
3. **WAIT** for user response
4. If approved: APPLY → DOCS
5. If changes requested: BUILD
6. If reverted: discard all

**Citation Formats**:
- Code: `path/file.ext:42` (single line) | `path/file.ext:42-58` (range) | `path/file.ext:functionName()` (function)
- MB: `memory-bank/systemPatterns.md#Section` | `memory-bank/decisions.md#2025-10-15-decision` | `memory-bank/tasks/2025-10/251025_task.md`
- Always include context: ✅ "Extended `services/auth.ext:45` following `systemPatterns.md#Service Extension Pattern`" | ❌ "Updated service per systemPatterns.md"

**When to Update MB**:
- ✅ Completing major features (update `progress.md`)
- ✅ Discovering new patterns (update `systemPatterns.md`, `projectRules.md`)
- ✅ Making arch decisions (update `decisions.md`)
- ✅ User explicitly requests: "update memory bank"
- ✅ Milestone completion (update monthly README)
- ❌ Minor bug fixes (task doc only)
- ❌ Code formatting (no doc needed)
- ❌ Dependency updates (task doc only)
- ❌ Routine maintenance (task doc only)

### Versioning & Rollback

**Version Management**: Do not invent release/milestone IDs. If new milestone needed, output Proposal block for user to assign ID.

**Rollback Triggers**: APPLY fails | User requests revert | Critical error | Security vulnerability

**Rollback Protocol**:
1. Identify last known good state
2. Restore all files to that state
3. Verify rollback successful
4. Log rollback in operational log
5. Report to user: reason, reverted changes, current state, recommendation

---

## 7. Example Workflow

### Task: Add Email Notification on Onboarding Complete

#### PLAN State

```markdown
## Plan: Onboarding Email

**Analyzed**:
- `services/onboarding.ext:120-150` - Current completion logic
- `services/notification.ext` - Existing notification service
- `systemPatterns.md#Event-Driven` - Event pattern
- `projectRules.md#Email Templates` - Email standards

**Reuse**:
- Extend `onboarding.ext:145` - emit "onboarding_completed" event
- Extend `notification.ext:67` - add event listener
- Add `templates/emails/onboarding_complete.template` - follow `welcome.template` pattern

Cannot create new notification service - existing service handles all notifications.

**Steps**:
1. `onboarding.ext:145` - emit event on completion
2. `notification.ext:67` - add listener for event
3. Create template following `welcome.template`
4. Add tests mirroring `tests/notification_test.ext`

**Integration**: Onboarding emits → Notification listens → Email service delivers (existing)
**Risks**: Email delivery fail → existing retry logic handles
**Tests**: Unit (event emission, listener) | Integration (e2e onboarding → email) | Manual (complete flow, verify email)

Ready for approval.
```

**User**: "approved"

---

#### BUILD State

```
Entering BUILD (substate: CODING)

Changes:
1. Modified `services/onboarding.ext:145` - added event emission
2. Extended `services/notification.ext:67` - added listener
3. Created `templates/emails/onboarding_complete.template`
4. Added `tests/notification_onboarding_test.ext`

Diff shows:
- services/onboarding.ext (+5, -1)
- services/notification.ext (+23, -0)
- templates/emails/onboarding_complete.template (+45, -0)
- tests/notification_onboarding_test.ext (+120, -0)

Ready for DIFF.
```

---

#### DIFF State

```markdown
## Proposed Changes

**Files**:
```
services/onboarding.ext                        |   5 +-
services/notification.ext                       |  23 +++
templates/emails/onboarding_complete.template  |  45 ++++
tests/notification_onboarding_test.ext         | 120 +++++++++++
4 files, 193 insertions(+), 1 deletion(-)
```

**Key Changes**:

`services/onboarding.ext`:
```diff
- // User completed onboarding
+ // User completed onboarding
+ emit_event('onboarding_completed', user_id, completion_data)
```

`services/notification.ext`:
```diff
+ function handle_onboarding_completed(user_id, data) {
+   template = load_template('onboarding_complete')
+   user = fetch_user(user_id)
+   send_email(user.email, template, data)
+ }
+ register_event_listener('onboarding_completed', handle_onboarding_completed)
```

**Rationale**: Follows `systemPatterns.md#Event-Driven Notifications` | Template matches existing structure | Tests mirror `tests/notification_welcome_test.ext`

**Integration**: No breaking changes | Event system handles async | Existing retry logic for failures

Ready for QA.
```

---

#### QA State

```markdown
Entering QA (substate: RUNNING)

## QA Results

**Tests**: ✅ PASS | Total: 156 (+11) | Passed: 156 | Failed: 0 | Duration: 18.2s
**Linter**: ✅ PASS | Errors: 0 | Warnings: 0
**Coverage**: Overall: 88.1% (+0.8%) | New code: 100% | Below threshold: None
**Build**: ✅ SUCCESS | Duration: 9.7s

**Verdict**: ✅ Ready for APPROVAL
```

---

#### APPROVAL State

```markdown
## Ready for Approval

Code changes complete. Ready for review.

**Files modified**:
- `services/onboarding.ext` (+5, -1)
- `services/notification.ext` (+23, -0)
- `templates/emails/onboarding_complete.template` (+45, -0)
- `tests/notification_onboarding_test.ext` (+120, -0)

**Git diff**: 4 files, 193 insertions(+), 1 deletion(-)

**Test Results**:
✅ 156 tests passing (+11) | ✅ Linter clean | ✅ Coverage: 88.1% (+0.8%) | ✅ Build successful

**Review Gates**:
- ✅ Tests pass
- ✅ Security reviewed (no sensitive data in emails, template escaped)
- ✅ Linter clean
- ✅ Documentation plan: Create `tasks/2025-10/251025_onboarding-email.md` + update monthly README

**Please review. Reply with**:
- "approved" | "looks good" | "document it" → APPLY
- "change X" | "fix Y" → BUILD with changes
- "revert" → Discard changes
```

**User**: "looks good"

---

#### APPLY State

```markdown
Entering APPLY

## Changes Applied

✅ All changes applied to sandbox branch
✅ 4 files modified
✅ Quick verification passed

Ready for DOCS.
```

---

#### DOCS State

```markdown
Entering DOCS

## Documentation Created

✅ Created `memory-bank/tasks/2025-10/251025_onboarding-email.md`
✅ Updated `memory-bank/tasks/2025-10/README.md`
✅ No MB pattern updates needed (used existing pattern)

Task complete.
```

---

## 8. Troubleshooting

### Decision Tree: Agent Stuck

```
Stuck? → Cycles ≥3?
           ↓ YES
         Identical diffs?
           ↓ YES → Load more MB context OR agent swap
           ↓ NO
         Different diffs?
           ↓ YES
         Same QA failure?
           ↓ YES → Environment issue OR requirement ambiguity
           ↓ NO
         Analyze failure pattern → Adjust approach
```

### Common Issues

| Issue | Symptoms | Resolution |
|-------|----------|------------|
| **Loop** | Same diff multiple times, QA fails repeatedly, no progress after 3+ cycles | Check budgets → Load more MB → Clarify requirements → Check environment → Agent swap |
| **Context Exceeded** | Token limit approaching, slow/truncated responses, forgetting earlier info | State already persisted via **Compaction Protocol** (Section 2) → Rotate context (drop Task, reload essentials) → Focused mode (MB summaries only) → Break into subtasks → Agent swap |
| **CI ≠ Local** | QA passes, CI fails | Compare environments → Verify dependency versions → Check timing/concurrency → Check state cleanup → Document waiver if CI issue |
| **Security Fail** | Security checklist incomplete, sensitive data exposed, auth/authz bypassed | Never bypass → Return to BUILD → Fix all issues → Re-test → Document pattern if new |

### Stall Detection Protocol

**Condition**: Two consecutive identical diffs

**Response**:
1. Detect: Compare current diff with previous
2. Log: Record in operational log
3. Halt: Stop all BUILD attempts
4. Report: Present diagnosis to user
5. Request: More context, alternative approach, or agent swap

### Recovery Procedures

**Full Reset** (complete breakdown):
1. Log current state
2. Discard uncommitted changes
3. Reset to last known good state
4. Start new session with fresh agent
5. Load MB in full (Standard Discovery)
6. Re-analyze with fresh perspective

**Partial Rollback** (recent regression):
1. Identify last working state
2. Rollback only problematic changes
3. Keep working changes
4. Re-test to verify stability
5. Continue from DIFF or BUILD

**Agent Swap** (capability mismatch):
1. Complete current state (clean boundary)
2. Document progress in operational log
3. Prepare focused context: task contract, relevant MB files, current work state
4. Spawn specialized agent with focused context
5. Let specialized agent complete subtask
6. Integrate results back into main workflow

---

## Quick Reference

### State Transitions

`PLAN [user approves] → BUILD → DIFF → QA [pass] → APPROVAL [user approves] → APPLY → DOCS`

Iterations on failure: `BUILD ← DIFF ← QA ← APPROVAL`
Major changes: Return to `PLAN`

### Critical Rules

1. 🚫 No new files without exhaustive reuse analysis
2. 🚫 No applying changes without user approval
3. 🚫 No documentation until code approved
4. 🚫 No fake/mock data in production
5. ✅ Always cite `file:line` for code, `file.md#Section` for MB
6. ✅ Always work in sandbox (never main)
7. ✅ Always validate reuse opportunities first

### When Stuck

1. Check cycle count (>3 = stall)
2. Check for identical diffs (stall indicator)
3. Load more MB context
4. Break into smaller subtasks
5. Request user intervention
6. Consider agent swap

### Files Never Created Without Approval

- `memory-bank/tasks/*/` (task docs)
- `memory-bank/tasks/*/README.md` (monthly summaries)
- Any commits to version control

---

**Each session starts fresh. Memory Bank is your only persistent memory. Maintain it with precision.**

**Mission**: Build software respecting existing architecture, following established patterns, improving incrementally. Reuse over creation. Quality over speed. Approval over assumption.

**Let's build smarter — together.**

你是一名 JavaScript、Rsbuild 和 Web 应用开发专家。你编写的代码应具备良好的可维护性、高性能和可访问性。

## 命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产环境应用
- `npm run preview` - 在本地预览生产构建结果

## 文档

- Rsbuild: https://rsbuild.rs/llms.txt
- Rspack: https://rspack.rs/llms.txt

## 工具

### Biome

- 运行 `npm run lint` 对代码进行静态检查
- 运行 `npm run format` 对代码进行格式化
