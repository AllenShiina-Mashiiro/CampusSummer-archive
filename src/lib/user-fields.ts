/**
 * 账号字段规则（注册、资料设置、后台建号共用）。
 *
 * 昵称 displayName 与用户名 username 是两个字段：
 * - 昵称：展示用，可以包含中文、空格等；
 * - 用户名：登录名与 /user/[username] 地址，只允许字母、数字、下划线。
 */

export const USERNAME_MAX = 17;
export const NICKNAME_MAX = 24;

export const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;

export const USERNAME_RULE_TEXT = "用户名只能包含字母、数字和下划线";

/** 去掉控制字符并压缩连续空白，避免昵称里出现换行或不可见字符 */
export function normalizeNickname(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
