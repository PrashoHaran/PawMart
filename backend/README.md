# PawMart Backend

Node.js + Express + MongoDB (Mongoose) API. Phase 1 covers auth, the product catalog, cart, and checkout/orders. Appointments, vendor, and admin endpoints are a later phase.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in MONGODB_URI and JWT_SECRET
npm run seed            # populates the product catalog
npm run dev              # starts the server with nodemon
```

## Getting a MongoDB Atlas connection string

1. Create a free account at https://mongodb.com/cloud/atlas.
2. Create a free **M0** cluster.
3. **Database Access** → add a database user (username/password) — separate from your Atlas login.
4. **Network Access** → add your IP (or `0.0.0.0/0` for local dev).
5. **Connect** → **Drivers** → Node.js → copy the connection string, swap in your password, and add a database name, e.g. `.../pawmart?retryWrites=true&w=majority`.
6. Put it in `backend/.env` as `MONGODB_URI`.

## API

Response envelope: `{ data, meta? }` on success, `{ error: { code, message, details? } }` on failure.

```
POST   /api/auth/register        { name, email, password }
POST   /api/auth/login           { email, password }
GET    /api/auth/me              (auth required)

GET    /api/products             ?category=&search=&page=&limit=
GET    /api/products/:id

GET    /api/cart                 (auth required)
POST   /api/cart/items           { productId, quantity }
PATCH  /api/cart/items/:productId { quantity }
DELETE /api/cart/items/:productId
DELETE /api/cart

POST   /api/orders               { shippingAddress, paymentMethod } — checks out the current cart
GET    /api/orders
GET    /api/orders/:id
```

All money fields are integer cents (`priceCents`, `totalCents`, ...) — never floats.
