import { Breadcrumb } from "@/components/breadcrumb";
import { SettingsNav } from "@/components/settings-nav";

/**
 * 账户设置外壳：左导航 + 右内容。
 * 鉴权放在各个子页面里做，因为 layout 读 cookies 会让整段路由变成动态阻塞。
 */
export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-6 py-6">
      <Breadcrumb items={[{ label: "用户设置" }]} />

      <div className="mt-4">
        <h1 className="text-[25px] font-semibold tracking-tight text-ink">账户设置</h1>
        <p className="mt-1.5 text-[14px] text-muted">
          按分类管理个人资料、账号安全、通知隐私与内容偏好。
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[240px_1fr]">
        <SettingsNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
