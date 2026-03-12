/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lol/shared'],
  eslint: {
    dirs: ['src'],
  },
};

module.exports = nextConfig;
