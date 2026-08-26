# PawMart

**Academic Submission: Group 17**  
**Team:** V. Prashoharan, Bashini Rashmika Vindyani, J.P. Inuka Sithanja Jayasinghe, D.S.N. Vitharana, B.R.G.S. Sandaruwan

PawMart is a pet marketplace web application designed as a one-stop platform for purchasing pet products and accessing pet care services. The system combines a customer-facing marketplace with vendor, administrator, appointment booking, pet-care assistance, and pet-management features.

This repository contains two independent projects:
- A React + Vite frontend
- A Node.js + Express backend API connected to MongoDB Atlas

---

## Table of Contents

- [Project Status](#project-status)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Current Features](#current-features)
- [Team Contributions](#team-contributions)
- [Quick Start](#quick-start)
- [Development Notes](#development-notes)
- [Remaining Work](#remaining-work)
- [Documentation](#documentation)

---

## Project Status

PawMart is currently in the active MVP development stage. The core marketplace workflow and several supporting modules have been implemented and connected to the backend and database.

| Area | Status |
|---|---|
| Authentication (register/login/session) | ✅ Implemented |
| Role-based authorization | ✅ Implemented |
| Product marketplace | ✅ Implemented |
| Product search and category filtering | ✅ Implemented |
| Product details | ✅ Implemented |
| Cart | ✅ Implemented with backend/database |
| Checkout | ✅ Implemented |
| Simulated payment | ✅ Implemented |
| Order management | ✅ Implemented |
| Vendor application workflow | ✅ Implemented |
| Vendor product management | ✅ Implemented |
| Admin dashboard | ✅ Implemented |
| Appointment booking | ✅ Implemented with backend/database |
| Smart Pet Care Assistant | ✅ Implemented |
| Reviews and ratings | 🚧 Remaining |
| Pet health records | 🚧 Remaining |
| Vaccination reminders / email notifications | 🚧 Remaining |
| Cloudinary image uploads | 🚧 Remaining |
| Automated testing | 🚧 Remaining |
| Deployment | 🚧 Remaining |

---

## Repository Structure

```text
PawMart/
├── frontend/              # React + Vite single-page application
├── backend/               # Node.js + Express + MongoDB Atlas REST API
├── projectDetails/        # Project-related documentation/materials
├── Group_01.md             # Group/project information
├── PROGRESS_REPORT.md      # Current development progress
├── README.md               # Project overview and setup
└── .gitignore
```

`frontend/` and `backend/` are independently managed Node.js projects with separate `package.json` and `node_modules` directories. This is not an npm/yarn workspace.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Authentication | JWT + bcrypt |
| API | REST API |
| Development | Antigravity IDE / VS Code-compatible workflow |

---

## Current Features

### Customer / Pet Owner

- User registration and login
- Persistent authentication session
- Browse pet products
- Search products
- Filter products by category
- View product details
- Add products to cart
- Update cart quantities
- Checkout with shipping information
- Simulated payment
- View orders
- Book pet-care appointments
- Access the Smart Pet Care Assistant
- Access user profile

### Vendor

- Vendor application workflow
- Vendor dashboard
- Product management
- Product creation and management
- Vendor-related management features

### Administrator

- Admin dashboard
- Administrative management features
- Vendor application management
- Product and system management

### Pet Care

- Appointment booking
- Smart Pet Care Assistant
- Pet-care related user interactions

---

## Main Frontend UIs

The current implementation contains multiple functional UI areas, including:

1. Home / Landing Page
2. Login and Registration
3. Marketplace
4. Product Details
5. Cart and Checkout
6. Vendor Application
7. Vendor Product Management / Dashboard
8. Admin Dashboard
9. Appointment Booking
10. Smart Pet Care Assistant

These interfaces provide sufficient frontend scope for the five-member group project and allow each member to contribute to a distinct functional area.

---

## Team Contributions

| Member | Main Responsibility |
|---|---|
| V. Prashoharan | Authentication, Authorization, Admin Dashboard |
| Bashini Rashmika Vindyani | Product Management, Vendor Dashboard |
| J.P. Inuka Sithanja Jayasinghe | Cart, Checkout, Simulated Payment |
| D.S.N. Vitharana | Order Management, Appointment Booking |
| B.R.G.S. Sandaruwan | Reviews, Smart Pet Care Assistant, Pet Health Records |

The remaining work will be completed collaboratively where features require integration between multiple modules.

---

## Quick Start

Both the frontend and backend must be running to use PawMart fully.

### 1. Backend

Open a terminal:

```bash
cd backend
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

On Windows PowerShell, if required:

```powershell
Copy-Item .env.example .env
```

Configure the required environment variables in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

Then seed the product catalogue:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

The API base URL is:

```text
http://localhost:5000/api
```

### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend normally runs on:

```text
http://localhost:5173
```

Open the displayed Vite URL in your browser.

> If port 5173 is already in use, Vite may automatically start on another port such as 5174. Make sure the backend CORS/frontend configuration matches the port being used.

---

## Database

PawMart uses MongoDB Atlas as the database.

The current application uses collections/models for areas including:

- Users
- Products
- Carts
- Orders
- Vendor Applications
- Services
- Appointments

The product seed script inserts the initial product catalogue into MongoDB.

---

## Development Workflow

The project uses feature-based development.

Recommended workflow:

```text
main
  │
  ├── feature/authentication
  ├── feature/admin-dashboard
  ├── feature/product-management
  ├── feature/vendor-dashboard
  ├── feature/cart-checkout
  ├── feature/order-management
  ├── feature/appointment-booking
  └── feature/pet-health
```

Development changes should be made on feature branches and merged into `main` through pull requests.

Do not commit directly to `main` for feature development.

---

## Remaining Work

The following areas are planned for the next development stage:

### Reviews and Ratings

- Product/service reviews
- Rating system
- Review storage
- Display ratings and reviews

### Pet Health Records

- Pet profile management
- Health record management
- Vaccination records
- Vaccination dates
- Reminder functionality

### Email Notifications

- Nodemailer integration
- Vaccination reminders
- Relevant appointment or system notifications

### Image Management

- Cloudinary integration
- Product image uploads
- Replace temporary/stock image URLs with managed uploads

### Testing

- Backend API tests
- Authentication tests
- Core business logic tests
- Frontend/component testing where appropriate
- Integration testing

### Deployment

Planned deployment targets include:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

---

## Development Notes

- `frontend/` and `backend/` must be run separately.
- The backend requires a valid MongoDB Atlas connection.
- `backend/.env` contains local secrets and must never be committed.
- Only `.env.example` files should be committed to GitHub.
- Do not expose MongoDB credentials or JWT secrets in screenshots, documentation, commits, or public repositories.
- There is currently no root-level build/lint/test command.
- Run npm scripts from the relevant `frontend/` or `backend/` directory.

---

## Documentation

| Document | Covers |
|---|---|
| `frontend/README.md` | Frontend setup, routes, state management, styling and scripts |
| `backend/README.md` | Backend setup, environment variables, API reference and data models |
| `PROGRESS_REPORT.md` | Current implementation progress |
| `projectDetails/` | Project-related documentation and supporting materials |

---

## Academic Project

**Project:** PawMart  
**Group:** Group 17  
**Team Size:** 5 Members

PawMart is being developed as a group Software Engineering project with a focus on implementing a functional pet marketplace, service booking, role-based dashboards, and supporting pet-care features using a modern web application architecture.
