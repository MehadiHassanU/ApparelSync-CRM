# ApparelSync-CRM — Clothing Retail Shop POS & CRM Suite

ApparelSync-CRM is a Customer Relationship Management (CRM) and Point of Sale (POS) system designed for retail apparel businesses. Built with **Next.js 14 (App Router)**, **Tailwind CSS**, and **Supabase (PostgreSQL)**, it streamlines inventory management, customer profiling, and sales checkouts.

---

## 🚀 Tech Stack

- **Frontend Framework:** Next.js 14 (React 18)
- **Styling:** Tailwind CSS (Dark Mode Design System)
- **Backend / Database:** Supabase (PostgreSQL)
- **UI Components:** `@base-ui/react` (Shadcn/ui base-nova design primitives)
- **QR / Barcode Scanning:** `html5-qrcode` & `qrcode.react`
- **Charts / Visualizations:** Recharts
- **Testing Suite:** Vitest + JSDOM + `@testing-library/react`

---

## 📊 Feature Implementation Status (10 User Stories)

Here is the master roadmap tracking what has been built and what is planned. Use this section to align with other developers or Agentic AIs.

### Scorecard Summary
- **User Stories Completed:** 2 / 10
- **User Stories Partially Completed:** 2 / 10
- **User Stories Not Started:** 6 / 10

---

### Phase 1: Completed / In Progress 🚧

#### 1. Product Inventory CRUD (User Story 1) — ✅ **COMPLETED**
- **Status:** Fully Implemented.
- **Details:** Full CRUD operations on `products` table. Includes sorting, searching, and filtering by category. Warning alerts display automatically on low-stock items (quantity &le; 5).
- **Location:** [src/app/dashboard/inventory/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/inventory/page.tsx)
- **Database Schema:** `products` and `categories` tables (see `supabase/migration.sql`).

#### 2. Barcode/QR Scanning (User Story 2) — ✅ **COMPLETED**
- **Status:** Fully Implemented.
- **Details:** Camera scanner captures product QR codes, parses JSON payloads, retrieves product details from the database, and adds them to a shopping cart. Supports manual SKU/barcode lookup fallback. Complete POS Checkout records the sale, creates line item logs, and decrements stock quantity.
- **Location:** [src/app/dashboard/scanner/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/scanner/page.tsx) & [src/components/scanner/ScannerCamera.tsx](file:///n:/app_sync/ApparelSync-CRM/src/components/scanner/ScannerCamera.tsx).

#### 3. Invoice Generation (User Story 3) — ❌ **NOT STARTED**
- **Requirements:** Generate invoice numbers on checkout, build invoice details display, download invoices as PDF, and store records.
- **Next steps for AI:** Create invoice schema, build Invoice details preview modal, and install/integrate a PDF generation library (like `jspdf` or `react-pdf`).

#### 4. Automatic Inventory Deductions (User Story 4) — ✅ **COMPLETED**
- **Status:** Fully Implemented.
- **Details:** Sales checkouts on the Scanner page automatically run stock deduction queries (`stock_quantity = stock_quantity - quantity`) in the database.
- **Location:** `handleCheckout` in [scanner/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/scanner/page.tsx).

#### 5. Low-Stock Alerts (User Story 5) — ⚠️ **PARTIAL**
- **Status:** UI indicator built; automation remains.
- **Details:** Inventory page marks products with stock &le; 5 with an amber warning badge.
- **Next steps for AI:** Allow the admin to configure custom stock threshold levels per product, and display low stock notifications dynamically on the main Dashboard.

---

### Phase 2: Pending backlog 📋

#### 6. Customer Profiles (User Story 6) — ⚠️ **PARTIAL**
- **Status:** Database support present; UI missing.
- **Details:** `customers` table exists and matches profiles to orders.
- **Next steps for AI:** Build dedicated `/dashboard/customers` profile page with forms to record customer phone number, email address, and home address.

#### 7. Loyalty Points System (User Story 7) — ❌ **NOT STARTED**
- **Requirements:** Auto-calculate loyalty points during checkouts and link balances to customer profiles.
- **Next steps for AI:** Add `loyalty_points` integer field to `customers` table and integrate point accumulation logic in checkout queries.

#### 8. Purchase Histories (User Story 8) — ❌ **NOT STARTED**
- **Requirements:** Search customers by name/phone to pull transactional purchase history.
- **Next steps for AI:** Build purchase history timeline panel inside Customer profiles.

#### 9. Sales Reports & Analytics (User Story 9) — ❌ **NOT STARTED**
- **Requirements:** Summary dashboard reports, top-selling products donut charts derived from real database transactions, and PDF exports.
- **Next steps for AI:** Replace static categories donut chart with live dynamic calculations, and create a PDF export button for daily reports.

#### 10. Email Invoices (User Story 10) — ❌ **NOT STARTED**
- **Requirements:** Send digital copy of checkout invoices to customer email addresses.
- **Next steps for AI:** Integrate mail relay service (like SendGrid, Resend, or Nodemailer).

---

## 🛠️ Developer Setup & Commands

### Prerequisites
Make sure you have Node.js 20+ installed.

### Installation
```bash
npm install
```

### Database Migration
Before running the POS or Inventory pages, apply the database schema. Copy the contents of [supabase/migration.sql](file:///n:/app_sync/ApparelSync-CRM/supabase/migration.sql) and execute it inside your Supabase project's SQL Editor.

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Running Tests
To verify all integrations and mocks:
```bash
npm test
```

### Production Build
To run TypeScript compilation and compile optimized static pages:
```bash
npm run build
```

---

## 🤖 Instructions for AI Coding Agents

When working on this repository, please observe the following structural patterns:

1. **Routing and Layouts:**
   - The sidebar resides in [Sidebar.tsx](file:///n:/app_sync/ApparelSync-CRM/src/components/layout/Sidebar.tsx). Do not hardcode navigation bars inside individual pages.
   - Pages under `/dashboard/*` are automatically wrapped by [layout.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/layout.tsx).

2. **Supabase Operations:**
   - Make client-side queries directly using the exported `supabase` client from `@/lib/supabaseClient`.
   - Always run operations inside try/catch blocks with console logs and UI error alerts.

3. **Styling Rules:**
   - Background colors must be `#0a0d14` (page bg) and `#111520` (card bg).
   - Component borders must be `#1d2434`.
   - Hover elements should use emerald/teal accents.
   - Design exclusively for dark-mode layout.

4. **Testing Rules:**
   - Any new page or database service should have a corresponding `.test.tsx` or `.test.ts` file.
   - Mock Supabase calls using `vi.spyOn(supabase, 'from')`. Do not trigger real database requests in unit tests.
