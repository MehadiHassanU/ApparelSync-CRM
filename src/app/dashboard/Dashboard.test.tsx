import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "./page";
import { supabase } from "../../lib/supabaseClient";

const mockOrdersData = [
  {
    id: "sale-1",
    order_number: "ORD-87483",
    total: 1299.99,
    payment_method: "PayPal",
    status: "processing",
    sale_date: "2026-06-25T12:00:00Z",
    customer_id: "cust-1",
    customer: { full_name: "Sarah Jenkins" },
  },
  {
    id: "sale-2",
    order_number: "ORD-87484",
    total: 145.50,
    payment_method: "Credit Card",
    status: "delivered",
    sale_date: "2026-06-26T12:00:00Z",
    customer_id: "cust-2",
    customer: { full_name: "Michael Chang" },
  },
];

describe("Admin Dashboard Integration & Analytics Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock Supabase select for initial render
    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "sales") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockOrdersData, error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      return {} as any;
    });
  });

  it("renders store analytics and KPI cards correctly", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Admin Dashboard")).toBeDefined();
      expect(screen.getByText("Total Revenue")).toBeDefined();
      expect(screen.getByText("Total Orders")).toBeDefined();
    });
  });

  it("renders active processing orders in summary section", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
      expect(screen.getByText(/ORD-87483/)).toBeDefined();
    });
  });

  it("provides link to see all processing orders on dedicated Orders page", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      const seeAllBtn = screen.getByText("See All Orders").closest("a");
      expect(seeAllBtn).not.toBeNull();
      expect(seeAllBtn?.getAttribute("href")).toBe("/dashboard/orders");
    });
  });
});
