import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "登录",
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  empty: "请填写账号和密码",
  invalid: "账号或密码不正确",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
      {/* 登录页整块做成一张玻璃卡：标题和「立即注册」也压在同一层实色上 */}
      <div className="glass-panel rounded-[20px] p-5 sm:p-6">
        <div className="text-center">
          <h1 className="text-[24px] font-semibold tracking-tight text-ink sm:text-[25px]">
            登录 {SITE.name}
          </h1>
          <p className="mt-2 text-[13.5px] text-muted sm:text-[14px]">整理条目、参与讨论、记录签到</p>
        </div>

        <div className="mt-6">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-subtle" />}>
            <LoginForm searchParams={searchParams} />
          </Suspense>
        </div>

        <p className="mt-4 text-center text-[13px] text-muted">
          还没有账号？
          <Link href="/register" className="ml-1 text-primary-strong hover:underline">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}

async function LoginForm({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = (await searchParams) ?? {};
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const error = read("error");
  const next = read("next") ?? "/";

  return (
    <form action="/api/auth/login" method="post" className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="identifier" className="mb-1.5 block text-[14px] font-medium text-ink">
          邮箱或用户名
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          required
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14.5px] text-ink outline-none transition-colors focus:border-primary/50"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[14px] font-medium text-ink">
          密码
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[14.5px] text-ink outline-none transition-colors focus:border-primary/50"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-[13.5px] text-rose">
          {ERRORS[error] ?? "登录失败，请重试"}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-primary py-2.5 text-[14.5px] font-medium text-white transition-colors hover:bg-primary-strong"
      >
        登录
      </button>

      <p className="text-center text-[13px] text-faint">
        <Link href="/" className="transition-colors hover:text-primary-strong">
          ← 返回站点
        </Link>
      </p>
    </form>
  );
}
