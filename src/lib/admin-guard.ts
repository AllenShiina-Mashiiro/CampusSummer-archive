import { redirect } from "next/navigation";

import { getSession } from "./auth";
import { db } from "./db";
import { can, type Capability, type UserRole } from "./permissions";

/** 读取当前登录者（含角色），未登录直接跳登录页 */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, displayName: true, role: true, bannedUntil: true },
  });
  if (!user) redirect("/login");

  return { ...user, role: user.role as UserRole };
}

/** 后台：没有 admin.access 的一律回首页 */
export async function requireAdmin() {
  const user = await requireUser();
  if (!can(user.role, "admin.access")) redirect("/");
  return user;
}

/** 需要某项具体能力；不满足时回到合适的位置 */
export async function requireCapability(capability: Capability) {
  const user = await requireUser();

  if (!can(user.role, capability)) {
    redirect(can(user.role, "admin.access") ? "/admin" : "/");
  }

  return user;
}

/** 是否处于封禁期 */
export function isBanned(user: { bannedUntil: Date | null }): boolean {
  return Boolean(user.bannedUntil && user.bannedUntil.getTime() > Date.now());
}
