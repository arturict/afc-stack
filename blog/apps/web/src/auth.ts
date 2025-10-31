import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@ac/db";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Resend from "next-auth/providers/resend";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db),
    session: { strategy: "jwt" },
    providers: [
        Resend({
            from: process.env.RESEND_FROM
        }),
        ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
            ? [
                  GitHub({
                      clientId: process.env.GITHUB_CLIENT_ID,
                      clientSecret: process.env.GITHUB_CLIENT_SECRET
                  })
              ]
            : []),
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                  Google({
                      clientId: process.env.GOOGLE_CLIENT_ID,
                      clientSecret: process.env.GOOGLE_CLIENT_SECRET
                  })
              ]
            : []),
        ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
            ? [
                  Discord({
                      clientId: process.env.DISCORD_CLIENT_ID,
                      clientSecret: process.env.DISCORD_CLIENT_SECRET
                  })
              ]
            : [])
    ]
});
