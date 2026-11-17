import Link from "next/link";

import { SendIcon } from "@/components/icons";
import { getSiteSettings } from "@/lib/site-settings";
import { COPYRIGHT_YEAR, SITE } from "@/lib/site";

const centerLinks = [
  { href: "/docs", label: "使用指南" },
  { href: "/galgame", label: "导航页面" },
  { href: "/friends", label: "友情链接" },
];

export async function SiteFooter() {
  const settings = await getSiteSettings();

  return (
    <footer className="mt-14 border-t border-hairline bg-[var(--color-glass)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-4 px-4 py-7 text-[13.5px] text-muted sm:px-6 sm:text-[14px] lg:flex-row lg:items-center lg:justify-between lg:gap-5">
        <div className="flex items-center gap-2.5">
          <span className="text-[16px]" aria-hidden>
            ⁂
          </span>
          <span>
            © {COPYRIGHT_YEAR} {SITE.latinName} / {settings.siteName || SITE.name}
          </span>
        </div>

        <nav aria-label="页脚导航" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {centerLinks.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
          {settings.githubUrl && (
            <a
              href={settings.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ink"
            >
              GitHub
            </a>
          )}
        </nav>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {/* 联系我们：纸飞机（Telegram）图标；填写 Telegram 地址后整项可点击跳转 */}
          {settings.telegramUrl ? (
            <a
              href={settings.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="联系我们（Telegram）"
              title={settings.contactText ? `联系我们：${settings.contactText}` : "联系我们（Telegram）"}
              className="flex items-center gap-1.5 text-muted transition-colors hover:text-ink"
            >
              <SendIcon size={17} />
              联系我们
            </a>
          ) : (
            <span
              title={settings.contactText ? `联系我们：${settings.contactText}` : "联系我们"}
              className="flex items-center gap-1.5 text-muted"
            >
              <SendIcon size={17} />
              联系我们
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}
