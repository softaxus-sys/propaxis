import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1MB — too small for listing/CMS photo uploads (multiple images per
    // submission, multipart overhead included in this limit). See src/lib/storage.ts;
    // individual files are still capped (5MB each) at the validation layer, this just
    // raises the overall request ceiling to fit several of them in one submission.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
