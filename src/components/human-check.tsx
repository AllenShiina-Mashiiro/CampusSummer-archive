"use client";

import { useState } from "react";

/**
 * 人机验证：勾选「我是真人」+ 服务端签发的两道随机题目。
 * 答案与签名一起提交，由 /api/auth/register 在服务端校验。
 */
export function HumanCheck({
  name = "human",
  challenge,
}: {
  name?: string;
  challenge?: { token: string; questions: { prompt: string }[] };
}) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="space-y-2.5">
      <label
        className={
          checked
            ? "flex cursor-pointer items-center gap-3 rounded-xl border border-primary/50 bg-primary-soft px-4 py-3 transition-colors"
            : "flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-subtle px-4 py-3 transition-colors hover:border-primary/30"
        }
      >
        <span
          className={
            checked
              ? "flex h-5 w-5 items-center justify-center rounded-md bg-primary text-white"
              : "flex h-5 w-5 items-center justify-center rounded-md border border-line bg-surface"
          }
        >
          {checked && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="m20 6-11 11-5-5"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>

        <span className="text-[14.5px] text-ink">我是真人</span>

        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          className="sr-only"
        />
      </label>

      {challenge && (
        <div className="rounded-xl border border-line bg-subtle px-4 py-3">
          <p className="text-[13px] font-medium text-ink-soft">再完成两道验证题</p>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {challenge.questions.map((question, index) => (
              <label key={question.prompt} className="block">
                <span className="text-[13px] text-muted">{question.prompt}</span>
                <input
                  name={`humanAnswer${index}`}
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-primary/50"
                />
              </label>
            ))}
          </div>
          <input type="hidden" name="humanToken" value={challenge.token} />
        </div>
      )}
    </div>
  );
}
