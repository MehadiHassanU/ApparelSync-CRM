# ApparelSync-CRM — Clothing Retail Shop POS & CRM Suite

ApparelSync-CRM is a modern, high-performance Customer Relationship Management (CRM) and Point of Sale (POS) system built for clothing and retail apparel businesses. Powered by **Next.js 14 (App Router)**, **Tailwind CSS**, and **Supabase (PostgreSQL)**, it streamlines inventory management, live camera QR scanning, customer profiling, lifetime value (LTV) analytics, and POS transactions.

---

## 🚀 Tech Stack

- **Frontend Framework:** Next.js 14 (React 18, App Router)
- **Styling & Aesthetics:** Tailwind CSS (Dark Mode Design System)
- **Backend & Database:** Supabase (PostgreSQL with RLS policies)
- **UI Component System:** `@base-ui/react` (Shadcn/ui base-nova design primitives)
- **QR / Barcode Scanning:** `html5-qrcode` & `qrcode.react`
- **Charts & Data Visualization:** Recharts
- **Testing Suite:** Vitest + JSDOM + `@testing-library/react`

---

## 📊 Feature Implementation Status (10 User Stories)

Here is the master roadmap tracking what has been built and what is available for team extension.

### Scorecard Summary
- **User Stories Completed:** 5 / 10
- **User Stories Partially Completed:** 1 / 10
- **User Stories Not Started:** 4 / 10

---

### Completed Features ✅

#### 1. Product Inventory CRUD (User Story 1) — ✅ **COMPLETED**
- **Details:** Full CRUD operations on the `products` table. Includes search, category filtering, auto-SKU generation, and low-stock warning badges (stock &le; 5).
- **Location:** [src/app/dashboard/inventory/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/inventory/page.tsx)

#### 2. Live Barcode/QR POS Scanner (User Story 2) — ✅ **COMPLETED**
- **Details:** Responsive web camera QR scanner using low-density plain SKU strings for fast decode on webcams. Supports manual SKU/barcode search, cross-browser Web Audio scan beep, instant cart building, and printable ticket-style receipts.
- **Location:** [src/app/dashboard/scanner/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/scanner/page.tsx) & [src/components/scanner/ScannerCamera.tsx](file:///n:/app_sync/ApparelSync-CRM/src/components/scanner/ScannerCamera.tsx)

#### 3. Automatic Inventory Stock Deductions (User Story 4) — ✅ **COMPLETED**
- **Details:** POS checkout automatically runs atomic stock deductions (`stock_quantity = stock_quantity - item.quantity`) in Supabase.
- **Location:** `handleCheckout` in [scanner/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/scanner/page.tsx)

#### 4. Customer Profiles & LTV Intelligence (User Story 6) — ✅ **COMPLETED**
- **Details:** Dedicated Customer Profiles module at `/dashboard/customers`. Records customer name, phone, email, address, city, and notes. Tracks cumulative Customer Lifetime Value (LTV), order counts, and returning customer ratios. Includes autocomplete integration in POS checkout.
- **Location:** [src/app/dashboard/customers/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/customers/page.tsx)

#### 5. Customer Purchase History Timeline (User Story 8) — ✅ **COMPLETED**
- **Details:** Slide-over customer profile drawer rendering full transactional order history linked via `customer_id`. Displays order numbers, dates, payment modes, total spent, and status badges.
- **Location:** `viewCustomer` drawer in [customers/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/customers/page.tsx)

---

### In Progress / Partially Built 🚧

#### 6. Low-Stock Alerts (User Story 5) — ⚠️ **PARTIAL**
- **Details:** Inventory page flags products with stock &le; 5 with amber warning badges.
- **Next steps:** Add configurable per-product thresholds and top banner notifications on the main Dashboard.

---

### Pending Backlog (Ready for Team Extension) 📋

Teammates (Safin, Uthso, etc.) can build directly on top of the Customer Profiles and Sales schema for the following upcoming features:

#### 7. Loyalty Points & Rewards System (User Story 7)
- **Extending Customer Profiles:** Add a `loyalty_points` integer field to the `customers` table (e.g. 1 point per $10 spent). Auto-increment points in POS `handleCheckout` and display point balances on customer profiles.

#### 8. Sales Reports & Business Insights (User Story 9)
- **Extending Analytics:** Leverage aggregated `sales` and `customers` LTV data to build top-buyer leaderboards, monthly revenue trends, and sales category charts on `/dashboard`.

#### 9. Invoice Generation & PDF Exports (User Story 3)
- **Extending Receipts:** Render printable PDF invoices using `jspdf` or `html2pdf` from POS checkout receipts or order records.

#### 10. Digital Email Invoices (User Story 10)
- **Extending Communications:** Use the customer `email` field captured in Customer Profiles to send digital PDF receipts after checkout using an email provider (Resend, SendGrid, or Nodemailer).

---

## 👥 Team Branching Strategy

The repository follows a clean, single-main team workflow:

- `main`: Production-ready branch containing merged and tested code.
- `Nafis`: Customer Profiles, Purchase History, POS Autocomplete, and schema enhancements.
- `Safin`: Assigned feature workspace branch.
- `Uthso`: Assigned feature workspace branch.

### Teammate Workflow
1. Switch to your designated branch: `git checkout <YourName>`
2. Pull latest from main: `git pull origin main`
3. Commit and push your changes: `git push origin <YourName>`

---

## 🛠️ Developer Setup & Commands

### Prerequisites
Node.js 20+ installed.

### Installation
```bash
npm install
```

### Database Migrations
Apply SQL migration scripts in order from `supabase/migrations/`:
1. `20260705172127_init_schema.sql` (Products, Categories, Sales, Sale Items)
2. `20260726000000_enhance_customers_schema.sql` (Customer Profiles schema)

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Test Suite
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## 📜 License & Credit Attribution

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)** - see the [LICENSE](file:///n:/app_sync/ApparelSync-CRM/LICENSE) file for full details.

### Commercial & Public Use Terms
ApparelSync-CRM is open-source. Anyone is free to use, modify, and distribute this software for personal or commercial purposes under the GNU GPL v3.0 license, provided that **attribution credit is given to the original authors** (ApparelSync CRM Team: **Mehadi Hassan Uthso, Nafis, Safin**).
