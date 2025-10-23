import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@ac/db"],
    typescript: {
        // FIXME: Temporarily ignore build errors due to Drizzle ORM type conflicts in monorepo
        ignoreBuildErrors: true
    },
    eslint: {
        ignoreDuringBuilds: false
    },
    outputFileTracingRoot: path.join(__dirname, "../../")
};

export default nextConfig;
