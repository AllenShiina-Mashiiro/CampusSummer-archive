import { updateCompanyAction } from "@/app/companies/company-actions";
import { fieldClass } from "@/components/settings-card";
import { getSession } from "@/lib/auth";
import { can } from "@/lib/permissions";

/** 会社资料编辑器：仅创作者及以上可见 */
export async function CompanyEditor({
  slug,
  values,
}: {
  slug: string;
  values: Record<string, string>;
}) {
  const session = await getSession();
  if (!session || !can(session.role, "game.publish")) return null;

  return (
    <details className="mt-4 rounded-xl border border-line bg-surface p-4">
      <summary className="cursor-pointer text-[14px] font-medium text-ink">编辑会社资料</summary>

      <form action={updateCompanyAction} className="mt-3 space-y-3">
        <input type="hidden" name="slug" value={slug} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13px] text-muted">名称</span>
            <input name="name" defaultValue={values.name} required className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-[13px] text-muted">别名（逗号或空格分隔）</span>
            <input name="aliases" defaultValue={values.aliases} className={fieldClass} />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13px] text-muted">官网</span>
            <input name="website" defaultValue={values.website} placeholder="https://" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-[13px] text-muted">主语言</span>
            <input name="mainLanguage" defaultValue={values.mainLanguage} placeholder="日本語" className={fieldClass} />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[13px] text-muted">地区</span>
            <input name="region" defaultValue={values.region} placeholder="日本" className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-[13px] text-muted">简介</span>
            <input name="description" defaultValue={values.description} className={fieldClass} />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-primary-strong"
          >
            保存会社资料
          </button>
        </div>
      </form>
    </details>
  );
}
