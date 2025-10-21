import "dotenv/config";
import Fastify from "fastify";
import websocket from "@fastify/websocket";

const app = Fastify({ logger: true });
app.register(websocket);

const clients = new Set<any>();

app.get("/ws", { websocket: true }, (conn) => {
    clients.add(conn.socket);
    conn.socket.on("close", () => clients.delete(conn.socket));
});

app.post("/events/todo-created", async (req, reply) => {
    try {
        const data = (await req.body) as any;
        const message = JSON.stringify({ type: "todo:created", payload: data });
        for (const client of Array.from(clients)) {
            client.send(message);
        }
        return reply.status(204).send();
    } catch {
        return reply.status(400).send();
    }
});

app.get("/health", async () => ({ ok: true }));

const port = Number(process.env.PORT ?? 4001);
app.listen({ port, host: "0.0.0.0" }).catch((err) => {
    console.error(err);
    process.exit(1);
});
