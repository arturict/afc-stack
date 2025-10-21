# WebSocket Integration

This directory contains the WebSocket service and related files for adding realtime functionality to your AFC Stack project.

## What's Included

- `ws/` - Fastify WebSocket service
- `page.tsx` - Frontend component with WebSocket integration
- `route.ts` - API route that broadcasts events to WebSocket

## Adding WebSocket to Your Project

### 1. Copy the WebSocket Service

```bash
# From your project root
cp -r cli-templates/extras/websocket/ws apps/
```

### 2. Update package.json

Add the WebSocket service to your workspace:

```json
{
  "workspaces": [
    "apps/*",     // Make sure this includes apps/ws
    "packages/*"
  ]
}
```

### 3. Install Dependencies

```bash
bun install
```

The WS service includes these dependencies:
- `fastify` - Fast web framework
- `@fastify/websocket` - WebSocket plugin
- `pino` - Logger

### 4. Environment Variables

Add to your `.env`:

```env
# WebSocket URLs
NEXT_PUBLIC_WS_URL=ws://localhost:4001
WS_INTERNAL_URL=http://localhost:4001
PORT=4001
```

- `NEXT_PUBLIC_WS_URL` - Client-side WebSocket URL (wss:// in production)
- `WS_INTERNAL_URL` - Server-side URL for internal communication
- `PORT` - WebSocket service port

### 5. Update Frontend

Replace `apps/web/src/app/page.tsx` with the WebSocket-enabled version:

```bash
cp cli-templates/extras/websocket/page.tsx apps/web/src/app/page.tsx
```

### 6. Update API Route

Replace your API route with the WebSocket-enabled version:

```bash
cp cli-templates/extras/websocket/route.ts apps/web/src/app/api/todos/route.ts
```

### 7. Start Services

```bash
# Start all services including WebSocket
bun run dev
```

This starts:
- Web app on port 3000
- WebSocket service on port 4001

## How It Works

### Architecture

```
Browser                Next.js API              WS Service           Other Browsers
  |                        |                         |                        |
  |-- POST /api/todos --->|                         |                        |
  |                        |-- DB Insert ---------->|                        |
  |<-- 201 Created --------|                         |                        |
  |                        |-- POST /events -------->|                        |
  |                        |                         |-- Broadcast ---------->|
  |                        |                         |                        |
  |<------------- WebSocket message ---------------->|                        |
```

### WebSocket Service (apps/ws)

The service has two roles:

**1. WebSocket Server** (`/ws`)
- Maintains persistent connections with browsers
- Broadcasts events to all connected clients

**2. Internal HTTP API** (`/events/*`)
- Receives events from Next.js API
- Triggers WebSocket broadcasts

### Frontend Integration

```typescript
// Connect to WebSocket
const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL + "/ws");

// Listen for events
socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "todo:created") {
        // Update UI with new todo
        setTodos(prev => [message.payload, ...prev]);
    }
};
```

### Backend Integration

```typescript
// In your API route after DB insert
if (process.env.WS_INTERNAL_URL) {
    await fetch(process.env.WS_INTERNAL_URL + "/events/todo-created", {
        method: "POST",
        body: JSON.stringify(newTodo)
    });
}
```

## Production Deployment

### Docker

The WebSocket service has its own Dockerfile at `apps/ws/Dockerfile`.

### Coolify Setup

1. Create a new Application for WebSocket service
2. Point to `apps/ws/Dockerfile`
3. Set environment variables
4. Enable WebSocket proxy
5. Add domain (e.g., `ws.yourdomain.com`)

### Environment URLs

```env
# Production
NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com
WS_INTERNAL_URL=http://ws-service:4001  # Internal Docker network

# Development
NEXT_PUBLIC_WS_URL=ws://localhost:4001
WS_INTERNAL_URL=http://localhost:4001
```

## Adding More Events

### 1. Add Event Route in WS Service

Edit `apps/ws/src/server.ts`:

```typescript
app.post("/events/user-updated", async (req, reply) => {
    const data = await req.body;
    const message = JSON.stringify({ 
        type: "user:updated", 
        payload: data 
    });
    
    for (const client of clients) {
        client.send(message);
    }
    
    return reply.status(204).send();
});
```

### 2. Trigger from API Route

```typescript
// In your API route
await fetch(WS_INTERNAL_URL + "/events/user-updated", {
    method: "POST",
    body: JSON.stringify(updatedUser)
});
```

### 3. Handle in Frontend

```typescript
socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    
    switch(msg.type) {
        case "todo:created":
            // Handle todo creation
            break;
        case "user:updated":
            // Handle user update
            break;
    }
};
```

## Troubleshooting

### WebSocket won't connect

- Check `NEXT_PUBLIC_WS_URL` is correct
- Verify WS service is running (`bun run dev` in apps/ws)
- Check browser console for errors
- Ensure port 4001 is not blocked

### Events not broadcasting

- Verify `WS_INTERNAL_URL` is set
- Check WS service logs
- Confirm API route is calling the event endpoint
- Test manually: `curl -X POST http://localhost:4001/events/todo-created -H "Content-Type: application/json" -d '{"id":1}'`

### Production issues

- Use `wss://` (not `ws://`) for client URL
- Enable WebSocket proxy in your hosting platform
- Check firewall allows WebSocket connections
- Verify both services can communicate internally

## Removing WebSocket

If you no longer need WebSocket:

1. Delete `apps/ws` directory
2. Remove WebSocket code from frontend
3. Remove event broadcast from API routes
4. Remove WS environment variables
5. Update `turbo.json` to remove ws references

## Alternative: Server-Sent Events (SSE)

If you prefer SSE over WebSocket:
- Simpler unidirectional communication
- Built into HTTP, no special protocol
- Better for simple notifications
- WebSocket better for bidirectional communication

Contact the AFC Stack team for SSE integration guide.
