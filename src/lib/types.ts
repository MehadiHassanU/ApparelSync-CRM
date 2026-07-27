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
  bonusPoints?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
}

// ─── Customer & Profile Types ────────────────────────────────────────────────

export interface Customer {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  rewardPoints?: number;
  tier?: "Bronze" | "Silver" | "Gold";
  createdAt: string;
  updatedAt: string;
  // Computed metrics for customer intelligence
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string | null;
  averageOrderValue?: number;
}

export interface CustomerOrderHistory {
  id: string;
  orderNumber: string;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  itemsCount?: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  discountAmount?: number;
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
  bonus_points?: number;
  created_at: string;
  updated_at: string;
  category?: { name: string } | null;
}

export interface CategoryRow {
  id: string;
  name: string;
  created_at: string;
}

export interface CustomerRow {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  reward_points?: number;
  tier?: "Bronze" | "Silver" | "Gold";
  created_at: string;
  updated_at: string;
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
