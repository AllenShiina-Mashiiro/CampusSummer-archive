# 🌸 CampusSummer Archive / 学园夏日局

面向游戏文化领域的非商业档案与资料整理站，记录作品、会社、标签、资料文档与社区内容。

## ✨ 功能概览

- 📚 作品档案：作品信息、封面、截图、发行日期、平台、语言、标签与会社
- 🏢 会社与标签：会社资料、别名，以及题材/平台/语言/主题标签
- 📄 文档中心：公告、指南、政策与关于页面，支持 Markdown
- 🔎 搜索与筛选：关键词、标签、平台、语言和排序
- 👤 账号系统：注册、邮箱验证码、登录、个人资料与签到
- 💬 社区互动：评论、评分、点赞、收藏、关注、提及与私信
- 🛡️ 内容管理：举报、申诉、封禁、创作者申请与管理后台
- 🖼️ 媒体库：本地上传或 S3 兼容对象存储，支持内容哈希去重

## 🧰 技术栈

- Next.js 16 / React 19
- TypeScript
- PostgreSQL + Prisma 6
- Tailwind CSS 4
- Redis（可选）
- S3 兼容对象存储（可选）

## 🗄️ 数据库原则

**本项目只使用 PostgreSQL，不使用 JSON 文件或本地 JSON 数据库。**

- 本地开发：连接你已经安装并运行的 PostgreSQL。
- 线上部署：连接独立的 PostgreSQL 服务，可使用云数据库或自建 PostgreSQL。
- `psql` 只用于连接 PostgreSQL、创建数据库和执行 SQL；它不是数据库服务本身。
- 仓库不再提供自动安装、启动或管理 PostgreSQL 的 PowerShell 脚本。
- `npm run db:push` 负责将 Prisma Schema 同步到已配置的 PostgreSQL，不会替你启动数据库。

## 📋 环境要求

| 项目 | 要求 |
| --- | --- |
| Node.js | 20.9 或更高版本 |
| npm | 随 Node.js 安装 |
| PostgreSQL | 14 或更高版本 |
| Redis | 可选；未配置时使用进程内缓存 |
| SMTP | 注册验证码与邮件功能需要 |
| S3 | 可选；未配置时使用本地上传目录 |

## 🚀 本地正式启动流程

### 1. 安装 PostgreSQL 并创建数据库

先在本机安装 PostgreSQL，并确保 PostgreSQL 服务已经启动。然后使用 `psql` 连接数据库：

```bash
psql -U postgres -h 127.0.0.1 -p 5432
```

在 psql 提示符中执行：

```sql
CREATE USER campussummer WITH PASSWORD '请替换为自己的数据库密码';
CREATE DATABASE campussummer OWNER campussummer;
\q
```

如果你已经有可用的 PostgreSQL 用户和数据库，可以直接使用现有配置，不必重复创建。

### 2. 获取项目并安装依赖

```bash
git clone https://github.com/AllenShiina-Mashiiro/CampusSummer-archive.git
cd CampusSummer-archive
npm install
```

### 3. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env
```

编辑 `.env`，至少填写：

```env
DATABASE_URL="postgresql://campussummer:你的数据库密码@127.0.0.1:5432/campussummer?schema=public"
AUTH_SECRET="替换为随机生成的长密钥"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

生成随机密钥可使用：

```bash
openssl rand -base64 32
```

注册验证码需要配置 SMTP：

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="465"
SMTP_USER="your@example.com"
SMTP_PASS="邮箱服务商提供的授权码"
SMTP_FROM="CampusSummer Archive <your@example.com>"
```

### 4. 同步数据库结构

确认 PostgreSQL 已启动且 `DATABASE_URL` 正确后执行：

```bash
npm run db:push
```

该命令使用 Prisma Schema 创建或更新数据表。**不要在已有重要数据的数据库上随意执行破坏性重置操作。**

### 5. （可选）导入演示数据

仅在全新开发数据库中执行：

```bash
npm run db:seed
```

`npm run db:seed:reset` 会清空现有数据并重建演示数据，具有破坏性；不要在生产数据库执行。

### 6. 启动开发服务器

```bash
npm run dev
```

浏览器打开：

- http://localhost:3000

## 🏗️ 生产部署

线上环境同样必须连接 PostgreSQL。可以部署在 VPS、Docker 容器平台、Node.js 托管平台或支持 Next.js 的云平台；数据库建议使用独立的 PostgreSQL 服务，不要把数据库数据放进应用容器的临时文件系统。

### 标准 Node.js 部署

在部署环境配置好生产环境变量、PostgreSQL 和必要的 SMTP / 对象存储参数后：

```bash
npm ci
npm run db:push
npm run build
npm run start
```

生产环境至少需要配置：

- `DATABASE_URL`：生产 PostgreSQL 连接串
- `AUTH_SECRET`：独立且随机的强密钥
- `NEXT_PUBLIC_SITE_URL`：正式网站 URL
- `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`：需要开放注册/邮件时配置
- `REDIS_URL`：多实例部署建议配置共享 Redis
- `S3_*`：多实例或容器部署建议配置共享对象存储，避免本地上传文件只存在于单个实例

部署平台应将应用进程保持运行，并通过 HTTPS 反向代理对外提供服务。不要在每次启动应用时执行演示数据重置。

### 管理员初始化

生产环境不要运行演示数据 Seed。先完成数据库结构同步，再通过一次性 CLI 命令创建管理员：

Linux / macOS：

```bash
ADMIN_USERNAME="admin" \
ADMIN_EMAIL="you@example.com" \
ADMIN_DISPLAY_NAME="站长" \
ADMIN_PASSWORD="至少10位且同时包含字母和数字" \
npm run db:create-admin
```

Windows PowerShell：

```powershell
$env:ADMIN_USERNAME = "admin"
$env:ADMIN_EMAIL = "you@example.com"
$env:ADMIN_DISPLAY_NAME = "站长"
$env:ADMIN_PASSWORD = "至少10位且同时包含字母和数字"
npm run db:create-admin
```

默认创建 `SUPER_ADMIN`。公开注册始终只创建普通用户。账号已存在时命令会停止，只有明确追加 `-- --force` 才会重置密码与角色；请谨慎使用。

## 📦 常用命令

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | ESLint 检查 |
| `npm run typecheck` | TypeScript 类型检查 |
| `npm run db:push` | 同步 Prisma Schema 到 PostgreSQL |
| `npm run db:seed` | 增量导入演示数据 |
| `npm run db:seed:reset` | 清空并重建演示数据（危险） |
| `npm run db:create-admin` | 创建管理员 |
| `npm run db:studio` | 打开 Prisma Studio |

## 🔐 安全与备份

- 不要提交 `.env`、数据库密码、SMTP 授权码或 S3 密钥。
- 生产环境使用独立的 `AUTH_SECRET`，并启用 HTTPS。
- 定期备份 PostgreSQL；对象存储中的图片与附件也需要单独备份。
- 多实例部署不要依赖单实例本地文件上传目录或进程内限流/缓存。
- 不要在生产环境执行 `db:seed:reset`，也不要将演示账号密码用于正式站点。

## 🚧 当前状态与限制

- 项目版本：`0.1.0`，仍在持续开发。
- 部分管理模块及 AI / OIDC 相关入口仍为占位功能。
- 暂无完整自动化端到端测试；上线前应手动验证注册、登录、上传、互动与后台权限流程。
- 正式公开运营前，请检查并替换演示文案、隐私政策、用户协议及其他法律页面。
- 项目尚未提供完整的容器编排文件；如需 Docker 部署，应自行配置应用镜像、持久化上传/对象存储、环境变量与外部 PostgreSQL。

## 📄 Credits

界面设计方向参考 [KunMoe/kun-touchgal-next](https://github.com/KunMoe/kun-touchgal-next)（GPL-3.0）；本项目代码与数据模型独立实现。请在公开部署前确认所有图片、美术素材与文字内容均拥有合法使用权限。
