import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "CampusSummer Archive｜学园夏日局",
    template: "%s｜CampusSummer Archive",
  },
  description: "收藏游戏里的夏日、故事与青春。一个关于视觉小说与游戏文化的数字档案馆。",
  applicationName: "CampusSummer Archive",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
