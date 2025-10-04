import type { NextConfig } from "next";

// Optionally include CDN host if configured
const cdnHost = (() => {
  try {
    const u = process.env.NEXT_PUBLIC_SPACES_CDN ? new URL(process.env.NEXT_PUBLIC_SPACES_CDN) : null
    return u?.hostname || null
  } catch {
    return null
  }
})()

const nextConfig: NextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",
      // DigitalOcean Spaces bucket host for uploaded avatars/attachments
      "campus-reach.nyc3.digitaloceanspaces.com",
      // Optional CDN host
      ...(cdnHost ? [cdnHost] as string[] : []),
    ],
  },
};

export default nextConfig;
