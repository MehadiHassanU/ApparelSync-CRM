-- ============================================================================
-- ApparelSync-CRM — Database Migration
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- ─── 1. Categories Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. Products Table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  barcode TEXT,
  qr_data TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. Sale Items Table (links sales to products for cart checkout) ─────────
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

-- ─── 4. Seed Default Categories ─────────────────────────────────────────────
INSERT INTO categories (name) VALUES
  ('Shirts'),
  ('Pants'),
  ('Jackets'),
  ('Dresses'),
  ('Accessories')
ON CONFLICT (name) DO NOTHING;

-- ─── 5. Enable Row Level Security ───────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- ─── 6. RLS Policies (allow anon access for MVP) ────────────────────────────
DO $$
BEGIN
  -- Categories
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Allow all for anon on categories') THEN
    CREATE POLICY "Allow all for anon on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Products
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow all for anon on products') THEN
    CREATE POLICY "Allow all for anon on products" ON products FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- Sale Items
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sale_items' AND policyname = 'Allow all for anon on sale_items') THEN
    CREATE POLICY "Allow all for anon on sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ─── 7. Index for faster product lookups by SKU and barcode ─────────────────
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- ─── 8. Reward Points & Loyalty System Migration ────────────────────────────
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS reward_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Bronze';

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS bonus_points INTEGER DEFAULT 0;

ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_redeemed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES sales(id) ON DELETE SET NULL,
  points_change INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'EARNED', 'REDEEMED', 'BONUS', 'ADJUSTMENT'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'point_transactions' AND policyname = 'Allow all for anon on point_transactions') THEN
    CREATE POLICY "Allow all for anon on point_transactions" ON point_transactions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_point_transactions_customer_id ON point_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_order_id ON point_transactions(order_id);

-- ─── 9. Fix sales_status_check Constraint ────────────────────────────────────
-- Update the constraint on the sales table to accept 'processing', 'delivered', 'awaiting'
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_status_check;
ALTER TABLE sales ADD CONSTRAINT sales_status_check 
  CHECK (status IN ('processing', 'delivered', 'awaiting', 'completed', 'on way', 'pending'));


