import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * 本项目大量页面依赖请求态数据（Cookie/JWT）及请求时计算（Date.now）。
   * 当前尚未完成 Cache Components 所要求的逐个 Suspense 子树动态边界声明；
   * 开启它会在预渲染阶段执行鉴权代码并触发 blocking-prerender-current-time。
   *
   * 使用 Next.js 默认的按需动态渲染：cookies() 等请求 API 会自动使对应路由
   * 在请求时执行，避免在静态预渲染阶段验证会话或读取当前时间。
   * 保留普通 Suspense 流式渲染，不影响页面交互与服务端鉴权。
   */
  cacheComponents: false,

  /**
   * 开发服务器默认只信任 localhost。用 127.0.0.1 访问时，HMR 与 dev 资源会被判定为
   * 跨来源而拦掉，客户端脚本因此不执行（表现为所有按钮点了没反应）。
   */
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
