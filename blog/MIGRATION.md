# Aktualisierungen und Korrekturen

Dieses Dokument beschreibt die durchgeführten Updates basierend auf der aktuellen Dokumentation von Next.js 15, Drizzle ORM, NextAuth v5 und Turborepo.

## Zusammenfassung der Änderungen

### 1. **Turborepo Konfiguration** (`turbo.json`)
- ✅ Cache-Verhalten für `dev` Task korrigiert (`cache: false`, `persistent: true`)
- ✅ Next.js Cache-Ordner explizit ausgeschlossen (`!.next/cache/**`)
- ✅ Test und Lint Tasks mit korrekten Dependencies konfiguriert

### 2. **Drizzle Kit Konfiguration** (`drizzle.config.ts`)
- ✅ Migrations Schema hinzugefügt für PostgreSQL Best Practices
- ✅ Migration Tabelle und Schema explizit definiert

### 3. **NextAuth v5 Migration**
- ✅ Neue `auth.ts` Datei erstellt mit korrektem NextAuth v5 Setup
- ✅ Drizzle Adapter korrekt konfiguriert mit `session: { strategy: "jwt" }`
- ✅ Resend Provider statt Email Provider verwendet
- ✅ Route Handler auf neue exports umgestellt (von `auth.handlers`)
- ✅ Schema um alle NextAuth Tabellen erweitert (users, accounts, sessions, verificationTokens, authenticators)

### 4. **Drizzle Schema Updates** (`packages/db/src/schema.ts`)
- ✅ NextAuth-kompatible Tabellen hinzugefügt (PostgreSQL)
- ✅ Korrekte Typisierung mit `AdapterAccountType`
- ✅ Alle Foreign Keys und Composite Primary Keys definiert

### 5. **Drizzle Client** (`packages/db/src/client.ts`)
- ✅ Schema in `drizzle()` übergeben für Relational Queries
- ✅ Connection Pooling mit `max: 5` beibehalten

### 6. **Environment Variables**
- ✅ `AUTH_SECRET` statt `NEXTAUTH_SECRET` (NextAuth v5)
- ✅ `.env.example` mit allen benötigten Variablen aktualisiert
- ✅ `env.ts` Validierung entsprechend angepasst

### 7. **TypeScript Konfiguration** (`tsconfig.json`)
- ✅ `baseUrl: "."` hinzugefügt für korrekte Path Resolution
- ✅ Paths Konfiguration bleibt unverändert

### 8. **Next.js Konfiguration** (`next.config.mjs`)
- ✅ `outputFileTracingRoot` hinzugefügt für Monorepo-Support
- ✅ Import/Export Syntax für ESM korrigiert

### 9. **PostCSS Konfiguration**
- ✅ `postcss.config.js` → `postcss.config.cjs` umbenannt (ESM Kompatibilität)

## Migration Steps für bestehende Datenbanken

Wenn du bereits eine Datenbank hast, führe folgende Schritte aus:

```bash
# 1. Generiere neue Migrations
bun run --cwd packages/db drizzle-kit generate

# 2. Überprüfe die generierten SQL-Dateien im drizzle/ Ordner

# 3. Wende die Migrations an
bun run --cwd packages/db drizzle-kit push

# 4. Alternativ: Migrations manuell ausführen
bun run --cwd packages/db drizzle-kit migrate
```

## Erforderliche Environment Variables

Kopiere `.env.example` nach `.env` und fülle folgende Werte aus:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# NextAuth v5
AUTH_SECRET=<generiere mit: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Resend (für Email Auth)
RESEND_API_KEY=<dein-resend-key>
RESEND_FROM=noreply@example.com

# Optional: OAuth Providers
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

## Breaking Changes

### NextAuth v4 → v5
- ❌ `NEXTAUTH_SECRET` → ✅ `AUTH_SECRET`
- ❌ `import NextAuth from "next-auth"` in Route Handler → ✅ `import { handlers } from "@/auth"`
- ❌ `Email` Provider → ✅ `Resend` Provider
- Schema-Änderungen: Neue Tabellen für Authenticators (WebAuthn Support)

### Drizzle ORM
- Relational Queries benötigen jetzt `schema` beim `drizzle()` Call
- Migrations Schema sollte explizit konfiguriert werden

## Checkliste nach Migration

- [ ] `.env` Datei mit neuen Variablen aktualisiert
- [ ] Datenbank Migrations ausgeführt
- [ ] `AUTH_SECRET` generiert
- [ ] Build erfolgreich (`bun run build`)
- [ ] Lint erfolgreich (`bun run lint`)
- [ ] Tests erfolgreich (`bun run test`)

## Weiterführende Dokumentation

- [Next.js 15 App Router](https://nextjs.org/docs/app)
- [NextAuth v5 (beta)](https://authjs.dev/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Turborepo Docs](https://turbo.build/repo/docs)
