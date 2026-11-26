import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  // Development only: lets the owner test the admin on an iPhone over home
  // Wi-Fi (e.g. http://192.168.0.200:3000). Has no effect on the live site.
  allowedDevOrigins: ["192.168.0.*"],
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Only product/collection photos from our own Supabase storage bucket.
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/catalogue/**`)]
      : [],
    qualities: [75],
  },
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
