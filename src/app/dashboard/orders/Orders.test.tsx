import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrdersPage from "./page";
import { supabase } from "@/lib/supabaseClient";

const mockSales = [
  {
    id: "sale-101",
    order_number: "ORD-99001",
    total: 250.0,
    payment_method: "Credit Card",
    status: "processing",
    sale_date: "2026-07-26T10:00:00Z",
    customer_id: "cust-1",
    customer: { full_name: "Sarah Jenkins" },
  },
  {
    id: "sale-102",
    order_number: "ORD-99002",
    total: 180.5,
    payment_method: "PayPal",
    status: "delivered",
    sale_date: "2026-07-25T14:30:00Z",
    customer_id: "cust-2",
    customer: { full_name: "Michael Chang" },
  },
];

const mockCustomers = [
  { id: "cust-1", full_name: "Sarah Jenkins", phone: "555-0192" },
  { id: "cust-2", full_name: "Michael Chang", phone: "555-0144" },
];

describe("Order Management Page Integration Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "sales") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockSales, error: null }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "sale-103",
                  order_number: "ORD-99003",
                  total: 120.0,
                  payment_method: "Cash",
                  status: "processing",
                  sale_date: "2026-07-26T15:00:00Z",
                  customer_id: "cust-3",
                  customer: { full_name: "Emma Watson" },
                },
                error: null,
              }),
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

      if (table === "customers") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockCustomers, error: null }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: "cust-3", full_name: "Emma Watson" },
                error: null,
              }),
            }),
          }),
        } as any;
      }

      return {} as any;
    });
  });

  it("renders order management header and order records", async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("Order Management")).toBeDefined();
      expect(screen.getByText("ORD-99001")).toBeDefined();
      expect(screen.getByText("Sarah Jenkins")).toBeDefined();
      expect(screen.getByText("ORD-99002")).toBeDefined();
      expect(screen.getByText("Michael Chang")).toBeDefined();
    });
  });

  it("opens Create Order dialog and submits order with a new customer name", async () => {
    render(<OrdersPage />);

    await waitFor(() => expect(screen.getByText("ORD-99001")).toBeDefined());

    const createBtn = screen.getByText("Create Order");
    fireEvent.click(createBtn);

    expect(screen.getByText("Create New Customer Order")).toBeDefined();

    const nameInput = screen.getByPlaceholderText("e.g. Jane Doe");
    const priceInput = screen.getByPlaceholderText("120.00");

    fireEvent.change(nameInput, { target: { value: "Emma Watson" } });
    fireEvent.change(priceInput, { target: { value: "120.00" } });

    const submitBtn = screen.getByText("Submit Order");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("customers");
      expect(supabase.from).toHaveBeenCalledWith("sales");
    });
  });

  it("updates order status from processing to delivered", async () => {
    render(<OrdersPage />);

    await waitFor(() => expect(screen.getByText("ORD-99001")).toBeDefined());

    const markDeliveredBtn = screen.getByText("Mark Delivered");
    fireEvent.click(markDeliveredBtn);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("sales");
    });
  });
});
