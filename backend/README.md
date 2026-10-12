# PawMart Backend

REST API for [PawMart](../README.md), a pet marketplace app. Built with Node.js, Express, and MongoDB (via Mongoose), and connects to a MongoDB Atlas cluster.

This is **Phase 1** of the backend: authentication, the product catalog, a per-user cart, and checkout/orders. Appointments, vendor tools, and admin approval endpoints are not implemented yet — those pages on the frontend still run on local mock data.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Reference](#api-reference)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Security](#security)
- [Scripts](#scripts)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)

## Overview

The backend exposes a JSON REST API under `/api`, backed by MongoDB Atlas. It follows a layered architecture (`routes → controllers → models`) with shared middleware for auth, validation, and error handling. Every response follows a consistent envelope so the frontend (and any other client) can handle success/error cases uniformly.

## Key Features

- **Authentication** — email/password signup and login, JWT-based sessions, bcrypt password hashing
- **Product catalog** — list with category/search filtering and pagination, fetch by ID
- **Cart** — per-user, server-persisted cart with add/update/remove operations
- **Checkout** — atomic stock validation and decrement per item, tax/shipping calculation, order creation, cart clearing
- **Validation** — every request body/query is validated with [Zod](https://zod.dev) before it reaches a controller
- **Security baseline** — Helmet security headers, CORS restricted to the frontend origin, rate limiting (tighter on auth routes)
- **Consistent error handling** — a single error-handling middleware maps Mongo/validation/custom errors to the right HTTP status and a uniform JSON shape

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | [Express](https://expressjs.com/) 4 |
| Database | MongoDB Atlas |
| ODM | [Mongoose](https://mongoosejs.com/) 8 |
| Auth | [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| Validation | [Zod](https://zod.dev) |
| Security | [Helmet](https://helmetjs.github.io/), [cors](https://github.com/expressjs/cors), [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) |
| Logging | [morgan](https://github.com/expressjs/morgan) |
| Config | [dotenv](https://github.com/motdotla/dotenv) |
| Dev tooling | [nodemon](https://nodemon.io/) |

Full dependency list and versions: [package.json](package.json).

## Project Structure

```
backend/
├── server.js                  # Entry point: connects DB, starts the HTTP server, handles graceful shutdown
├── src/
│   ├── app.js                 # Express app assembly (middleware, routes, error handlers) — no listen()
│   ├── config/
│   │   ├── env.js             # Loads and validates required environment variables
│   │   └── db.js              # Mongoose connection with retry logic and connection event logging
│   ├── models/                # Mongoose schemas: User, Product, Cart, Order
│   ├── controllers/           # Route handler logic (one file per resource)
│   ├── routes/                # Express routers (one file per resource) + routes/index.js mounting them
│   ├── middleware/
│   │   ├── auth.js            # requireAuth — verifies JWT and attaches req.user
│   │   ├── validate.js        # validateBody / validateQuery (Zod) / validateObjectId
│   │   ├── errorHandler.js    # Centralized error handler + 404 handler
│   │   └── rateLimiter.js     # apiLimiter (general) and authLimiter (stricter, login/register)
│   ├── validators/            # Zod schemas, one per resource
│   ├── utils/
│   │   ├── ApiError.js        # Typed error class with status/code helpers
│   │   ├── ApiResponse.js     # sendData() — writes the { data, meta } success envelope
│   │   └── asyncHandler.js    # Wraps async route handlers so rejected promises reach the error handler
│   └── scripts/
│       └── seed.js            # Populates the product catalog with starter data
├── .env.example                # Template for required environment variables
└── package.json
```

## Setup & Installation

**Prerequisites:** Node.js (a recent LTS version is recommended — the project uses ES Modules and modern dependency versions), npm, and a MongoDB Atlas account (free tier is enough).

```bash
cd backend
npm install
cp .env.example .env
```

Then fill in `.env` — see [Environment Variables](#environment-variables) below.

### Getting a MongoDB Atlas connection string

If you don't already have an Atlas cluster:

1. Create a free account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas).
2. Create a free **M0** cluster.
3. **Database Access** → add a database user (username/password) — this is separate from your Atlas login.
4. **Network Access** → add your IP address (or `0.0.0.0/0` for local development).
5. On the cluster, click **Connect** → **Drivers** → **Node.js**, and copy the connection string.
6. Replace `<password>` with your database user's password, and add a database name after the host, e.g. `.../pawmart?retryWrites=true&w=majority`.
7. Paste the full string into `.env` as `MONGODB_URI`.

## Environment Variables

Defined in [`.env.example`](.env.example). Copy it to `.env` (gitignored) and fill in real values — the server validates that `MONGODB_URI` and `JWT_SECRET` are present at startup and throws immediately if either is missing.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Port the HTTP server listens on |
| `NODE_ENV` | No | `development` | `development` enables verbose (`dev`-format) request logging; anything else uses `combined` format |
| `MONGODB_URI` | **Yes** | — | Full MongoDB Atlas connection string, including database name |
| `JWT_SECRET` | **Yes** | — | Secret used to sign/verify JWTs — use a long random string |
| `FRONTEND_URL` | No | `http://localhost:5173` | Origin allowed by CORS (the Vite dev server by default); also used for links in emails |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | No | — | Enables image uploads (product images, pet photos). If unset, forms fall back to an image-URL field |
| `SMTP_HOST` | No | — | SMTP server. **If unset, emails are printed to the console instead of sent** |
| `SMTP_PORT` | No | `587` | SMTP port |
| `SMTP_SECURE` | No | `false` | `true` for implicit TLS (port 465); `false` uses STARTTLS on 587 |
| `SMTP_USER` / `SMTP_PASS` | No | — | SMTP credentials (for Gmail, an [App Password](https://support.google.com/accounts/answer/185833)) |
| `EMAIL_FROM` | No | `PawMart <no-reply@pawmart.local>` | Sender shown on outgoing emails |
| `REMINDERS_ENABLED` | No | `true` | Set `false` to disable the daily vaccination reminder job |
| `REMINDER_CRON` | No | `0 8 * * *` | Cron expression for the reminder job |
| `REMINDER_TZ` | No | `Asia/Colombo` | Timezone the cron expression is evaluated in |
| `REMINDER_DAYS_BEFORE` | No | `7` | Remind about vaccinations due within this many days (overdue ones are always included) |

### Image uploads (Cloudinary)

Uploads go **directly from the browser to Cloudinary** using signed uploads, so files never pass through this server and the API secret never reaches the client:

1. The frontend calls `POST /api/uploads/signature` with `{ "purpose": "product" | "pet" }`. Product images are vendor-only; pet photos are available to any signed-in user.
2. The server returns a short-lived signature restricted to JPG/PNG/WebP and a fixed folder (`pawmart/products` or `pawmart/pets/<userId>`).
3. The browser uploads the file to Cloudinary and saves the returned `secure_url` on the product or pet.

`GET /api/uploads/config` tells the frontend whether uploads are enabled. Cloudinary images are displayed with delivery transformations (`c_limit,w_<n>,f_auto,q_auto`) so each view loads a resized, compressed version. The 5 MB size limit is checked in the browser; to enforce it on Cloudinary's side as well, create a signed upload preset with a max file size.

### Email notifications

Emails are sent with Nodemailer and never block or fail the action that triggers them.

- **Order confirmation** — sent after a successful checkout.
- **Vaccination reminders** — a `node-cron` job (daily, 08:00 Asia/Colombo by default) emails each owner about pets whose latest dose of a vaccine is due within `REMINDER_DAYS_BEFORE` days or overdue — one email per pet. Each vaccination remembers the due date it was reminded about (`reminderSentFor`), so a reminder is sent once per due date; editing the due date re-arms it. Failed sends are retried on the next run.
- Admins can trigger the reminder job immediately with `POST /api/admin/reminders/vaccinations/run` (or the **Send Vaccine Reminders Now** button on the Admin Hub) — useful for demos, and on free hosting tiers where a sleeping server can miss the scheduled run.

For local testing without a real mailbox, leave `SMTP_HOST` empty (emails go to the console), or run [Mailpit](https://mailpit.axllent.org/) (`docker run -p 1025:1025 -p 8025:8025 axllent/mailpit`) with `SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025` and open http://localhost:8025.

## Running the Project

```bash
npm run dev      # start with nodemon (auto-restarts on file changes)
npm run seed      # populate the product catalog (run once, or after wiping the DB)
npm run start      # start without nodemon (e.g. in production)
```

On successful startup you should see:

```
[mongo] connected
[server] listening on port 5000
```

A health check is available at `GET /health` (returns `{ "data": { "status": "ok" } }`) — useful for verifying the server is up without touching the database-backed routes.

## API Reference

Base path: `/api`. All request/response bodies are JSON.

**Response envelope** — every endpoint responds with one of these two shapes:

```jsonc
// Success
{ "data": { /* ... */ }, "meta": { /* optional, e.g. pagination */ } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid input", "details": [ /* optional */ ] } }
```

**Auth** — protected routes expect `Authorization: Bearer <token>`. Money fields (`priceCents`, `subtotalCents`, `totalCents`, etc.) are always **integer cents**, never floats.

### Auth

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | No | `{ name, email, password }` | Create an account, returns the user + a JWT |
| POST | `/api/auth/login` | No | `{ email, password }` | Log in, returns the user + a JWT |
| GET | `/api/auth/me` | Yes | — | Returns the currently authenticated user |

<details>
<summary>Example: register</summary>

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret123"}'
```

```json
{
  "data": {
    "user": { "_id": "...", "name": "Jane Doe", "email": "jane@example.com", "role": "customer", "tokenVersion": 0, "createdAt": "...", "updatedAt": "..." },
    "token": "eyJhbGciOi..."
  }
}
```
</details>

### Products

| Method | Endpoint | Auth | Query/Body | Description |
|---|---|---|---|---|
| GET | `/api/products` | No | `?category=&search=&page=&limit=` | List products, paginated |
| GET | `/api/products/:id` | No | — | Get a single product by ID |

`category` and `search` are optional filters (`search` uses MongoDB text search on the product name). `page` defaults to `1`, `limit` defaults to `20` (max `100`).

<details>
<summary>Example: list products</summary>

```bash
curl "http://localhost:5000/api/products?category=Food&limit=10"
```

```json
{
  "data": [ { "_id": "...", "name": "...", "priceCents": 4599, "category": "Food", "stock": 50, "...": "..." } ],
  "meta": { "page": 1, "per_page": 10, "total": 2 }
}
```
</details>

### Cart

All cart routes require authentication and operate on the logged-in user's own cart.

| Method | Endpoint | Body | Description |
|---|---|---|---|
| GET | `/api/cart` | — | Get the current cart (items + subtotal) |
| POST | `/api/cart/items` | `{ productId, quantity }` | Add an item (merges quantity if already present) |
| PATCH | `/api/cart/items/:productId` | `{ quantity }` | Set an item's quantity to an absolute value |
| DELETE | `/api/cart/items/:productId` | — | Remove a single item |
| DELETE | `/api/cart` | — | Empty the cart |

Every cart response has the same shape:

```json
{
  "data": {
    "items": [
      { "product": { "_id": "...", "name": "...", "image": "...", "priceCents": 4599, "stock": 50 }, "quantity": 2, "lineTotalCents": 9198 }
    ],
    "subtotalCents": 9198
  }
}
```

### Orders

All order routes require authentication.

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/api/orders` | `{ shippingAddress, paymentMethod }` | Check out the current cart — creates an order, decrements stock, clears the cart |
| GET | `/api/orders` | — | List the current user's orders |
| GET | `/api/orders/:id` | — | Get a single order (must belong to the current user) |

`paymentMethod` is one of `credit_card` or `cash_on_delivery`. `shippingAddress` requires `firstName`, `lastName`, `address`, `city`, `postalCode`.

Checkout re-validates stock for every cart item and atomically decrements it (`stock >= quantity` guard on the update). If any item is short, already-decremented items from the same request are rolled back and the request fails with `409 CONFLICT` — no partial orders are created.

### Full Endpoint Summary

| Method | Endpoint | Auth Required |
|---|---|:---:|
| POST | `/api/auth/register` | ✗ |
| POST | `/api/auth/login` | ✗ |
| GET | `/api/auth/me` | ✓ |
| GET | `/api/products` | ✗ |
| GET | `/api/products/:id` | ✗ |
| GET | `/api/cart` | ✓ |
| POST | `/api/cart/items` | ✓ |
| PATCH | `/api/cart/items/:productId` | ✓ |
| DELETE | `/api/cart/items/:productId` | ✓ |
| DELETE | `/api/cart` | ✓ |
| POST | `/api/orders` | ✓ |
| GET | `/api/orders` | ✓ |
| GET | `/api/orders/:id` | ✓ |
| GET | `/health` | ✗ |

## Data Models

| Model | Key Fields |
|---|---|
| **User** | `name`, `email` (unique), `passwordHash`, `role` (`customer` \| `vendor` \| `admin`, default `customer`), `tokenVersion` |
| **Product** | `name`, `priceCents`, `rating`, `category`, `image`, `description`, `features[]`, `vendorName`, `stock` |
| **Cart** | `userId` (unique — one cart per user), `items: [{ product, quantity }]` |
| **Order** | `userId`, `items: [{ product, name, priceCents, quantity }]` (price snapshot at purchase time), `subtotalCents`, `taxCents`, `shippingCents`, `totalCents`, `status`, `shippingAddress`, `paymentMethod` |

Full field definitions with types, defaults, and indexes are in `src/models/`. Notes:

- Passwords are never returned in API responses (`User.toJSON` strips `passwordHash`).
- `Order.items` stores a **snapshot** of the product name/price at checkout time — it doesn't change if the product is later edited or deleted.
- Tax is calculated as 8% of the subtotal; shipping is a flat $5.99 (`599` cents) unless the subtotal exceeds $50 (`5000` cents), in which case it's free.

## Error Handling

All errors — thrown `ApiError`s, Mongoose validation errors, invalid ObjectId `CastError`s, and MongoDB duplicate-key (`11000`) errors — are caught by a single middleware (`src/middleware/errorHandler.js`) and normalized into the `{ error: { code, message, details? } }` shape with the right HTTP status:

| Status | Code | Typical Cause |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Zod validation failure, invalid ObjectId, Mongoose validation error |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token |
| 403 | `FORBIDDEN` | (reserved for future role-based checks) |
| 404 | `NOT_FOUND` | Resource not found, or an unmatched route |
| 409 | `CONFLICT` | Duplicate email on register, insufficient stock at checkout |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unhandled server error |

## Security

- Passwords hashed with bcrypt (`bcryptjs`, 10 salt rounds)
- JWTs signed with `JWT_SECRET`, 1-day expiry; each carries a `tokenVersion` claim checked against the user record, so bumping a user's `tokenVersion` invalidates all their existing tokens
- `helmet()` sets standard security headers
- CORS locked to a single configured origin (`FRONTEND_URL`)
- Rate limiting: 300 requests / 15 min on `/api/*` generally, 20 requests / 15 min on auth routes specifically
- All mutating routes validate their input with Zod before touching the database
- Route params expected to be Mongo ObjectIds are validated before use, avoiding raw driver errors leaking as 500s

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the server with `nodemon` (auto-restart on changes) |
| `npm run start` | Start the server directly with `node` |
| `npm run seed` | Wipe and repopulate the `Product` collection with starter catalog data |

## Deployment Notes

There is no deployment configuration (Dockerfile, CI/CD, hosting-specific config) in this repo yet — the project has been run locally against MongoDB Atlas only. If deploying:

- Set `MONGODB_URI`, `JWT_SECRET`, and `FRONTEND_URL` (pointing at the deployed frontend origin) as real environment variables on the host — never commit `.env`.
- Use `npm run start` (not `dev`) in production.
- Atlas's **Network Access** list must allow the deployment host's outbound IP (or `0.0.0.0/0`, with the tradeoffs that implies).
- `NODE_ENV=production` switches request logging to the more compact `combined` format.
- Set the `SMTP_*` and `EMAIL_FROM` variables to send real emails. Free-tier hosts (e.g. Render) sleep when idle, so the 08:00 reminder job may not fire — use the admin "run now" endpoint, or an external scheduler that calls it.

## Troubleshooting

| Problem | Likely Cause / Fix |
|---|---|
| Server exits immediately with `Missing required environment variable` | `.env` wasn't created, or is missing `MONGODB_URI`/`JWT_SECRET` — see [Environment Variables](#environment-variables) |
| `querySrv ENOTFOUND ...mongodb.net` on startup | Usually a transient DNS hiccup right after creating a new Atlas cluster; the connection logic retries automatically (up to 5 attempts) — if it persists, double-check the cluster hostname in `MONGODB_URI` |
| `MongoServerError: bad auth` | Wrong database user/password in `MONGODB_URI` — note this is the **database user** created under Atlas's Database Access, not your Atlas account login |
| Connection hangs / times out | Your current IP isn't in Atlas's Network Access list |
| `401 Unauthorized` on a route you just logged in for | Token wasn't sent (`Authorization: Bearer <token>` header), has expired (1-day lifetime), or the user's `tokenVersion` changed since the token was issued |
| CORS error in the browser console | `FRONTEND_URL` in `.env` doesn't match the origin the frontend is actually running on |
| `409 CONFLICT` on checkout | A cart item's quantity exceeds current stock — re-fetch the cart/product to see live stock |
