/**
 * Design Pattern: Factory Pattern
 * 
 * Factory Pattern provides an interface for creating families of related or dependent
 * payment processor objects without specifying their concrete classes.
 */

export type SupportedPaymentMethod = "Cash" | "bKash" | "Credit Card" | "PayPal";

export interface PaymentProcessResult {
  success: boolean;
  transactionReference: string;
  method: SupportedPaymentMethod;
  amount: number;
  fee: number;
  netAmount: number;
  timestamp: string;
  message: string;
}

export interface IPaymentProcessor {
  method: SupportedPaymentMethod;
  processPayment(amount: number, details?: Record<string, any>): PaymentProcessResult;
  calculateFee(amount: number): number;
  validatePayment(amount: number, details?: Record<string, any>): { valid: boolean; error?: string };
}

// Concrete Product A: Cash Payment Processor
export class CashPaymentProcessor implements IPaymentProcessor {
  public method: SupportedPaymentMethod = "Cash";

  public calculateFee(amount: number): number {
    // Zero processing fee for physical cash
    return 0;
  }

  public validatePayment(amount: number): { valid: boolean; error?: string } {
    if (amount <= 0) return { valid: false, error: "Payment amount must be greater than zero." };
    return { valid: true };
  }

  public processPayment(amount: number): PaymentProcessResult {
    const validation = this.validatePayment(amount);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const fee = this.calculateFee(amount);
    return {
      success: true,
      transactionReference: `CASH-${Math.floor(100000 + Math.random() * 900000)}`,
      method: this.method,
      amount,
      fee,
      netAmount: amount - fee,
      timestamp: new Date().toISOString(),
      message: "Cash payment settled at POS terminal register.",
    };
  }
}

// Concrete Product B: bKash Mobile Wallet Processor
export class BkashPaymentProcessor implements IPaymentProcessor {
  public method: SupportedPaymentMethod = "bKash";

  public calculateFee(amount: number): number {
    // 1.5% standard mobile money merchant settlement fee
    return Math.round(amount * 0.015 * 100) / 100;
  }

  public validatePayment(amount: number, details?: { walletNumber?: string }): { valid: boolean; error?: string } {
    if (amount <= 0) return { valid: false, error: "Payment amount must be positive." };
    if (details?.walletNumber && !details.walletNumber.match(/^01[3-9]\d{8}$/)) {
      return { valid: false, error: "Invalid bKash mobile wallet number format." };
    }
    return { valid: true };
  }

  public processPayment(amount: number, details?: { walletNumber?: string }): PaymentProcessResult {
    const validation = this.validatePayment(amount, details);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const fee = this.calculateFee(amount);
    return {
      success: true,
      transactionReference: `BKASH-${Math.floor(10000000 + Math.random() * 90000000)}`,
      method: this.method,
      amount,
      fee,
      netAmount: amount - fee,
      timestamp: new Date().toISOString(),
      message: `bKash payment verified via mobile gateway ${details?.walletNumber ? `(${details.walletNumber})` : ""}`,
    };
  }
}

// Concrete Product C: Credit Card Processor
export class CreditCardPaymentProcessor implements IPaymentProcessor {
  public method: SupportedPaymentMethod = "Credit Card";

  public calculateFee(amount: number): number {
    // 2.2% card interchange fee + fixed ৳5
    return Math.round((amount * 0.022 + 5) * 100) / 100;
  }

  public validatePayment(amount: number, details?: { cardLast4?: string }): { valid: boolean; error?: string } {
    if (amount <= 0) return { valid: false, error: "Payment amount must be positive." };
    if (details?.cardLast4 && details.cardLast4.length !== 4) {
      return { valid: false, error: "Credit card last 4 digits must be exactly 4 numbers." };
    }
    return { valid: true };
  }

  public processPayment(amount: number, details?: { cardLast4?: string }): PaymentProcessResult {
    const validation = this.validatePayment(amount, details);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const fee = this.calculateFee(amount);
    return {
      success: true,
      transactionReference: `CARD-AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
      method: this.method,
      amount,
      fee,
      netAmount: amount - fee,
      timestamp: new Date().toISOString(),
      message: `Card transaction authorized ${details?.cardLast4 ? `ending in *${details.cardLast4}` : ""}`,
    };
  }
}

// Concrete Product D: PayPal Gateway Processor
export class PaypalPaymentProcessor implements IPaymentProcessor {
  public method: SupportedPaymentMethod = "PayPal";

  public calculateFee(amount: number): number {
    // 2.9% international transaction fee
    return Math.round(amount * 0.029 * 100) / 100;
  }

  public validatePayment(amount: number, details?: { email?: string }): { valid: boolean; error?: string } {
    if (amount <= 0) return { valid: false, error: "Payment amount must be positive." };
    return { valid: true };
  }

  public processPayment(amount: number, details?: { email?: string }): PaymentProcessResult {
    const validation = this.validatePayment(amount, details);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const fee = this.calculateFee(amount);
    return {
      success: true,
      transactionReference: `PAYPAL-TX-${Math.floor(1000000 + Math.random() * 9000000)}`,
      method: this.method,
      amount,
      fee,
      netAmount: amount - fee,
      timestamp: new Date().toISOString(),
      message: `PayPal checkout completed successfully ${details?.email ? `for ${details.email}` : ""}`,
    };
  }
}

// ─── Payment Processor Factory ────────────────────────────────────────────────
export class PaymentProcessorFactory {
  /**
   * Factory method to instantiate the appropriate payment processor based on payment type
   */
  public static createProcessor(method: string): IPaymentProcessor {
    switch (method.toLowerCase().trim()) {
      case "cash":
        return new CashPaymentProcessor();
      case "bkash":
        return new BkashPaymentProcessor();
      case "credit card":
      case "card":
        return new CreditCardPaymentProcessor();
      case "paypal":
        return new PaypalPaymentProcessor();
      default:
        // Default fallback to cash
        return new CashPaymentProcessor();
    }
  }

  /**
   * Convenience helper to process any payment through the factory in a single call
   */
  public static executePayment(
    method: string,
    amount: number,
    details?: Record<string, any>
  ): PaymentProcessResult {
    const processor = PaymentProcessorFactory.createProcessor(method);
    return processor.processPayment(amount, details);
  }
}
