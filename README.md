# ApparelSync-CRM — Clothing Retail Shop POS & CRM Suite

ApparelSync-CRM is a modern, high-performance Customer Relationship Management (CRM) and Point of Sale (POS) system built for clothing and retail apparel businesses. Powered by **Next.js 14 (App Router)**, **Tailwind CSS**, and **Supabase (PostgreSQL)**, it streamlines inventory management, live camera QR scanning, customer profiling, lifetime value (LTV) analytics, order management, PDF invoice generation, and a fully customizable Reward Points & VIP Loyalty Program.

---

## 🚀 Tech Stack

- **Frontend Framework:** Next.js 14 (React 18, App Router)
- **Styling & Aesthetics:** Vanilla CSS & Tailwind CSS (Modern Dark Mode Design System)
- **Backend & Database:** Supabase (PostgreSQL with RLS policies)
- **UI Component System:** `@base-ui/react` (Shadcn/ui design primitives)
- **PDF Generation:** `jspdf` (Custom Retail Invoice Engine)
- **QR / Barcode Scanning:** `html5-qrcode` & `qrcode.react`
- **Charts & Data Visualization:** Recharts
- **Testing Suite:** Vitest + JSDOM + `@testing-library/react` (31 tests / 9 suites)

---

## 📊 Feature Implementation Status

### Scorecard Summary
- **User Stories Completed:** 9 / 10 ✅
- **Testing Coverage:** 31 / 31 Unit & Integration Tests Passing (100%) ✅

---

### Completed Features & Modules

#### 1. Order Management & PDF Invoicing (`/dashboard/orders`) — ✅ **COMPLETED**
- **Customer Lookup & Auto-Registration**: Select existing customer profiles or type a new name to automatically create a customer profile.
- **Order Lifecycle**: Full tracking from `processing` to `delivered` and `awaiting`.
- **Automatic PDF Invoices**: Generates and downloads official retail PDF invoices via `jspdf` featuring item breakdowns, payment modes, and reward points summaries.
- **Mobile Responsive**: Fully responsive dark mode layout with drawer controls for phones and tablets.

#### 2. Customizable Reward Points & VIP Loyalty System (`src/lib/loyalty.ts`) — ✅ **COMPLETED**
- **Spending-Based Points**: Configurable earning rule (default: 1 Point for every $10 spent).
- **Point Redemption**: Redeem points for instant dollar discounts during checkout (default: 100 Points = $5.00 discount).
- **VIP Tiers & Multipliers**: Automatically promotes customers across 🥉 **Bronze** (1.0x), 🥈 **Silver** (1.2x), and 🥇 **Gold** (1.5x) tiers based on points threshold.
- **Bonus Product Points**: Assign custom bonus points to specific high-margin inventory products.
- **Store Manager Rules Panel**: Configure custom spend ratios, redemption rates, and VIP tier thresholds in `/dashboard/customers`.
- **Manual Point Adjustments & Gifts**: Store managers can gift bonus points (e.g. Birthday Gifts, Promos) or adjust balances with audit trail logging in `point_transactions`.

#### 3. Product Inventory Management (`/dashboard/inventory`) — ✅ **COMPLETED**
- **Full CRUD Operations**: Create, edit, search, and delete products with SKU, category, price, and stock management.
- **Bonus Reward Points**: Configure bonus reward points per product with `+XX PTS BONUS` badges.
- **Low-Stock Alerts**: Automated badges for items with stock &le; 5.
- **Auto SKU & Barcode Generator**: Instant SKU generation and QR payload creation.

#### 4. Live Barcode/QR POS Scanner (`/dashboard/scanner`) — ✅ **COMPLETED**
- **Responsive Camera Scanner**: Real-time camera QR decode using `html5-qrcode` with low-density plain SKU payloads.
- **Cart & POS Checkout**: Instant cart building, item quantity adjustments, customer autocomplete, Web Audio scan beeps, and printable receipts.

#### 5. Customer Profiles & LTV Intelligence (`/dashboard/customers`) — ✅ **COMPLETED**
- **Customer Directory**: Track Customer Lifetime Value (LTV), total orders, average order values, and returning customer ratios.
- **Loyalty Badges & Audit Ledger**: Displays VIP Tier badges, current point balances, and transaction history timelines (`EARNED`, `REDEEMED`, `BONUS`).

#### 6. Admin Analytics Dashboard (`/dashboard`) — ✅ **COMPLETED**
- **Real-Time KPIs**: Total Revenue, Total Orders, Net Profit estimations, and sales category donut chart.
- **Processing Orders Tracker**: Summary table of active processing orders with quick status toggle.

---

## 👥 Team Branching & Workflow

- `main`: Production-ready branch containing merged, fully tested code.
- `safin`: Feature workspace branch for active development and extensions.
- `Nafis`: Customer Profiles, Purchase History, POS Autocomplete, and schema enhancements.
- `Uthso`: Assigned feature workspace branch.

---

## 🛠️ Developer Setup & Commands

### Prerequisites
- Node.js 20+ installed.

### Installation
```bash
npm install
```

### Database Migration (Supabase SQL Editor)
Run the SQL script from `supabase/migration.sql` in your **[Supabase SQL Editor](https://supabase.com/dashboard)** to set up tables (`products`, `categories`, `sales`, `sale_items`, `customers`, `point_transactions`) and RLS policies.

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Test Suite
```bash
npm test
```
All 31 unit & integration tests across 9 test files will execute via Vitest.

### Type Check
```bash
npx tsc --noEmit
```

### Production Build
```bash
npm run build
```

---

## 📜 License & Credit Attribution

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)** - see the [LICENSE](file:///c:/Users/Admin/Desktop/ApparelSync-CRM-main/LICENSE) file for details.

### Commercial & Public Use Terms
ApparelSync-CRM is open-source. Anyone is free to use, modify, and distribute this software under the GNU GPL v3.0 license, provided that **attribution credit is given to the original authors** (ApparelSync CRM Team: **Mehadi Hassan Uthso, Nafis, Safin**).
