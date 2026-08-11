/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@conductor/contracts"],
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;
