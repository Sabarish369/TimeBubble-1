import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/(?!app$|api/|.*\\..*).+', // Matches any path that is not /app, not under /api, and not a file
        has: [
          {
            type: 'cookie',
            key: 'firebase-auth-logged-in',
            value: 'true',
          },
        ],
        destination: '/app',
        permanent: false,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
