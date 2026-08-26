# Interim Progress Report (CA 02)

**Group:** Group_17
**Project:** PawMart – A One-Stop Web Marketplace for Pet Products and Pet Care Services
**Team:** V. Prashoharan, Bashini Rashmika Vindyani, J.P. Inuka Sithanja Jayasinghe, D.S.N. Vitharana, B.R.G.S. Sandaruwan

Overall project completion at the time of this report: **approximately 50%**, above the 35% minimum required for this submission.

Each screenshot below has a placeholder — replace `*(Insert screenshot here)*` with the actual image when assembling the final submission.

---

## Frontend

### 1. Home Page
*(Insert screenshot here)*
The landing page introducing PawMart, with navigation to the marketplace, appointment booking, and the Smart Pet Care Assistant. Fully responsive with a working mobile menu.

### 2. Login / Register Page
*(Insert screenshot here)*
Real authentication is wired up here — users can register or log in, and the session persists across page reloads using a JWT token.

### 3. Product Listing (Marketplace)
*(Insert screenshot here)*
Products are pulled live from our MongoDB Atlas database, with working category filters and a search bar that queries the backend as you type.

### 4. Product Detail Page
*(Insert screenshot here)*
Shows full product information fetched by ID from the API, with a quantity selector and an "Add to Cart" action tied to the logged-in user's real cart.

### 5. Shopping Cart & Checkout
*(Insert screenshot here)*
Cart contents are stored server-side per user. Checkout collects a shipping address and payment method (simulated, as planned in our proposal) and creates a real order on submission.

### 6. Vendor Dashboard – Application Form
*(Insert screenshot here)*
A customer without vendor access sees this form to apply for vendor status with a business name and type. The application is submitted to the backend and reviewed by an admin.

### 7. Vendor Dashboard – Product Management
*(Insert screenshot here)*
Once approved, a vendor sees their own real sales stats and an inventory table where they can add, edit, and delete their own products.

### 8. Admin Dashboard
*(Insert screenshot here)*
Shows live platform statistics (total users, vendors, appointments) and a list of pending vendor applications that the admin can approve or reject in real time.

### 9. Appointment Booking
*(Insert screenshot here)*
Users pick a real service, date, and time slot. The system prevents two people from booking the exact same slot and stores the booking against the logged-in user.

### 10. Smart Pet Care Assistant
*(Insert screenshot here)*
A logged-in user enters their pet's details (type, breed, age, weight, activity level, allergies) and receives a calculated daily feeding recommendation plus real product suggestions from our catalogue, with any allergy-matching products automatically excluded.

---

## Backend

### 11. REST API Response
*(Insert screenshot here)*
Example response from `GET /api/products`, showing the API returning real product data from the database in a consistent JSON format.

### 12. Authentication Endpoint
*(Insert screenshot here)*
Example response from `POST /api/auth/login`, returning a signed JWT token used to authenticate all subsequent requests.

### 13. CRUD & Business Logic in Action
*(Insert screenshot here)*
Example of the appointment booking endpoint rejecting a duplicate time-slot request with a `409 Conflict` response, showing real validation logic rather than a static form.

---

## Database

### 14. MongoDB Atlas – Collections Overview
*(Insert screenshot here)*
The live Atlas cluster showing our active collections: Users, Products, Carts, Orders, VendorApplications, Services, and Appointments.

### 15. Sample Document Structure
*(Insert screenshot here)*
A sample product document from Atlas, showing the schema fields (name, price, category, vendor reference, stock, etc.) as actually stored in the database.

---

**Note:** Reviews & Ratings, Pet Health Records with vaccination reminders, Cloudinary image hosting, and deployment are the remaining items from our original proposal and are not yet reflected above.
