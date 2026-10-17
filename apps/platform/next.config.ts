import type { NextConfig } from "next";

const codespacesOrigin =
  "didactic-barnacle-vpp5vj9x5qqrcv9-3000.app.github.dev";
const productionOrigins = (process.env.APP_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim().replace(/^https?:\/\//, ""))
  .filter(Boolean);

const nextConfig: NextConfig = {
  transpilePackages: ["@oqood/design-system"],
  poweredByHeader: false,

  allowedDevOrigins: [
    codespacesOrigin,
    "localhost:3000",
  ],

  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: [
        codespacesOrigin,
        "localhost:3000",
        ...productionOrigins,
      ],
    },
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
