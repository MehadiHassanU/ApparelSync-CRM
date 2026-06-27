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
  category: string;
  price: number;
  formattedPrice: string;
  date: string;
  paymentMethod: string;
  status: OrderStatus;
}

export const kpiMetrics: KPIMetrics = {
  totalRevenue: {
    value: 99560,
    formattedValue: "$99,560",
    percentageChange: 12.5,
    isPositive: true,
  },
  totalOrders: {
    value: 35,
    formattedValue: "35",
    percentageChange: -3.2,
    isPositive: false,
  },
  netProfit: {
    value: 60450,
    formattedValue: "$60,450",
    percentageChange: 8.4,
    isPositive: true,
  },
};

export const orderList: Order[] = [
  {
    id: "1",
    orderNumber: "NA874839",
    customerName: "Sarah Jenkins",
    category: "Laptops",
    price: 1299.99,
    formattedPrice: "$1,299.99",
    date: "2026-06-25",
    paymentMethod: "PayPal",
    status: "on way",
  },
  {
    id: "2",
    orderNumber: "NA874840",
    customerName: "Michael Chang",
    category: "Apparel",
    price: 145.50,
    formattedPrice: "$145.50",
    date: "2026-06-25",
    paymentMethod: "Credit Card",
    status: "delivered",
  },
  {
    id: "3",
    orderNumber: "NA874841",
    customerName: "Emma Watson",
    category: "Accessories",
    price: 89.00,
    formattedPrice: "$89.00",
    date: "2026-06-26",
    paymentMethod: "PayPal",
    status: "awaiting",
  },
  {
    id: "4",
    orderNumber: "NA874842",
    customerName: "David Miller",
    category: "Laptops",
    price: 2199.00,
    formattedPrice: "$2,199.00",
    date: "2026-06-26",
    paymentMethod: "Apple Pay",
    status: "on way",
  },
  {
    id: "5",
    orderNumber: "NA874843",
    customerName: "Sophia Martinez",
    category: "Footwear",
    price: 175.25,
    formattedPrice: "$175.25",
    date: "2026-06-26",
    paymentMethod: "PayPal",
    status: "delivered",
  },
  {
    id: "6",
    orderNumber: "NA874844",
    customerName: "James Wilson",
    category: "Electronics",
    price: 450.00,
    formattedPrice: "$450.00",
    date: "2026-06-27",
    paymentMethod: "Credit Card",
    status: "awaiting",
  },
  {
    id: "7",
    orderNumber: "NA874845",
    customerName: "Olivia Taylor",
    category: "Apparel",
    price: 230.00,
    formattedPrice: "$230.00",
    date: "2026-06-27",
    paymentMethod: "PayPal",
    status: "on way",
  },
  {
    id: "8",
    orderNumber: "NA874846",
    customerName: "Lucas Brown",
    category: "Laptops",
    price: 1549.99,
    formattedPrice: "$1,549.99",
    date: "2026-06-27",
    paymentMethod: "Google Pay",
    status: "delivered",
  },
  {
    id: "9",
    orderNumber: "NA874847",
    customerName: "Ava Anderson",
    category: "Accessories",
    price: 64.50,
    formattedPrice: "$64.50",
    date: "2026-06-27",
    paymentMethod: "PayPal",
    status: "on way",
  },
  {
    id: "10",
    orderNumber: "NA874848",
    customerName: "Ethan Thomas",
    category: "Electronics",
    price: 820.00,
    formattedPrice: "$820.00",
    date: "2026-06-27",
    paymentMethod: "Credit Card",
    status: "awaiting",
  },
];
