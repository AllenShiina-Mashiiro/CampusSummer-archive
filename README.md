# Campus Archive

以游戏作品资料整理为核心的独立档案网站。

## 技术栈

- Next.js 15、React 19、TypeScript
- PostgreSQL 18、Prisma 6
- Redis（可选缓存）
- S3 兼容对象存储（封面与媒体资源）
- Tailwind CSS 4

## 本地开发

需要 Node.js 20.9+、npm 10+ 和可连接的 PostgreSQL 实例。

```powershell
npm install
Copy-Item .env.example .env
```

编辑 `.env`，填写本机 PostgreSQL 连接信息。之后运行：

```powershell
npm run db:generate
npm run db:push
npm run dev
```

访问 http://localhost:3000。

## 主要栏目

- `/` 首页与目录入口
- `/games` 游戏档案、搜索与标签筛选
- `/games/[slug]` 游戏详情
- `/companies` 游戏会社索引
- `/tags` 游戏标签索引
- `/docs` 说明文档
- `/about` 关于我们
- `/api/health` 应用、数据库与 Redis 状态

## 数据模型

现有 `Game` 模型包含作品标题、简介、封面 URL、发行日期、制作会社、发行会社、平台、标签与发布状态。会社和标签索引从已发布作品的数据中自动汇总，不需要重复维护独立清单。

## 图片存储

可选配置 S3 兼容存储。未配置时网站仍可运行，封面显示默认占位图。不要将真实密钥提交到 Git。

## 说明

当前版本先完成目录、列表、搜索、筛选和详情展示。投稿、管理后台、用户系统与复杂审核流程属于后续阶段。
