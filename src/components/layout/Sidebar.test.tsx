import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Sidebar from "./Sidebar";

// Mock next/navigation usePathname
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/customers",
}));

describe("Sidebar Navigation Component Tests", () => {
  it("renders brand logo and all primary navigation items correctly", () => {
    render(<Sidebar />);

    expect(screen.getByText("ApparelSync")).toBeDefined();
    expect(screen.getByText("CRM Suite")).toBeDefined();

    // Verify nav links
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Inventory")).toBeDefined();
    expect(screen.getByText("Scanner")).toBeDefined();
    expect(screen.getByText("Customers")).toBeDefined();
  });

  it("links Customers menu item to /dashboard/customers route", () => {
    render(<Sidebar />);

    const customerLink = screen.getByText("Customers").closest("a");
    expect(customerLink).not.toBeNull();
    expect(customerLink?.getAttribute("href")).toBe("/dashboard/customers");
  });
});
