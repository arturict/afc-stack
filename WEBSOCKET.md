# WebSocket Integration Guide

## Overview

AFC Stack supports optional WebSocket integration for realtime features. This guide explains the architecture and how to add WebSocket support to your project.

## What is WebSocket?

WebSocket provides full-duplex communication between browser and server, enabling:
- **Realtime updates** - Changes appear instantly across all connected clients
- **Live notifications** - Push notifications without polling
- **Collaborative features** - Multiple users seeing each other's actions
- **Chat functionality** - Instant messaging

## Architecture

### Without WebSocket (Default)
```
Browser → Next.js API → Database
Browser ← JSON Response ←
```

Simple REST API pattern. Client polls or refreshes to see updates.

### With WebSocket
```
Browser → Next.js API → Database
        → WS Service → Broadcast to all clients
Browser ← WebSocket Message ← Real-time update
```

Next.js handles CRUD operations, WebSocket service broadcasts events.

## When to Use WebSocket

**Use WebSocket if you need:**
- Live dashboards showing realtime data
- Collaborative editing (multiple users)
- Chat or messaging features
- Live notifications
- Stock tickers or live updates
- Multiplayer games

**Don't use WebSocket if:**
- Simple CRUD app with no realtime needs
- Updates can wait for page refresh
- Prefer simpler architecture
- Scaling concerns (each connection uses resources)

## Adding WebSocket to Your Project

### Step 1: Run the Add Command

```bash
cd your-project
bun run add:websocket
```

This automatically:
- Copies WebSocket service to `apps/ws`
- Updates frontend with WebSocket connection
- Modifies API routes to broadcast events
- Adds environment variables

### Step 2: Install Dependencies

```bash
bun install
```

### Step 3: Configure Environment

Check `.env` has these variables:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:4001
WS_INTERNAL_URL=http://localhost:4001
PORT=4001
```

### Step 4: Start Services

```bash
bun run dev
```

Now both services run:
- Web app: http://localhost:3000
- WebSocket: ws://localhost:4001

## How It Works

### 1. WebSocket Service (apps/ws)

A separate Fastify server with two responsibilities:

**WebSocket Endpoint** (`/ws`)
```typescript
// Client connects
const socket = new WebSocket("ws://localhost:4001/ws");

// Service maintains all connections
const clients = new Set<WebSocket>();
```

**Event Endpoint** (`/events/*`)
```typescript
// Next.js calls this internally
POST /events/todo-created
{
  "id": 1,
  "title": "New Todo"
}

// Service broadcasts to all WebSocket clients
```

### 2. Frontend Integration

```typescript
// Connect on mount
useEffect(() => {
  const socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL + "/ws");
  
  // Listen for events
  socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === "todo:created") {
      // Update UI immediately
      setTodos(prev => [msg.payload, ...prev]);
    }
  };
  
  return () => socket.close();
}, []);
```

### 3. Backend Integration

```typescript
// In your API route after DB insert
export async function POST(req: Request) {
  // ... validation, DB insert ...
  
  const [inserted] = await db.insert(todos).values({...}).returning();
  
  // Broadcast to WebSocket service
  if (process.env.WS_INTERNAL_URL) {
    await fetch(WS_INTERNAL_URL + "/events/todo-created", {
      method: "POST",
      body: JSON.stringify(inserted)
    });
  }
  
  return NextResponse.json(inserted);
}
```

## Complete Data Flow

```
User A creates todo:
1. Browser → POST /api/todos → Next.js
2. Next.js → Insert to DB
3. Next.js → POST /events/todo-created → WS Service
4. WS Service → Broadcast to all connected clients
5. User B's browser receives WebSocket message
6. User B's UI updates automatically
```

## Production Deployment

### Environment Variables

```env
# Production
NEXT_PUBLIC_WS_URL=wss://ws.yourdomain.com
WS_INTERNAL_URL=http://ws-service:4001  # Internal Docker network

# Development
NEXT_PUBLIC_WS_URL=ws://localhost:4001
WS_INTERNAL_URL=http://localhost:4001
```

### Coolify Setup

1. **Deploy Web App** (existing)
2. **Deploy WS Service**:
   - Create new Application
   - Dockerfile: `apps/ws/Dockerfile`
   - Port: 4001
   - Enable "WebSocket Proxy"
   - Domain: `ws.yourdomain.com`
   - Environment: `PORT=4001`, `DATABASE_URL=...`

3. **Configure Networking**:
   - Web app's `WS_INTERNAL_URL`: `http://ws-service-name:4001`
   - Public `NEXT_PUBLIC_WS_URL`: `wss://ws.yourdomain.com`

## Adding Custom Events

### 1. Add Event Handler in WS Service

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

### 2. Broadcast from API Route

```typescript
// In apps/web/src/app/api/users/route.ts
if (process.env.WS_INTERNAL_URL) {
  await fetch(WS_INTERNAL_URL + "/events/user-updated", {
    method: "POST",
    body: JSON.stringify(updatedUser)
  });
}
```

### 3. Handle in Frontend

```typescript
socket.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  
  switch (msg.type) {
    case "todo:created":
      setTodos(prev => [msg.payload, ...prev]);
      break;
    case "user:updated":
      setUser(msg.payload);
      break;
  }
};
```

## Troubleshooting

### WebSocket won't connect
```bash
# Check WS service is running
curl http://localhost:4001/health

# Check browser console for errors
# Verify NEXT_PUBLIC_WS_URL is correct
```

### Events not broadcasting
```bash
# Test event endpoint manually
curl -X POST http://localhost:4001/events/todo-created \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "title": "Test"}'

# Check WS service logs
cd apps/ws && bun run dev
```

### Production issues
- Use `wss://` (not `ws://`) for secure connections
- Enable WebSocket proxy in hosting platform
- Check firewall allows WebSocket connections
- Verify internal network communication

## Removing WebSocket

If you no longer need WebSocket:

```bash
# 1. Remove service directory
rm -rf apps/ws

# 2. Remove WebSocket code from frontend
# apps/web/src/app/page.tsx - remove socket connection

# 3. Remove event broadcasts from API routes
# apps/web/src/app/api/*/route.ts - remove fetch to WS_INTERNAL_URL

# 4. Remove environment variables
# .env - remove WS_* variables

# 5. Update turbo.json
# Remove ws from pipeline
```

## Alternative: Server-Sent Events

If WebSocket is too complex, consider Server-Sent Events (SSE):
- Simpler than WebSocket (unidirectional)
- Built into HTTP (no special protocol)
- Good for notifications/updates
- Not suitable for bidirectional communication

## Learn More

- [Fastify WebSocket Plugin](https://github.com/fastify/fastify-websocket)
- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [WebSocket vs SSE](https://ably.com/blog/websockets-vs-sse)

For questions or issues, see the main README or open an issue on GitHub.
