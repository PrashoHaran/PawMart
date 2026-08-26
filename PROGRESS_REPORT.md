# PawMart – Interim Progress Report

**Team:** V. Prashoharan, Bashini Rashmika Vindyani, J.P. Inuka Sithanja Jayasinghe, D.S.N. Vitharana, B.R.G.S. Sandaruwan
**Project:** PawMart – A One-Stop Web Marketplace for Pet Products and Pet Care Services
**Purpose of this document:** a plain summary of what we've actually built so far, checked against what we promised in our original proposal, to support our CA 02 submission.

## Where things stand

CA 02 asks for at least 35% of the project to be complete by now. Going through everything module by module against our own proposal, we're comfortably past that — realistically around half the project is working end to end, with real data flowing between a live database, a real backend, and the actual website. Nothing described below is a mockup pretending to be finished; if it's listed as done, you can register an account, click through it, and see it happen.

## What we've built so far

### The website itself (frontend)

All ten pages from our original design exist and are live: Home, Login, Marketplace, Product Details, Cart, Smart Pet Care Assistant, Appointment Booking, User Dashboard, Vendor Dashboard, and Admin Dashboard. Of those, most are no longer running on placeholder data — they talk to our real backend:

- People can actually register and log in, and stay logged in when they refresh the page.
- The Marketplace pulls real products from our database, with working search and category filters.
- The cart and checkout are real — items persist per account, totals are calculated on the server, and placing an order actually creates a record and reduces stock.
- The Vendor Dashboard is functional: a customer can apply to become a vendor, and once approved by an admin, they can add, edit, and delete their own products, and see real sales numbers.
- The Admin Dashboard shows real platform numbers (users, vendors, appointments) and lets an admin approve or reject vendor applications.
- Appointment Booking lets a logged-in user pick a real service, pick a date and time slot, and book it — the system even stops two people from booking the exact same slot.
- The Smart Pet Care Assistant is genuinely rule-based, as we promised in the proposal. It takes the pet's weight, age, and activity level and calculates a real daily calorie estimate using a standard veterinary formula, then recommends real products from our catalogue while filtering out anything matching the owner's listed allergies.

The one page still running on placeholder data is the User Dashboard (the pet-profile view), since it depends on the Pet Health Records module, which isn't built yet.

### The backend

We built a proper REST API using Node.js and Express, connected to a live MongoDB Atlas database — not a local or fake database. It covers authentication (JWT, with passwords hashed using bcrypt), role-based permissions for customers, vendors, and admins, and full CRUD operations for products, cart items, orders, vendor applications, services, and appointments. Every request is validated before it touches the database, errors come back in a consistent format, and we've added basic protections like rate limiting and security headers.

### The database

We're running on MongoDB Atlas, matching what we proposed. The collections that exist and are actively used right now are Users, Products, Carts, Orders, Vendor Applications, Services, and Appointments. This is smaller than our original ER diagram, which also included Pets, Pet Health Records, Payments as a separate collection, and Reviews — those are part of what's still left to do.

## What's still left

To be upfront about the gap: three pieces from our original proposal haven't been started yet.

- **Reviews & Ratings** — customers can't leave a review on a product yet.
- **Pet Health Records & Vaccination Reminders** — there's no pet profile storage yet, and the automatic email reminders that depend on it (via Nodemailer) haven't been built either.
- **Cloudinary for image hosting** — product images currently come from stock photo URLs rather than actual uploads.

We also haven't deployed anything yet. Everything above has been built and tested locally against our real Atlas database, but the site isn't live on Vercel or Render yet.

## How this maps to individual responsibilities

Going back to how we split the work in our proposal:

- **Prashoharan** (Authentication, Authorization, Admin Dashboard) — done.
- **Bashini** (Product Management, Vendor Dashboard) — done.
- **Inuka** (Shopping Cart, Checkout, Simulated Payment) — done.
- **Vitharana** (Order Management, Appointment Booking) — done.
- **Sandaruwan** (Reviews, Smart Pet Care Assistant, Pet Health Records & Vaccination Reminders) — the Smart Pet Care Assistant is done; Reviews and Pet Health Records are the two pieces still outstanding.

Four of the five modules are fully working. The remaining work is concentrated in one area, which gives us a clear, specific target for the next stretch of the timeline rather than a vague list of loose ends.

## Bottom line

We're past the 35% CA 02 requires, with a real, working system covering the entire core shopping flow (browse → cart → checkout → order), both the vendor and admin sides of the platform, appointment booking with conflict prevention, and a genuinely rule-based pet care assistant. What's left is well-defined: reviews, pet health records with email reminders, image hosting, and deployment.
