import { supabase } from "./supabaseClient";

export type CustomerTier = "Bronze" | "Silver" | "Gold";

export interface PointTransaction {
  id: string;
  customerId: string;
  orderId?: string | null;
  pointsChange: number;
  type: "EARNED" | "REDEEMED" | "BONUS" | "ADJUSTMENT";
  description: string;
  createdAt: string;
}

export interface LoyaltySettings {
  dollarsPerPoint: number; // e.g., $10 spent = 1 point
  pointsPerDiscount: number; // e.g., 100 points = $5.00 discount
  discountValue: number; // e.g., $5.00 discount for pointsPerDiscount
  silverThreshold: number; // e.g., 500 points
  goldThreshold: number; // e.g., 1500 points
  silverMultiplier: number; // e.g., 1.2x
  goldMultiplier: number; // e.g., 1.5x
}

const DEFAULT_SETTINGS: LoyaltySettings = {
  dollarsPerPoint: 10,
  pointsPerDiscount: 100,
  discountValue: 5,
  silverThreshold: 500,
  goldThreshold: 1500,
  silverMultiplier: 1.2,
  goldMultiplier: 1.5,
};

// ─── SETTINGS PERSISTENCE ───────────────────────────────────────────────────
export function getLoyaltySettings(): LoyaltySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem("apparel_loyalty_settings");
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn("Failed to load loyalty settings:", err);
  }
  return DEFAULT_SETTINGS;
}

export function saveLoyaltySettings(settings: Partial<LoyaltySettings>): LoyaltySettings {
  const current = getLoyaltySettings();
  const updated = { ...current, ...settings };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("apparel_loyalty_settings", JSON.stringify(updated));
    } catch (err) {
      console.warn("Failed to save loyalty settings:", err);
    }
  }
  return updated;
}

// ─── TIER COMPUTATION ────────────────────────────────────────────────────────
export function getCustomerTier(totalPoints: number, settings = getLoyaltySettings()): CustomerTier {
  if (totalPoints >= settings.goldThreshold) return "Gold";
  if (totalPoints >= settings.silverThreshold) return "Silver";
  return "Bronze";
}

export function getTierMultiplier(tier: CustomerTier, settings = getLoyaltySettings()): number {
  switch (tier) {
    case "Gold":
      return settings.goldMultiplier;
    case "Silver":
      return settings.silverMultiplier;
    default:
      return 1.0;
  }
}

export function getTierBadgeClass(tier: CustomerTier): string {
  switch (tier) {
    case "Gold":
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "Silver":
      return "bg-slate-300/20 text-slate-200 border-slate-300/40";
    default:
      return "bg-amber-700/20 text-amber-500 border-amber-700/40";
  }
}

// ─── REWARD POINTS CALCULATIONS ──────────────────────────────────────────────
export function calculateEarnedPoints(
  amountSpent: number,
  tier: CustomerTier = "Bronze",
  bonusPoints: number = 0,
  settings = getLoyaltySettings()
): number {
  if (amountSpent <= 0 || settings.dollarsPerPoint <= 0) return Math.max(0, bonusPoints);
  const basePoints = Math.floor(amountSpent / settings.dollarsPerPoint);
  const multiplier = getTierMultiplier(tier, settings);
  const totalEarned = Math.floor(basePoints * multiplier) + bonusPoints;
  return Math.max(0, totalEarned);
}

export function calculateDiscountFromPoints(
  pointsToRedeem: number,
  settings = getLoyaltySettings()
): number {
  if (pointsToRedeem <= 0 || settings.pointsPerDiscount <= 0) return 0;
  const val = (pointsToRedeem / settings.pointsPerDiscount) * settings.discountValue;
  return Number(val.toFixed(2));
}

export function getMaxRedeemablePoints(
  orderTotal: number,
  availablePoints: number,
  settings = getLoyaltySettings()
): number {
  if (settings.discountValue <= 0) return 0;
  const maxPointsForOrder = Math.floor((orderTotal / settings.discountValue) * settings.pointsPerDiscount);
  return Math.min(availablePoints, maxPointsForOrder);
}

// ─── SUPABASE TRANSACTIONS ───────────────────────────────────────────────────
export async function recordPointTransaction(
  customerId: string,
  pointsChange: number,
  type: "EARNED" | "REDEEMED" | "BONUS" | "ADJUSTMENT",
  description: string,
  orderId?: string
): Promise<boolean> {
  try {
    // 1. Log transaction
    const { error: txErr } = await supabase.from("point_transactions").insert([
      {
        customer_id: customerId,
        order_id: orderId || null,
        points_change: pointsChange,
        type,
        description,
      },
    ]);

    if (txErr) {
      console.warn("Could not log point_transaction to Supabase:", txErr);
    }

    // 2. Fetch current points
    const { data: custData, error: custErr } = await supabase
      .from("customers")
      .select("reward_points")
      .eq("id", customerId)
      .single();

    if (custErr) throw custErr;

    const currentPoints = custData?.reward_points || 0;
    const updatedPoints = Math.max(0, currentPoints + pointsChange);
    const updatedTier = getCustomerTier(updatedPoints);

    // 3. Update customer table
    const { error: updateErr } = await supabase
      .from("customers")
      .update({
        reward_points: updatedPoints,
        tier: updatedTier,
      })
      .eq("id", customerId);

    if (updateErr) throw updateErr;

    return true;
  } catch (err) {
    console.error("Error processing reward points transaction:", err);
    return false;
  }
}
