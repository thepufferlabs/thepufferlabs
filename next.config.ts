import type { NextConfig } from "next";

const repoName = process.env.NEXT_PUBLIC_REPO_NAME || "";

const nextConfig: NextConfig = {
  basePath: repoName ? `/${repoName}` : "",
  assetPrefix: repoName ? `/${repoName}/` : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
