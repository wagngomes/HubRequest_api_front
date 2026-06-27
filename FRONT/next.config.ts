import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Source maps em produção consomem ~150MB de RAM — desnecessário na VPS
  productionBrowserSourceMaps: false,

  // Tree-shaking agressivo nos pacotes grandes: reduz bundle e tempo de parse
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "@radix-ui/react-icons"],
  },

  turbopack: {
    root: __dirname,
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Telemetria desabilitada (menos ruído e CPU)
  // (também definida como ENV no Dockerfile)
};

export default nextConfig;
