import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['placehold.co'], // Added 'placehold.co' to allow images from this domain
  },
  /* other config options here */
};

export default nextConfig;
