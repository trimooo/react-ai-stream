import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@react-ai-stream/core'],
  async redirects() {
    return [
      {
        source: '/docs',
        destination: 'https://react-ai-stream-docs.vercel.app',
        permanent: false,
      },
      {
        source: '/docs/:path*',
        destination: 'https://react-ai-stream-docs.vercel.app/:path*',
        permanent: false,
      },
    ]
  },
}

export default config
