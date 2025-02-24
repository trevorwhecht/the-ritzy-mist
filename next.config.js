/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['static.wixstatic.com', 'firebasestorage.googleapis.com', 'hebbkx1anhila5yf.public.blob.vercel-storage.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-src 'self' calendar.google.com;",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 