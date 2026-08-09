import { describe, it, expect } from "vitest";
import {
  PaymentProcessorFactory,
  CashPaymentProcessor,
  BkashPaymentProcessor,
  CreditCardPaymentProcessor,
  PaypalPaymentProcessor,
} from "./PaymentFactory";

describe("Design Pattern: Factory Pattern (PaymentProcessorFactory)", () => {
  it("creates CashPaymentProcessor for Cash method", () => {
    const processor = PaymentProcessorFactory.createProcessor("Cash");
    expect(processor).toBeInstanceOf(CashPaymentProcessor);
    expect(processor.method).toBe("Cash");
    expect(processor.calculateFee(1000)).toBe(0);

    const result = processor.processPayment(1000);
    expect(result.success).toBe(true);
    expect(result.amount).toBe(1000);
    expect(result.fee).toBe(0);
    expect(result.netAmount).toBe(1000);
    expect(result.transactionReference).toContain("CASH-");
  });

  it("creates BkashPaymentProcessor for bKash method with 1.5% fee", () => {
    const processor = PaymentProcessorFactory.createProcessor("bKash");
    expect(processor).toBeInstanceOf(BkashPaymentProcessor);
    expect(processor.method).toBe("bKash");
    expect(processor.calculateFee(2000)).toBe(30); // 1.5% of 2000

    const result = processor.processPayment(2000, { walletNumber: "01712345678" });
    expect(result.success).toBe(true);
    expect(result.fee).toBe(30);
    expect(result.netAmount).toBe(1970);
    expect(result.transactionReference).toContain("BKASH-");
  });

  it("creates CreditCardPaymentProcessor for Card method", () => {
    const processor = PaymentProcessorFactory.createProcessor("Credit Card");
    expect(processor).toBeInstanceOf(CreditCardPaymentProcessor);
    expect(processor.method).toBe("Credit Card");

    const result = processor.processPayment(1000, { cardLast4: "4242" });
    expect(result.success).toBe(true);
    expect(result.transactionReference).toContain("CARD-AUTH-");
  });

  it("creates PaypalPaymentProcessor for PayPal method", () => {
    const processor = PaymentProcessorFactory.createProcessor("PayPal");
    expect(processor).toBeInstanceOf(PaypalPaymentProcessor);
    expect(processor.method).toBe("PayPal");

    const result = processor.processPayment(500, { email: "customer@example.com" });
    expect(result.success).toBe(true);
    expect(result.transactionReference).toContain("PAYPAL-TX-");
  });

  it("executes payment directly via factory static helper", () => {
    const result = PaymentProcessorFactory.executePayment("Cash", 750);
    expect(result.success).toBe(true);
    expect(result.amount).toBe(750);
  });
});
