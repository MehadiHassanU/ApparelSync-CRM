// ─── Product & Inventory Types ───────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  categoryId: string | null;
  categoryName: string;
  barcode: string | null;
  qrData: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
}

// ─── Scanner & Cart Types ────────────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ─── QR Code Payload ─────────────────────────────────────────────────────────

export interface QRPayload {
  type: "product";
  id: string;
  sku: string;
}

// ─── Database Row Types (raw Supabase responses) ─────────────────────────────

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  category_id: string | null;
  barcode: string | null;
  qr_data: string | null;
  created_at: string;
  updated_at: string;
  category?: { name: string } | null;
}

export interface CategoryRow {
  id: string;
  name: string;
  created_at: string;
}

export interface SaleItemRow {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}
