import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'static.wixstatic.com' },
      { protocol: 'https', hostname: 'hebbkx1anhila5yf.public.blob.vercel-storage.com' },
      { protocol: 'https', hostname: '7njnoxrfmp9jlkvi.public.blob.vercel-storage.com' },
    ],
  },
  async headers() {
    // The Google appointment iframe stays until the first-party /book flow replaces it.
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Content-Security-Policy', value: "frame-src 'self' calendar.google.com;" }],
      },
    ]
  },
}

export default nextConfig
