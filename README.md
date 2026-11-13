# CampusSummer Archive｜学园夏日局

一个关于游戏、青春与创作的数字档案馆。第一阶段提供清新夏日学园风的响应式网站框架，并预留游戏资料、文化文章与档案收藏的数据层。

## 技术栈

- Next.js 15 / React 19 / TypeScript
- PostgreSQL 18 + Prisma 6
- Redis 7（缓存层，按需启用）
- Tailwind CSS 4（基础样式通过 CSS variables 与全局样式管理）

## 本地开发

### 1. 环境要求

Node.js 20.9+、npm 10+，以及可连接的 PostgreSQL 18 实例。Redis 仅在启用缓存功能时需要。

### 2. 安装依赖并配置环境变量

```bash
npm install
cp .env.example .env
```

根据你自己的 PostgreSQL 实例修改 `.env` 中的 `DATABASE_URL`。如果启用 Redis，也请配置对应的 `REDIS_URL`。

### 3. 初始化 Prisma

```bash
npm run db:generate
npm run db:push
```

### 4. 启动网站

```bash
npm run dev
```

访问 http://localhost:3000。健康检查接口：`GET /api/health`。

## 当前页面

- `/` 首页与栏目入口
- `/games` 游戏档案（内容模块占位）
- `/articles` 文化手记（内容模块占位）
- `/archive` 资料收藏（内容模块占位）
- `/about` 项目介绍
- `/api/health` 应用、数据库与 Redis 状态

## 数据模型

Prisma schema 当前包含：
- `Game`：游戏条目、平台、标签、发行信息与发布状态
- `Article`：专题文章、分类、作者与发布时间
- `ArchiveEntry`：外部资料与档案索引

## 下一阶段建议

1. 接入数据库读取，制作游戏列表、详情页与筛选。
2. 增加文章详情、搜索与分页。
3. 增加用户认证、投稿与后台内容管理。
4. 根据实际访问量决定 Redis 缓存策略。

## 安全提示

不要提交真实的 `.env`、数据库密码或生产环境密钥。Redis 在此阶段仅作为可选缓存依赖，不存放权威业务数据。
