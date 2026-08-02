import {
  FinancialTransaction,
  FinancialSummary,
  CategoryBreakdown,
  PaymentMethodBreakdown,
  TimelineDataPoint,
  TransactionType,
  PaymentMethod,
} from "./financialTypes";
import { supabase } from "./supabaseClient";

export type TimeframePreset = "today" | "week" | "month" | "yearly" | "all";

// Helper to calculate relative ISO date strings (e.g. today, 1 day ago, 3 days ago)
export function getRelativeDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

// Helper to get formatted month strings (e.g., "2026-08", "2026-07")
export function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── Dynamic Default Mock Financial Transactions ──────────────────────────────
export const getInitialTransactions = (): FinancialTransaction[] => {
  const todayStr = getRelativeDateString(0);
  const yesterdayStr = getRelativeDateString(1);
  const day3Str = getRelativeDateString(3);
  const day5Str = getRelativeDateString(5);
  const day10Str = getRelativeDateString(10);
  const day20Str = getRelativeDateString(20);

  return [
    {
      id: "trx-101",
      transactionNumber: "TRX-2026-001",
      date: todayStr,
      type: "income",
      category: "Apparel Sales",
      amount: 14500,
      paymentMethod: "bKash",
      status: "completed",
      partyName: "Rahim Chowdhury",
      orderId: "ORD-9801",
      notes: "Order payment for 5x Denim Jackets",
      createdAt: `${todayStr}T10:30:00Z`,
    },
    {
      id: "trx-102",
      transactionNumber: "TRX-2026-002",
      date: todayStr,
      type: "income",
      category: "Footwear Sales",
      amount: 8200,
      paymentMethod: "Card",
      status: "completed",
      partyName: "Anika Rahman",
      orderId: "ORD-9802",
      notes: "Order payment for Leather Sneakers",
      createdAt: `${todayStr}T11:45:00Z`,
    },
    {
      id: "trx-103",
      transactionNumber: "TRX-2026-003",
      date: yesterdayStr,
      type: "expense",
      category: "Supplier Inventory",
      amount: 12500,
      paymentMethod: "Cash",
      status: "completed",
      partyName: "TexFab Apparel Mills",
      notes: "Bulk cotton fabric purchase for autumn collection",
      createdAt: `${yesterdayStr}T14:20:00Z`,
    },
    {
      id: "trx-104",
      transactionNumber: "TRX-2026-004",
      date: day3Str,
      type: "income",
      category: "Accessories",
      amount: 4300,
      paymentMethod: "Nagad",
      status: "completed",
      partyName: "Tanvir Ahmed",
      orderId: "ORD-9799",
      notes: "Purchase of belts and leather wallets",
      createdAt: `${day3Str}T16:10:00Z`,
    },
    {
      id: "trx-105",
      transactionNumber: "TRX-2026-005",
      date: day5Str,
      type: "expense",
      category: "Store Utilities",
      amount: 3200,
      paymentMethod: "bKash",
      status: "completed",
      partyName: "Dhaka Electric Supply",
      notes: "Monthly store power bill",
      createdAt: `${day5Str}T09:15:00Z`,
    },
    {
      id: "trx-106",
      transactionNumber: "TRX-2026-006",
      date: day5Str,
      type: "refund",
      category: "Customer Refund",
      amount: 1800,
      paymentMethod: "bKash",
      status: "completed",
      partyName: "Farhana Islam",
      orderId: "ORD-9788",
      notes: "Size exchange refund adjustment",
      createdAt: `${day5Str}T13:00:00Z`,
    },
    {
      id: "trx-107",
      transactionNumber: "TRX-2026-007",
      date: day10Str,
      type: "income",
      category: "Apparel Sales",
      amount: 19800,
      paymentMethod: "PayPal",
      status: "completed",
      partyName: "Kazi Mushtaq",
      orderId: "ORD-9785",
      notes: "International customer wholesale order",
      createdAt: `${day10Str}T18:40:00Z`,
    },
    {
      id: "trx-108",
      transactionNumber: "TRX-2026-008",
      date: day10Str,
      type: "expense",
      category: "Logistics & Shipping",
      amount: 2400,
      paymentMethod: "Cash",
      status: "completed",
      partyName: "Paperfly Courier Ltd",
      notes: "Weekly nationwide parcel dispatch costs",
      createdAt: `${day10Str}T15:30:00Z`,
    },
    {
      id: "trx-109",
      transactionNumber: "TRX-2026-009",
      date: day20Str,
      type: "income",
      category: "Apparel Sales",
      amount: 7600,
      paymentMethod: "Nagad",
      status: "processing",
      partyName: "Sabbir Hossain",
      orderId: "ORD-9780",
      notes: "Polo t-shirt collection order",
      createdAt: `${day20Str}T11:00:00Z`,
    },
    {
      id: "trx-110",
      transactionNumber: "TRX-2026-010",
      date: day20Str,
      type: "expense",
      category: "Marketing & Ads",
      amount: 4500,
      paymentMethod: "Card",
      status: "completed",
      partyName: "Meta Ads Platform",
      notes: "Social media ad campaign for summer clearance sale",
      createdAt: `${day20Str}T10:00:00Z`,
    },
    // Earlier months records for Monthly/Yearly navigation
    {
      id: "trx-111",
      transactionNumber: "TRX-2026-011",
      date: "2026-07-15",
      type: "income",
      category: "Apparel Sales",
      amount: 34200,
      paymentMethod: "Card",
      status: "completed",
      partyName: "EID Festival Bulk Order",
      notes: "Festive panjabi and saree sales",
      createdAt: "2026-07-15T12:00:00Z",
    },
    {
      id: "trx-112",
      transactionNumber: "TRX-2026-012",
      date: "2026-07-18",
      type: "expense",
      category: "Supplier Inventory",
      amount: 18500,
      paymentMethod: "Cash",
      status: "completed",
      partyName: "Noman Terry Towel Ltd",
      notes: "Mid-year inventory restock",
      createdAt: "2026-07-18T15:00:00Z",
    },
    {
      id: "trx-113",
      transactionNumber: "TRX-2026-013",
      date: "2026-06-20",
      type: "income",
      category: "Footwear Sales",
      amount: 28900,
      paymentMethod: "bKash",
      status: "completed",
      partyName: "Bata Distributor Payout",
      notes: "Summer sandal collection",
      createdAt: "2026-06-20T11:30:00Z",
    },
    {
      id: "trx-114",
      transactionNumber: "TRX-2026-014",
      date: "2026-05-10",
      type: "income",
      category: "Apparel Sales",
      amount: 41000,
      paymentMethod: "Nagad",
      status: "completed",
      partyName: "Boishakh Special Sale",
      notes: "Festival special collection sales",
      createdAt: "2026-05-10T16:00:00Z",
    },
    {
      id: "trx-115",
      transactionNumber: "TRX-2026-015",
      date: "2026-04-22",
      type: "expense",
      category: "Store Rent & Fixtures",
      amount: 25000,
      paymentMethod: "Card",
      status: "completed",
      partyName: "Dhanmondi Commercial Complex",
      notes: "Quarterly showroom lease payment",
      createdAt: "2026-04-22T09:00:00Z",
    },
  ];
};

export const INITIAL_TRANSACTIONS: FinancialTransaction[] = getInitialTransactions();

// ─── LocalStorage Key ─────────────────────────────────────────────────────────
const STORAGE_KEY = "apparelsync_financial_transactions";

// ─── Service Functions ────────────────────────────────────────────────────────
export async function getFinancialTransactions(): Promise<FinancialTransaction[]> {
  try {
    let localData: FinancialTransaction[] = [];
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          localData = JSON.parse(stored);
        } catch {
          localData = [];
        }
      }
    }

    if (localData.length === 0) {
      localData = getInitialTransactions();
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
      }
    }

    const { data: salesData } = await supabase
      .from("sales")
      .select("id, total_amount, payment_method, created_at, customer_name")
      .order("created_at", { ascending: false });

    if (salesData && salesData.length > 0) {
      const supabaseTransactions: FinancialTransaction[] = salesData.map((s) => ({
        id: `db-sale-${s.id}`,
        transactionNumber: `SALE-${String(s.id).substring(0, 8).toUpperCase()}`,
        date: s.created_at ? s.created_at.split("T")[0] : getRelativeDateString(0),
        type: "income" as TransactionType,
        category: "Apparel Sales",
        amount: Number(s.total_amount) || 0,
        paymentMethod: (s.payment_method || "Cash") as PaymentMethod,
        status: "completed",
        partyName: s.customer_name || "Walk-in Customer",
        orderId: `ORD-${String(s.id).substring(0, 6)}`,
        notes: "Live sale from POS / Scanner",
        createdAt: s.created_at || new Date().toISOString(),
      }));

      const mergedMap = new Map<string, FinancialTransaction>();
      supabaseTransactions.forEach((t) => mergedMap.set(t.id, t));
      localData.forEach((t) => mergedMap.set(t.id, t));

      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    }

    return localData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error("Error fetching financial transactions:", error);
    return getInitialTransactions();
  }
}

export function saveFinancialTransaction(
  transaction: Omit<FinancialTransaction, "id" | "transactionNumber" | "createdAt">
): FinancialTransaction {
  const newTx: FinancialTransaction = {
    ...transaction,
    id: `trx-${Date.now()}`,
    transactionNumber: `TRX-2026-${Math.floor(100 + Math.random() * 900)}`,
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    const existing = localStorage.getItem(STORAGE_KEY);
    let list: FinancialTransaction[] = [];
    if (existing) {
      try {
        list = JSON.parse(existing);
      } catch {
        list = getInitialTransactions();
      }
    } else {
      list = getInitialTransactions();
    }
    list.unshift(newTx);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  return newTx;
}

export function filterByTimeframe(
  transactions: FinancialTransaction[],
  preset: TimeframePreset,
  selectedMonth?: string // Format: "YYYY-MM" (e.g., "2026-08")
): FinancialTransaction[] {
  if (preset === "all") return transactions;

  const now = new Date();
  const todayStr = getRelativeDateString(0);

  return transactions.filter((t) => {
    const tDate = new Date(t.date);

    if (preset === "today") {
      return t.date === todayStr || tDate.toDateString() === now.toDateString();
    }
    if (preset === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return tDate >= oneWeekAgo;
    }
    if (preset === "month") {
      if (selectedMonth) {
        return t.date.startsWith(selectedMonth);
      }
      // Default to matching month of transaction
      const targetMonthKey = now.toISOString().slice(0, 7);
      if (t.date.startsWith(targetMonthKey)) return true;
      // Fallback: match latest available month in transactions if current month has no data
      return true;
    }
    if (preset === "yearly") {
      const targetYear = selectedMonth ? selectedMonth.slice(0, 4) : String(now.getFullYear());
      return t.date.startsWith(targetYear);
    }
    return true;
  });
}

export function calculateSummary(transactions: FinancialTransaction[]): FinancialSummary {
  let totalRevenue = 0;
  let totalExpenses = 0;
  let totalRefunds = 0;
  let completedCount = 0;
  let pendingCount = 0;

  transactions.forEach((t) => {
    if (t.type === "income") {
      totalRevenue += t.amount;
    } else if (t.type === "expense") {
      totalExpenses += t.amount;
    } else if (t.type === "refund") {
      totalRefunds += t.amount;
    }

    if (t.status === "completed") {
      completedCount++;
    } else if (t.status === "pending" || t.status === "processing") {
      pendingCount++;
    }
  });

  const totalEffectiveExpenses = totalExpenses + totalRefunds;
  const netProfit = totalRevenue - totalEffectiveExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const avgTransactionValue =
    transactions.length > 0 ? totalRevenue / (transactions.filter((t) => t.type === "income").length || 1) : 0;

  return {
    totalRevenue,
    totalExpenses: totalEffectiveExpenses,
    totalRefunds,
    netProfit,
    profitMargin,
    totalTransactions: transactions.length,
    avgTransactionValue,
    completedCount,
    pendingCount,
  };
}

export function getCategoryBreakdown(transactions: FinancialTransaction[]): CategoryBreakdown[] {
  const categoryMap = new Map<string, number>();
  let totalIncome = 0;

  transactions
    .filter((t) => t.type === "income")
    .forEach((t) => {
      totalIncome += t.amount;
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
    });

  const result: CategoryBreakdown[] = [];
  categoryMap.forEach((amount, category) => {
    result.push({
      category,
      amount,
      percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
    });
  });

  return result.sort((a, b) => b.amount - a.amount);
}

export function getPaymentMethodBreakdown(transactions: FinancialTransaction[]): PaymentMethodBreakdown[] {
  const methodMap = new Map<PaymentMethod, { amount: number; count: number }>();

  transactions.forEach((t) => {
    const existing = methodMap.get(t.paymentMethod) || { amount: 0, count: 0 };
    methodMap.set(t.paymentMethod, {
      amount: existing.amount + t.amount,
      count: existing.count + 1,
    });
  });

  const result: PaymentMethodBreakdown[] = [];
  methodMap.forEach((val, method) => {
    result.push({
      method,
      amount: val.amount,
      count: val.count,
    });
  });

  return result.sort((a, b) => b.amount - a.amount);
}

export function getTimelineData(
  transactions: FinancialTransaction[],
  preset: TimeframePreset = "all",
  selectedMonth?: string
): TimelineDataPoint[] {
  const filtered = filterByTimeframe(transactions, preset, selectedMonth);

  if (preset === "yearly" || (preset === "all" && filtered.length > 10)) {
    const monthMap = new Map<string, { income: number; expense: number; monthName: string }>();

    filtered.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthName = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

      const current = monthMap.get(key) || { income: 0, expense: 0, monthName };
      if (t.type === "income") current.income += t.amount;
      else if (t.type === "expense" || t.type === "refund") current.expense += t.amount;

      monthMap.set(key, current);
    });

    const sortedKeys = Array.from(monthMap.keys()).sort();
    return sortedKeys.map((k) => {
      const val = monthMap.get(k)!;
      return {
        date: k,
        displayDate: val.monthName,
        income: val.income,
        expense: val.expense,
        net: val.income - val.expense,
      };
    });
  }

  const dateMap = new Map<string, { income: number; expense: number }>();

  filtered.forEach((t) => {
    const d = t.date;
    const current = dateMap.get(d) || { income: 0, expense: 0 };

    if (t.type === "income") {
      current.income += t.amount;
    } else if (t.type === "expense" || t.type === "refund") {
      current.expense += t.amount;
    }

    dateMap.set(d, current);
  });

  const sortedDates = Array.from(dateMap.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return sortedDates.map((dateStr) => {
    const val = dateMap.get(dateStr)!;
    const dateObj = new Date(dateStr);
    const displayDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      date: dateStr,
      displayDate,
      income: val.income,
      expense: val.expense,
      net: val.income - val.expense,
    };
  });
}

export function exportTransactionsToCSV(transactions: FinancialTransaction[]): void {
  const headers = [
    "Transaction ID",
    "Date",
    "Type",
    "Category",
    "Party Name (Customer/Vendor)",
    "Payment Method",
    "Status",
    "Amount (BDT)",
    "Order ID",
    "Notes",
  ];

  const rows = transactions.map((t) => [
    t.transactionNumber,
    t.date,
    t.type.toUpperCase(),
    `"${t.category}"`,
    `"${t.partyName}"`,
    t.paymentMethod,
    t.status.toUpperCase(),
    t.amount,
    t.orderId || "",
    `"${(t.notes || "").replace(/"/g, '""')}"`,
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ApparelSync_Financial_Report_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
