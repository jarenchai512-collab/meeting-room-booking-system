/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.BUILD_TARGET === "github-pages";

const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  ...(isGitHubPages
    ? {
        output: "export",
        basePath: "/meeting-room-booking-system",
        images: { unoptimized: true },
      }
    : {
        experimental: {
          serverComponentsExternalPackages: ["googleapis"],
        },
        images: {
          remotePatterns: [
            {
              protocol: "https",
              hostname: "**",
            },
          ],
        },
      }),
};

export default nextConfig;
