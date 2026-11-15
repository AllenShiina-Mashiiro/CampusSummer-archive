// CampusSummer Archive 种子数据
// 运行：npm run db:seed（增量补齐，保留已有用户/设置/友链）
//       npm run db:seed:reset（清空后重建完整预设）
//
// 说明：
// 1. 条目内容为本项目自拟的档案样例（虚构作品），不包含任何受版权保护的美术素材；
// 2. 封面用脚本生成 SVG 海报占位，真实封面请上传到 S3 后替换 coverUrl；
// 3. 资源链接一律指向示例地址，接入真实条目时替换为官方商店 / 授权渠道链接。

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COVER_DIR = path.join(process.cwd(), "public", "covers");

const palettes = [
  ["#fda4af", "#7c3aed"],
  ["#93c5fd", "#1e40af"],
  ["#fdba74", "#be123c"],
  ["#a7f3d0", "#0f766e"],
  ["#fcd34d", "#7c2d12"],
  ["#c4b5fd", "#4338ca"],
  ["#f9a8d4", "#9d174d"],
  ["#bae6fd", "#0369a1"],
  ["#fecaca", "#991b1b"],
  ["#d9f99d", "#3f6212"],
  ["#e9d5ff", "#6b21a8"],
  ["#fed7aa", "#c2410c"],
];

function coverSvg(title, romanized, [from, to], seed) {
  // SVG 是 XML：标题里的 & < > 必须转义，否则整张图解析失败
  const esc = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const safeTitle = esc(title);
  const safeRomanized = esc(romanized);
  const r = (n) => Math.abs(Math.sin(seed * n) * 100) % 100;
  const cx1 = 120 + r(1) * 5;
  const cy1 = 90 + r(2) * 3;
  const cx2 = 520 + r(3) * 2;
  const cy2 = 320 + r(4) * 1.2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="55"/></filter>
    <linearGradient id="fade" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <g filter="url(#soft)" opacity="0.75">
    <circle cx="${cx1}" cy="${cy1}" r="150" fill="#ffffff" opacity="0.45"/>
    <circle cx="${cx2}" cy="${cy2}" r="190" fill="#ffffff" opacity="0.25"/>
    <circle cx="${700 - r(5) * 3}" cy="${80 + r(6) * 2}" r="120" fill="#ffffff" opacity="0.3"/>
  </g>
  <g stroke="#ffffff" stroke-opacity="0.18">
    <path d="M0 380 L800 300" stroke-width="1"/>
    <path d="M0 420 L800 360" stroke-width="1"/>
    <path d="M0 460 L800 420" stroke-width="1"/>
  </g>
  <rect width="800" height="500" fill="url(#fade)"/>
  <text x="48" y="408" font-family="system-ui, 'Segoe UI', sans-serif" font-size="30" font-weight="700" fill="#ffffff" opacity="0.96">${safeTitle}</text>
  <text x="48" y="446" font-family="system-ui, 'Segoe UI', sans-serif" font-size="15" letter-spacing="3" fill="#ffffff" opacity="0.7">${safeRomanized}</text>
  <text x="48" y="60" font-family="system-ui, sans-serif" font-size="12" letter-spacing="4" fill="#ffffff" opacity="0.55">CAMPUSSUMMER ARCHIVE</text>
</svg>`;
}

const games = [
  {
    slug: "semi-shigure",
    title: "蝉时雨",
    originalTitle: "蝉しぐれ",
    romanizedTitle: "SEMI SHIGURE",
    aliases: ["蝉しぐれ", "Semi Shigure"],
    summary:
      "以地方小镇的最后一个夏天为舞台，讲述三名高中生在毕业前整理旧校舍档案室时，逐渐拼凑出一段被遗忘的校园往事。作品以克制的日常叙事与细腻的环境音设计见长，是学园夏日局档案中「夏日记忆」线索的代表条目之一。",
    rating: 8.6,
    viewCount: 382000,
    releaseDate: "2024-08-14",
    platforms: ["PC"],
    languages: ["简体中文", "日本語"],
    tags: ["纯爱", "校园", "夏日", "青春", "PC", "简体中文"],
    company: "青空文库游戏部",
  },
  {
    slug: "resonance-of-summer",
    title: "盛夏残响",
    originalTitle: "盛夏の残響",
    romanizedTitle: "RESONANCE OF SUMMER",
    aliases: ["盛夏の残響", "Resonance of Summer"],
    summary:
      "围绕一支即将解散的校内乐队展开的群像剧。叙事在排练室、河堤与屋顶之间往返，用四段不同视角的短章还原同一个夏天的四种记忆版本。",
    rating: 9.1,
    viewCount: 425000,
    releaseDate: "2025-07-20",
    platforms: ["PC", "PE"],
    languages: ["简体中文", "日本語"],
    tags: ["青春", "校园", "夏日", "音乐", "PC", "PE"],
    company: "夏日制研所",
  },
  {
    slug: "haruhizaka-transfer",
    title: "春日坂的转校生",
    originalTitle: "春日坂の転校生",
    romanizedTitle: "HARUHIZAKA TRANSFER",
    aliases: ["春日坂の転校生"],
    summary:
      "转学到山间小城的第三学期，主角发现自己被安排进了一个只剩三名成员的社团。作品把「错过」处理成一种温柔的时间结构，全篇没有反派。",
    rating: 7.9,
    viewCount: 156000,
    releaseDate: "2023-03-11",
    platforms: ["PC"],
    languages: ["简体中文"],
    tags: ["纯爱", "校园", "日常", "PC", "简体中文"],
    company: "星屑社",
  },
  {
    slug: "planetarium-clubroom",
    title: "星空下的社团室",
    originalTitle: "プラネタリウム部室",
    romanizedTitle: "PLANETARIUM CLUBROOM",
    aliases: ["プラネタリウム部室"],
    summary:
      "天文社的观测记录簿串起十七个短篇，每个夜晚对应一位部员的一段独白。作品以冷色调的画面与大量留白著称，适合慢读。",
    rating: 8.8,
    viewCount: 264000,
    releaseDate: "2025-01-18",
    platforms: ["PC", "Android"],
    languages: ["简体中文", "日本語"],
    tags: ["校园", "奇幻", "日常", "PC", "Android", "简体中文"],
    company: "星屑社",
  },
  {
    slug: "sea-breeze-white-line",
    title: "海风与白线",
    originalTitle: "潮風と白線",
    romanizedTitle: "SEA BREEZE & WHITE LINE",
    aliases: ["潮風と白線"],
    summary:
      "海岸线沿线的县立高中，田径部与美术部共用一间仓库。两条成长线在夏季合宿期间交汇，作品对「坚持」的描写相当克制。",
    rating: 7.4,
    viewCount: 98000,
    releaseDate: "2022-08-02",
    platforms: ["PC"],
    languages: ["简体中文"],
    tags: ["青春", "日常", "夏日", "PC", "简体中文"],
    company: "白樺工作室",
  },
  {
    slug: "sakura-ame-shou",
    title: "樱雨抄",
    originalTitle: "桜雨抄",
    romanizedTitle: "SAKURA AME SHOU",
    aliases: ["桜雨抄", "Sakura Ame Shou"],
    summary:
      "以和歌与季节记事的结构推进的短篇集，四个春天、四段告别。文本量不大，但每章都附有一份可查阅的用语注释，适合作为档案索引的入门条目。",
    rating: 8.2,
    viewCount: 141000,
    releaseDate: "2024-04-05",
    platforms: ["PC", "PE"],
    languages: ["简体中文", "日本語"],
    tags: ["纯爱", "校园", "日常", "PC", "PE"],
    company: "雨音企画",
  },
  {
    slug: "july-fragments",
    title: "七月的记忆碎片",
    originalTitle: "七月の記憶片",
    romanizedTitle: "JULY FRAGMENTS",
    aliases: ["七月の記憶片"],
    summary:
      "非线性叙事的实验性作品：玩家每次重玩都会看到同一段暑假的不同切面。档案组为其建立了完整的版本对照表。",
    rating: 8.9,
    viewCount: 312000,
    releaseDate: "2025-07-01",
    platforms: ["PC", "Android"],
    languages: ["简体中文"],
    tags: ["奇幻", "夏日", "青春", "PC", "Android", "简体中文"],
    company: "夏日制研所",
  },
  {
    slug: "seventh-day-of-festival",
    title: "文化祭的第七天",
    originalTitle: "文化祭の七日目",
    romanizedTitle: "THE SEVENTH DAY",
    aliases: ["文化祭の七日目"],
    summary:
      "以七天为单位的群像剧，每天对应一个班级摊位的筹备进度。作品最大的特点是「可跳过」，任何一天缺席都不会破坏叙事完整性。",
    rating: 7.7,
    viewCount: 87000,
    releaseDate: "2023-10-28",
    platforms: ["PC"],
    languages: ["简体中文", "日本語"],
    tags: ["校园", "日常", "青春", "PC", "简体中文"],
    company: "青空文库游戏部",
  },
  {
    slug: "evening-train",
    title: "末班电车之后",
    originalTitle: "終電のあとで",
    romanizedTitle: "AFTER THE LAST TRAIN",
    aliases: ["終電のあとで"],
    summary:
      "全部剧情发生在一座车站的候车室里。四个陌生人、一场延误、一整夜。属于档案中「单场景叙事」专题的推荐条目。",
    rating: 8.4,
    viewCount: 203000,
    releaseDate: "2024-12-09",
    platforms: ["PC"],
    languages: ["简体中文"],
    tags: ["日常", "纯爱", "PC", "简体中文"],
    company: "白樺工作室",
  },
  {
    slug: "windchime-notation",
    title: "风铃记谱法",
    originalTitle: "風鈴の記譜法",
    romanizedTitle: "WINDCHIME NOTATION",
    aliases: ["風鈴の記譜法"],
    summary:
      "以声音为核心机制的作品，剧情推进依赖玩家对环境中细微声响的判断。档案组整理了完整的音轨索引。",
    rating: 8.0,
    viewCount: 119000,
    releaseDate: "2025-06-15",
    platforms: ["PC", "Android"],
    languages: ["简体中文", "日本語"],
    tags: ["奇幻", "夏日", "音乐", "PC", "Android", "简体中文"],
    company: "雨音企画",
  },
  {
    slug: "greenhouse-girl",
    title: "温室里的她",
    originalTitle: "温室の彼女",
    romanizedTitle: "THE GIRL IN THE GREENHOUSE",
    aliases: ["温室の彼女"],
    summary:
      "园艺部与废弃温室的故事。作品对植物季节变化的考据相当扎实，附录里甚至给出了完整的栽培日志。",
    rating: 7.6,
    viewCount: 76000,
    releaseDate: "2022-05-21",
    platforms: ["PC"],
    languages: ["简体中文"],
    tags: ["纯爱", "校园", "日常", "PC", "简体中文"],
    company: "星屑社",
  },
  {
    slug: "archive-of-that-summer",
    title: "那个夏天的档案",
    originalTitle: "あの夏のアーカイブ",
    romanizedTitle: "ARCHIVE OF THAT SUMMER",
    aliases: ["あの夏のアーカイブ"],
    summary:
      "元叙事作品：主角在整理一份「游戏档案」，而玩家看到的界面正是那份档案本身。学园夏日局的同名企划即以此为灵感来源。",
    rating: 9.3,
    viewCount: 387000,
    releaseDate: "2026-07-07",
    platforms: ["PC", "PE", "Android"],
    languages: ["简体中文", "日本語"],
    tags: ["奇幻", "夏日", "青春", "PC", "PE", "Android", "简体中文"],
    company: "夏日制研所",
  },
];

const companies = [
  {
    name: "青空文库游戏部",
    aliases: ["青空文庫ゲーム部", "Aozora Bunko Game Club"],
    website: "https://example.com/aozora-game",
    mainLanguage: "日本語",
    region: "日本",
    description:
      "以改编文学作品为主的同人社团，作品普遍篇幅不长，偏好留白与日常叙事。档案组收录其 2022 年之后的全部条目。",
  },
  {
    name: "夏日制研所",
    aliases: ["夏日製研所", "Summer Lab"],
    website: "https://example.com/summer-lab",
    mainLanguage: "简体中文",
    region: "中国大陆",
    description:
      "关注「夏天」这一母题的独立制作组，作品多以非线性结构呈现同一段记忆的不同版本。",
  },
  {
    name: "星屑社",
    aliases: ["星屑社", "Hoshikuzu Works"],
    website: "https://example.com/hoshikuzu",
    mainLanguage: "日本語",
    region: "日本",
    description: "擅长冷色调视觉与短篇群像的社团，作品数量不多但风格统一。",
  },
  {
    name: "白樺工作室",
    aliases: ["白樺スタジオ", "Shirakaba Studio"],
    website: "https://example.com/shirakaba",
    mainLanguage: "简体中文",
    region: "中国大陆",
    description: "以单场景叙事见长的独立工作室，偏好把剧情压缩在极短的时间跨度内。",
  },
  {
    name: "雨音企画",
    aliases: ["雨音企画", "Amane Project"],
    website: "https://example.com/amane",
    mainLanguage: "日本語",
    region: "日本",
    description: "以声音演出与听觉机制为核心方向的制作组，作品通常附带完整的音轨索引。",
  },
];

const docs = [
  {
    slug: "site-launch",
    title: "站点上线公告",
    category: "NOTICE",
    summary: "学园夏日局（CampusSummer Archive）正式上线，说明本站的定位、内容边界与更新节奏。",
    content: `## 关于本站

学园夏日局是一个面向游戏文化领域的**非商业档案与资料整理项目**。我们记录作品、创作脉络与社区文化，通过条目化档案、专题策展、版本与发行信息、术语索引等方式，构建可检索、可引用、可持续维护的文化档案库。

## 内容边界

- 本站**不托管、不分发**任何游戏文件，资源条目只记录元数据与指向官方 / 授权渠道的链接；
- 收录条目仅面向成年用户，涉及成人向内容的条目会标注分级提示；
- 所有条目文本为本项目自行撰写，美术素材版权归原作者所有。

## 更新节奏

公告与运营简报按月更新，条目整理按专题推进。`,
  },
  {
    slug: "monthly-report-2026-11",
    title: "2026 年 11 月整理简报",
    category: "NOTICE",
    summary: "本月新增条目、站点设置能力与档案组的分工说明。",
    content: `## 本月新增

- 新增作品条目 12 条，集中在「夏日记忆」与「单场景叙事」两个专题；
- 新增会社条目 5 条，补齐了主语言与官网信息字段；
- 标签体系新增 \`THEME\` 类别，用于横向串联叙事母题。

## 站点能力

- 站长可以在「网站设置」里维护站点名称、logo、全站背景与友情链接；
- 签到成功后会展示站长配置的奖励弹窗；
- 注册流程加入邮箱验证码与多道人机验证。

## 下月计划

1. 为全部条目补充「版本与发行信息」；
2. 开始整理术语索引（术语表第一期）；
3. 评估全文检索方案。`,
  },
  {
    slug: "user-roles",
    title: "用户角色权限说明",
    category: "GUIDE",
    summary: "普通用户、创作者、管理员与超级管理员各自的权限范围。",
    content: `## 角色一览

| 角色 | 提交条目 | 上传资源 | 审核内容 | 站点设置 |
| --- | --- | --- | --- | --- |
| 普通用户 | 否 | 否 | 否 | 否 |
| 创作者 | 是 | 是 | 否 | 否 |
| 管理员 | 是 | 是 | 是 | 否 |
| 超级管理员 | 是 | 是 | 是 | 是 |

## 如何成为创作者

在个人主页点击「申请成为创作者」，填写整理方向与过往成果，管理员会在 7 个工作日内答复。

## 站点设置

站点名称、logo、全站背景、签到弹窗、用户协议、页脚链接与友情链接仅超级管理员可以修改。

## 管理员账号

首个超级管理员通过 \`npm run db:create-admin\` 创建；公开注册永远只创建普通用户。后续管理员由现有超管在后台「用户管理」里授予角色。超级管理员可以在「网站设置」里把自己的账号绑定到管理员邮箱。`,
  },
  {
    slug: "getting-started",
    title: "帮助文档总览",
    category: "GUIDE",
    summary: "如何检索条目、理解标签体系、签到与举报。",
    content: `## 检索

- 顶栏搜索支持作品名、原名与罗马字；
- 列表页可按平台、语言、标签筛选，并按资源更新时间 / 评分 / 浏览量排序；
- 顶栏的骰子按钮会随机打开一个条目。

## 标签体系

标签分为四类：\`GENRE\`（题材）、\`PLATFORM\`（平台）、\`LANGUAGE\`（语言）、\`THEME\`（叙事母题）。主题标签用于跨题材串联，例如「夏日」「青春」。

## 签到与举报

- 每天可以在账号菜单里签到一次，获得樱花点；签到成功后会弹出站长配置的奖励提示；
- 讨论、评价与用户主页都提供「举报」入口，提交后会进入后台的举报管理流程。

## 账号

注册时「昵称」和「用户名」是分开的：昵称支持中文，会显示在主页、评论和消息里；用户名只允许字母、数字和下划线，用于登录和个人主页地址 \`/user/用户名\`。

## 引用

条目页面提供稳定的 slug，可直接作为引用标识。`,
  },
  {
    slug: "entry-guidelines",
    title: "条目收录与标注规范",
    category: "GUIDE",
    summary: "什么样的作品会被收录，字段如何填写，来源如何标注。",
    content: `## 收录标准

1. 有明确的创作主体（个人或社团）；
2. 有可查证的发行记录；
3. 内容属于游戏文化范畴的叙事作品。

## 字段规范

- **原名**：以官方公布的原始语言标题为准；
- **别名**：包含常见译名、罗马字与旧称；
- **分级**：仅标注是否全年龄，不做内容细节描述。

## 来源标注

每条资源的「提供方」字段区分 \`OFFICIAL\`（官方渠道）与 \`COMMUNITY\`（社区整理），后者必须注明整理者。`,
  },
  {
    slug: "privacy",
    title: "隐私政策",
    category: "POLICY",
    summary: "我们收集哪些数据、如何使用、如何删除；用户协议正文以网站设置里的版本为准。",
    content: `## 收集范围

- 账号信息：用户名、邮箱、密码哈希；
- 行为数据：签到记录、收藏、评论、举报；
- 技术数据：用于限流的 IP 摘要（不长期保存）。

## 使用方式

数据仅用于站点功能本身，**不出售、不共享**给第三方。注册验证码只保存加盐哈希，验证成功后立即删除。

## 删除

在「信息设置」中可随时删除账号，相关评论与收藏会一并清除。

## 用户协议

注册页展示的用户协议正文由站长在后台「网站设置」中维护；本页仅说明隐私与数据处理方式。`,
  },
  {
    slug: "about",
    title: "关于 CampusSummer Archive",
    category: "ABOUT",
    summary: "项目缘起、命名与整理原则。",
    content: `## 命名

**CampusSummer** 取「校园」与「夏日」两个意象，对应本项目最主要的叙事线索；**学园夏日局** 是中文名，其中「局」既是「结局」，也是「局面」。

## 原则

- 克制：不做主观评分推荐，只记录可查证的事实；
- 学术化：字段结构优先于叙述文采；
- 可持续：所有条目都可以被后续整理者接手。

## 技术

Next.js 16 + React 19 + PostgreSQL + Prisma + Tailwind CSS 4，图片走 S3 或本地存储，缓存走 Redis（未配置时自动降级）。`,
  },
];

/** 会社 / 标签 / 条目的 slug 规则，和站点保持一致 */
function entrySlug(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "") || "entry"
  );
}

/** 只有显式 --reset 或 SEED_RESET=1 才清空全部数据 */
const RESET = process.env.SEED_RESET === "1" || process.argv.includes("--reset");

async function resetAll() {
  console.log("重置模式：清空全部数据…");
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.directMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.media.deleteMany();
  await prisma.report.deleteMany();
  await prisma.appeal.deleteMany();
  await prisma.creatorApplication.deleteMany();
  await prisma.adminLog.deleteMany();
  await prisma.blockedTag.deleteMany();
  await prisma.blockedGame.deleteMany();
  await prisma.commentLike.deleteMany();
  await prisma.ratingLike.deleteMany();
  await prisma.resourceLike.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.friendLink.deleteMany();
  await prisma.purchaseLink.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.gameTag.deleteMany();
  await prisma.game.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.company.deleteMany();
  await prisma.doc.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED !== "1") {
    console.error(
      "✗ 这是开发用种子脚本。\n" +
        "  生产环境请改用：ADMIN_EMAIL=... ADMIN_USERNAME=... ADMIN_PASSWORD=... npm run db:create-admin\n" +
        "  确实要在生产灌入样例数据，请显式设置 ALLOW_SEED=1。",
    );
    process.exit(1);
  }

  console.log(
    RESET
      ? "模式：重置（会清空全部数据后重建）"
      : "模式：增量（保留已有用户、站点设置、友情链接与现有内容）",
  );
  if (RESET) await resetAll();

  console.log("生成封面…");
  mkdirSync(COVER_DIR, { recursive: true });
  games.forEach((game, index) => {
    const palette = palettes[index % palettes.length];
    writeFileSync(
      path.join(COVER_DIR, `${game.slug}.svg`),
      coverSvg(game.title, game.romanizedTitle, palette, index + 1),
      "utf8",
    );
  });

  console.log("创建演示用户（已存在则原样保留）…");
  // 开发样例密码；生产请用 db:create-admin 建管理员
  const seedPassword = process.env.SEED_PASSWORD ?? "campus2026";
  const passwordHash = await bcrypt.hash(seedPassword, 10);
  let createdUsers = 0;

  // 管理员邮箱与 SMTP 发信邮箱保持一致，避免本地测试时验证码邮件和管理员账号对不上
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.SMTP_USER || "admin@example.com")
    .trim()
    .toLowerCase();
  const smtpUser = (process.env.SMTP_USER || "").trim().toLowerCase();
  if (smtpUser && adminEmail && smtpUser !== adminEmail) {
    console.warn(
      `⚠ ADMIN_EMAIL（${adminEmail}）与 SMTP_USER（${smtpUser}）不一致。\n` +
        "  本地测试时请把两者设为同一个邮箱，否则注册验证码邮件会发到 SMTP_USER，" +
        "而管理员账号绑定的邮箱是 ADMIN_EMAIL。",
    );
  }

  async function ensureUser(data) {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) {
      console.log(`  保留已有用户 @${data.username}`);
      return existing;
    }

    const created = await prisma.user.create({ data: { ...data, passwordHash } });
    createdUsers += 1;
    console.log(`  创建演示用户 @${data.username}`);
    return created;
  }

  const allen = await ensureUser({
    username: "allen",
    email: adminEmail,
    displayName: "AllenShiina",
    role: "SUPER_ADMIN",
    points: 1280,
    bio: "学园夏日局的整理者之一，负责条目结构与技术实现。",
    createdAt: new Date("2025-09-01T08:00:00Z"),
  });
  const tobikin = await ensureUser({
    username: "tobikin",
    email: "tobikin@campussummer.example",
    displayName: "Tobikin",
    role: "CREATOR",
    points: 640,
    bio: "负责会社条目与版本信息整理。",
    createdAt: new Date("2025-09-12T08:00:00Z"),
  });
  const soulbelow = await ensureUser({
    username: "soulbelow",
    email: "soulbelow@campussummer.example",
    displayName: "SoulBelow",
    role: "USER",
    points: 120,
    createdAt: new Date("2026-02-03T08:00:00Z"),
  });

  console.log("创建会社（已存在则复用）…");
  const companyMap = new Map();
  for (const [companyIndex, company] of companies.entries()) {
    const slug = entrySlug(company.name) || `company-${companyIndex}`;
    const existing = await prisma.company.findFirst({
      where: { OR: [{ slug }, { name: company.name }] },
    });
    if (existing) {
      companyMap.set(company.name, existing);
      continue;
    }

    const created = await prisma.company.create({
      data: { ...company, slug },
    });
    companyMap.set(company.name, created);
  }

  console.log("创建标签（已存在则复用）…");
  const platformTags = ["PC", "PE", "Android"];
  const languageTags = ["简体中文", "日本語"];
  const tagMap = new Map();

  async function ensureTag(name, kind) {
    if (tagMap.has(name)) return tagMap.get(name);

    const slug = entrySlug(name) || `tag-${tagMap.size}`;
    const existing = await prisma.tag.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) {
      tagMap.set(name, existing);
      return existing;
    }

    const created = await prisma.tag.create({
      data: { name, kind, slug },
    });
    tagMap.set(name, created);
    return created;
  }

  for (const name of platformTags) await ensureTag(name, "PLATFORM");
  for (const name of languageTags) await ensureTag(name, "LANGUAGE");

  console.log("创建作品条目（已存在则保留）…");
  let index = 0;
  for (const game of games) {
    index += 1;
    const existingGame = await prisma.game.findUnique({
      where: { slug: game.slug },
      select: { id: true },
    });
    if (existingGame) continue;

    const { tags, company, ...rest } = game;
    const created = await prisma.game.create({
      data: {
        ...rest,
        slug: game.slug,
        coverUrl: `/covers/${game.slug}.svg`,
        screenshots: [],
        releaseDate: new Date(game.releaseDate),
        resourceUpdatedAt: new Date(
          Date.parse(game.releaseDate) + index * 86400000 * 3,
        ),
        ratingCount: Math.round(game.viewCount / 380),
        downloadCount: Math.round(game.viewCount / 12),
        favoriteCount: Math.round(game.viewCount / 60),
        isSfw: true,
        companyId: companyMap.get(company)?.id ?? null,
        creatorId: index % 3 === 0 ? tobikin.id : allen.id,
        tags: {
          create: await (async () => {
            const writes = [];
            for (const name of tags) {
              const kind = platformTags.includes(name)
                ? "PLATFORM"
                : languageTags.includes(name)
                  ? "LANGUAGE"
                  : ["夏日", "青春"].includes(name)
                    ? "THEME"
                    : "GENRE";
              const tag = await ensureTag(name, kind);
              writes.push({ tag: { connect: { id: tag.id } } });
            }
            return writes;
          })(),
        },
      },
    });

    await prisma.resource.createMany({
      data: [
        {
          gameId: created.id,
          title: `${created.title} · 官方商店页面`,
          type: "GAME",
          provider: "OFFICIAL",
          url: `https://example.com/store/${created.slug}`,
          format: "商店链接",
          note: "官方发行渠道，价格与版本以商店页面为准。",
          likeCount: 40 + index * 3,
          downloadCount: 120 + index * 11,
          authorId: allen.id,
        },
        {
          gameId: created.id,
          title: `${created.title} · 汉化与术语对照说明`,
          type: "PATCH",
          provider: "COMMUNITY",
          url: `https://example.com/notes/${created.slug}`,
          format: "说明文档",
          note: "仅记录术语对照与排版规范，不提供文件本体。",
          likeCount: 12 + index,
          downloadCount: 30 + index * 4,
          authorId: tobikin.id,
        },
      ],
    });

    await prisma.comment.create({
      data: {
        gameId: created.id,
        userId: tobikin.id,
        content: `已补充《${created.title}》的版本对照信息，欢迎在条目讨论区补充遗漏。`,
        likeCount: 3 + (index % 5),
      },
    });

    await prisma.rating.create({
      data: { gameId: created.id, userId: soulbelow.id, score: Math.round(game.rating) },
    });
  }

  console.log("补齐演示内容（购买链接、收藏、点赞、通知、私信、媒体、日志）…");
  const demoGames = await prisma.game.findMany({
    where: { slug: { in: games.map((game) => game.slug) } },
    select: { id: true, slug: true, title: true },
  });
  const gameBySlug = new Map(demoGames.map((game) => [game.slug, game]));
  const demoGameIds = demoGames.map((game) => game.id);
  const demoUserIds = [allen.id, tobikin.id, soulbelow.id];

  // 支持正版：每个种子条目补一个官方商店链接
  for (const game of demoGames) {
    const existing = await prisma.purchaseLink.findFirst({
      where: { gameId: game.id },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.purchaseLink.create({
      data: {
        gameId: game.id,
        label: "官方商店",
        url: `https://example.com/store/${game.slug}`,
        note: "官方发行渠道，价格与版本以商店页面为准。",
      },
    });
  }

  // 收藏夹
  for (const entry of [
    { userId: allen.id, slugs: ["semi-shigure", "resonance-of-summer"] },
    { userId: tobikin.id, slugs: ["planetarium-clubroom"] },
  ]) {
    for (const slug of entry.slugs) {
      const game = gameBySlug.get(slug);
      if (!game) continue;
      await prisma.collection.upsert({
        where: { gameId_userId: { gameId: game.id, userId: entry.userId } },
        update: {},
        create: { gameId: game.id, userId: entry.userId },
      });
    }
  }

  // 点赞：让点赞表与页面显示的数量一致，而不是只写冗余的 likeCount
  const demoComments = await prisma.comment.findMany({
    where: { gameId: { in: demoGameIds } },
    select: { id: true, userId: true },
  });
  for (const comment of demoComments) {
    for (const userId of demoUserIds.filter((id) => id !== comment.userId)) {
      await prisma.commentLike.upsert({
        where: { commentId_userId: { commentId: comment.id, userId } },
        update: {},
        create: { commentId: comment.id, userId },
      });
    }
    const count = await prisma.commentLike.count({ where: { commentId: comment.id } });
    await prisma.comment.update({ where: { id: comment.id }, data: { likeCount: count } });
  }

  const demoRatings = await prisma.rating.findMany({
    where: { gameId: { in: demoGameIds } },
    select: { id: true, userId: true },
  });
  for (const rating of demoRatings) {
    for (const userId of demoUserIds.filter((id) => id !== rating.userId)) {
      await prisma.ratingLike.upsert({
        where: { ratingId_userId: { ratingId: rating.id, userId } },
        update: {},
        create: { ratingId: rating.id, userId },
      });
    }
  }

  const demoResources = await prisma.resource.findMany({
    where: { gameId: { in: demoGameIds } },
    select: { id: true, authorId: true },
  });
  for (const resource of demoResources) {
    for (const userId of demoUserIds.filter((id) => id !== resource.authorId)) {
      await prisma.resourceLike.upsert({
        where: { resourceId_userId: { resourceId: resource.id, userId } },
        update: {},
        create: { resourceId: resource.id, userId },
      });
    }
    const count = await prisma.resourceLike.count({ where: { resourceId: resource.id } });
    await prisma.resource.update({ where: { id: resource.id }, data: { likeCount: count } });
  }

  // 消息中心：铃铛与 /message 读取的是 Notification 表
  const demoNotifications = [
    {
      userId: allen.id,
      type: "SYSTEM",
      title: "欢迎回来",
      body: "本周新增 12 条作品条目，3 条文档等待校对。",
      href: "/galgame",
      read: true,
    },
    {
      userId: allen.id,
      type: "FOLLOW",
      title: "Tobikin 关注了你",
      body: "你们可以互相查看整理进度。",
      href: "/user/tobikin",
      actorId: tobikin.id,
      read: false,
    },
    {
      userId: allen.id,
      type: "DOC",
      title: "文档更新：站点上线公告",
      body: "站点定位、内容边界与更新节奏。",
      href: "/docs/site-launch",
      actorId: allen.id,
      read: false,
    },
    {
      userId: tobikin.id,
      type: "SYSTEM",
      title: "欢迎加入学园夏日局",
      body: "你可以在这里整理会社条目和版本信息。",
      href: "/docs/getting-started",
      read: true,
    },
    {
      userId: soulbelow.id,
      type: "SYSTEM",
      title: "欢迎加入学园夏日局",
      body: "签到、收藏与讨论都会记录在你的主页。",
      href: "/docs/getting-started",
      read: true,
    },
  ];
  for (const item of demoNotifications) {
    const existing = await prisma.notification.findFirst({
      where: { userId: item.userId, title: item.title },
      select: { id: true },
    });
    if (!existing) await prisma.notification.create({ data: item });
  }

  // 私信：给 allen 和 tobikin 建一个已接受的示例会话
  let conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { aId: allen.id, bId: tobikin.id },
        { aId: tobikin.id, bId: allen.id },
      ],
    },
    select: { id: true },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        aId: allen.id,
        bId: tobikin.id,
        status: "ACCEPTED",
        lastMessageAt: new Date(),
      },
      select: { id: true },
    });
  }

  const directMessageCount = await prisma.directMessage.count({
    where: { conversationId: conversation.id },
  });
  if (directMessageCount === 0) {
    for (const message of [
      {
        senderId: tobikin.id,
        body: "版本对照表已经更新，麻烦你看一下条目里的补丁说明。",
        read: true,
      },
      { senderId: allen.id, body: "收到，我晚点核对后同步到资源页。", read: true },
      { senderId: tobikin.id, body: "好的，有遗漏直接在这里说。", read: false },
    ]) {
      await prisma.directMessage.create({
        data: { conversationId: conversation.id, ...message },
      });
    }
  }

  // 媒体库：把生成的封面登记为媒体资源，后台媒体库不再空白
  for (const game of demoGames) {
    const file = path.join(COVER_DIR, `${game.slug}.svg`);
    const buffer = readFileSync(file);
    const hash = createHash("sha256").update(buffer).digest("hex");
    await prisma.media.upsert({
      where: { hash },
      update: {},
      create: {
        hash,
        key: `covers/${game.slug}.svg`,
        url: `/covers/${game.slug}.svg`,
        filename: `${game.slug}.svg`,
        mimeType: "image/svg+xml",
        size: statSync(file).size,
        uploadedById: allen.id,
      },
    });
  }

  // 管理日志：演示日志页有内容可看
  const logCount = await prisma.adminLog.count();
  if (logCount === 0) {
    await prisma.adminLog.createMany({
      data: [
        {
          level: "INFO",
          source: "seed",
          message: "初始化演示数据：12 个条目、5 个会社、7 篇文档",
        },
        { level: "INFO", source: "seed", message: "管理员邮箱已按 ADMIN_EMAIL 绑定" },
      ],
    });
  }

  console.log("创建文档（已存在则保留）…");
  let docIndex = 0;
  for (const doc of docs) {
    docIndex += 1;
    const existingDoc = await prisma.doc.findUnique({
      where: { slug: doc.slug },
      select: { id: true },
    });
    if (existingDoc) continue;

    // 让文档列表的「更新于」呈现真实的时间梯度，而不是全部堆在同一天
    const updatedAt = new Date(Date.now() - docIndex * 11 * 86400000);
    const createdAt = new Date(updatedAt.getTime() - 6 * 86400000);

    await prisma.doc.create({
      data: {
        ...doc,
        category: doc.category,
        wordCount: doc.content.replace(/\s|#|\||-|`/g, "").length,
        authorId: allen.id,
        published: true,
        createdAt,
        updatedAt,
      },
    });
  }

  console.log("补齐站点设置（已存在的值不覆盖）…");
  const siteSettings = {
    siteName: "学园夏日局",
    adminEmail,
    logoUrl: "",
    heroTitle: "一站式游戏文化档案库",
    heroDescription: "非商业的作品与创作脉络整理项目，条目化收录作品、会社、版本与术语。",
    backgroundUrl: "",
    backgroundOverlay: "15",
    bannerUrl: "/covers/banner.svg",
    activityLeft: "公告与更新",
    activityRight: "档案组的最新动态",
    checkinImageUrl: "/covers/banner.svg",
    checkinTitle: "今日签到成功",
    checkinText: "获得 10 樱花点，明天再来可以继续累积。",
    agreement: `欢迎使用 学园夏日局（CampusSummer Archive）。

一、服务说明
本站是面向游戏文化领域的非商业档案与资料整理项目，提供条目化资料、社区讨论与资源链接索引。本站不托管、不分发任何游戏文件，资源条目只记录元数据与指向官方或授权渠道的链接。

二、账号与行为规范
1. 注册时请提供真实可用的邮箱，并妥善保管账号密码；
2. 不得发布广告、人身攻击、违法违规或侵犯他人权益的内容；
3. 不得利用本站从事任何破坏性、自动化或商业性抓取行为。

三、内容与版权
条目文本由本站整理者撰写，美术素材与作品版权归原作者及权利方所有。如权利人认为内容侵犯其权益，可通过页脚联系方式与我们联系，我们会及时处理。

四、隐私与数据
我们仅收集维持站点功能所必需的数据：账号信息、签到与互动记录。数据不会出售或共享给第三方。你可以在个人设置中修改资料或申请删除账号。

五、免责声明
本站内容仅供学习与交流参考，不构成任何购买或游玩建议。因使用第三方链接产生的风险由使用者自行承担。

继续注册即表示你已阅读并同意上述条款。`,
    githubUrl: "",
    telegramUrl: "",
    contactText: "",
  };
  await prisma.siteSetting.createMany({
    data: Object.entries(siteSettings).map(([key, value]) => ({ key, value })),
    skipDuplicates: true,
  });

  // 友情链接默认留空：旧版写死的示例友链已删除，由站长在后台按需添加。
  console.log("友情链接：保留现有数据（新库为 0 条）");

  console.log("补齐演示消息与关注关系…");
  const welcome = await prisma.message.findFirst({
    where: { userId: allen.id, title: "欢迎回来" },
    select: { id: true },
  });
  if (!welcome) {
    await prisma.message.create({
      data: {
        userId: allen.id,
        type: "SYSTEM",
        title: "欢迎回来",
        body: "本周新增 12 条作品条目，3 条文档等待校对。",
        href: "/galgame",
      },
    });
  }

  const followMessage = await prisma.message.findFirst({
    where: { userId: allen.id, title: "Tobikin 关注了你" },
    select: { id: true },
  });
  if (!followMessage) {
    await prisma.message.create({
      data: {
        userId: allen.id,
        type: "FOLLOW",
        title: "Tobikin 关注了你",
        body: "你们可以互相查看整理进度。",
        href: "/user/tobikin",
      },
    });
  }

  await prisma.follow.createMany({
    data: [
      { followerId: tobikin.id, followingId: allen.id },
      { followerId: soulbelow.id, followingId: allen.id },
    ],
    skipDuplicates: true,
  });

  if (createdUsers > 0) {
    console.log(
      `演示账号密码：${seedPassword}（仅本地开发；生产请用 npm run db:create-admin 创建管理员）`,
    );
  }

  const [userCount, companyCount, gameCount, docCount, settingCount, friendCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.game.count(),
      prisma.doc.count(),
      prisma.siteSetting.count(),
      prisma.friendLink.count(),
    ]);

  console.log(
    `完成：用户 ${userCount} / 会社 ${companyCount} / 条目 ${gameCount} / 文档 ${docCount} / 站点设置 ${settingCount} / 友情链接 ${friendCount}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
