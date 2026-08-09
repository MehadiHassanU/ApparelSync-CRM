"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  TimeframeMode,
  TimeframeChartPoint,
  aggregateOrdersByTimeframe,
  calculateTimeframeSummary,
  calculatePaymentBreakdown,
  CategorySharePoint,
} from "@/lib/analyticsUtils";
import { Order } from "@/app/dashboard/page";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Download,
  X,
  Sparkles,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface GraphDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Order[];
  categoryData?: CategorySharePoint[];
}

export default function GraphDetailsModal({
  isOpen,
  onOpenChange,
  orders,
}: GraphDetailsModalProps) {
  // Timeframe View Selection
  const [timeframe, setTimeframe] = useState<TimeframeMode>("daily");
  // Active Graph Tab
  const [activeGraphTab, setActiveGraphTab] = useState<
    "revenue" | "volume" | "profit" | "payment" | "category"
  >("revenue");

  // Aggregate telemetry points for selected timeframe
  const chartData = useMemo(() => {
    return aggregateOrdersByTimeframe(orders, timeframe);
  }, [orders, timeframe]);

  // Calculate summary metrics
  const summaryStats = useMemo(() => {
    return calculateTimeframeSummary(chartData);
  }, [chartData]);

  // Payment method breakdown for selected timeframe
  const paymentData = useMemo(() => {
    return calculatePaymentBreakdown(orders);
  }, [orders]);

  // Category distribution data
  const categoryData = useMemo(() => {
    return [
      { name: "Shirts & Polos", value: 45, revenue: summaryStats.totalRevenue * 0.45, color: "#10b981", ordersCount: Math.round(summaryStats.totalOrders * 0.45) },
      { name: "Denim & Pants", value: 25, revenue: summaryStats.totalRevenue * 0.25, color: "#6366f1", ordersCount: Math.round(summaryStats.totalOrders * 0.25) },
      { name: "Outerwear & Jackets", value: 18, revenue: summaryStats.totalRevenue * 0.18, color: "#f59e0b", ordersCount: Math.round(summaryStats.totalOrders * 0.18) },
      { name: "Activewear", value: 12, revenue: summaryStats.totalRevenue * 0.12, color: "#06b6d4", ordersCount: Math.round(summaryStats.totalOrders * 0.12) },
    ];
  }, [summaryStats]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (chartData.length === 0) return;
    const headers = ["Period", "Date", "Revenue (BDT)", "Orders Count", "Average Order Value (BDT)", "Estimated Profit (BDT)", "COGS (BDT)"];
    const rows = chartData.map((p) => [
      `"${p.label}"`,
      `"${p.date}"`,
      p.revenue.toFixed(2),
      p.ordersCount,
      p.avgOrderValue.toFixed(2),
      p.profit.toFixed(2),
      p.cogs.toFixed(2),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ApparelSync_Analytics_${timeframe}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0b0e17] border-[#1d2434] text-white rounded-3xl p-6 sm:p-8 max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1d2434]">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold px-2.5 py-0.5">
                <Sparkles className="w-3 h-3 mr-1" /> Multi-Timeframe Analytics Suite
              </Badge>
            </div>
            <DialogTitle className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-emerald-400" />
              Graph Telemetry & Deep-Dive Analysis
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Inspect granular sales velocity, revenue trends, product category share, and profit margins.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportCSV}
              variant="outline"
              size="sm"
              className="bg-[#111520] hover:bg-[#1c2335] text-slate-200 border-[#1d2434] font-bold text-xs rounded-xl h-10 px-4 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Export CSV
            </Button>
          </div>
        </DialogHeader>

        {/* Timeframe Selector Segmented Bar (Daily | Weekly | Monthly) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 p-2 rounded-2xl bg-[#111520] border border-[#1d2434]">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Timeframe View:
            </span>
            <button
              type="button"
              onClick={() => setTimeframe("daily")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                timeframe === "daily"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Daily View (14 Days)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("weekly")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                timeframe === "weekly"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Weekly View (8 Weeks)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("monthly")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                timeframe === "monthly"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              Monthly View (12 Months)
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-400 px-3 text-right">
            Active: <span className="text-emerald-400 font-extrabold uppercase">{timeframe} Granularity</span>
          </div>
        </div>

        {/* Dynamic Metric KPI Badges for Selected Timeframe */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#111520] border border-[#1d2434] rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period Revenue</span>
            <div className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              {formatCurrency(summaryStats.totalRevenue)}
            </div>
            <div className="text-[10px] text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> Live aggregated
            </div>
          </div>

          <div className="bg-[#111520] border border-[#1d2434] rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
            <div className="text-xl sm:text-2xl font-black text-indigo-400 tracking-tight mt-1">
              {summaryStats.totalOrders}
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">Transactions count</div>
          </div>

          <div className="bg-[#111520] border border-[#1d2434] rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Ticket (AOV)</span>
            <div className="text-xl sm:text-2xl font-black text-teal-400 tracking-tight mt-1">
              {formatCurrency(summaryStats.avgOrderValue)}
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">Per order avg</div>
          </div>

          <div className="bg-[#111520] border border-[#1d2434] rounded-2xl p-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peak Velocity Period</span>
            <div className="text-base sm:text-lg font-black text-amber-400 tracking-tight mt-1 truncate">
              {summaryStats.peakPeriodLabel}
            </div>
            <div className="text-[10px] text-slate-400 font-bold mt-0.5">
              {formatCurrency(summaryStats.peakRevenue)} peak
            </div>
          </div>
        </div>

        {/* Graph Type Selection Sub-Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-b border-[#1d2434] pb-3">
          <button
            type="button"
            onClick={() => setActiveGraphTab("revenue")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeGraphTab === "revenue"
                ? "bg-[#1c2335] text-emerald-400 border border-emerald-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> 1. Revenue Trajectory
          </button>
          <button
            type="button"
            onClick={() => setActiveGraphTab("volume")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeGraphTab === "volume"
                ? "bg-[#1c2335] text-indigo-400 border border-indigo-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> 2. Order Volume & Velocity
          </button>
          <button
            type="button"
            onClick={() => setActiveGraphTab("profit")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeGraphTab === "profit"
                ? "bg-[#1c2335] text-teal-400 border border-teal-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> 3. Profit Margin & COGS
          </button>
          <button
            type="button"
            onClick={() => setActiveGraphTab("payment")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeGraphTab === "payment"
                ? "bg-[#1c2335] text-amber-400 border border-amber-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" /> 4. Payment Gateway Share
          </button>
          <button
            type="button"
            onClick={() => setActiveGraphTab("category")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeGraphTab === "category"
                ? "bg-[#1c2335] text-pink-400 border border-pink-500/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" /> 5. Category Performance
          </button>
        </div>

        {/* Primary Interactive Chart Canvas */}
        <div className="mt-6 bg-[#111520] border border-[#1d2434] rounded-3xl p-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                {activeGraphTab === "revenue" && "Revenue & Sales Trajectory"}
                {activeGraphTab === "volume" && "Order Transactions Velocity"}
                {activeGraphTab === "profit" && "Revenue vs. 60% Net Profit vs. 40% COGS"}
                {activeGraphTab === "payment" && "Payment Method Volume Breakdown"}
                {activeGraphTab === "category" && "Product Category Performance Share"}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Aggregated in {timeframe} intervals across {chartData.length} data points
              </p>
            </div>
            <Badge className="bg-[#1c2335] text-slate-300 border-[#2a3652] text-[10px] font-mono">
              {timeframe.toUpperCase()} MODE
            </Badge>
          </div>

          <div className="h-[320px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              {activeGraphTab === "revenue" ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="detailRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0d14", borderColor: "#1d2434", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#detailRevGrad)" />
                </AreaChart>
              ) : activeGraphTab === "volume" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0d14", borderColor: "#1d2434", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    formatter={(value: any) => [value, "Completed Orders"]}
                  />
                  <Bar dataKey="ordersCount" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : activeGraphTab === "profit" ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0d14", borderColor: "#1d2434", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    formatter={(value: any) => formatCurrency(Number(value))}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Bar dataKey="revenue" name="Gross Revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="profit" name="Net Profit (60%)" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="cogs" name="COGS (40%)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : activeGraphTab === "payment" ? (
                <BarChart data={paymentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} width={90} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0d14", borderColor: "#1d2434", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    formatter={(value: any) => [formatCurrency(Number(value)), "Revenue Volume"]}
                  />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 8, 8, 0]}>
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <PieChart width={320} height={280}>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-cat-${index}`} fill={entry.color} stroke="#111520" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0a0d14", borderColor: "#1d2434", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                      formatter={(val: any, name: any, item: any) => [`${val}% (${formatCurrency(item.payload.revenue)})`, name]}
                    />
                  </PieChart>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabular Breakdown for Selected Timeframe */}
        <div className="mt-6">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            {timeframe.toUpperCase()} Data Breakdown Ledger
          </h4>
          <div className="overflow-x-auto rounded-2xl border border-[#1d2434]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#111520] text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-[#1d2434]">
                <tr>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Date Anchor</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Gross Revenue</th>
                  <th className="py-3 px-4">Avg Ticket</th>
                  <th className="py-3 px-4 text-right">Est. Profit (60%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d2434] text-slate-300 font-medium">
                {chartData.map((p) => (
                  <tr key={p.key} className="hover:bg-[#151b2a] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{p.label}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{p.date}</td>
                    <td className="py-3 px-4 font-bold text-indigo-400">{p.ordersCount}</td>
                    <td className="py-3 px-4 font-black text-emerald-400">{formatCurrency(p.revenue)}</td>
                    <td className="py-3 px-4 text-slate-300">{formatCurrency(p.avgOrderValue)}</td>
                    <td className="py-3 px-4 text-right font-black text-teal-400">{formatCurrency(p.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Close Button */}
        <div className="mt-6 flex justify-end">
          <DialogClose render={
            <Button variant="outline" className="border-[#1d2434] text-slate-300 font-bold text-xs rounded-xl h-10 px-6" />
          }>
            Close Analytics
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
