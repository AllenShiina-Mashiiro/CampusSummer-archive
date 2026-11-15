import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { RegisterFields } from "@/components/register-fields";
import { createHumanChallenge } from "@/lib/human-challenge";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "注册",
  robots: { index: false },
};

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col px-6 py-12">
      <div className="rounded-2xl border border-line bg-surface p-7">
        <div className="flex items-center justify-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet to-primary text-[12px] font-semibold text-white">
            ⁂
          </span>
          <span className="text-[16px] font-semibold text-ink">{settings.siteName}</span>
        </div>

        <h1 className="mt-5 text-center text-[28px] font-semibold tracking-tight text-ink">
          注册
        </h1>

        <Suspense fallback={<div className="mt-7 h-80 animate-pulse rounded-xl bg-subtle" />}>
          <RegisterForm searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function RegisterForm({
  searchParams,
}: {
  searchParams: PageProps<"/register">["searchParams"];
}) {
  // 人机题目每次请求都要重新生成，显式声明为运行时渲染
  await connection();

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : undefined;
  const [settings, challenge] = await Promise.all([getSiteSettings(), createHumanChallenge()]);

  return (
    <RegisterFields
      error={error}
      siteName={settings.siteName}
      agreement={settings.agreement}
      challenge={challenge}
    />
  );
}
