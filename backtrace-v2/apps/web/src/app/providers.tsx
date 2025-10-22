"use client";

import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com",
                capture_pageview: true
            });
        }
    }, []);
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
