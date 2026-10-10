import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Slides read fonts, the logo and post files from disk at request time (lib/graphics/assets.ts,
  // lib/post/load.ts); make sure serverless bundles include them if this ever moves to Vercel.
  outputFileTracingIncludes: {
    "/**/*": ["./assets/**/*", "./content/posts/*.json"],
  },
};

export default nextConfig;
