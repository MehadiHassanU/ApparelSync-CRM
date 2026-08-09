import { describe, it, expect } from "vitest";
import { InvoiceBuilder } from "./InvoiceBuilder";

describe("Design Pattern: Builder Pattern (InvoiceBuilder)", () => {
  it("builds a basic retail invoice step by step with default values", () => {
    const invoice = new InvoiceBuilder()
      .setOrderNumber("ORD-10020")
      .setCustomer("Sarah Jenkins")
      .setPaymentMethod("bKash")
      .setDirectTotal(1500)
      .build();

    expect(invoice.orderNumber).toBe("ORD-10020");
    expect(invoice.customerName).toBe("Sarah Jenkins");
    expect(invoice.paymentMethod).toBe("bKash");
    expect(invoice.total).toBe(1500);
    expect(invoice.price).toBe(1500);
    expect(invoice.formattedPrice).toBe("৳1500.00");
  });

  it("builds an invoice with line items and automatically calculates total", () => {
    const invoice = new InvoiceBuilder()
      .setOrderNumber("ORD-10021")
      .setCustomer("Michael Chang")
      .addItem({ name: "Cotton Polo Shirt", quantity: 2, unitPrice: 400, totalPrice: 800 })
      .addItem({ name: "Denim Jeans", quantity: 1, unitPrice: 1200, totalPrice: 1200 })
      .build();

    expect(invoice.items?.length).toBe(2);
    expect(invoice.total).toBe(2000); // 800 + 1200
  });

  it("applies loyalty points reward discount and adjusts total amount", () => {
    const invoice = new InvoiceBuilder()
      .setOrderNumber("ORD-10022")
      .setCustomer("Marcus Brody")
      .addItem({ name: "Winter Jacket", quantity: 1, unitPrice: 3000, totalPrice: 3000 })
      .applyLoyaltyRewards(300, 50, 100) // 100 BDT discount
      .build();

    expect(invoice.pointsEarned).toBe(300);
    expect(invoice.pointsRedeemed).toBe(50);
    expect(invoice.discountAmount).toBe(100);
    expect(invoice.total).toBe(2900); // 3000 - 100
  });
});
