export type TransactionType = "income" | "expense" | "refund" | "discount";
export type PaymentMethod = "Cash" | "Card" | "bKash" | "Nagad" | "PayPal";
export type TransactionStatus = "completed" | "processing" | "pending" | "failed";

export interface FinancialTransaction {
  id: string;
  transactionNumber: string;
  date: string; // ISO date string or YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  partyName: string; // Customer Name or Vendor Name
  orderId?: string;
  notes?: string;
  createdAt?: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalRefunds: number;
  netProfit: number;
  profitMargin: number;
  totalTransactions: number;
  avgTransactionValue: number;
  completedCount: number;
  pendingCount: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface PaymentMethodBreakdown {
  method: PaymentMethod;
  amount: number;
  count: number;
}

export interface TimelineDataPoint {
  date: string;
  displayDate: string;
  income: number;
  expense: number;
  net: number;
}
