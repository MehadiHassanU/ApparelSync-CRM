import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ScannerPOSPage from "@/app/dashboard/scanner/page";
import CustomersPage from "@/app/dashboard/customers/page";
import InventoryPage from "@/app/dashboard/inventory/page";
import { supabase } from "@/lib/supabaseClient";
import { aggregateOrdersByTimeframe, calculateTimeframeSummary } from "@/lib/analyticsUtils";

describe("User Acceptance Testing (UAT) — End-to-End User Scenarios", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Acceptance Scenario 1: POS Cashier End-to-End Checkout ────────────────
  it("UAT Scenario 1: Cashier scans product barcode, links customer profile, and processes POS sale", async () => {
    const mockProduct = {
      id: "prod-100",
      name: "Vintage Denim Jacket",
      sku: "AP-892100",
      price: 2500,
      stock_quantity: 12,
      barcode: "893000892100",
      category_id: "cat-1",
      category: { name: "Outerwear" },
    };

    let updatedStock: number | null = null;
    let createdSale: any = null;

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "products") {
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: mockProduct, error: null }),
              limit: vi.fn().mockResolvedValue({ data: [mockProduct], error: null }),
            }),
          }),
          update: vi.fn().mockImplementation((payload: any) => ({
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              updatedStock = payload.stock_quantity;
              return Promise.resolve({ error: null });
            }),
          })),
        } as any;
      }
      if (table === "customers") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: "cust-50" }, error: null }),
            }),
          }),
        } as any;
      }
      if (table === "sales") {
        return {
          insert: vi.fn().mockImplementation((payload: any[]) => {
            createdSale = payload[0];
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "sale-999" }, error: null }),
              }),
            };
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

    render(<ScannerPOSPage />);

    // 1. Search product by barcode
    const barcodeInput = screen.getByPlaceholderText("Enter product SKU or barcode...");
    fireEvent.change(barcodeInput, { target: { value: "893000892100" } });
    fireEvent.click(screen.getByText("Look up"));

    // Verify product added to POS Cart
    await waitFor(() => {
      expect(screen.getAllByText("Vintage Denim Jacket").length).toBeGreaterThan(0);
    });

    // 2. Select customer profile in POS checkout
    const customerInput = screen.getByPlaceholderText(/Walk-in Customer/i);
    fireEvent.change(customerInput, { target: { value: "Sarah Jenkins" } });

    // 3. Complete checkout
    const checkoutBtn = screen.getByText("Complete POS Sale");
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("sales");
      expect(supabase.from).toHaveBeenCalledWith("products");
    });

    // Acceptance criteria validation: Stock decremented by 1 (12 -> 11)
    expect(updatedStock).toBe(11);
    expect(createdSale).not.toBeNull();
  });

  // ─── Acceptance Scenario 2: Automatic Barcode & Label Generation ───────────
  it("UAT Scenario 2: New product creation auto-assigns Code 128 barcode and detects low stock boundary", async () => {
    let insertedProduct: any = null;

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "categories") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [{ id: "cat-1", name: "Shirts" }], error: null }),
          }),
        } as any;
      }
      if (table === "products") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          insert: vi.fn().mockImplementation((payload: any[]) => {
            insertedProduct = payload[0];
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: "new-prod-id" }, error: null }),
              }),
            };
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as any;
      }
      return {} as any;
    });

    render(<InventoryPage />);

    // Open Add Product Dialog
    const addBtn = screen.getByText("Add product");
    fireEvent.click(addBtn);

    // Auto-generate SKU & Barcode
    const autoSkuBtn = screen.getByText("Auto");
    fireEvent.click(autoSkuBtn);

    // Fill Product details
    const nameInput = screen.getByPlaceholderText("e.g. Slim Fit Denim Shirt");
    fireEvent.change(nameInput, { target: { value: "Linen Summer Shirt" } });

    const priceInput = screen.getByPlaceholderText("29.99");
    fireEvent.change(priceInput, { target: { value: "1850" } });

    const stockInput = screen.getByPlaceholderText("100");
    fireEvent.change(stockInput, { target: { value: "4" } }); // Low stock threshold (<= 5)

    // Save Product
    const saveBtn = screen.getByText("Save Product");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(insertedProduct).not.toBeNull();
    });

    // Acceptance Criteria: Auto SKU prefix AP- and Barcode 893000 prefix
    expect(insertedProduct.name).toBe("Linen Summer Shirt");
    expect(insertedProduct.sku).toMatch(/^AP-\d+/);
    expect(insertedProduct.barcode).toMatch(/^893000\d+/);
    expect(insertedProduct.stock_quantity).toBe(4);
  });

  // ─── Acceptance Scenario 3: Customer Lifetime Value (LTV) Aggregation ───────
  it("UAT Scenario 3: Recurring customer purchases aggregate LTV and display purchase timeline", async () => {
    const mockCustomers = [
      {
        id: "cust-1",
        full_name: "Sarah Jenkins",
        email: "sarah@example.com",
        phone: "+880 1712-345678",
        created_at: "2026-06-01T00:00:00Z",
      },
    ];

    const mockSales = [
      {
        id: "sale-1",
        order_number: "NA1001",
        customer_id: "cust-1",
        total: 3500.0,
        payment_method: "bKash",
        status: "completed",
        sale_date: "2026-06-15T12:00:00Z",
      },
      {
        id: "sale-2",
        order_number: "NA1002",
        customer_id: "cust-1",
        total: 2500.0,
        payment_method: "Credit Card",
        status: "completed",
        sale_date: "2026-07-20T12:00:00Z",
      },
    ];

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "customers") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockCustomers, error: null }),
          }),
        } as any;
      }
      if (table === "sales") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockSales, error: null }),
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockSales, error: null }),
            }),
          }),
        } as any;
      }
      if (table === "point_transactions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
    });

    // Acceptance Criteria: KPI header renders Total Customer LTV
    expect(screen.getByText("Total Customer LTV")).toBeDefined();
    expect(screen.getByText("Repeat Customers")).toBeDefined();

    // View customer timeline drawer
    const viewBtn = screen.getByText("View");
    fireEvent.click(viewBtn);

    await waitFor(() => {
      expect(screen.getByText("Purchase History")).toBeDefined();
      expect(screen.getByText("#NA1001")).toBeDefined();
      expect(screen.getByText("#NA1002")).toBeDefined();
    });
  });

  // ─── Acceptance Scenario 4: Multi-Timeframe Analytics Aggregation ──────────
  it("UAT Scenario 4: Aggregates daily, weekly, and monthly sales datasets and computes run-rates", () => {
    const rawOrders = [
      { price: 1500, date: "2026-08-01", paymentMethod: "bKash" },
      { price: 2500, date: "2026-08-01", paymentMethod: "Cash" },
      { price: 4000, date: "2026-08-08", paymentMethod: "Credit Card" },
      { price: 6000, date: "2026-07-20", paymentMethod: "PayPal" },
    ];

    const dailyPoints = aggregateOrdersByTimeframe(rawOrders, "daily");
    const weeklyPoints = aggregateOrdersByTimeframe(rawOrders, "weekly");
    const monthlyPoints = aggregateOrdersByTimeframe(rawOrders, "monthly");

    expect(dailyPoints.length).toBeGreaterThanOrEqual(2);
    expect(weeklyPoints.length).toBeGreaterThanOrEqual(2);
    expect(monthlyPoints.length).toBe(2); // July and August

    const summary = calculateTimeframeSummary(monthlyPoints);
    expect(summary.totalRevenue).toBe(14000);
    expect(summary.totalOrders).toBe(4);
    expect(summary.avgOrderValue).toBe(3500);
    expect(summary.estimatedProfit).toBe(8400); // 60%
  });
});
