/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "project-one-thumbnail.s3.us-west-2.amazonaws.com",
      },
    ],
  },
};

module.exports = nextConfig;
