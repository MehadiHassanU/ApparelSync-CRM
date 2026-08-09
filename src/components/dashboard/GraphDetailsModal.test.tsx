import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GraphDetailsModal from "./GraphDetailsModal";
import { Order } from "@/app/dashboard/page";

const mockOrders: Order[] = [
  {
    id: "ord-1",
    orderNumber: "NA874839",
    customerName: "Sarah Jenkins",
    category: "Apparel",
    price: 1500,
    formattedPrice: "৳1,500.00",
    date: "2026-08-01",
    paymentMethod: "bKash",
    status: "delivered",
  },
  {
    id: "ord-2",
    orderNumber: "NA874840",
    customerName: "Michael Chang",
    category: "Apparel",
    price: 2500,
    formattedPrice: "৳2,500.00",
    date: "2026-08-05",
    paymentMethod: "Credit Card",
    status: "processing",
  },
];

describe("GraphDetailsModal Component Tests", () => {
  it("renders multi-timeframe modal when open with timeframe view switcher", () => {
    render(
      <GraphDetailsModal
        isOpen={true}
        onOpenChange={vi.fn()}
        orders={mockOrders}
      />
    );

    expect(screen.getByText("Graph Telemetry & Deep-Dive Analysis")).toBeDefined();
    expect(screen.getByText("Daily View (14 Days)")).toBeDefined();
    expect(screen.getByText("Weekly View (8 Weeks)")).toBeDefined();
    expect(screen.getByText("Monthly View (12 Months)")).toBeDefined();
  });

  it("switches timeframe view between Daily, Weekly, and Monthly", () => {
    render(
      <GraphDetailsModal
        isOpen={true}
        onOpenChange={vi.fn()}
        orders={mockOrders}
      />
    );

    const weeklyBtn = screen.getByText("Weekly View (8 Weeks)");
    fireEvent.click(weeklyBtn);
    expect(screen.getByText(/weekly Granularity/i)).toBeDefined();

    const monthlyBtn = screen.getByText("Monthly View (12 Months)");
    fireEvent.click(monthlyBtn);
    expect(screen.getByText(/monthly Granularity/i)).toBeDefined();
  });

  it("switches graph tabs to view Volume, Profit, Payment, and Category charts", () => {
    render(
      <GraphDetailsModal
        isOpen={true}
        onOpenChange={vi.fn()}
        orders={mockOrders}
      />
    );

    const volumeTab = screen.getByText(/2. Order Volume & Velocity/i);
    fireEvent.click(volumeTab);
    expect(screen.getByText("Order Transactions Velocity")).toBeDefined();

    const profitTab = screen.getByText(/3. Profit Margin & COGS/i);
    fireEvent.click(profitTab);
    expect(screen.getByText(/Revenue vs. 60% Net Profit vs. 40% COGS/i)).toBeDefined();

    const paymentTab = screen.getByText(/4. Payment Gateway Share/i);
    fireEvent.click(paymentTab);
    expect(screen.getByText("Payment Method Volume Breakdown")).toBeDefined();
  });

  it("renders summary metric cards (Period Revenue, Total Orders, AOV)", () => {
    render(
      <GraphDetailsModal
        isOpen={true}
        onOpenChange={vi.fn()}
        orders={mockOrders}
      />
    );

    expect(screen.getByText("Period Revenue")).toBeDefined();
    expect(screen.getByText("Total Orders")).toBeDefined();
    expect(screen.getByText("Average Ticket (AOV)")).toBeDefined();
    expect(screen.getByText("Peak Velocity Period")).toBeDefined();
  });
});
