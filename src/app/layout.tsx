import type { Metadata } from "next";
import { Suspense, type CSSProperties } from "react";

import { AgeGate } from "@/components/age-gate";
import { ProgressBar } from "@/components/progress-bar";
import { SakuraLayer } from "@/components/sakura-layer";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE } from "@/lib/site";

import "./globals.css";

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
    : 0.15;
  // 站长设置的「遮罩强度」只表示方向，深浅色各走一条更适合自己的曲线：
  // 浅色用白雾压住插画高光，深色需要更厚的暗纱，否则亮色插画会把文字吃掉。
  const veilLight = Math.min(0.84, 0.22 + overlayOpacity * 0.9).toFixed(3);
  const veilDark = Math.min(0.92, 0.42 + overlayOpacity * 0.55).toFixed(3);
  const backdropStyle = {
    "--veil-light": veilLight,
    "--veil-dark": veilDark,
  } as CSSProperties;

  return (
    <html lang="zh-CN" className="h-full" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen min-h-dvh">
        {/*
          背景由四层叠加：图 / 品牌微光 / 画布遮罩 / 暗角。
          没有上传背景图时用品牌渐变兜底，玻璃卡片在浅色和深色下都有底色可压。
        */}
        <div
          aria-hidden
          className={`site-backdrop ${backgroundImage ? "" : "is-plain"}`}
          style={backdropStyle}
        >
          <div className="site-backdrop__image" style={{ backgroundImage }} />
          <div className="site-backdrop__glow" />
          <div className="site-backdrop__veil" />
          <div className="site-backdrop__vignette" />
        </div>

        <div className="relative z-10 flex min-h-screen min-h-dvh flex-col">
          <AgeGate />
          <Suspense fallback={null}>
            <ProgressBar />
          </Suspense>
          <SakuraLayer />
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
