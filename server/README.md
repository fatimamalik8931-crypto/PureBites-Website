# Pure Bites — Backend

API server for the Pure Bites restaurant website.
Node.js + Express + Prisma. Development database is SQLite (no install needed).

## Requirements

- Node.js 18+ (you have v26)
- npm

## First-time setup

```bash
cd server
npm install
cp .env.example .env        # then edit .env if needed
npm run prisma:migrate      # creates prisma/dev.db and the tables
npm run db:seed             # loads the 16 menu items
```

## Run

```bash
npm run dev                 # http://localhost:4000  (auto-restarts on change)
```

- Frontend:     http://localhost:4000/
- Health check: http://localhost:4000/api/health

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the server with auto-reload |
| `npm start` | Start the server once (production style) |
| `npm run prisma:migrate` | Create/apply a new migration |
| `npm run db:seed` | Re-load menu seed data (safe to re-run) |
| `npm run prisma:studio` | Open a visual database browser |
| `npm run db:reset` | Wipe the dev database and re-seed (destructive) |

## Folder structure

```
server/
  prisma/
    schema.prisma        # database models
    seed.js              # loads menu-seed-data.js into the DB
    menu-seed-data.js    # the 16 menu items (copied from frontend)
    dev.db               # SQLite file (git-ignored, created by migrate)
  src/
    config/env.js        # loads + validates .env
    lib/
      prisma.js          # shared Prisma client
      logger.js          # pino logger
      ApiError.js        # typed HTTP errors
    middleware/
      asyncHandler.js    # forwards async errors to Express
      errorHandler.js    # central error -> JSON response
      notFound.js        # 404 for unknown /api routes
      rateLimit.js       # read / write / auth limiters
    routes/
      index.js           # mounts all /api routers
      health.routes.js   # GET /api/health
    app.js               # Express app (middleware + routes + static)
    server.js            # starts the HTTP listener
```
