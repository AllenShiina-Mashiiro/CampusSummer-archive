import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAdmin } from "@/lib/admin-guard";

// 管理面板是登录后的私有区域，只在请求时渲染，不参与部分预渲染
export const instant = false;

/**
 * 管理面板整屏布局：盖住前台导航，自成一套侧边栏 + 内容区。
 * 右上角保留与前台一致的主题切换按钮（小太阳），全站深浅色统一由它控制。
 *
 * 鉴权放在 layout 里：`instant = false` 让它整段阻塞渲染，
 * 未授权时在输出任何字节之前就跳走，不会把后台外壳泄露给普通用户。
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas">
      <div className="flex min-h-full">
        <AdminSidebar role={admin.role} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-end px-10 pt-5">
            <ThemeToggle />
          </div>
          <div className="px-10 pb-10">{children}</div>
        </div>
      </div>
    </div>
  );
}
