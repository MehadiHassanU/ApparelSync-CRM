export type TimeframeMode = "daily" | "weekly" | "monthly";

export interface TimeframeChartPoint {
  key: string;
  label: string;
  date: string;
  revenue: number;
  ordersCount: number;
  avgOrderValue: number;
  profit: number;
  cogs: number;
}

export interface CategorySharePoint {
  name: string;
  value: number;
  revenue: number;
  color: string;
  ordersCount: number;
}

export interface PaymentSharePoint {
  name: string;
  value: number;
  revenue: number;
  color: string;
  percentage: number;
}

export interface TimeframeSummaryStats {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  estimatedProfit: number;
  peakPeriodLabel: string;
  peakRevenue: number;
  lowestPeriodLabel: string;
  lowestRevenue: number;
}

const CATEGORY_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#06b6d4", "#ec4899", "#8b5cf6"];
const PAYMENT_COLORS: Record<string, string> = {
  Cash: "#10b981",
  bKash: "#ec4899",
  "Credit Card": "#6366f1",
  PayPal: "#0ea5e9",
  Other: "#64748b",
};

/**
 * Format a Date or date string to local Month Short + Day (e.g. "Aug 02")
 */
export function formatDailyLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

/**
 * Get Week Number or formatted Week label (e.g. "W32 (Aug 04)")
 */
export function formatWeeklyLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    // Calculate week start (Sunday or Monday)
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const month = monday.toLocaleDateString("en-US", { month: "short" });
    const day = monday.getDate();
    return `Wk of ${month} ${day}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format a Date or date string to Month Year (e.g. "Aug 2026")
 */
export function formatMonthlyLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

/**
 * Aggregates orders into daily, weekly, or monthly chart telemetry
 */
export function aggregateOrdersByTimeframe(
  orders: Array<{ price: number; date: string; paymentMethod?: string; category?: string }>,
  timeframe: TimeframeMode
): TimeframeChartPoint[] {
  if (!orders || orders.length === 0) {
    if (timeframe === "daily") {
      return [
        { key: "1", label: "Mon", date: "2026-08-03", revenue: 1200, ordersCount: 4, avgOrderValue: 300, profit: 720, cogs: 480 },
        { key: "2", label: "Tue", date: "2026-08-04", revenue: 2100, ordersCount: 7, avgOrderValue: 300, profit: 1260, cogs: 840 },
        { key: "3", label: "Wed", date: "2026-08-05", revenue: 1800, ordersCount: 5, avgOrderValue: 360, profit: 1080, cogs: 720 },
        { key: "4", label: "Thu", date: "2026-08-06", revenue: 2400, ordersCount: 8, avgOrderValue: 300, profit: 1440, cogs: 960 },
        { key: "5", label: "Fri", date: "2026-08-07", revenue: 3100, ordersCount: 11, avgOrderValue: 281.8, profit: 1860, cogs: 1240 },
        { key: "6", label: "Sat", date: "2026-08-08", revenue: 2800, ordersCount: 9, avgOrderValue: 311.1, profit: 1680, cogs: 1120 },
        { key: "7", label: "Sun", date: "2026-08-09", revenue: 3400, ordersCount: 12, avgOrderValue: 283.3, profit: 2040, cogs: 1360 },
      ];
    } else if (timeframe === "weekly") {
      return [
        { key: "1", label: "Week 1", date: "2026-07-13", revenue: 8400, ordersCount: 28, avgOrderValue: 300, profit: 5040, cogs: 3360 },
        { key: "2", label: "Week 2", date: "2026-07-20", revenue: 9800, ordersCount: 34, avgOrderValue: 288.2, profit: 5880, cogs: 3920 },
        { key: "3", label: "Week 3", date: "2026-07-27", revenue: 11500, ordersCount: 40, avgOrderValue: 287.5, profit: 6900, cogs: 4600 },
        { key: "4", label: "Week 4", date: "2026-08-03", revenue: 16800, ordersCount: 56, avgOrderValue: 300, profit: 10080, cogs: 6720 },
      ];
    } else {
      return [
        { key: "1", label: "Mar 2026", date: "2026-03-01", revenue: 28000, ordersCount: 95, avgOrderValue: 294.7, profit: 16800, cogs: 11200 },
        { key: "2", label: "Apr 2026", date: "2026-04-01", revenue: 34500, ordersCount: 118, avgOrderValue: 292.3, profit: 20700, cogs: 13800 },
        { key: "3", label: "May 2026", date: "2026-05-01", revenue: 41200, ordersCount: 142, avgOrderValue: 290.1, profit: 24720, cogs: 16480 },
        { key: "4", label: "Jun 2026", date: "2026-06-01", revenue: 39800, ordersCount: 135, avgOrderValue: 294.8, profit: 23880, cogs: 15920 },
        { key: "5", label: "Jul 2026", date: "2026-07-01", revenue: 48500, ordersCount: 164, avgOrderValue: 295.7, profit: 29100, cogs: 19400 },
        { key: "6", label: "Aug 2026", date: "2026-08-01", revenue: 54200, ordersCount: 182, avgOrderValue: 297.8, profit: 32520, cogs: 21680 },
      ];
    }
  }

  const buckets: Record<string, { label: string; date: string; revenue: number; ordersCount: number }> = {};

  orders.forEach((o) => {
    const rawDate = o.date || new Date().toISOString().split("T")[0];
    let bucketKey = "";
    let label = "";

    if (timeframe === "daily") {
      bucketKey = rawDate;
      label = formatDailyLabel(rawDate);
    } else if (timeframe === "weekly") {
      bucketKey = formatWeeklyLabel(rawDate);
      label = bucketKey;
    } else {
      // monthly
      bucketKey = rawDate.slice(0, 7); // YYYY-MM
      label = formatMonthlyLabel(rawDate);
    }

    if (!buckets[bucketKey]) {
      buckets[bucketKey] = {
        label,
        date: rawDate,
        revenue: 0,
        ordersCount: 0,
      };
    }

    buckets[bucketKey].revenue += Number(o.price || 0);
    buckets[bucketKey].ordersCount += 1;
  });

  const sortedKeys = Object.keys(buckets).sort();
  // For daily, keep up to 14 latest points; for weekly keep up to 8; for monthly keep all (up to 12)
  const slicedKeys =
    timeframe === "daily"
      ? sortedKeys.slice(-14)
      : timeframe === "weekly"
      ? sortedKeys.slice(-8)
      : sortedKeys.slice(-12);

  return slicedKeys.map((k) => {
    const b = buckets[k];
    const avg = b.ordersCount > 0 ? b.revenue / b.ordersCount : 0;
    return {
      key: k,
      label: b.label,
      date: b.date,
      revenue: Math.round(b.revenue * 100) / 100,
      ordersCount: b.ordersCount,
      avgOrderValue: Math.round(avg * 100) / 100,
      profit: Math.round(b.revenue * 0.6 * 100) / 100,
      cogs: Math.round(b.revenue * 0.4 * 100) / 100,
    };
  });
}

/**
 * Calculates summary metrics across the selected timeframe points
 */
export function calculateTimeframeSummary(points: TimeframeChartPoint[]): TimeframeSummaryStats {
  if (!points || points.length === 0) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      estimatedProfit: 0,
      peakPeriodLabel: "N/A",
      peakRevenue: 0,
      lowestPeriodLabel: "N/A",
      lowestRevenue: 0,
    };
  }

  let totalRev = 0;
  let totalOrd = 0;
  let peak = points[0];
  let lowest = points[0];

  points.forEach((p) => {
    totalRev += p.revenue;
    totalOrd += p.ordersCount;
    if (p.revenue > peak.revenue) peak = p;
    if (p.revenue < lowest.revenue) lowest = p;
  });

  const aov = totalOrd > 0 ? totalRev / totalOrd : 0;

  return {
    totalRevenue: Math.round(totalRev * 100) / 100,
    totalOrders: totalOrd,
    avgOrderValue: Math.round(aov * 100) / 100,
    estimatedProfit: Math.round(totalRev * 0.6 * 100) / 100,
    peakPeriodLabel: peak.label,
    peakRevenue: peak.revenue,
    lowestPeriodLabel: lowest.label,
    lowestRevenue: lowest.revenue,
  };
}

/**
 * Payment method breakdown with percentages and custom theme colors
 */
export function calculatePaymentBreakdown(
  orders: Array<{ price: number; paymentMethod?: string }>
): PaymentSharePoint[] {
  if (!orders || orders.length === 0) {
    return [
      { name: "Cash", value: 45, revenue: 14500, color: PAYMENT_COLORS.Cash, percentage: 45 },
      { name: "bKash", value: 30, revenue: 9800, color: PAYMENT_COLORS.bKash, percentage: 30 },
      { name: "Credit Card", value: 15, revenue: 4900, color: PAYMENT_COLORS["Credit Card"], percentage: 15 },
      { name: "PayPal", value: 10, revenue: 3200, color: PAYMENT_COLORS.PayPal, percentage: 10 },
    ];
  }

  const map: Record<string, { revenue: number; count: number }> = {};
  let totalRev = 0;

  orders.forEach((o) => {
    const method = o.paymentMethod || "Cash";
    if (!map[method]) map[method] = { revenue: 0, count: 0 };
    const p = Number(o.price || 0);
    map[method].revenue += p;
    map[method].count += 1;
    totalRev += p;
  });

  return Object.entries(map).map(([name, data]) => {
    const pct = totalRev > 0 ? Math.round((data.revenue / totalRev) * 100) : 0;
    return {
      name,
      value: pct,
      revenue: Math.round(data.revenue * 100) / 100,
      color: PAYMENT_COLORS[name] || PAYMENT_COLORS.Other,
      percentage: pct,
    };
  });
}
