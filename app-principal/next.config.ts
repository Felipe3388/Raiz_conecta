import type { NextConfig } from "next";

// CORS opcional para o app mobile rodando no navegador (Expo Web).
// Defina CORS_ALLOWED_ORIGIN no .env (ex.: http://localhost:8081). Sem a variável, nada muda.
const corsOrigin = process.env.CORS_ALLOWED_ORIGIN;

const nextConfig: NextConfig = {
  async headers() {
    if (!corsOrigin) return [];

    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: corsOrigin },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
  reactCompiler: true,
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
