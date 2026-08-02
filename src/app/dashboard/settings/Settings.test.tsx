import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SettingsPage from "./page";

describe("CRM Settings Page Integration Tests", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("renders settings header, tagline, and navigation tabs", () => {
    render(<SettingsPage />);

    expect(screen.getByText("CRM Store Settings")).toBeDefined();
    expect(screen.getByText(/Configure store branding/i)).toBeDefined();
    expect(screen.getByText("Store Profile")).toBeDefined();
    expect(screen.getByText("Tax & Billing")).toBeDefined();
    expect(screen.getByText("Payment Gateways")).toBeDefined();
    expect(screen.getByText("Loyalty & Rewards")).toBeDefined();
  });

  it("allows registering a new custom payment gateway option", async () => {
    render(<SettingsPage />);

    const gatewayTab = screen.getByText("Payment Gateways");
    fireEvent.click(gatewayTab);

    await waitFor(() => {
      expect(screen.getByText("Add Custom Gateway")).toBeDefined();
    });

    const addBtn = screen.getByText("Add Custom Gateway");
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText("Add Custom Payment Option")).toBeDefined();
    });
  });

  it("renders detailed multi-tier loyalty rules configuration", async () => {
    render(<SettingsPage />);

    const loyaltyTab = screen.getByText("Loyalty & Rewards");
    fireEvent.click(loyaltyTab);

    await waitFor(() => {
      expect(screen.getByText(/Detailed Customer Loyalty & Reward Rules/i)).toBeDefined();
      expect(screen.getByText(/Bronze Tier/i)).toBeDefined();
      expect(screen.getByText(/Silver Tier/i)).toBeDefined();
      expect(screen.getByText(/Gold VIP Tier/i)).toBeDefined();
    });
  });
});
