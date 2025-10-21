import { NextResponse } from "next/server";
import { db, todos } from "@ac/db";
import { z } from "zod";
import arcjet from "@arcjet/next";

const aj = arcjet({
    key: process.env.ARCJET_KEY!,
    rules: [{ type: "fixed-window", window: "10s", limit: 10 }]
});

const createTodoSchema = z.object({ title: z.string().min(1).max(200) });

export async function GET(req: Request) {
    const decision = await aj.protect(req);
    if (decision.isDenied()) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    const data = await db.query.todos.findMany({ limit: 50, orderBy: (t, { desc }) => [desc(t.createdAt)] });
    return NextResponse.json(data);
}

export async function POST(req: Request) {
    const decision = await aj.protect(req);
    if (decision.isDenied()) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

    const body = await req.json();
    const parsed = createTodoSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

    const [inserted] = await db.insert(todos).values({ title: parsed.data.title }).returning();

    // Realtime broadcast to WebSocket service
    if (process.env.WS_INTERNAL_URL) {
        await fetch(process.env.WS_INTERNAL_URL + "/events/todo-created", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(inserted)
        }).catch(() => {
            // Silent fail if WS service is not available
        });
    }

    return NextResponse.json(inserted, { status: 201 });
}
