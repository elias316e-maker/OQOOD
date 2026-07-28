import type { NextConfig } from "next";

const codespacesOrigin =
  "didactic-barnacle-vpp5vj9x5qqrcv9-3000.app.github.dev";

const nextConfig: NextConfig = {
  transpilePackages: ["@oqood/design-system"],

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
      ],
    },
  },
};

export default nextConfig;
