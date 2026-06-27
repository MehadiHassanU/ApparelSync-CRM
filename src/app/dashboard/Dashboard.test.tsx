import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Dashboard from "./page";
import { kpiMetrics, orderList } from "../../lib/mockData";

describe("Admin Dashboard Page", () => {
  it("verifies that the Total Revenue value from mock data renders on screen", () => {
    render(<Dashboard />);
    const revenueElement = screen.getByText(kpiMetrics.totalRevenue.formattedValue);
    expect(revenueElement).toBeDefined();
  });

  it("verifies that the data table renders exactly 10 rows", () => {
    render(<Dashboard />);
    const tableBody = screen.getByTestId("order-table-body");
    const rows = tableBody.querySelectorAll("tr");
    expect(rows.length).toBe(orderList.length);
    expect(rows.length).toBe(10);
  });
});
