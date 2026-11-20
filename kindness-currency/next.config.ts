import type { NextConfig } from "next";
import path from "node:path";

// Baseline hardening on every response. Deliberately conservative: no script/connect CSP (a wrong
// one would silently break the Paystack inline popup, Supabase or Google sign-in, and a strict one
// needs per-request nonces), and Permissions-Policy leaves `payment` alone because Paystack's
// checkout runs in an iframe. No Strict-Transport-Security here on purpose: Vercel already sends a
// longer one (max-age=63072000) and setting our own would only shorten it.
export const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Nobody should be framing this site (clickjacking, and lookalike pages wrapping it).
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  // /give/[uuid] is the secret link; never hand its path to other origins.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
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
