import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  // Lets the dev server accept HMR/RSC requests when the app is opened through a tunnel
  // (cloudflared, ngrok) instead of localhost — without this, pages and images still load
  // (plain GETs) but every client interaction is silently dead, since Next blocks
  // cross-origin dev requests from unrecognized origins with no visible browser error.
  allowedDevOrigins: ['*.trycloudflare.com'],
};

export default nextConfig;
