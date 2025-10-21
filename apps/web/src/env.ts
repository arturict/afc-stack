import { z } from "zod";

export const env = z
    .object({
        DATABASE_URL: z.string().url(),
        NEXTAUTH_SECRET: z.string().min(32),
        NEXTAUTH_URL: z.string().url(),
        NEXT_PUBLIC_WS_URL: z.string().url(),
        WS_INTERNAL_URL: z.string().url().optional(),
        ARCJET_KEY: z.string().optional(),
        NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
        NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
        RESEND_API_KEY: z.string().optional(),
        RESEND_FROM: z.string().email().optional(),
        GITHUB_CLIENT_ID: z.string().optional(),
        GITHUB_CLIENT_SECRET: z.string().optional(),
        GOOGLE_CLIENT_ID: z.string().optional(),
        GOOGLE_CLIENT_SECRET: z.string().optional(),
        DISCORD_CLIENT_ID: z.string().optional(),
        DISCORD_CLIENT_SECRET: z.string().optional(),
        STORAGE_PROVIDER: z.enum(["minio", "uploadthing"]).default("minio"),
        S3_ENDPOINT: z.string().url().optional(),
        S3_REGION: z.string().optional(),
        S3_ACCESS_KEY_ID: z.string().optional(),
        S3_SECRET_ACCESS_KEY: z.string().optional(),
        S3_BUCKET: z.string().optional(),
        UPLOADTHING_APP_ID: z.string().optional(),
        UPLOADTHING_SECRET: z.string().optional()
    })
    .parse(process.env);
