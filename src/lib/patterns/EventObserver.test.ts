import { describe, it, expect } from "vitest";
import {
  PosEventHub,
  LowStockAlertObserver,
  LoyaltyPointsObserver,
} from "./EventObserver";

describe("Design Pattern: Observer Pattern (PosEventHub)", () => {
  it("allows observers to subscribe, receive published events, and unsubscribe", () => {
    const hub = PosEventHub.getInstance();
    hub.clearHistory();

    const lowStockObserver = new LowStockAlertObserver();
    const loyaltyObserver = new LoyaltyPointsObserver();

    // Subscribe observers to events
    const unsubStock = hub.subscribe("INVENTORY_LOW_STOCK", lowStockObserver);
    hub.subscribe("LOYALTY_POINTS_AWARDED", loyaltyObserver);

    // Notify Low Stock
    hub.notify({
      type: "INVENTORY_LOW_STOCK",
      payload: { productId: "prod-1", stock: 3, name: "Silk Shirt" },
      timestamp: new Date().toISOString(),
    });

    expect(lowStockObserver.lowStockAlerts.length).toBe(1);
    expect(lowStockObserver.lowStockAlerts[0].productId).toBe("prod-1");

    // Notify Loyalty Points
    hub.notify({
      type: "LOYALTY_POINTS_AWARDED",
      payload: { customerId: "cust-1", points: 150 },
      timestamp: new Date().toISOString(),
    });

    expect(loyaltyObserver.awardedLog.length).toBe(1);
    expect(loyaltyObserver.awardedLog[0].points).toBe(150);

    // Unsubscribe and verify no further notifications received
    unsubStock();
    hub.notify({
      type: "INVENTORY_LOW_STOCK",
      payload: { productId: "prod-2", stock: 2, name: "Cap" },
      timestamp: new Date().toISOString(),
    });

    expect(lowStockObserver.lowStockAlerts.length).toBe(1); // Unsubscribed, unchanged
  });
});
