import { describe, it, expect } from "vitest";
import {
  aggregateOrdersByTimeframe,
  calculateTimeframeSummary,
  calculatePaymentBreakdown,
  formatDailyLabel,
  formatWeeklyLabel,
  formatMonthlyLabel,
} from "./analyticsUtils";

const mockOrders = [
  { price: 1200, date: "2026-08-01", paymentMethod: "bKash" },
  { price: 800, date: "2026-08-01", paymentMethod: "Cash" },
  { price: 2500, date: "2026-08-02", paymentMethod: "Credit Card" },
  { price: 1500, date: "2026-08-08", paymentMethod: "Cash" },
  { price: 3000, date: "2026-07-15", paymentMethod: "PayPal" },
];

describe("Analytics Utils & Multi-Timeframe Grouping Tests", () => {
  it("formats daily, weekly, and monthly labels properly", () => {
    expect(formatDailyLabel("2026-08-01")).toContain("Aug");
    expect(formatWeeklyLabel("2026-08-01")).toContain("Wk of");
    expect(formatMonthlyLabel("2026-08-01")).toBe("Aug 2026");
  });

  it("aggregates orders into daily chart data correctly", () => {
    const dailyPoints = aggregateOrdersByTimeframe(mockOrders, "daily");
    expect(dailyPoints.length).toBeGreaterThan(0);

    const aug1 = dailyPoints.find((p) => p.date === "2026-08-01");
    expect(aug1).toBeDefined();
    expect(aug1?.revenue).toBe(2000);
    expect(aug1?.ordersCount).toBe(2);
    expect(aug1?.avgOrderValue).toBe(1000);
    expect(aug1?.profit).toBe(1200); // 60%
    expect(aug1?.cogs).toBe(800); // 40%
  });

  it("aggregates orders into monthly chart data correctly", () => {
    const monthlyPoints = aggregateOrdersByTimeframe(mockOrders, "monthly");
    expect(monthlyPoints.length).toBe(2); // July and August

    const augMonth = monthlyPoints.find((p) => p.key === "2026-08");
    expect(augMonth).toBeDefined();
    expect(augMonth?.revenue).toBe(6000); // 1200+800+2500+1500
    expect(augMonth?.ordersCount).toBe(4);
  });

  it("calculates timeframe summary metrics (Revenue, AOV, Peak)", () => {
    const dailyPoints = aggregateOrdersByTimeframe(mockOrders, "daily");
    const summary = calculateTimeframeSummary(dailyPoints);

    expect(summary.totalRevenue).toBe(9000);
    expect(summary.totalOrders).toBe(5);
    expect(summary.avgOrderValue).toBe(1800);
    expect(summary.estimatedProfit).toBe(5400);
    expect(summary.peakRevenue).toBe(3000);
  });

  it("calculates payment method distribution with percentages", () => {
    const breakdown = calculatePaymentBreakdown(mockOrders);
    expect(breakdown.length).toBe(4);

    const cash = breakdown.find((b) => b.name === "Cash");
    expect(cash).toBeDefined();
    expect(cash?.revenue).toBe(2300); // 800+1500
    expect(cash?.color).toBe("#10b981");
  });
});
