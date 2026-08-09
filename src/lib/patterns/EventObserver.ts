/**
 * Design Pattern: Observer Pattern
 * 
 * Observer Pattern defines a one-to-many dependency between objects so that when
 * a POS or Inventory state changes (e.g. order completed, low stock threshold),
 * all registered observers are automatically notified and updated.
 */

export type AppEventType =
  | "ORDER_COMPLETED"
  | "INVENTORY_LOW_STOCK"
  | "LOYALTY_POINTS_AWARDED"
  | "FINANCIAL_ENTRY_LOGGED";

export interface AppEvent<T = any> {
  type: AppEventType;
  payload: T;
  timestamp: string;
}

export interface IObserver<T = any> {
  id: string;
  onNotify(event: AppEvent<T>): void;
}

export interface ISubject {
  subscribe(eventType: AppEventType, observer: IObserver): () => void;
  unsubscribe(eventType: AppEventType, observerId: string): void;
  notify(event: AppEvent): void;
}

export class PosEventHub implements ISubject {
  private observers: Map<AppEventType, Set<IObserver>> = new Map();
  private eventHistory: AppEvent[] = [];

  private static instance: PosEventHub;

  public static getInstance(): PosEventHub {
    if (!PosEventHub.instance) {
      PosEventHub.instance = new PosEventHub();
    }
    return PosEventHub.instance;
  }

  public subscribe(eventType: AppEventType, observer: IObserver): () => void {
    if (!this.observers.has(eventType)) {
      this.observers.set(eventType, new Set());
    }
    this.observers.get(eventType)!.add(observer);

    // Return unsubscription lambda for clean lifecycle teardown
    return () => this.unsubscribe(eventType, observer.id);
  }

  public unsubscribe(eventType: AppEventType, observerId: string): void {
    const list = this.observers.get(eventType);
    if (!list) return;

    list.forEach((obs) => {
      if (obs.id === observerId) {
        list.delete(obs);
      }
    });
  }

  public notify(event: AppEvent): void {
    this.eventHistory.push(event);
    const list = this.observers.get(event.type);
    if (list) {
      list.forEach((obs) => {
        try {
          obs.onNotify(event);
        } catch (err) {
          console.error(`Observer [${obs.id}] error on event [${event.type}]:`, err);
        }
      });
    }
  }

  public getHistory(): AppEvent[] {
    return [...this.eventHistory];
  }

  public clearHistory(): void {
    this.eventHistory = [];
  }
}

// ─── Concrete Observers ───────────────────────────────────────────────────────

/**
 * Concrete Observer 1: Stock Deductions & Low Stock Alert Listener
 */
export class LowStockAlertObserver implements IObserver {
  public id = "low-stock-alert-observer";
  public lowStockAlerts: Array<{ productId: string; stock: number }> = [];

  public onNotify(event: AppEvent<{ productId: string; stock: number; name: string }>): void {
    if (event.payload.stock <= 5) {
      this.lowStockAlerts.push({
        productId: event.payload.productId,
        stock: event.payload.stock,
      });
    }
  }
}

/**
 * Concrete Observer 2: Customer Loyalty Points Award Listener
 */
export class LoyaltyPointsObserver implements IObserver {
  public id = "loyalty-points-observer";
  public awardedLog: Array<{ customerId: string; points: number }> = [];

  public onNotify(event: AppEvent<{ customerId: string; points: number }>): void {
    this.awardedLog.push({
      customerId: event.payload.customerId,
      points: event.payload.points,
    });
  }
}
