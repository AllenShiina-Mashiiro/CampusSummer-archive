import { saveGameAction } from "@/app/admin/game-actions";
import { ImagePicker } from "@/components/admin/image-picker";
import { ScreenshotUploader } from "@/components/admin/screenshot-uploader";
import { fieldClass } from "@/components/settings-card";

const PLATFORMS = ["PC", "PE", "Android", "iOS"];
const LANGUAGES = ["简体中文", "繁體中文", "日本語", "English"];

export type GameFormValues = {
  id?: string;
  title?: string;
  originalTitle?: string | null;
  romanizedTitle?: string | null;
  slug?: string;
  summary?: string;
  coverUrl?: string | null;
  screenshots?: string[];
  platforms?: string[];
  languages?: string[];
  isSfw?: boolean;
  companyName?: string | null;
  releaseDate?: string | null;
  tags?: string;
};

const ERRORS: Record<string, string> = {
  title: "标题不能为空",
  save: "保存失败，请查看服务端日志",
  resource: "资源标题和链接都是必填",
  missing: "条目不存在，可能已被删除",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13.5px] font-medium text-ink">{label}</span>
      {hint && <span className="ml-1 text-[12.5px] text-faint">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export function GameForm({
  values,
  companies,
  error,
}: {
  values: GameFormValues;
  companies: { id: string; name: string }[];
  error?: string;
}) {
  const editing = Boolean(values.id);

  return (
    <form action={saveGameAction} className="space-y-4">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      {error && (
        <p role="alert" className="rounded-xl bg-rose-soft px-4 py-2.5 text-[14px] text-rose">
          {ERRORS[error] ?? "操作失败，请重试"}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
          <Field label="标题" hint="必填">
            <input name="title" defaultValue={values.title} required className={fieldClass} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="原名">
              <input name="originalTitle" defaultValue={values.originalTitle ?? ""} className={fieldClass} />
            </Field>
            <Field label="罗马字">
              <input name="romanizedTitle" defaultValue={values.romanizedTitle ?? ""} className={fieldClass} />
            </Field>
          </div>

          <Field label="slug" hint="留空则按标题生成，发布后不建议修改">
            <input name="slug" defaultValue={values.slug} className={fieldClass} />
          </Field>

          <Field label="简介">
            <textarea name="summary" rows={6} defaultValue={values.summary ?? ""} className={`${fieldClass} resize-y`} />
          </Field>

          <ImagePicker
            name="coverUrl"
            label="封面"
            hint="可上传，也可直接填地址"
            defaultValue={values.coverUrl}
            aspect="aspect-[16/10]"
          />

          <ScreenshotUploader defaultValue={values.screenshots} />
        </section>

        <aside className="space-y-4">
          <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
            <Field label="开发会社" hint="直接输入名称，不存在会自动创建；留空为未指定">
              <input
                name="companyName"
                defaultValue={values.companyName ?? ""}
                list="company-options"
                placeholder="例如：夏日制研所"
                className={fieldClass}
              />
              <datalist id="company-options">
                {companies.map((company) => (
                  <option key={company.id} value={company.name} />
                ))}
              </datalist>
            </Field>

            <Field label="发行日期">
              <input type="date" name="releaseDate" defaultValue={values.releaseDate ?? ""} className={fieldClass} />
            </Field>

            <Field label="标签" hint="用逗号或空格分隔">
              <input name="tags" defaultValue={values.tags} placeholder="夏日, 青春, 校园" className={fieldClass} />
            </Field>

            <div>
              <span className="text-[13.5px] font-medium text-ink">平台</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {PLATFORMS.map((platform) => (
                  <label
                    key={platform}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-subtle px-2.5 py-1.5 text-[13.5px] text-ink-soft"
                  >
                    <input
                      type="checkbox"
                      name="platforms"
                      value={platform}
                      defaultChecked={values.platforms?.includes(platform)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    {platform}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[13.5px] font-medium text-ink">语言</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {LANGUAGES.map((language) => (
                  <label
                    key={language}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-subtle px-2.5 py-1.5 text-[13.5px] text-ink-soft"
                  >
                    <input
                      type="checkbox"
                      name="languages"
                      value={language}
                      defaultChecked={values.languages?.includes(language)}
                      className="h-3.5 w-3.5 accent-primary"
                    />
                    {language}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-[13.5px] text-ink-soft">
              <input type="checkbox" name="isSfw" defaultChecked={values.isSfw ?? true} className="h-4 w-4 accent-primary" />
              全年龄条目（SFW）
            </label>
          </section>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
            >
              {editing ? "保存修改" : "创建条目"}
            </button>
            <a
              href="/admin/games"
              className="rounded-xl border border-line px-4 py-2.5 text-[14px] text-ink-soft transition-colors hover:text-ink"
            >
              取消
            </a>
          </div>
        </aside>
      </div>
    </form>
  );
}
