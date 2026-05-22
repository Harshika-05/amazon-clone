# Amazon Clone — Full-Stack E-Commerce Application

> **SDE Intern Fullstack Assignment** | React.js · Node.js · Express · PostgreSQL · Prisma

A production-quality, full-stack e-commerce web application that closely replicates Amazon India's design, user experience, and core functionality. Built with a component-driven React frontend and a RESTful Node.js/Express backend backed by a PostgreSQL database.

---

## 🚀 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React.js** (Vite) | Fast, component-based SPA |
| **React Router DOM v6** | Client-side routing & navigation |
| **Context API** | Global state — Auth, Cart, Wishlist |
| **CSS Modules** | Scoped styling, zero class collisions |
| **Lucide React** | Clean, consistent SVG icon set |
| **Axios** | HTTP client for all API calls |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | RESTful API server |
| **PostgreSQL** (Neon.tech) | Relational database |
| **Prisma ORM** | Type-safe schema management & queries |
| **JWT (jsonwebtoken)** | Stateless user authentication |
| **Bcryptjs** | Secure password hashing (salt rounds: 10) |
| **Nodemailer** | Order confirmation & OTP emails (Ethereal SMTP) |

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js **v16+**
- A PostgreSQL database (local or cloud — [Neon.tech](https://neon.tech) recommended)

---

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd amazon-clone
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@host:5432/amazon_clone"
JWT_SECRET="your_super_secret_jwt_key_here"
```

Push schema to the database and generate the Prisma client:
```bash
npx prisma db push
npx prisma generate
```

Seed the database with sample products, categories, and a guest user:
```bash
npm run seed
```

Start the backend development server:
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 🗄️ Database Design (Schema)

The database schema was custom-designed using **Prisma** to enforce strict relational integrity across all entities.

### Entity Relationship Diagram

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email UK
        String password
        String defaultAddress
    }
    Category {
        String id PK
        String name UK
    }
    Product {
        String id PK
        String name
        String description
        Float price
        Int stock
        String categoryId FK
    }
    ProductImage {
        String id PK
        String url
        String productId FK
    }
    Cart {
        String id PK
        String userId FK "unique"
    }
    CartItem {
        String id PK
        String cartId FK
        String productId FK
        Int quantity
    }
    Wishlist {
        String id PK
        String userId FK "unique"
    }
    WishlistItem {
        String id PK
        String wishlistId FK
        String productId FK
        DateTime createdAt
    }
    Order {
        String id PK
        String userId FK
        Float totalAmount
        String shippingAddress
        String status
        String cancellationReason
        DateTime createdAt
    }
    OrderItem {
        String id PK
        String orderId FK
        String productId FK
        Int quantity
        Float priceAtPurchase
    }
    Review {
        String id PK
        Int rating
        String comment
        String userId FK
        String productId FK
        DateTime createdAt
        DateTime updatedAt
    }
    OtpVerification {
        String id PK
        String email UK
        String otp
        DateTime expiresAt
        DateTime createdAt
    }

    User ||--o{ Order : "places"
    User ||--o| Cart : "has"
    User ||--o| Wishlist : "has"
    User ||--o{ Review : "writes"
    Category ||--o{ Product : "contains"
    Product ||--o{ ProductImage : "has"
    Product ||--o{ CartItem : "in"
    Product ||--o{ OrderItem : "in"
    Product ||--o{ WishlistItem : "in"
    Product ||--o{ Review : "receives"
    Cart ||--o{ CartItem : "contains"
    Wishlist ||--o{ WishlistItem : "contains"
    Order ||--o{ OrderItem : "contains"
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| `priceAtPurchase` on `OrderItem` | Snapshots product price at checkout — historical orders stay accurate even if the price changes later |
| `@@unique([userId, productId])` on `Review` | Database-level constraint — one review per user per product, prevents duplicates |
| `@@unique([wishlistId, productId])` on `WishlistItem` | Prevents the same product being wishlisted twice |
| One-to-one `Cart` & `Wishlist` per `User` | Enforced via `@unique` on `userId`, entities created lazily on first use |
| `cancellationReason` on `Order` | Records why an order was cancelled, mirrors Amazon's cancellation flow |
| `OtpVerification` table with `expiresAt` | Temporary OTP store with TTL — auto-cleaned after successful verification |
| Nullable `defaultAddress` on `User` | Allows registration without address; populated at checkout |

---

## 🌐 API Documentation

**Base URL:** `http://localhost:5000/api`

> 🔒 Routes marked **Auth** require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/auth/register` | — | Register (legacy direct register) |
| `POST` | `/auth/login` | — | Login and receive JWT |
| `GET` | `/auth/me` | 🔒 | Get current logged-in user profile |
| `POST` | `/auth/send-otp` | — | Send 6-digit OTP to email for signup |
| `POST` | `/auth/verify-otp` | — | Verify OTP and create account |

### Products

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/products` | — | List products. Query params: `search`, `sortBy` (name/price), `sortOrder` (asc/desc), `page`, `limit` |
| `GET` | `/products/:id` | — | Get a single product with images and category |
| `GET` | `/products/categories` | — | List all categories |

### Cart

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/cart` | 🔒 | Get user's cart with all items |
| `POST` | `/cart/items` | 🔒 | Add item to cart |
| `PUT` | `/cart/items/:id` | 🔒 | Update item quantity |
| `DELETE` | `/cart/items/:id` | 🔒 | Remove item from cart |

### Orders

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/orders` | 🔒 | Place order (clears cart, sends confirmation email) |
| `GET` | `/orders/history` | 🔒 | Get all orders for current user |
| `GET` | `/orders/:id` | 🔒 | Get single order details |
| `PATCH` | `/orders/:id/cancel` | 🔒 | Cancel a PENDING order (restores stock atomically) |

### Wishlist

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/wishlist` | 🔒 | Get user's wishlist |
| `POST` | `/wishlist/items` | 🔒 | Add product to wishlist |
| `DELETE` | `/wishlist/items/:productId` | 🔒 | Remove product from wishlist |

### Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `GET` | `/reviews/:productId` | — | Get all reviews + average rating for a product |
| `POST` | `/reviews` | 🔒 | Create or update a review (upsert — one per user per product) |
| `DELETE` | `/reviews/:productId` | 🔒 | Delete the user's review for a product |

---

## ✅ Features Implemented

### Core Features (Must Have)
| Feature | Details |
|---|---|
| **Product Listing Page** | Grid layout, product cards with Image + Name + Price + **Add to Cart** button |
| **Search** | Debounced real-time search with result count and sort controls |
| **Filter by Category** | Category nav bar + per-category product rows on homepage |
| **Sort Products** | Price (low→high / high→low), Name (A→Z / Z→A) — server-side |
| **Pagination** | Server-side pagination with numbered page buttons |
| **Product Detail Page** | Image gallery, description, price, stock status, Add to Cart, Buy Now |
| **Shopping Cart** | View all items, update quantity, remove items, subtotal + total |
| **Order Placement** | Shipping address form, order summary review, place order |
| **Order Confirmation** | Confirmation page showing Order ID and full order details |

### Bonus Features (Good to Have)
| Feature | Details |
|---|---|
| **User Authentication** | Secure JWT-based Login/Signup with bcrypt password hashing |
| **Email OTP Verification** | 2-step signup with 6-digit OTP, 10-minute expiry, resend with cooldown |
| **Order History** | Full order history with status badges (Pending / Shipped / Delivered / Cancelled) |
| **Order Cancellation** | Amazon-style — only PENDING orders cancellable, stock restored atomically in DB transaction, cancellation reason saved |
| **Wishlist** | Heart icon on product cards, dedicated wishlist page, move to cart |
| **Product Reviews** | Star rating (1–5) + comment, one review per user per product, live average displayed |
| **Email Notifications** | Ethereal SMTP — order confirmation email and OTP email with HTML templates |
| **Responsive Design** | Fully responsive across desktop, tablet, and mobile |
| **Toast Notifications** | Slide-in toasts replacing all `alert()` calls — success / error / info types |

---

## 💡 Assumptions Made

- **Payment Gateway**: Real payment processing is intentionally bypassed. Clicking "Place Order" assumes a successful transaction and proceeds directly to order creation. This matches the assignment note *"No Login Required — focus on e-commerce functionality"*.
- **Email Delivery**: Uses **Ethereal Email** (a mock SMTP service by Nodemailer) so OTP and order confirmation emails can be previewed via a URL without requiring real SMTP credentials. Switching to Gmail or SendGrid requires only updating the transporter config in `emailService.js`.
- **Stock Management**: Stock is displayed on the Product Detail page. It is **decremented** when an order is placed and **restored** when an order is cancelled, implemented inside atomic Prisma transactions.
- **Order Status Progression**: Orders are created as `PENDING`. Status progression to `SHIPPED` / `DELIVERED` is designed for admin control (not implemented in UI — outside scope of assignment).

---

## 📦 Sample Data

The database is seeded with **17 real products** across **4 categories**:

| Category | Products |
|---|---|
| Electronics | Sony WH-1000XM5, Apple iPhone 15, Samsung 4K TV, Logitech MX Master 3S, boAt Airdopes 141 |
| Books | Atomic Habits, The Psychology of Money, Rich Dad Poor Dad, Ikigai |
| Fashion | Levi's 511 Jeans, Puma Dazzler Sneakers, Allen Solly Polo, Fastrack Watch |
| Home & Kitchen | Pigeon Mixer, Philips Mixer Grinder, Prestige Mixer, Amazon Basics Dinner Set |

To re-seed at any time:
```bash
cd backend
npm run seed
```

---

## 📈 Scalability & Performance Considerations

| Pattern | Implementation |
|---|---|
| **Stateless Auth** | JWT tokens — backend can be horizontally scaled behind a load balancer with no sticky sessions |
| **Decoupled Architecture** | Frontend and backend are fully independent — frontend deployable on CDN (Vercel), backend on any Node host |
| **Server-side Pagination** | `GET /products` supports `page` + `limit` — prevents large payloads as product catalogue grows |
| **Debounced Search** | 500ms debounce on the search bar prevents server spam on every keystroke |
| **Atomic Transactions** | Order placement and order cancellation use `prisma.$transaction()` — guarantees data consistency under failure |
| **DB Connection Pooling** | Prisma ORM manages connection pools automatically — protects PostgreSQL under traffic spikes |
| **Indexed Unique Constraints** | `@@unique` constraints on frequently queried fields (`email`, `userId_productId`) ensure fast lookups |
