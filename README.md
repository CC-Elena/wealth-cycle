# 个人财务生命周期管理 (Stock)

本项目采用 `pnpm` Monorepo 构建，包含一个由 React 19 + Vite 驱动的响应式前端，以及一个由 NestJS 11 + Drizzle ORM 驱动的后端。

## 📦 项目结构

```text
stock/
├── apps/
│   ├── web/        # 前端代码，使用 React + Vite + Tailwind v4 + shadcn/ui
│   └── server/     # 后端代码，使用 NestJS + Drizzle ORM (SQLite)
├── packages/
│   └── shared/     # 前后端共享包，存放 Zod Schema 以及 TS 类型定义
├── pnpm-workspace.yaml
└── package.json    # 包含一键启动两端应用的 scripts
```

## 🚀 启动与访问

首先，在项目根目录安装所需的所有依赖：
```bash
pnpm install
```

然后，在根目录一键启动前端和后端开发服务器：
```bash
pnpm run dev
```

### 访问地址
- **前端应用 (Web)**：[http://localhost:5173](http://localhost:5173) (Vite 默认地址)
- **后端服务 (Server)**：[http://localhost:3000](http://localhost:3000) (NestJS 默认地址)
  - 目前 API 服务会在 3000 端口运行，后续如果有 OpenAPI/Swagger 配置，也会在此端口拓展，比如 `http://localhost:3000/api`。

---
