import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateEarnedPoints,
  calculateDiscountFromPoints,
  getMaxRedeemablePoints,
  getCustomerTier,
  getTierMultiplier,
  saveLoyaltySettings,
  getLoyaltySettings,
} from "./loyalty";

describe("Loyalty Engine Unit Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("calculates base earned points correctly (1 point per $10 spent)", () => {
    const pointsBronze = calculateEarnedPoints(120.0, "Bronze");
    expect(pointsBronze).toBe(12);

    const pointsZero = calculateEarnedPoints(5.0, "Bronze");
    expect(pointsZero).toBe(0);
  });

  it("applies VIP tier multipliers accurately", () => {
    // Silver: 1.2x (12 base * 1.2 = 14)
    const pointsSilver = calculateEarnedPoints(120.0, "Silver");
    expect(pointsSilver).toBe(14);

    // Gold: 1.5x (12 base * 1.5 = 18)
    const pointsGold = calculateEarnedPoints(120.0, "Gold");
    expect(pointsGold).toBe(18);
  });

  it("calculates bonus points additions", () => {
    const pointsWithBonus = calculateEarnedPoints(100.0, "Bronze", 50); // 10 base + 50 bonus
    expect(pointsWithBonus).toBe(60);
  });

  it("calculates redemption discount values (100 points = $5 discount)", () => {
    const discount100 = calculateDiscountFromPoints(100);
    expect(discount100).toBe(5.0);

    const discount200 = calculateDiscountFromPoints(200);
    expect(discount200).toBe(10.0);

    const discount0 = calculateDiscountFromPoints(0);
    expect(discount0).toBe(0);
  });

  it("determines customer VIP tiers based on points threshold", () => {
    expect(getCustomerTier(0)).toBe("Bronze");
    expect(getCustomerTier(499)).toBe("Bronze");
    expect(getCustomerTier(500)).toBe("Silver");
    expect(getCustomerTier(1499)).toBe("Silver");
    expect(getCustomerTier(1500)).toBe("Gold");
  });

  it("supports customizable store manager loyalty rules", () => {
    saveLoyaltySettings({
      dollarsPerPoint: 5, // $5 spent per point
      pointsPerDiscount: 50, // 50 points = $5.00
      silverThreshold: 200,
    });

    const currentSettings = getLoyaltySettings();
    expect(currentSettings.dollarsPerPoint).toBe(5);

    // $100 spent with $5 per point = 20 points
    const customPoints = calculateEarnedPoints(100.0, "Bronze");
    expect(customPoints).toBe(20);

    // Tier threshold check
    expect(getCustomerTier(250)).toBe("Silver");
  });
});
