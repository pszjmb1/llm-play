const nextConfig = {
  // Remove or comment out the output property so that SSR is used:
  // output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
