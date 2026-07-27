# ApparelSync-CRM — Clothing Retail Shop POS & CRM Suite

ApparelSync-CRM is a modern, high-performance Customer Relationship Management (CRM) and Point of Sale (POS) system built for clothing and retail apparel businesses. Powered by **Next.js 14 (App Router)**, **Tailwind CSS**, and **Supabase (PostgreSQL)**, it streamlines inventory management, live camera QR scanning, customer profiling, customer loyalty & rewards, PDF invoice generation, lifetime value (LTV) analytics, and POS transactions.

---

## 🚀 Tech Stack

- **Frontend Framework:** Next.js 14 (React 18, App Router)
- **Styling & Aesthetics:** Tailwind CSS (Dark Mode Design System)
- **Backend & Database:** Supabase (PostgreSQL with RLS policies)
- **UI Component System:** `@base-ui/react` (Shadcn/ui base-nova design primitives)
- **QR / Barcode Scanning:** `html5-qrcode` & `qrcode.react`
- **Charts & Data Visualization:** Recharts
- **Invoice Generation:** `jspdf` & `html2canvas`
- **Testing Suite:** Vitest + JSDOM + `@testing-library/react`

---

## 📊 Feature Implementation Status

### Scorecard Summary
- **User Stories Completed:** 8 / 10
- **User Stories Partially Completed:** 1 / 10
- **User Stories Not Started:** 1 / 10

---

### Completed Features ✅

#### 1. Product Inventory CRUD — ✅ **COMPLETED**
- Full CRUD operations on the `products` table. Includes search, category filtering, auto-SKU generation, BDT (৳) currency formatting, and low-stock warning badges (stock &le; 5).
- **Location:** [src/app/dashboard/inventory/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/inventory/page.tsx)

#### 2. Live Barcode/QR POS Scanner — ✅ **COMPLETED**
- Responsive web camera QR scanner using low-density plain SKU strings for fast decode on webcams. Supports manual SKU/barcode search, cross-browser Web Audio scan beep, instant cart building, and printable receipts.
- **Location:** [src/app/dashboard/scanner/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/scanner/page.tsx) & [src/components/scanner/ScannerCamera.tsx](file:///n:/app_sync/ApparelSync-CRM/src/components/scanner/ScannerCamera.tsx)

#### 3. Automatic Inventory Stock Deductions — ✅ **COMPLETED**
- POS checkout automatically runs atomic stock deductions (`stock_quantity = stock_quantity - item.quantity`) in Supabase.
- **Location:** `handleCheckout` in [scanner/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/scanner/page.tsx)

#### 4. Customer Profiles & LTV Intelligence — ✅ **COMPLETED**
- Dedicated Customer Profiles module at `/dashboard/customers`. Records customer name, phone, email, address, city, and notes. Tracks cumulative Customer Lifetime Value (LTV), order counts, and returning customer ratios. Includes auto customer picker search in POS checkout to prevent duplicate profiles.
- **Location:** [src/app/dashboard/customers/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/customers/page.tsx) & [src/components/customers/CustomerPicker.tsx](file:///n:/app_sync/ApparelSync-CRM/src/components/customers/CustomerPicker.tsx)

#### 5. Customer Purchase History Timeline — ✅ **COMPLETED**
- Slide-over customer profile drawer rendering full transactional order history linked via `customer_id`. Displays order numbers, dates, payment modes, total spent, and status badges.
- **Location:** `viewCustomer` drawer in [customers/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/customers/page.tsx)

#### 6. Customer Loyalty & Rewards System — ✅ **COMPLETED**
- Auto-calculate and earn reward points on purchases, tier assignment (Bronze, Silver, Gold), point redemption on checkout, and bonus points tracking.
- **Location:** [src/lib/loyalty.ts](file:///n:/app_sync/ApparelSync-CRM/src/lib/loyalty.ts)

#### 7. Orders & PDF Invoice Generation — ✅ **COMPLETED**
- Dedicated Orders dashboard (`/dashboard/orders`) and PDF invoice generator supporting instant download of transaction invoices.
- **Location:** [src/app/dashboard/orders/page.tsx](file:///n:/app_sync/ApparelSync-CRM/src/app/dashboard/orders/page.tsx) & [src/lib/invoiceGenerator.ts](file:///n:/app_sync/ApparelSync-CRM/src/lib/invoiceGenerator.ts)

---

## 👥 Team Branching Strategy

The repository follows a clean team workflow:

- `main`: Primary production-ready branch containing merged and tested code.
- `Nafis`: Customer Profiles, Purchase History, POS Autocomplete, and schema enhancements.
- `Safin`: Orders Dashboard, Loyalty Points System, and Invoice PDF Generation.
- `Utsho`: Auto customer picker search, BDT currency formatting, and scanner improvements.

---

## 🛠️ Developer Setup & Commands

### Prerequisites
Node.js 20+ installed.

### Installation
```bash
npm install
### Environment Setup (.env.local)
When cloning to a new computer, copy `.env.example` to create your local `.env.local` file:
```bash
cp .env.example .env.local
```
Inside `.env.local`, ensure your Supabase URL and public anon key are set:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://kndtuchbhtyunhmybjmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Migrations
Apply SQL migration scripts in order from `supabase/migrations/`:
1. `20260705172127_init_schema.sql` (Products, Categories, Sales, Sale Items)
2. `20260726000000_enhance_customers_schema.sql` (Customer Profiles schema)
3. `supabase/migration.sql` (Loyalty & Orders schema updates)

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
ApparelSync-CRM is open-source. Anyone is free to use, modify, and distribute this software for personal or commercial purposes under the GNU GPL v3.0 license, provided that **attribution credit is given to the original authors** (ApparelSync CRM Team: **Mehadi Hassan Utsho, Nafis, Safin**).
