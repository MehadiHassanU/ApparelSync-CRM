import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ScannerPOSPage from "@/app/dashboard/scanner/page";
import { supabase } from "@/lib/supabaseClient";
import { PaymentProcessorFactory, BkashPaymentProcessor, CreditCardPaymentProcessor } from "@/lib/patterns/PaymentFactory";
import { InvoiceBuilder } from "@/lib/patterns/InvoiceBuilder";
import { PosEventHub } from "@/lib/patterns/EventObserver";

describe("Negative Testing & Boundary Failure Handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Negative Test 1: Scanning Unregistered Barcode ─────────────────────────
  it("Negative Case 1: Scanning an unregistered barcode displays error banner and allows retry", async () => {
    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "products") {
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              // Returns null/not found for invalid barcode
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        } as any;
      }
      return {} as any;
    });

    render(<ScannerPOSPage />);

    const barcodeInput = screen.getByPlaceholderText("Enter product SKU or barcode...");
    fireEvent.change(barcodeInput, { target: { value: "INVALID-BARCODE-99999" } });
    fireEvent.click(screen.getByText("Look up"));

    await waitFor(() => {
      expect(screen.getByText(/No product found matching code/i)).toBeDefined();
    });

    // Verify Cart remains empty
    expect(screen.getByText("Your cart is empty")).toBeDefined();
  });

  // ─── Negative Test 2: Payment Gateway Negative & Zero Amounts ───────────────
  it("Negative Case 2: Payment processor rejects zero and negative transaction amounts", () => {
    const cashProcessor = PaymentProcessorFactory.createProcessor("Cash");
    const zeroValidation = cashProcessor.validatePayment(0);
    expect(zeroValidation.valid).toBe(false);
    expect(zeroValidation.error).toContain("greater than zero");

    const negativeValidation = cashProcessor.validatePayment(-500);
    expect(negativeValidation.valid).toBe(false);

    expect(() => {
      cashProcessor.processPayment(-100);
    }).toThrowError(/Payment amount must be greater than zero/);
  });

  // ─── Negative Test 3: Malformed bKash Mobile Wallet Number ──────────────────
  it("Negative Case 3: Rejects malformed bKash mobile numbers with invalid formats", () => {
    const bkashProcessor = new BkashPaymentProcessor();

    // Invalid non-Bangladeshi / malformed prefix
    const invalidFormat = bkashProcessor.validatePayment(1000, { walletNumber: "123456" });
    expect(invalidFormat.valid).toBe(false);
    expect(invalidFormat.error).toContain("Invalid bKash mobile wallet number format");

    // Invalid carrier code (010, 011, 012 not valid mobile operators in BD)
    const invalidCarrier = bkashProcessor.validatePayment(1000, { walletNumber: "01012345678" });
    expect(invalidCarrier.valid).toBe(false);

    expect(() => {
      bkashProcessor.processPayment(1000, { walletNumber: "01012345678" });
    }).toThrowError(/Invalid bKash mobile wallet number format/);
  });

  // ─── Negative Test 4: Malformed Credit Card Last 4 Digits ───────────────────
  it("Negative Case 4: Rejects credit card last-4 digits with invalid length", () => {
    const cardProcessor = new CreditCardPaymentProcessor();

    const shortDigits = cardProcessor.validatePayment(1500, { cardLast4: "12" });
    expect(shortDigits.valid).toBe(false);
    expect(shortDigits.error).toContain("exactly 4 numbers");

    const longDigits = cardProcessor.validatePayment(1500, { cardLast4: "123456" });
    expect(longDigits.valid).toBe(false);

    expect(() => {
      cardProcessor.processPayment(1500, { cardLast4: "123" });
    }).toThrowError(/exactly 4 numbers/);
  });

  // ─── Negative Test 5: Loyalty Discount Exceeding Order Price ────────────────
  it("Negative Case 5: Discount greater than invoice items amount safely bounds total to 0", () => {
    const invoice = new InvoiceBuilder()
      .setOrderNumber("ORD-NEG-01")
      .setCustomer("John Doe")
      .addItem({ name: "Socks", quantity: 1, unitPrice: 100, totalPrice: 100 })
      .applyLoyaltyRewards(0, 500, 300) // ৳300 discount on ৳100 item
      .build();

    // Total must not be negative (bounded to 0)
    expect(invoice.total).toBe(0);
    expect(invoice.price).toBe(0);
    expect(invoice.formattedPrice).toBe("৳0.00");
  });

  // ─── Negative Test 6: Observer Error Isolation ─────────────────────────────
  it("Negative Case 6: Broken observer throws error without terminating remaining observer notifications", () => {
    const hub = PosEventHub.getInstance();
    hub.clearHistory();

    const brokenObserver = {
      id: "broken-obs",
      onNotify: vi.fn().mockImplementation(() => {
        throw new Error("Fatal crash in faulty 3rd party plugin");
      }),
    };

    const healthyObserver = {
      id: "healthy-obs",
      onNotify: vi.fn(),
    };

    hub.subscribe("ORDER_COMPLETED", brokenObserver);
    hub.subscribe("ORDER_COMPLETED", healthyObserver);

    // Notify hub — should not throw uncaught error
    expect(() => {
      hub.notify({
        type: "ORDER_COMPLETED",
        payload: { orderId: "ord-100" },
        timestamp: new Date().toISOString(),
      });
    }).not.toThrow();

    // Verify healthy observer still received notification
    expect(healthyObserver.onNotify).toHaveBeenCalled();
  });
});
