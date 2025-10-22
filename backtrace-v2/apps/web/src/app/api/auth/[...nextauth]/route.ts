import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@ac/db";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Email from "next-auth/providers/email";

const providers = [
    Email({
        server: {
            host: "smtp.resend.com",
            port: 587,
            auth: { user: "resend", pass: process.env.RESEND_API_KEY! }
        },
        from: process.env.RESEND_FROM
    })
];

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.push(GitHub({ clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET }));
}
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }));
}
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    providers.push(
        Discord({ clientId: process.env.DISCORD_CLIENT_ID, clientSecret: process.env.DISCORD_CLIENT_SECRET })
    );
}

const auth = NextAuth({
    adapter: DrizzleAdapter(db),
    providers,
    session: { strategy: "jwt" }
});

export const GET = auth.handlers.GET;
export const POST = auth.handlers.POST;
