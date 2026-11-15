import { cacheLife, cacheTag } from "next/cache";

import { db } from "./db";
import { SITE } from "./site";

/**
 * 站点设置：所有「站长可改」的内容都集中在这里。
 *
 * 数据库只存被保存过的键，读取时与默认值合并，因此新增设置项不需要迁移旧数据。
 * 管理员保存后通过 updateTag("settings") 立即让前台缓存失效。
 */

export const DEFAULT_AGREEMENT = `欢迎使用 ${SITE.name}（${SITE.latinName}）。

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

继续注册即表示你已阅读并同意上述条款。`;

export const SITE_SETTING_DEFAULTS = {
  siteName: SITE.name,
  /**
   * 管理员邮箱绑定目标：只用于把当前超级管理员账号绑定到这个邮箱。
   * 公开注册不会因为邮箱相同自动获得管理员权限；首个超管请用 db:create-admin 创建。
   */
  adminEmail: "",
  logoUrl: "",
  /** 首页左上角介绍卡的主标题与说明文字 */
  heroTitle: "一站式游戏文化档案库",
  heroDescription: "非商业的作品与创作脉络整理项目，条目化收录作品、会社、版本与术语。",
  /** 全站固定背景图 */
  backgroundUrl: "",
  /** 背景遮罩强度：0 = 完全透明，90 = 几乎遮住；默认 15，尽量保留背景原色 */
  backgroundOverlay: "15",
  /** 首页右侧活动卡默认背景图 */
  bannerUrl: "/covers/banner.svg",
  activityLeft: "公告与更新",
  activityRight: "档案组的最新动态",
  /** 签到成功后的弹窗：图片、标题、正文都由站长在网站设置里填写 */
  checkinImageUrl: "/covers/banner.svg",
  checkinTitle: "今日签到成功",
  checkinText: "获得 10 樱花点，明天再来可以继续累积。",
  agreement: DEFAULT_AGREEMENT,
  /** 页脚外链：留空则不显示 */
  githubUrl: "",
  telegramUrl: "",
  /** 页脚「联系我们」：纯文本展示，不做成按钮 */
  contactText: "",
} as const;

export type SiteSettings = Record<string, string>;

/** 读取站点设置（前台用），带缓存与标签，后台保存后失效 */
export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");

  const rows = await db.siteSetting.findMany();
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return { ...SITE_SETTING_DEFAULTS, ...stored };
}

export async function getSiteName(): Promise<string> {
  const settings = await getSiteSettings();
  return settings.siteName?.trim() || SITE.name;
}
