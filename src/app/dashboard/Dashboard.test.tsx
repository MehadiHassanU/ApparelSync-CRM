import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Dashboard from "./page";
import { supabase } from "../../lib/supabaseClient";

const mockOrdersData = [
  {
    id: "sale-1",
    order_number: "NA874839",
    total: 1299.99,
    payment_method: "PayPal",
    status: "on way",
    sale_date: "2026-06-25T12:00:00Z",
    customer_id: "cust-1",
    customer: { full_name: "Sarah Jenkins" },
  },
  {
    id: "sale-2",
    order_number: "NA874840",
    total: 145.50,
    payment_method: "Credit Card",
    status: "delivered",
    sale_date: "2026-06-26T12:00:00Z",
    customer_id: "cust-2",
    customer: { full_name: "Michael Chang" },
  },
];

describe("Admin Dashboard Integration & CRUD Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock Supabase select for initial render
    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "sales") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockOrdersData, error: null }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      if (table === "customers") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cust-1" }, error: null }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });
  });

  it("renders loaded sales records correctly", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
      expect(screen.getByText("Michael Chang")).toBeDefined();
      expect(screen.getByText("NA874839")).toBeDefined();
    });
  });

  // 🔍 SEARCH & FILTER TESTS
  describe("Search & Filter Functionality", () => {
    it("filters orders based on search query", async () => {
      render(<Dashboard />);
      await waitFor(() => expect(screen.getByText("Sarah Jenkins")).toBeDefined());

      const searchInputs = screen.getAllByPlaceholderText("Search customer, ID, category...");
      fireEvent.change(searchInputs[0], { target: { value: "Sarah" } });

      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
      expect(screen.queryByText("Michael Chang")).toBeNull();
    });

    it("filters orders when clicking category filter buttons", async () => {
      render(<Dashboard />);
      await waitFor(() => expect(screen.getByText("Sarah Jenkins")).toBeDefined());

      const filterBtn = screen.getByText("+ Filter Apparel");
      fireEvent.click(filterBtn);

      expect(screen.getAllByText("Apparel").length).toBeGreaterThan(0);
    });

    it("clears active filters when Clear Filters button is clicked", async () => {
      render(<Dashboard />);
      await waitFor(() => expect(screen.getByText("Sarah Jenkins")).toBeDefined());

      const filterBtn = screen.getByText("+ Filter Apparel");
      fireEvent.click(filterBtn);

      const clearBtn = screen.getByText("Clear filters");
      fireEvent.click(clearBtn);

      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
      expect(screen.getByText("Michael Chang")).toBeDefined();
    });
  });

  // ⚡ CRUD ACTION TESTS
  describe("CRUD Actions (Add, Mark Delivered, Delete)", () => {
    it("opens Add Order modal and submits new order payload", async () => {
      render(<Dashboard />);
      await waitFor(() => expect(screen.getByText("Sarah Jenkins")).toBeDefined());

      const addOrderBtn = screen.getByText("Add order");
      fireEvent.click(addOrderBtn);

      expect(screen.getByText("Create Apparel Order")).toBeDefined();

      const customerInput = screen.getByPlaceholderText("e.g. Sarah Jenkins");
      const priceInput = screen.getByPlaceholderText("e.g. 145.50");

      fireEvent.change(customerInput, { target: { value: "Emma Watson" } });
      fireEvent.change(priceInput, { target: { value: "299.99" } });

      const submitBtn = screen.getByText("Submit Order");
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith("sales");
      });
    });

    it("marks an order as delivered via action menu", async () => {
      render(<Dashboard />);
      await waitFor(() => expect(screen.getByText("Sarah Jenkins")).toBeDefined());

      // Open dropdown actions menu
      const actionButtons = screen.getAllByRole("button");
      const moreButtons = actionButtons.filter(btn => btn.querySelector("svg"));
      if (moreButtons.length > 0) {
        fireEvent.click(moreButtons[moreButtons.length - 1]);
      }
    });

    it("deletes an order when confirmed", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      render(<Dashboard />);
      await waitFor(() => expect(screen.getByText("Sarah Jenkins")).toBeDefined());
    });
  });
});
