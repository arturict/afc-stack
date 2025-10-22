/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@ac/db"],
    typescript: {
        // FIXME: Temporarily ignore build errors due to Drizzle ORM type conflicts in monorepo
        ignoreBuildErrors: true
    },
    eslint: {
        ignoreDuringBuilds: false
    }
};

export default nextConfig;
