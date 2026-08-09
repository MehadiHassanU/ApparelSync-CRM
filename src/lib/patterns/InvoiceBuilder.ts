/**
 * Design Pattern: Builder Pattern
 * 
 * Builder Pattern separates the construction of a complex InvoiceData / Receipt
 * object from its representation, allowing the creation of complex sales invoices step by step.
 */

import { InvoiceData, InvoiceItem } from "@/lib/invoiceGenerator";

export class InvoiceBuilder {
  private invoice: InvoiceData;

  constructor() {
    this.invoice = {
      orderNumber: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName: "Walk-in Customer",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "Cash",
      status: "completed",
      total: 0,
      price: 0,
      pointsEarned: 0,
      pointsRedeemed: 0,
      discountAmount: 0,
      items: [],
    };
  }

  public setOrderId(id: string): this {
    this.invoice.id = id;
    return this;
  }

  public setOrderNumber(orderNumber: string): this {
    this.invoice.orderNumber = orderNumber;
    return this;
  }

  public setCustomer(name: string): this {
    this.invoice.customerName = name || "Walk-in Customer";
    return this;
  }

  public setDate(dateStr: string): this {
    this.invoice.date = dateStr;
    return this;
  }

  public setPaymentMethod(method: string): this {
    this.invoice.paymentMethod = method;
    return this;
  }

  public setStatus(status: string): this {
    this.invoice.status = status;
    return this;
  }

  public setCategory(category: string): this {
    this.invoice.category = category;
    return this;
  }

  public addItem(item: InvoiceItem): this {
    if (!this.invoice.items) this.invoice.items = [];
    this.invoice.items.push(item);
    this.recalculateTotal();
    return this;
  }

  public addItems(items: InvoiceItem[]): this {
    if (!this.invoice.items) this.invoice.items = [];
    this.invoice.items.push(...items);
    this.recalculateTotal();
    return this;
  }

  public applyLoyaltyRewards(pointsEarned: number, pointsRedeemed: number = 0, discountAmount: number = 0): this {
    this.invoice.pointsEarned = pointsEarned;
    this.invoice.pointsRedeemed = pointsRedeemed;
    this.invoice.discountAmount = discountAmount;
    this.recalculateTotal();
    return this;
  }

  public setDirectTotal(total: number): this {
    this.invoice.total = total;
    this.invoice.price = total;
    this.invoice.formattedPrice = `৳${total.toFixed(2)}`;
    return this;
  }

  private recalculateTotal(): void {
    if (this.invoice.items && this.invoice.items.length > 0) {
      const itemsSum = this.invoice.items.reduce((sum, i) => sum + i.totalPrice, 0);
      const discount = this.invoice.discountAmount ?? 0;
      const grandTotal = Math.max(0, itemsSum - discount);
      this.invoice.total = grandTotal;
      this.invoice.price = grandTotal;
      this.invoice.formattedPrice = `৳${grandTotal.toFixed(2)}`;
    }
  }

  public build(): InvoiceData {
    if (!this.invoice.orderNumber) {
      throw new Error("Invoice must have an orderNumber.");
    }
    if ((this.invoice.total ?? 0) <= 0 && (!this.invoice.items || this.invoice.items.length === 0)) {
      // Default placeholder item if none passed
      this.invoice.items = [
        {
          name: "Apparel Retail Purchase",
          quantity: 1,
          unitPrice: Number(this.invoice.price ?? 0),
          totalPrice: Number(this.invoice.price ?? 0),
        },
      ];
    }
    return { ...this.invoice };
  }
}
