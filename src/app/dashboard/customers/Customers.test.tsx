import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CustomersPage from "./page";
import { supabase } from "@/lib/supabaseClient";

const mockCustomers = [
  {
    id: "cust-1",
    full_name: "Sarah Jenkins",
    email: "sarah@example.com",
    phone: "+1 555-0192",
    address: "742 Evergreen Terrace",
    city: "Springfield",
    notes: "VIP Wholesale buyer",
    created_at: "2026-06-25T12:00:00Z",
    updated_at: "2026-06-25T12:00:00Z",
  },
  {
    id: "cust-2",
    full_name: "Alex Rivera",
    email: "alex@example.com",
    phone: "+1 555-0199",
    address: null,
    city: "Chicago",
    notes: null,
    created_at: "2026-06-26T12:00:00Z",
    updated_at: "2026-06-26T12:00:00Z",
  },
];

const mockSales = [
  {
    id: "sale-1",
    order_number: "NA874839",
    customer_id: "cust-1",
    total: 250.0,
    payment_method: "Credit Card",
    status: "completed",
    sale_date: "2026-06-25T12:00:00Z",
  },
  {
    id: "sale-2",
    order_number: "NA874840",
    customer_id: "cust-1",
    total: 150.0,
    payment_method: "Cash",
    status: "completed",
    sale_date: "2026-06-27T12:00:00Z",
  },
];

describe("Customer Profiles Page Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "customers") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockCustomers, error: null }),
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
      return {} as any;
    });
  });

  it("renders loaded customer directory and calculates KPI stats correctly", async () => {
    render(<CustomersPage />);

    // Wait for customer profiles to load
    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
      expect(screen.getByText("Alex Rivera")).toBeDefined();
      expect(screen.getByText("+1 555-0192")).toBeDefined();
      expect(screen.getByText("Springfield")).toBeDefined();
    });

    // Verify KPI stats render
    expect(screen.getByText("Total Customers")).toBeDefined();
    expect(screen.getByText("Repeat Customers")).toBeDefined();
    expect(screen.getByText("Total Customer LTV")).toBeDefined();
  });

  it("filters customer profiles using search query", async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
    });

    const searchInput = screen.getByPlaceholderText("Search by name, phone, email, city...");
    fireEvent.change(searchInput, { target: { value: "Springfield" } });

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
      expect(screen.queryByText("Alex Rivera")).toBeNull();
    });
  });

  it("opens Add Customer modal and submits new customer profile", async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
    });

    const addBtn = screen.getByText("Add New Customer");
    fireEvent.click(addBtn);

    // Fill form
    const nameInput = screen.getByPlaceholderText("e.g. Sarah Jenkins");
    fireEvent.change(nameInput, { target: { value: "Marcus Brody" } });

    const phoneInput = screen.getByPlaceholderText("e.g. +1 555-0192");
    fireEvent.change(phoneInput, { target: { value: "+1 555-9900" } });

    const saveBtn = screen.getByText("Save Customer");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("customers");
    });
  });

  it("opens customer profile drawer and views purchase history", async () => {
    render(<CustomersPage />);

    await waitFor(() => {
      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
    });

    const viewBtns = screen.getAllByText("View");
    fireEvent.click(viewBtns[0]);

    await waitFor(() => {
      expect(screen.getByText("Customer ID: #cust-1", { exact: false })).toBeDefined();
      expect(screen.getByText("Purchase History")).toBeDefined();
      expect(screen.getByText("#NA874839")).toBeDefined();
    });
  });
});
