import type { Metadata } from "next";

import { AgeGate } from "@/components/age-gate";
import { ProgressBar } from "@/components/progress-bar";
import { SakuraLayer } from "@/components/sakura-layer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE } from "@/lib/site";

import "./globals.css";

/**
 * 整站按请求渲染。
 *
 * 根布局里的顶栏需要读会话（cookie → jwtVerify），而 jwtVerify 会读当前时间校验过期，
 * 这在「预渲染」阶段属于不稳定值：一旦被预渲染命中，会报
 * `encountered the unstable value new Date()`，Suspense 边界失败后浏览器反复重取，
 * 表现就是页面持续闪烁。这里显式声明为阻塞路由，避免布局进入预渲染。
 */
export const instant = false;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${SITE.name} · ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.latinName,
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: SITE.name,
    title: `${SITE.name} · ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true },
};

/** 首屏前置应用主题，避免深色用户看到白色闪屏。默认浅色，只有用户主动选过深色才切换。 */
const themeScript = `
(function () {
  try {
    if (localStorage.getItem('csa-theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();
  const backgroundUrl = (settings.backgroundUrl || settings.bannerUrl || "").trim();
  const backgroundImage = backgroundUrl
    ? `url("${backgroundUrl.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`
    : undefined;
  const overlayValue = Number(settings.backgroundOverlay);
  const overlayOpacity = Number.isFinite(overlayValue)
    ? Math.min(90, Math.max(0, overlayValue)) / 100
    : 0.55;

  return (
    <html lang="zh-CN" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        {/* 站长在「网站设置」上传的背景图：固定铺满视口，上面盖一层画布色保证正文可读 */}
        {backgroundImage && (
          <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage }}
            />
            {/* 遮罩强度由网站设置控制：默认 55%，背景图能看清，正文靠卡片和文字颜色保持可读 */}
            <div className="absolute inset-0 bg-canvas" style={{ opacity: overlayOpacity }} />
          </div>
        )}

        <div className="relative z-10 flex min-h-full flex-col">
          <AgeGate />
          <ProgressBar />
          <SakuraLayer />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
