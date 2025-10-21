import { NextResponse } from "next/server";
import { db, todos } from "@ac/db";
import { z } from "zod";
import arcjet, { fixedWindow } from "@arcjet/next";
import { desc } from "drizzle-orm";

const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [fixedWindow({ mode: "LIVE", window: "10s", max: 10 })]
});

const createTodoSchema = z.object({ title: z.string().min(1).max(200) });

export async function GET(req: Request) {
    const decision = await aj.protect(req);
    if (decision.isDenied()) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    const data = await db.select().from(todos).orderBy(desc(todos.createdAt)).limit(50);
    return NextResponse.json(data);
}

export async function POST(req: Request) {
    const decision = await aj.protect(req);
    if (decision.isDenied()) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    const body = await req.json();
    const parsed = createTodoSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const [inserted] = await db.insert(todos).values({ title: parsed.data.title }).returning();

    // Realtime broadcast an WS-Service
    if (process.env.WS_INTERNAL_URL) {
        await fetch(process.env.WS_INTERNAL_URL + "/events/todo-created", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(inserted)
        }).catch(() => {});
    }

    return NextResponse.json(inserted, { status: 201 });
}
