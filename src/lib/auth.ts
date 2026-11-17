import { createHmac, timingSafeEqual } from "node:crypto";

import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";

import { db } from "./db";
import { env } from "./env";
import { normalizeRole, type UserRole } from "./permissions";

export const SESSION_COOKIE = "csa_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export type SessionUser = {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
};

export type CurrentUser = SessionUser & {
  avatarUrl: string | null;
  points: number;
};

function secretKey(): Uint8Array {
  return new TextEncoder().encode(env.authSecret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
}

/** 生成会话 JWT。Route Handler 需要自己把 Cookie 写到响应上时用这个 */
export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * 纯 HMAC 验签，不碰时间。
 *
 * 为什么不用 jose 的 jwtVerify：它内部会用 new Date() 计算当前时间去校验 exp/nbf，
 * 而 Next 16 在预渲染 / revalidatePath 触发的重渲染阶段会把 `new Date()` 判为
 * unstable value 并抛错（表现为删除条目时报 Blocking Route）。
 *
 * 签名完整性与伪造防护完全一致；过期由 Cookie 的 maxAge（浏览器侧）
 * 和 proxy 里的完整校验（请求时执行）共同保证。
 */
function verifySessionToken(token: string): Record<string, unknown> | null {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;

  const expected = createHmac("sha256", env.authSecret).update(`${header}.${payload}`).digest();
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return null;

    const claims = decoded as Record<string, unknown>;
    // Cookie 的 maxAge 只是浏览器端限制；服务端必须独立验证 JWT 时效，
    // 否则被复制的旧 Cookie 可在浏览器过期后继续访问 API。
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== "number" || !Number.isFinite(claims.exp) || now >= claims.exp) {
      return null;
    }
    if (typeof claims.nbf === "number" && now < claims.nbf) return null;
    if (typeof claims.sub !== "string" || !claims.sub) return null;
    return claims;
  } catch {
    return null;
  }
}

/** 只验签，不查库；用于顶栏这类高频读取 */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;
  if (typeof payload.sub !== "string" || typeof payload.username !== "string") return null;

  return {
    id: payload.sub,
    username: payload.username,
    displayName:
      typeof payload.displayName === "string" ? payload.displayName : payload.username,
    role: normalizeRole(payload.role),
  };
});

/** 需要积分、头像等完整资料时再查一次库 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, username: true, displayName: true, avatarUrl: true, points: true, role: true },
  });
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    points: user.points,
    role: normalizeRole(user.role),
  };
});

export async function authenticate(identifier: string, password: string): Promise<SessionUser | null> {
  const key = identifier.trim().toLowerCase();
  const user = await db.user.findFirst({
    where: {
      OR: [{ email: key }, { username: identifier.trim() }],
    },
    select: { id: true, username: true, displayName: true, passwordHash: true, role: true },
  });

  if (!user) {
    // 账号不存在也走一次哈希比较，避免用响应时间探测账号是否存在
    await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali");
    return null;
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: normalizeRole(user.role),
  };
}
