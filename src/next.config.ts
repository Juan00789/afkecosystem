import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // This is a workaround for a development-only issue when running in a container.
    // allowedDevOrigins: ['**'], // This is now a top-level property
  },
  // This is a workaround for a development-only issue when running in a container.
  allowedDevOrigins: ['**'],
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
