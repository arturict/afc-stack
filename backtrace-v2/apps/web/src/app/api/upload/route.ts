export const runtime = "nodejs";

export async function POST(req: Request) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
        return new Response("No file", { status: 400 });
    }
    const res = await (await import("@/storage")).uploadFile(file);
    return new Response(JSON.stringify(res), { status: 201, headers: { "content-type": "application/json" } });
}
