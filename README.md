# CampusSummer Archive

游戏作品资料档案站。以 TouchGal 的信息架构与卡片式资料浏览体验为视觉参考，独立实现站点布局与交互。

## 技术栈

- Next.js 15 / React 19 / TypeScript
- PostgreSQL 18 + Prisma 6
- Redis（可选缓存）
- S3 兼容对象存储（封面与静态媒体，配置后启用）
- Tailwind CSS 4 + 全局 CSS

## 本地开发

需要 Node.js 20.9+、npm 10+ 和可连接的 PostgreSQL 实例。

```powershell
npm install
```

复制 `.env.example` 为 `.env`，并填写本机数据库账号密码。Redis 和 S3 暂时可以不配置；启用时再填写对应环境变量。

```powershell
npm run db:generate
npm run db:push
npm run dev
```

访问 http://localhost:3000。

## 页面

- `/` 首页与最新收录
- `/games` 游戏档案、搜索与标签/会社筛选
- `/games/[slug]` 游戏详情
- `/companies` 游戏会社索引
- `/tags` 游戏标签索引
- `/docs` 说明文档
- `/about` 关于我们
- `/api/games` 游戏列表 API
- `/api/health` 应用、数据库与 Redis 状态

旧的 `/articles` 和 `/archive` 地址会转到说明文档。

## 数据模型

Prisma 的 `Game` 模型目前使用 `developer`、`publisher` 字段生成会社索引，使用 `tags` 数组生成标签索引。公开页面只展示 `PUBLISHED` 状态的记录。

## S3 环境变量

`S3_ENDPOINT`、`S3_REGION`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`、`S3_BUCKET`、`S3_FORCE_PATH_STYLE` 和 `S3_PUBLIC_URL`。当前已加入 S3 客户端初始化层，具体上传接口可在确定对象存储服务商后接入。

## 安全

不要提交真实的 `.env`、数据库密码或 S3 密钥。Redis 仅作为缓存，不作为权威业务数据存储。
