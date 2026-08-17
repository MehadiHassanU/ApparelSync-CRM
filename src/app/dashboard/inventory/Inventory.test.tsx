import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InventoryPage from "./page";
import { supabase } from "@/lib/supabaseClient";

const mockProducts = [
  {
    id: "prod-1",
    name: "Classic Denim Shirt",
    sku: "AP-874839",
    price: 49.99,
    stock_quantity: 12,
    category_id: "cat-1",
    barcode: "123456789",
    qr_data: null,
    created_at: "2026-06-25T12:00:00Z",
    updated_at: "2026-06-25T12:00:00Z",
    category: { name: "Shirts" },
  },
  {
    id: "prod-2",
    name: "Slim Fit Pants",
    sku: "AP-874840",
    price: 69.99,
    stock_quantity: 2, // low stock
    category_id: "cat-2",
    barcode: null,
    qr_data: null,
    created_at: "2026-06-26T12:00:00Z",
    updated_at: "2026-06-26T12:00:00Z",
    category: { name: "Pants" },
  },
];

const mockCategories = [
  { id: "cat-1", name: "Shirts" },
  { id: "cat-2", name: "Pants" },
];

describe("Inventory Page Integration & CRUD Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "products") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockProducts, error: null }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: "prod-new" }, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      if (table === "categories") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockCategories, error: null }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      return {} as any;
    });
  });

  it("renders loaded products and categories count correctly", async () => {
    render(<InventoryPage />);
    await waitFor(() => {
      expect(screen.getByText("Classic Denim Shirt")).toBeDefined();
      expect(screen.getByText("Slim Fit Pants")).toBeDefined();
      expect(screen.getByText("AP-874839")).toBeDefined();
      expect(screen.getByText("Low")).toBeDefined(); // low stock badge for prod-2
    });
  });

  describe("Filtering and Search", () => {
    it("filters products by search query", async () => {
      render(<InventoryPage />);
      await waitFor(() => expect(screen.getByText("Classic Denim Shirt")).toBeDefined());

      const searchInput = screen.getByPlaceholderText("Search name, SKU, barcode...");
      fireEvent.change(searchInput, { target: { value: "Denim" } });

      expect(screen.getByText("Classic Denim Shirt")).toBeDefined();
      expect(screen.queryByText("Slim Fit Pants")).toBeNull();
    });
  });

  describe("Product Dialogs", () => {
    it("opens Add Product dialog and allows auto generating SKU", async () => {
      render(<InventoryPage />);
      await waitFor(() => expect(screen.getByText("Classic Denim Shirt")).toBeDefined());

      const addBtn = screen.getByText("Add product");
      fireEvent.click(addBtn);

      expect(screen.getByText("Create New Product")).toBeDefined();

      const autoBtn = screen.getByText("Auto");
      fireEvent.click(autoBtn);

      const skuInput = screen.getByPlaceholderText("AP-100492") as HTMLInputElement;
      expect(skuInput.value).toContain("AP-");
    });
  });
});
