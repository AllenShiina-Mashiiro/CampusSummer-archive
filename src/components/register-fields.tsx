"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AgreementButton } from "@/components/agreement-dialog";
import { HumanCheck } from "@/components/human-check";
import {
  NICKNAME_MAX,
  USERNAME_MAX,
  USERNAME_PATTERN,
  USERNAME_RULE_TEXT,
} from "@/lib/user-fields";

const ERROR_TEXT: Record<string, string> = {
  human: "请先勾选「我是真人」",
  "human-answer": "人机验证答案不正确，请重新填写",
  nickname: "请填写昵称",
  "nickname-long": `昵称最长 ${NICKNAME_MAX} 个字符`,
  username: "请填写用户名",
  "username-long": `用户名最长 ${USERNAME_MAX} 个字符`,
  "username-format": USERNAME_RULE_TEXT,
  email: "请填写正确的邮箱",
  password: "密码长度至少 6 位，且需包含数字和英文字母",
  agree: "请先同意用户协议",
  code: "请填写邮箱验证码",
  "code-invalid": "验证码不正确或已过期，请重新获取",
  "username-taken": "这个用户名已经被占用了",
  "email-taken": "这个邮箱已经注册过了",
  closed: "站点当前已关闭注册，请联系管理员开通账号",
};

const DOMAINS = ["@qq.com", "@163.com", "@gmail.com", "@outlook.com", "@foxmail.com"];

export function RegisterFields({
  error,
  siteName,
  agreement,
  challenge,
}: {
  error?: string;
  siteName: string;
  agreement: string;
  challenge: { token: string; questions: { prompt: string }[] };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function sendCode() {
    const form = formRef.current;
    if (!form) return;

    const local = (form.elements.namedItem("emailLocal") as HTMLInputElement | null)?.value.trim();
    const domain = (form.elements.namedItem("emailDomain") as HTMLSelectElement | null)?.value;

    if (!local || !/^[\w.+-]+$/.test(local)) {
      setNotice({ tone: "error", text: "请先填写正确的邮箱前缀" });
      return;
    }

    setSending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `${local}${domain}` }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };

      if (data.ok) {
        setCooldown(60);
        setNotice({ tone: "ok", text: "验证码已发送，请检查邮箱（含垃圾邮件箱）" });
      } else if (data.error === "too-soon") {
        setNotice({ tone: "error", text: "发送太频繁，请稍后再试" });
      } else if (data.error === "smtp" || data.error === "send") {
        setNotice({ tone: "error", text: "邮件服务暂时不可用，请联系站长" });
      } else if (data.error === "rate-limit") {
        setNotice({ tone: "error", text: "请求过于频繁，请稍后再试" });
      } else {
        setNotice({ tone: "error", text: "邮箱格式不正确" });
      }
    } catch {
      setNotice({ tone: "error", text: "发送失败，请检查网络" });
    } finally {
      setSending(false);
    }
  }

  return (
    <form ref={formRef} action="/api/auth/register" method="post" className="mt-6 space-y-3">
      <input
        name="nickname"
        required
        maxLength={NICKNAME_MAX}
        placeholder="昵称 *（支持中文）"
        autoComplete="nickname"
        className="w-full rounded-xl border border-line bg-subtle px-4 py-3 text-[14.5px] text-ink outline-none placeholder:text-faint focus:border-primary/50 focus:bg-surface"
      />

      <input
        name="username"
        required
        maxLength={USERNAME_MAX}
        pattern={USERNAME_PATTERN.source}
        placeholder="用户名 *（字母 / 数字 / 下划线）"
        autoComplete="username"
        className="w-full rounded-xl border border-line bg-subtle px-4 py-3 text-[14.5px] text-ink outline-none placeholder:text-faint focus:border-primary/50 focus:bg-surface"
      />
      <p className="-mt-1 text-[12px] leading-relaxed text-faint">
        用户名用于登录和个人主页地址，只能包含字母、数字和下划线；昵称可以随意填写。
      </p>

      <div className="flex gap-2.5">
        <input
          name="emailLocal"
          required
          placeholder="邮箱 *"
          type="text"
          autoComplete="email"
          className="min-w-0 flex-1 rounded-xl border border-line bg-subtle px-4 py-3 text-[14.5px] text-ink outline-none placeholder:text-faint focus:border-primary/50 focus:bg-surface"
        />
        <select
          name="emailDomain"
          defaultValue="@qq.com"
          className="w-[120px] shrink-0 rounded-xl border border-line bg-subtle px-3 py-3 text-[14.5px] text-ink outline-none focus:border-primary/50"
        >
          {DOMAINS.map((domain) => (
            <option key={domain} value={domain}>
              {domain}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-line bg-subtle px-4 py-3">
        <input
          name="code"
          required
          inputMode="numeric"
          placeholder="邮箱验证码 *"
          autoComplete="one-time-code"
          className="min-w-0 flex-1 bg-transparent text-[14.5px] text-ink outline-none placeholder:text-faint"
        />
        <button
          type="button"
          onClick={sendCode}
          disabled={sending || cooldown > 0}
          className="shrink-0 text-[13.5px] font-medium text-primary-strong transition-opacity hover:opacity-80 disabled:text-faint"
        >
          {sending ? "发送中…" : cooldown > 0 ? `${cooldown} 秒后重发` : "发送验证码"}
        </button>
      </div>

      <input
        name="password"
        type="password"
        required
        minLength={6}
        placeholder="密码 *（至少 6 位，含数字和字母）"
        autoComplete="new-password"
        className="w-full rounded-xl border border-line bg-subtle px-4 py-3 text-[14.5px] text-ink outline-none placeholder:text-faint focus:border-primary/50 focus:bg-surface"
      />

      <HumanCheck challenge={challenge} />

      <div className="flex items-start gap-2 text-[13.5px] text-ink-soft">
        <input
          id="agree"
          type="checkbox"
          name="agree"
          required
          className="mt-0.5 h-4 w-4 rounded border-line accent-primary"
        />
        <div>
          <label htmlFor="agree">我同意</label>{" "}
          <AgreementButton siteName={siteName} content={agreement} />
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className={
            notice.tone === "ok"
              ? "rounded-lg bg-mint-soft px-3 py-2 text-[13.5px] text-mint"
              : "rounded-lg bg-rose-soft px-3 py-2 text-[13.5px] text-rose"
          }
        >
          {notice.text}
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-[13.5px] text-rose">
          {ERROR_TEXT[error] ?? "注册失败，请重试"}
        </p>
      )}

      <button
        type="submit"
        className="w-full rounded-xl bg-primary py-3 text-[14.5px] font-medium text-white transition-colors hover:bg-primary-strong"
      >
        注册
      </button>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-line" />
        <span className="text-[13px] text-faint">或</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Link
        href="/login"
        className="block w-full rounded-xl border border-primary/40 py-3 text-center text-[14.5px] font-medium text-primary-strong transition-colors hover:bg-primary-soft"
      >
        登录
      </Link>

      <p className="pt-1 text-[13px] text-faint">
        忘记密码？{" "}
        <Link href="/docs/contact" className="text-primary-strong hover:underline">
          重置密码
        </Link>
      </p>
    </form>
  );
}
