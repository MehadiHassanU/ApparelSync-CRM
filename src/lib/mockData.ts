export interface MetricDetail {
  value: number;
  formattedValue: string;
  percentageChange: number;
  isPositive: boolean;
}

export interface KPIMetrics {
  totalRevenue: MetricDetail;
  totalOrders: MetricDetail;
  netProfit: MetricDetail;
}

export type OrderStatus = "on way" | "delivered" | "awaiting";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId?: string;
  category: string;
  price: number;
  formattedPrice: string;
  date: string;
  paymentMethod: string;
  status: OrderStatus;
}

// Empty fallback initial lists (Live data is loaded dynamically from Supabase)
export const kpiMetrics: KPIMetrics = {
  totalRevenue: {
    value: 0,
    formattedValue: "$0.00",
    percentageChange: 0,
    isPositive: true,
  },
  totalOrders: {
    value: 0,
    formattedValue: "0",
    percentageChange: 0,
    isPositive: true,
  },
  netProfit: {
    value: 0,
    formattedValue: "$0.00",
    percentageChange: 0,
    isPositive: true,
  },
};

export const orderList: Order[] = [];
