import type { Metadata } from "next";
import { Suspense } from "react";

import {
  bindAdminEmail,
  deleteFriendLink,
  saveFriendLink,
  saveSiteSettings,
} from "@/app/admin/settings-actions";
import { ImagePicker } from "@/components/admin/image-picker";
import { fieldClass } from "@/components/settings-card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import { requireCapability } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";

export const metadata: Metadata = { title: "网站设置", robots: { index: false } };

export default function AdminSettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  return (
    <div>
      <h1 className="text-[23px] font-semibold tracking-tight text-ink">网站设置</h1>
      <p className="mt-1.5 text-[14px] text-muted">
        站点名称、logo、全站背景、签到弹窗、用户协议、页脚联系方式与友情链接；保存后前台立即生效。
      </p>

      <Suspense fallback={<div className="mt-5 h-80 animate-pulse rounded-2xl bg-subtle" />}>
        <SettingsForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SettingsForm({
  searchParams,
}: {
  searchParams: PageProps<"/admin/settings">["searchParams"];
}) {
  const actor = await requireCapability("site.settings");

  const params = (await searchParams) ?? {};
  const settings = await getSiteSettings();
  const [friends, admins] = await Promise.all([
    db.friendLink.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    db.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
      orderBy: { createdAt: "asc" },
      select: { username: true, email: true, displayName: true, role: true },
    }),
  ]);

  return (
    <>
      {params.ok && (
        <p className="mt-4 rounded-xl bg-mint-soft px-4 py-2.5 text-[14px] text-mint">
          {params.ok === "admin-bound" ? "管理员邮箱已绑定到当前账号" : "已保存"}
        </p>
      )}
      {params.error === "friend" && (
        <p className="mt-4 rounded-xl bg-rose-soft px-4 py-2.5 text-[14px] text-rose">
          友情链接的标题和跳转链接不能为空。
        </p>
      )}
      {params.error === "admin-email" && (
        <p className="mt-4 rounded-xl bg-rose-soft px-4 py-2.5 text-[14px] text-rose">
          管理员邮箱格式不正确。
        </p>
      )}
      {params.error === "admin-password" && (
        <p className="mt-4 rounded-xl bg-rose-soft px-4 py-2.5 text-[14px] text-rose">
          当前账号密码不正确，未能绑定。
        </p>
      )}
      {params.error === "admin-email-taken" && (
        <p className="mt-4 rounded-xl bg-rose-soft px-4 py-2.5 text-[14px] text-rose">
          该邮箱已经被其他账号使用，请换一个邮箱。
        </p>
      )}

      <form action={saveSiteSettings} className="mt-5 space-y-4">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-[16px] font-semibold text-ink">站点信息</h2>
          <p className="mt-1 text-[13px] text-muted">显示在顶栏、页脚、浏览器标题与首页介绍卡里。</p>

          <label className="mt-4 block">
            <span className="text-[13.5px] font-medium text-ink">站点名称</span>
            <input name="siteName" defaultValue={settings.siteName} className={`${fieldClass} mt-1.5`} />
          </label>

          <label className="mt-3 block">
            <span className="text-[13.5px] font-medium text-ink">管理员邮箱（绑定当前超管）</span>
            <input
              name="adminEmail"
              type="email"
              defaultValue={settings.adminEmail}
              placeholder="admin@example.com"
              className={`${fieldClass} mt-1.5`}
            />
            <span className="mt-1.5 block text-[12.5px] leading-relaxed text-faint">
              只用于把当前超级管理员账号绑定到这个邮箱。公开注册不会因为邮箱相同自动获得管理员权限；首个超管请用
              <code className="mx-1 rounded bg-subtle px-1">npm run db:create-admin</code>
              创建，之后在「用户管理」里给其他账号授权。
            </span>
          </label>

          <label className="mt-3 block">
            <span className="text-[13.5px] font-medium text-ink">首页主标题</span>
            <input
              name="heroTitle"
              defaultValue={settings.heroTitle}
              placeholder="一站式游戏文化档案库"
              className={`${fieldClass} mt-1.5`}
            />
          </label>

          <label className="mt-3 block">
            <span className="text-[13.5px] font-medium text-ink">首页说明文字</span>
            <textarea
              name="heroDescription"
              rows={3}
              defaultValue={settings.heroDescription}
              placeholder="显示在首页左上角介绍卡里的说明"
              className={`${fieldClass} mt-1.5 resize-y`}
            />
          </label>

          <div className="mt-4">
            <ImagePicker
              name="logoUrl"
              label="导航 logo"
              hint="留空则使用内置星芒图形"
              defaultValue={settings.logoUrl}
              aspect="aspect-square"
            />
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <ImagePicker
              name="backgroundUrl"
              label="网站背景图"
              hint="全站固定背景，建议使用浅色或低对比图片"
              defaultValue={settings.backgroundUrl}
            />

            <label className="mt-4 block max-w-xs">
              <span className="text-[13.5px] font-medium text-ink">背景遮罩强度（0-90）</span>
              <input
                type="number"
                name="backgroundOverlay"
                min={0}
                max={90}
                step={5}
                defaultValue={settings.backgroundOverlay}
                className={`${fieldClass} mt-1.5`}
              />
              <span className="mt-1.5 block text-[12.5px] leading-relaxed text-faint">
                默认 15；想让背景图更清楚填 0-20，想优先保证文字对比填 40-70。
              </span>
            </label>
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <ImagePicker
              name="bannerUrl"
              label="首页横幅 / 活动卡默认图"
              hint="活动没有单独封面时使用"
              defaultValue={settings.bannerUrl}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[13.5px] font-medium text-ink">活动板左侧文案</span>
              <input
                name="activityLeft"
                defaultValue={settings.activityLeft}
                className={`${fieldClass} mt-1.5`}
              />
            </label>
            <label className="block">
              <span className="text-[13.5px] font-medium text-ink">活动板右侧说明</span>
              <input
                name="activityRight"
                defaultValue={settings.activityRight}
                className={`${fieldClass} mt-1.5`}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-[16px] font-semibold text-ink">签到奖励弹窗</h2>
          <p className="mt-1 text-[13px] text-muted">
            用户签到成功后弹出。图片由站长上传，标题与正文可以自由填写。
          </p>

          <div className="mt-4">
            <ImagePicker
              name="checkinImageUrl"
              label="弹窗图片"
              hint="建议 16:9，留空则不显示图片"
              defaultValue={settings.checkinImageUrl}
            />
          </div>

          <label className="mt-4 block">
            <span className="text-[13.5px] font-medium text-ink">弹窗标题</span>
            <input
              name="checkinTitle"
              defaultValue={settings.checkinTitle}
              className={`${fieldClass} mt-1.5`}
            />
          </label>

          <label className="mt-3 block">
            <span className="text-[13.5px] font-medium text-ink">弹窗正文</span>
            <textarea
              name="checkinText"
              rows={3}
              defaultValue={settings.checkinText}
              className={`${fieldClass} mt-1.5 resize-y`}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-[16px] font-semibold text-ink">用户协议</h2>
          <p className="mt-1 text-[13px] text-muted">
            注册页的「用户协议」会直接展示这里填写的内容，不再依赖帮助文档。
          </p>
          <textarea
            name="agreement"
            rows={14}
            defaultValue={settings.agreement}
            className={`${fieldClass} mt-3 resize-y font-mono text-[13px] leading-relaxed`}
          />
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-[16px] font-semibold text-ink">页脚与联系方式</h2>
          <p className="mt-1 text-[13px] text-muted">
            页脚的 GitHub 与「联系我们」纸飞机图标读取这里；Telegram 地址填写后可直接点击跳转。
          </p>

          <label className="mt-4 block">
            <span className="text-[13.5px] font-medium text-ink">GitHub 跳转地址</span>
            <input
              name="githubUrl"
              defaultValue={settings.githubUrl}
              placeholder="https://github.com/your-name/your-repo"
              className={`${fieldClass} mt-1.5`}
            />
          </label>

          <label className="mt-3 block">
            <span className="text-[13.5px] font-medium text-ink">Telegram 跳转地址</span>
            <input
              name="telegramUrl"
              defaultValue={settings.telegramUrl}
              placeholder="https://t.me/your-channel"
              className={`${fieldClass} mt-1.5`}
            />
          </label>

          <label className="mt-3 block">
            <span className="text-[13.5px] font-medium text-ink">联系我们备注（悬停提示）</span>
            <input
              name="contactText"
              defaultValue={settings.contactText}
              placeholder="例如：邮箱 hi@example.com"
              className={`${fieldClass} mt-1.5`}
            />
            <span className="mt-1.5 block text-[12.5px] text-faint">
              鼠标悬停在页脚「联系我们」纸飞机图标上时显示；不会直接排版在页脚里。
            </span>
          </label>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-strong"
          >
            保存设置
          </button>
        </div>
      </form>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-[16px] font-semibold text-ink">管理员账号与邮箱绑定</h2>
        <p className="mt-1 text-[13px] text-muted">
          首个超级管理员由命令行创建；公开注册只会得到普通用户。后续管理员由现有超管在「用户管理」里授予角色。
        </p>

        <ul className="mt-3 space-y-1.5 text-[13.5px]">
          {admins.map((admin) => (
            <li
              key={admin.username}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-subtle px-3 py-2"
            >
              <span className="text-ink">
                {admin.displayName}（@{admin.username}）
              </span>
              <span className="text-muted">{admin.email}</span>
              <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[12px] text-primary-strong">
                {admin.role === "SUPER_ADMIN" ? "超级管理员" : "管理员"}
              </span>
            </li>
          ))}
        </ul>

        <form
          action={bindAdminEmail}
          className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <label className="block">
            <span className="text-[13px] font-medium text-ink">绑定到邮箱</span>
            <input
              name="email"
              type="email"
              defaultValue={settings.adminEmail}
              className={`${fieldClass} mt-1`}
            />
          </label>
          <label className="block">
            <span className="text-[13px] font-medium text-ink">当前账号密码</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={`${fieldClass} mt-1`}
            />
          </label>
          <button
            type="submit"
            className="rounded-xl border border-primary/40 px-4 py-2.5 text-[13.5px] font-medium text-primary-strong transition-colors hover:bg-primary-soft"
          >
            绑定到当前账号
          </button>
        </form>

        <p className="mt-2 text-[12.5px] text-faint">
          当前登录：{actor.displayName}。绑定会修改当前账号的登录邮箱，请确保该邮箱可以正常收信。
        </p>
      </section>

      <section id="friends" className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[16px] font-semibold text-ink">友情链接</h2>
            <p className="mt-1 text-[13px] text-muted">
              显示在首页底部与 /friends 页面。可编辑图片、标题、简介与跳转链接。
            </p>
          </div>
          <span className="rounded-lg bg-subtle px-2.5 py-1 text-[12.5px] text-muted">
            {friends.length} 条
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {friends.map((friend) => (
            <div key={friend.id} className="rounded-xl border border-line p-4">
              <form action={saveFriendLink} className="space-y-3">
                <input type="hidden" name="id" value={friend.id} />

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[13px] font-medium text-ink">标题</span>
                    <input
                      name="title"
                      defaultValue={friend.title}
                      className={`${fieldClass} mt-1`}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[13px] font-medium text-ink">跳转链接</span>
                    <input
                      name="url"
                      defaultValue={friend.url}
                      className={`${fieldClass} mt-1`}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-[13px] font-medium text-ink">简介</span>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={friend.description}
                    className={`${fieldClass} mt-1 resize-y`}
                  />
                </label>

                <ImagePicker
                  name="imageUrl"
                  label="图片"
                  hint="留空则用标题首字占位"
                  defaultValue={friend.imageUrl}
                  aspect="aspect-square"
                />

                <div className="flex items-end justify-between gap-3">
                  <label className="block w-28">
                    <span className="text-[13px] font-medium text-ink">排序</span>
                    <input
                      type="number"
                      name="sortOrder"
                      defaultValue={friend.sortOrder}
                      className={`${fieldClass} mt-1`}
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-strong"
                  >
                    保存此条
                  </button>
                </div>
              </form>

              <form action={deleteFriendLink} className="mt-2 flex justify-end">
                <input type="hidden" name="id" value={friend.id} />
                <ConfirmSubmitButton
                  label="删除此条"
                  title={`删除友情链接「${friend.title}」？`}
                  description="删除后首页底部与 /friends 页面都不再显示，操作不可撤销。"
                  confirmText="确认删除"
                />
              </form>
            </div>
          ))}

          {friends.length === 0 && (
            <p className="rounded-xl border border-dashed border-line py-8 text-center text-[13.5px] text-muted">
              还没有友情链接。使用下面的表单添加第一条。
            </p>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-line p-4">
          <h3 className="text-[14px] font-semibold text-ink">新增友情链接</h3>
          <form action={saveFriendLink} className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-[13px] font-medium text-ink">标题</span>
                <input name="title" className={`${fieldClass} mt-1`} />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-ink">跳转链接</span>
                <input name="url" placeholder="https://" className={`${fieldClass} mt-1`} />
              </label>
            </div>

            <label className="block">
              <span className="text-[13px] font-medium text-ink">简介</span>
              <textarea name="description" rows={2} className={`${fieldClass} mt-1 resize-y`} />
            </label>

            <ImagePicker name="imageUrl" label="图片" hint="可上传或粘贴图片地址" aspect="aspect-square" />

            <div className="flex items-end justify-between gap-3">
              <label className="block w-28">
                <span className="text-[13px] font-medium text-ink">排序</span>
                <input type="number" name="sortOrder" defaultValue={0} className={`${fieldClass} mt-1`} />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-strong"
              >
                添加
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
