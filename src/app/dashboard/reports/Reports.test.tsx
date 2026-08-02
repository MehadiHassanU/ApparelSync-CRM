import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ReportsPage from "./page";
import { supabase } from "@/lib/supabaseClient";

// Mock recharts ResponsiveContainer to render children cleanly in JSDOM
vi.mock("recharts", async () => {
  const original = await vi.importActual("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
  };
});

describe("Financial Reports & Ledger Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== "undefined") {
      localStorage.clear();
    }

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "sales") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "sale-901",
                  total_amount: 15000,
                  payment_method: "bKash",
                  created_at: "2026-08-01T10:00:00Z",
                  customer_name: "Mahmud Hasan",
                },
              ],
              error: null,
            }),
          }),
        } as any;
      }
      return {} as any;
    });
  });

  it("renders page header, top actions, and KPI summary metrics", async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Financial Reports & Ledger/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Gross Revenue/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Expenses & Refunds/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Net Profit/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Log Transaction/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Export CSV/i).length).toBeGreaterThan(0);
    });
  });

  it("renders financial transactions ledger table and filters", async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Financial Transactions Ledger/i).length).toBeGreaterThan(0);
      expect(screen.getByPlaceholderText(/Search ID, party, category/i)).toBeDefined();
    });
  });

  it("opens Log Financial Transaction modal when Log Transaction button is clicked", async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Log Transaction/i).length).toBeGreaterThan(0);
    });

    const logBtn = screen.getAllByText(/Log Transaction/i)[0];
    fireEvent.click(logBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Log Financial Transaction/i).length).toBeGreaterThan(0);
      expect(screen.getByPlaceholderText("e.g. 5000")).toBeDefined();
    });
  });

  it("filters transactions table based on search input", async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search ID, party, category/i)).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText(/Search ID, party, category/i);
    fireEvent.change(searchInput, { target: { value: "Rahim Chowdhury" } });

    await waitFor(() => {
      expect(screen.getAllByText(/Rahim Chowdhury/i).length).toBeGreaterThan(0);
    });
  });

  it("allows switching timeframe presets and month selection for timeline chart", async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Today").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Last Week").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Monthly").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Yearly").length).toBeGreaterThan(0);
    });

    const monthlyBtn = screen.getAllByText("Monthly")[0];
    fireEvent.click(monthlyBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Financial Timeline/i).length).toBeGreaterThan(0);
    });
  });
});
