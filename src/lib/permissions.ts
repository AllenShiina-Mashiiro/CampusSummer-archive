/**
 * 权限矩阵（单一事实来源）。
 *
 * 角色：
 * - USER        普通用户：下载、讨论、评价、个人设置
 * - CREATOR     创作者：+ 发布 / 管理自己的游戏与资源
 * - MODERATOR   管理员：+ 审核创作者、处置举报与账号
 * - ADMIN       管理员（与 MODERATOR 同级，兼容历史数据）
 * - SUPER_ADMIN 超级管理员：+ 升降权、站点设置、日志、邮件群发
 */

export const USER_ROLES = ["USER", "CREATOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export type Capability =
  | "admin.access" // 能看到后台
  | "creator.center" // 创作中心
  | "game.publish" // 发布游戏
  | "resource.manage" // 管理资源 / 补丁
  | "content.moderate" // 删除、撤回讨论与评价
  | "report.handle" // 处理举报
  | "appeal.handle" // 处理申诉
  | "creator.review" // 审核创作者申请
  | "user.moderate" // 封禁 / 删号
  | "role.manage" // 升权 / 降权
  | "site.settings" // 网站设置
  | "logs.view" // 管理日志
  | "mail.send"; // 邮件群发

const CAPABILITIES: Record<Capability, readonly UserRole[]> = {
  "admin.access": ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
  "creator.center": ["CREATOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"],
  "game.publish": ["CREATOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"],
  "resource.manage": ["CREATOR", "MODERATOR", "ADMIN", "SUPER_ADMIN"],
  "content.moderate": ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
  "report.handle": ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
  "appeal.handle": ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
  "creator.review": ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
  "user.moderate": ["MODERATOR", "ADMIN", "SUPER_ADMIN"],
  "role.manage": ["SUPER_ADMIN"],
  "site.settings": ["SUPER_ADMIN"],
  "logs.view": ["SUPER_ADMIN"],
  "mail.send": ["SUPER_ADMIN"],
};

export function can(role: UserRole | null | undefined, capability: Capability): boolean {
  if (!role) return false;
  return CAPABILITIES[capability].includes(role);
}

/** 管理员的账号不可被普通管理员处置 */
export function canModerateUser(actor: UserRole | null | undefined, targetRole: UserRole): boolean {
  if (!can(actor, "user.moderate")) return false;
  if (targetRole === "SUPER_ADMIN") return false;
  if (actor === "SUPER_ADMIN") return true;
  // 管理员只能处置普通用户与创作者
  return targetRole === "USER" || targetRole === "CREATOR";
}

export const ROLE_LABEL: Record<UserRole, string> = {
  USER: "用户",
  CREATOR: "创作者",
  MODERATOR: "管理员",
  ADMIN: "管理员",
  SUPER_ADMIN: "超级管理员",
};

export function normalizeRole(value: unknown): UserRole {
  return USER_ROLES.includes(value as UserRole) ? (value as UserRole) : "USER";
}
