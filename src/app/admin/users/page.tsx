import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { banUserAction, setUserRoleAction } from "@/app/admin/game-actions";
import { AdminTable, Td, Th } from "@/components/admin/admin-placeholder";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { ROLE_LABEL, USER_ROLES } from "@/lib/permissions";
import { formatDate } from "@/lib/site";

export const metadata: Metadata = { title: "用户管理", robots: { index: false } };

const SORTS = {
  new: { label: "注册时间（新→旧）", order: { createdAt: "desc" as const } },
  old: { label: "注册时间（旧→新）", order: { createdAt: "asc" as const } },
  points: { label: "积分最多", order: { points: "desc" as const } },
  name: { label: "昵称 A→Z", order: { displayName: "asc" as const } },
};

const ERRORS: Record<string, string> = {
  self: "不能对自己执行该操作",
  super: "超级管理员不能被封禁或改动",
  missing: "用户不存在",
};

/**
 * 角色下拉只列四层：普通 / 创作者 / 管理员 / 超级管理员。
 * MODERATOR 是历史遗留值，显示归入「管理员」，重新保存时会写成 ADMIN。
 */
const ROLE_OPTIONS = [
  { value: "USER", label: "普通用户" },
  { value: "CREATOR", label: "创作者" },
  { value: "ADMIN", label: "管理员" },
  { value: "SUPER_ADMIN", label: "超级管理员" },
] as const;

function normalizeForSelect(role: string): string {
  return role === "MODERATOR" ? "ADMIN" : role;
}

export default function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">用户管理</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        检索用户、调整角色、手动封禁或解封；封禁会向该用户发送站内通知。
      </p>

      <Suspense fallback={<div className="mt-5 h-64 animate-pulse rounded-2xl bg-subtle" />}>
        <UsersTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function UsersTable({ searchParams }: { searchParams: PageProps<"/admin/users">["searchParams"] }) {
  await connection();
  const actor = await requireCapability("user.moderate");

  const params = (await searchParams) ?? {};
  const read = (key: string) => {
    const value = Array.isArray(params[key]) ? params[key][0] : params[key];
    return typeof value === "string" ? value : "";
  };

  const query = read("q").trim();
  const rawSort = read("sort");
  const sortKey = (rawSort in SORTS ? rawSort : "new") as keyof typeof SORTS;
  const error = read("error");
  const ok = read("ok");

  const users = await db.user.findMany({
    where: query
      ? {
          OR: [
            { username: { contains: query, mode: "insensitive" } },
            { displayName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: SORTS[sortKey].order,
    take: 100,
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
      points: true,
      bannedUntil: true,
      banReason: true,
      createdAt: true,
      _count: { select: { comments: true, resources: true } },
    },
  });

  return (
    <>
      {error && (
        <p className="mt-4 rounded-xl bg-rose-soft px-4 py-2.5 text-[14px] text-rose">
          {ERRORS[error] ?? "操作失败"}
        </p>
      )}
      {ok === "ban" && (
        <p className="mt-4 rounded-xl bg-mint-soft px-4 py-2.5 text-[14px] text-mint">
          封禁状态已更新
        </p>
      )}

      <form className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5">
        <input
          name="q"
          defaultValue={query}
          placeholder="搜索昵称 / 用户名 / 邮箱"
          className="min-w-[200px] flex-1 rounded-lg border border-line bg-canvas px-3 py-1.5 text-[13.5px] text-ink outline-none placeholder:text-faint focus:border-primary/40"
        />
        <select
          name="sort"
          defaultValue={sortKey}
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-[13.5px] text-ink-soft"
        >
          {Object.entries(SORTS).map(([value, item]) => (
            <option key={value} value={value}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-primary px-3 py-1.5 text-[13.5px] font-medium text-white transition-colors hover:bg-primary-strong"
        >
          检索
        </button>
        {(query || sortKey !== "new") && (
          <a href="/admin/users" className="text-[13px] text-muted hover:text-ink">
            清除
          </a>
        )}
        <span className="ml-auto text-[13px] text-faint">共 {users.length} 个账号</span>
      </form>

      <div className="mt-3">
        <AdminTable
          head={
            <>
              <Th>用户</Th>
              <Th>邮箱</Th>
              <Th>角色</Th>
              <Th>封禁状态</Th>
              <Th>积分</Th>
              <Th>注册时间</Th>
              <Th>封禁 / 解封</Th>
            </>
          }
          empty={users.length === 0}
        >
          {users.map((user) => {
            const banned = Boolean(user.bannedUntil && user.bannedUntil.getTime() > Date.now());
            const self = user.id === actor.id;

            return (
              <tr key={user.id}>
                <Td>
                  <span className="font-medium text-ink">{user.displayName}</span>
                  <span className="ml-1.5 text-[13px] text-faint">@{user.username}</span>
                  {self && <span className="ml-1.5 text-[12px] text-faint">（你自己）</span>}
                </Td>
                <Td>{user.email}</Td>
                <Td>
                  {self ? (
                    <span className="rounded-md bg-subtle px-1.5 py-0.5 text-[12.5px] text-ink-soft">
                      {ROLE_LABEL[user.role as keyof typeof ROLE_LABEL] ?? user.role}
                    </span>
                  ) : (
                    <form action={setUserRoleAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={normalizeForSelect(user.role)}
                        className="rounded-lg border border-line bg-surface px-1.5 py-1 text-[12.5px] text-ink-soft"
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg border border-line px-1.5 py-1 text-[12.5px] text-muted transition-colors hover:border-primary/40 hover:text-primary-strong"
                      >
                        改
                      </button>
                    </form>
                  )}
                </Td>
                <Td>
                  {banned ? (
                    <span className="text-rose">封禁至 {formatDate(user.bannedUntil as Date)}</span>
                  ) : (
                    <span className="text-muted">正常</span>
                  )}
                </Td>
                <Td>{user.points}</Td>
                <Td>{formatDate(user.createdAt)}</Td>
                <Td>
                  {self || user.role === "SUPER_ADMIN" ? (
                    <span className="text-[12.5px] text-faint">不可操作</span>
                  ) : banned ? (
                    <form action={banUserAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <input type="hidden" name="days" value="0" />
                      <ConfirmSubmitButton
                        label="解封"
                        title={`解除 @${user.username} 的封禁？`}
                        description="解封后该用户可立即恢复讨论与评价权限，并会收到站内通知。"
                        confirmText="确认解封"
                        tone="primary"
                      />
                    </form>
                  ) : (
                    <form action={banUserAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="days"
                        defaultValue="1"
                        className="rounded-lg border border-line bg-surface px-1.5 py-1 text-[12.5px] text-ink-soft"
                      >
                        <option value="1">1 天</option>
                        <option value="2">2 天</option>
                        <option value="5">5 天</option>
                        <option value="10">10 天</option>
                      </select>
                      <input
                        name="reason"
                        placeholder="原因"
                        className="w-24 rounded-lg border border-line bg-surface px-1.5 py-1 text-[12.5px] text-ink"
                      />
                      <ConfirmSubmitButton
                        label="封禁"
                        title={`封禁 @${user.username}？`}
                        description="封禁期间无法发表讨论与评价；用户会收到站内通知，可通过「设置 → 我的申诉」申诉。"
                        confirmText="确认封禁"
                      />
                    </form>
                  )}
                </Td>
              </tr>
            );
          })}
        </AdminTable>
      </div>
    </>
  );
}
