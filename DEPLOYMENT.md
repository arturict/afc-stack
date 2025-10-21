# Deployment Guide

## Coolify Setup

**Deployment URL**: [cloud.artur.engineer](https://cloud.artur.engineer)

### 1. Database

1. Create a new PostgreSQL database in Coolify
2. Note the connection string
3. Enable automatic backups

### 2. Web Application

1. **Create New Resource** → Application
2. **Source**: Connect GitHub repository
3. **Build Configuration**:
    - Build Pack: Dockerfile
    - Dockerfile Location: `apps/web/Dockerfile`
    - Build Context: Repository root
4. **Port**: 3000
5. **Domains**: Add your domain and enable SSL
6. **Environment Variables**: Copy from `.env.example` and fill in:
    - `DATABASE_URL`: From step 1
    - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
    - `NEXTAUTH_URL`: Your domain URL
    - `NEXT_PUBLIC_WS_URL`: WebSocket public URL (wss://ws.yourdomain.com)
    - `WS_INTERNAL_URL`: Internal service URL (http://ws-service:4001)
    - Add OAuth credentials if using
    - Add Arcjet, PostHog, Resend keys
    - Set `STORAGE_PROVIDER=uploadthing` for production
7. **Health Check**:
    - Type: HTTP
    - Path: `/`
    - Port: 3000
8. **Deploy Hook**: Generate and save as GitHub secret `COOLIFY_WEB_HOOK_URL`

### 3. WebSocket Service

1. **Create New Resource** → Application
2. **Source**: Same GitHub repository
3. **Build Configuration**:
    - Build Pack: Dockerfile
    - Dockerfile Location: `apps/ws/Dockerfile`
    - Build Context: Repository root
4. **Port**: 4001
5. **Network**: Enable WebSocket proxy
6. **Domains**: Add WebSocket domain (e.g., ws.yourdomain.com)
7. **Environment Variables**:
    - `DATABASE_URL`: Same as web app
    - `PORT`: 4001
8. **Health Check**:
    - Type: HTTP
    - Path: `/health`
    - Port: 4001
9. **Deploy Hook**: Generate and save as GitHub secret `COOLIFY_WS_HOOK_URL`

### 4. Internal Networking

If using Coolify's internal networking:

- Web app's `WS_INTERNAL_URL` should be: `http://<ws-service-name>:4001`
- Where `<ws-service-name>` is the service name you gave the WS app in Coolify

## GitHub Secrets

Add these to your repository settings → Secrets and variables → Actions:

1. `COOLIFY_WEB_HOOK_URL`: Deploy webhook from Web app
2. `COOLIFY_WS_HOOK_URL`: Deploy webhook from WS service

The `GITHUB_TOKEN` is automatically available and doesn't need to be added.

## Container Registry

Images are pushed to GitHub Container Registry (GHCR) automatically:

- `ghcr.io/<your-username>/your-stack-web:latest`
- `ghcr.io/<your-username>/your-stack-ws:latest`

Make sure the repository is public or configure Coolify to authenticate with GHCR.

## Environment Setup Checklist

### Required for Basic Functionality

- [ ] `DATABASE_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXT_PUBLIC_WS_URL`
- [ ] `WS_INTERNAL_URL`

### Optional Services

- [ ] Arcjet: `ARCJET_KEY`
- [ ] PostHog: `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- [ ] Resend: `RESEND_API_KEY`, `RESEND_FROM`
- [ ] UploadThing: `UPLOADTHING_APP_ID`, `UPLOADTHING_SECRET`, `STORAGE_PROVIDER=uploadthing`
- [ ] GitHub OAuth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- [ ] Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- [ ] Discord OAuth: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`

## Deployment Flow

1. Push to `main` branch
2. GitHub Actions CI runs (lint, typecheck, build)
3. If CI passes, deploy workflow:
    - Builds Docker images
    - Pushes to GHCR
    - Triggers Coolify webhooks
4. Coolify pulls new images and deploys

## Troubleshooting

### Web app fails to start

- Check `DATABASE_URL` is correct
- Ensure migrations ran (check logs for "migrate.mjs")
- Verify `NEXTAUTH_SECRET` is set and 32+ characters

### WebSocket connection fails

- Check `NEXT_PUBLIC_WS_URL` is accessible from browser
- Verify WebSocket proxy is enabled in Coolify
- Check WS service health endpoint: `https://ws.yourdomain.com/health`

### Internal WS communication fails

- Verify `WS_INTERNAL_URL` matches Coolify service name
- Check both services are in same network
- Test from web container: `curl http://ws-service:4001/health`

## Monitoring

Add to Coolify:

- Enable health checks for both services
- Set up log aggregation
- Configure uptime monitoring
- Enable automatic restarts on failure

## Backups

- Database: Enable automatic backups in Coolify
- Files: If using MinIO/S3, configure bucket versioning
- Code: Always in Git

## Scaling

- Web app: Can be scaled horizontally (multiple instances)
- WebSocket: Sticky sessions needed if scaling (use Redis adapter)
- Database: Consider read replicas for high traffic
