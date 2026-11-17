import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Cache Components 已在数据读取层使用；保留以支持现有 use cache / cacheLife / cacheTag。 */
  cacheComponents: true,

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
