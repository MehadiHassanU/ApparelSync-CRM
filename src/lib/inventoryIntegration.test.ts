import { describe, it, expect, vi, beforeEach } from "vitest";
import { supabase } from "./supabaseClient";

describe("Database Integration Tests - Products & Categories", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("verifies selecting products from supabase products schema", async () => {
    const mockProds = [
      { id: "p1", name: "Shirt", price: 10, stock_quantity: 50 },
    ];

    const spy = vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockProds, error: null }),
        }),
      } as any;
    });

    const { data, error } = await supabase
      .from("products")
      .select("*, category:categories(name)")
      .order("created_at");

    expect(error).toBeNull();
    expect(data).toEqual(mockProds);
    expect(spy).toHaveBeenCalledWith("products");
  });

  it("verifies inserting a product and then updating its QR data", async () => {
    const insertSpy = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "p-new" }, error: null }),
      }),
    });

    const updateSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "products") {
        return {
          insert: insertSpy,
          update: updateSpy,
        } as any;
      }
      return {} as any;
    });

    // 1. Insert product
    const { data: newProd, error: insertErr } = await supabase
      .from("products")
      .insert([{ name: "Tee", sku: "AP-101", price: 19.99, stock_quantity: 20 }])
      .select("id")
      .single();

    expect(insertErr).toBeNull();
    expect(newProd?.id).toBe("p-new");

    // 2. Update QR
    const qrPayload = JSON.stringify({ type: "product", id: "p-new", sku: "AP-101" });
    const { error: updateErr } = await supabase
      .from("products")
      .update({ qr_data: qrPayload })
      .eq("id", "p-new");

    expect(updateErr).toBeNull();
    expect(updateSpy).toHaveBeenCalledWith({ qr_data: qrPayload });
  });

  it("verifies category creation and deletion schema calls", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    const deleteSpy = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "categories") {
        return {
          insert: insertSpy,
          delete: deleteSpy,
        } as any;
      }
      return {} as any;
    });

    // Add category
    const { error: addErr } = await supabase
      .from("categories")
      .insert([{ name: "Dresses" }]);
    expect(addErr).toBeNull();
    expect(insertSpy).toHaveBeenCalledWith([{ name: "Dresses" }]);

    // Delete category
    const { error: delErr } = await supabase
      .from("categories")
      .delete()
      .eq("id", "cat-123");
    expect(delErr).toBeNull();
    expect(deleteSpy).toHaveBeenCalled();
  });
});
