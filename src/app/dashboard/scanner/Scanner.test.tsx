import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ScannerPOSPage from "./page";
import { supabase } from "@/lib/supabaseClient";

const mockFoundProduct = {
  id: "prod-1",
  name: "Vintage Denim Jacket",
  sku: "AP-998822",
  price: 89.99,
  stock_quantity: 10,
  category_id: "cat-1",
  barcode: "998822",
  qr_data: null,
  created_at: "2026-06-25T12:00:00Z",
  updated_at: "2026-06-25T12:00:00Z",
  category: { name: "Jackets" },
};

describe("Scanner POS Page Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "products") {
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockFoundProduct, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
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
      if (table === "sales") {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "sale-123" }, error: null }),
            }),
          }),
        } as any;
      }
      if (table === "sale_items") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        } as any;
      }
      return {} as any;
    });
  });

  it("performs manual SKU lookup and adds item to cart", async () => {
    render(<ScannerPOSPage />);

    // Type in manual input
    const input = screen.getByPlaceholderText("Enter product SKU or barcode...");
    fireEvent.change(input, { target: { value: "AP-998822" } });

    const lookupBtn = screen.getByText("Look up");
    fireEvent.click(lookupBtn);

    // Wait for product preview card to render
    await waitFor(() => {
      expect(screen.getAllByText("Vintage Denim Jacket").length).toBeGreaterThan(0);
      expect(screen.getByText("SKU: AP-998822", { exact: false })).toBeDefined();
      expect(screen.getAllByText("$89.99", { exact: false }).length).toBeGreaterThan(0);
    });

    // Check shopping cart displays the item since it's auto-added
    expect(screen.getByText("Shopping Cart")).toBeDefined();
  });

  it("handles checkout form and triggers sale insertion", async () => {
    render(<ScannerPOSPage />);

    // Lookup to add item
    const input = screen.getByPlaceholderText("Enter product SKU or barcode...");
    fireEvent.change(input, { target: { value: "AP-998822" } });
    fireEvent.click(screen.getByText("Look up"));

    await waitFor(() => {
      expect(screen.getAllByText("Vintage Denim Jacket").length).toBeGreaterThan(0);
    });

    // Fill customer name
    const custInput = screen.getByPlaceholderText("e.g. Walk-in Customer");
    fireEvent.change(custInput, { target: { value: "Jane Doe" } });

    // Submit checkout
    const checkoutBtn = screen.getByText("Complete POS Sale");
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("sales");
      expect(supabase.from).toHaveBeenCalledWith("sale_items");
    });
  });
});
