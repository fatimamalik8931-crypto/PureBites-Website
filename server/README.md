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

## API — public menu

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/menu` | All available items |
| GET | `/api/menu?category=burgers` | Filter by category (`burgers`, `sandwiches`, `sides`, `drinks`) |
| GET | `/api/menu?featured=true` | Only featured (or `false` for the rest) |
| GET | `/api/menu/:id` | One item by its public id, e.g. `/api/menu/b1` |

List response: `{ items: [ { id, cat, name, price, tag, desc, img, featured } ], count, filters }`
Single response: `{ item: { ... } }`
Errors: `{ error: { message, code, details? } }` — `400 VALIDATION_ERROR` for a bad
category/featured/id, `404 NOT_FOUND` for an unknown or unavailable item.

Unavailable items (`isAvailable = false`) never appear in either endpoint.

## API — contact form

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/contact` | Submit the public contact form (`#contactForm`) |

Request body (JSON):

```json
{ "name": "Ali Khan", "email": "ali@example.com", "message": "Do you cater for 30 people?" }
```

- `name` 2–100 chars · `email` valid, stored lower-cased · `message` 10–2000 chars
- `website` — optional honeypot field. If non-empty the API returns a normal
  success but stores nothing (a bot filled a field real users can't see).
- Rate limit: `writeLimiter` (20 requests / hour / IP).

Success: `201 { ok: true, message, id }`
Errors: `400 VALIDATION_ERROR` with `error.details` giving per-field messages.

Every submission is written to the `ContactMessage` table first. An email
notification to `NOTIFY_TO` is then attempted as a best-effort extra — if SMTP
is not configured (`SMTP_USER` / `SMTP_PASS` / `NOTIFY_TO` blank) or the send
fails, it is logged and the request still succeeds.

## API — reservations

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/reservations` | Submit the public booking form (`#reserveForm`) |

Request body (JSON):

```json
{
  "name": "Bilal Ahmed", "phone": "0315 3155632",
  "date": "2027-01-15", "time": "19:30",
  "guests": 4, "seating": "Outdoor", "note": "Window seat please"
}
```

- `name` 3–100 · `phone` valid PK mobile (punctuation stripped) · `date`
  `YYYY-MM-DD`, today or later (Asia/Karachi) · `time` `HH:MM` · `guests` 1–20 ·
  `seating` one of `Indoor` / `Outdoor` / `Family cabin` · `note` optional ≤ 500
- `website` — honeypot, same behaviour as the contact form
- Rate limit: `writeLimiter` (20 requests / hour / IP)

Success: `201 { ok: true, message, id }`
Errors: `400 VALIDATION_ERROR` with `error.details` per-field messages.

Stored in the `Reservation` table. `date` + `time` are also combined into
`reservedAt` (an absolute UTC instant, pinned to UTC+5) for chronological
sorting in the future admin dashboard. Same best-effort email as above.

## API — orders

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/orders` | Place a delivery order from the public `#order` card |

Request body (JSON):

```json
{
  "customerName": "Ali Khan", "phone": "0300 1234567",
  "address": "House 12, Street 4, Charsadda",
  "note": "Ring the bell twice",
  "payment": "cod",
  "items": [ { "code": "b1", "quantity": 2 }, { "code": "f1", "quantity": 1 } ]
}
```

- `customerName` 3–100 · `phone` valid PK mobile · `address` 10–300 ·
  `note` optional ≤ 500 · `payment` one of `cod` / `online`
- `items` 1–50 lines of `{ code, quantity }` — `quantity` 1–20. Duplicate
  codes are merged. **No prices or totals are accepted from the client.**
- `website` — honeypot, same behaviour as the other forms
- Rate limit: `writeLimiter` (20 requests / hour / IP)

The server looks up every `code` in the `MenuItem` table (available items
only) and recomputes `unitPrice`, `lineTotal`, `subtotal` and `total`
itself. A tampered client total can never be stored.

Success: `201 { ok: true, message, id, reference, total }` — `reference`
is a short code like `PB-3F9K2` shown to the customer.
Errors: `400 VALIDATION_ERROR` with per-field messages;
`409 ITEM_UNAVAILABLE` with `error.details.items` listing codes that can no
longer be ordered.

Stored as an `Order` row plus one `OrderItem` per line (name + price
snapshotted at order time). Same best-effort email as above.

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
    migrations/          # generated SQL, checked into git
    dev.db               # SQLite file (git-ignored, created by migrate)
  src/
    config/env.js        # loads + validates .env
    lib/
      prisma.js          # shared Prisma client
      logger.js          # pino logger
      ApiError.js        # typed HTTP errors
      mailer.js          # best-effort email notifications (Nodemailer)
    middleware/
      asyncHandler.js    # forwards async errors to Express
      validate.js        # Zod request validation -> req.valid
      errorHandler.js    # central error -> JSON response
      notFound.js        # 404 for unknown /api routes
      rateLimit.js       # read / write / auth limiters
    validators/
      menu.validators.js        # query + param schemas for the menu API
      contact.validators.js     # body schema for the contact form
      reservation.validators.js # body schema for the booking form
      order.validators.js       # body schema for the order form
    services/
      menu.service.js        # menu queries + response shaping
      contact.service.js     # store message + trigger notification email
      reservation.service.js # store booking + trigger notification email
      order.service.js       # price the basket from the DB, store order + items
    routes/
      index.js               # mounts all /api routers
      health.routes.js       # GET /api/health
      menu.routes.js         # GET /api/menu, /api/menu/:id
      contact.routes.js      # POST /api/contact
      reservation.routes.js  # POST /api/reservations
      order.routes.js        # POST /api/orders
    app.js               # Express app (middleware + routes + static)
    server.js            # starts the HTTP listener
```
