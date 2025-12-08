import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: "standalone",
  eslint: {
    // 生产构建时忽略 ESLint 错误（包括 no-explicit-any、jsx-no-leaked-render 等）
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
