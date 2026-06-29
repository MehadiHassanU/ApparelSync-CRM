"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Order, OrderStatus } from "../../lib/mockData";
import { supabase } from "../../lib/supabaseClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import {
  Search,
  Bell,
  Settings,
  ShoppingBag,
  ArrowUpRight,
  Plus,
  ArrowUpDown,
  Download,
  X,
  MoreHorizontal,
  Eye,
  Trash2,
  CheckCircle,
  PackageCheck,
  Clock,
  Truck,
  Sparkles,
  TrendingUp,
  Loader2,
  RefreshCw,
} from "lucide-react";

// Category sales donut chart data
const categorySalesData = [
  { name: "Apparel & Suits", value: 35, color: "#10b981" },
  { name: "Laptops & Tech", value: 25, color: "#6366f1" },
  { name: "Footwear & Shoes", value: 20, color: "#f59e0b" },
  { name: "Accessories", value: 12, color: "#ec4899" },
  { name: "Electronics", value: 8, color: "#06b6d4" },
];

// Custom Active Shape for Interactive Donut Chart Hover
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={-4} textAnchor="middle" fill="#ffffff" className="font-extrabold text-xs">
        {payload.name.split(" ")[0]}
      </text>
      <text x={cx} y={cy} dy={14} textAnchor="middle" fill="#10b981" className="font-black text-sm">
        {value}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export default function Dashboard() {
  // ─── Live Supabase State ─────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"default" | "price-desc" | "date-desc">("default");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewChartOpen, setIsViewChartOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [activePieIndex, setActivePieIndex] = useState(0);

  // Form states for adding new order
  const [newCustomer, setNewCustomer] = useState("");
  const [newCategory, setNewCategory] = useState("Apparel");
  const [newPrice, setNewPrice] = useState("");
  const [newPayment, setNewPayment] = useState("PayPal");
  const [newStatus, setNewStatus] = useState<OrderStatus>("on way");

  // ─── Fetch Sales Data from Supabase ─────────────────────────────────────────
  const fetchSalesFromSupabase = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          id,
          order_number,
          total,
          payment_method,
          status,
          sale_date,
          customer_id,
          customer:customers ( full_name )
        `)
        .order("sale_date", { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        const mappedOrders: Order[] = data.map((item: any) => ({
          id: item.id,
          orderNumber: item.order_number || "N/A",
          customerName: item.customer?.full_name || "Walk-in Customer",
          customerId: item.customer_id,
          category: "Apparel", // Default category representation
          price: Number(item.total),
          formattedPrice: `$${Number(item.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
          date: item.sale_date ? new Date(item.sale_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
          paymentMethod: item.payment_method,
          status: (item.status as OrderStatus) || "delivered",
        }));
        setOrders(mappedOrders);
      }
    } catch (err: any) {
      console.error("Supabase Fetch Error:", err);
      setErrorMsg(err.message || "Failed to load sales data from Supabase");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesFromSupabase();
  }, [fetchSalesFromSupabase]);

  // ─── Dynamic KPI Calculations ──────────────────────────────────────────────
  const dynamicKPIs = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + o.price, 0);
    const totalOrd = orders.length;
    const netProf = totalRev * 0.6; // Estimated net margin

    return {
      totalRevenue: {
        formattedValue: `$${totalRev.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        value: totalRev,
      },
      totalOrders: {
        formattedValue: totalOrd.toString(),
        value: totalOrd,
      },
      netProfit: {
        formattedValue: `$${netProf.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        value: netProf,
      },
    };
  }, [orders]);

  // Dynamic Revenue Chart Data derived from sales dates
  const revenueChartData = useMemo(() => {
    if (orders.length === 0) {
      return [
        { date: "Mon", revenue: 1200 },
        { date: "Tue", revenue: 2100 },
        { date: "Wed", revenue: 1800 },
        { date: "Thu", revenue: 2400 },
        { date: "Fri", revenue: 3100 },
      ];
    }
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      const d = o.date.slice(5); // MM-DD
      map[d] = (map[d] || 0) + o.price;
    });
    return Object.entries(map)
      .map(([date, revenue]) => ({ date, revenue }))
      .slice(0, 7)
      .reverse();
  }, [orders]);

  // ─── Filtering & Sorting Logic ──────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = activeCategory ? order.category === activeCategory : true;
        const matchesPayment = activePayment ? order.paymentMethod === activePayment : true;

        return matchesSearch && matchesCategory && matchesPayment;
      })
      .sort((a, b) => {
        if (sortOrder === "price-desc") return b.price - a.price;
        if (sortOrder === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
        return 0;
      });
  }, [orders, searchQuery, activeCategory, activePayment, sortOrder]);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory(null);
    setActivePayment(null);
  };

  // ─── Add Order to Supabase ──────────────────────────────────────────────────
  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer || !newPrice) return;

    setIsSubmitting(true);
    try {
      // 1. Find or create Customer in Supabase
      let customerId = null;
      const { data: existingCust } = await supabase
        .from("customers")
        .select("id")
        .eq("full_name", newCustomer.trim())
        .maybeSingle();

      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const { data: newCust, error: custErr } = await supabase
          .from("customers")
          .insert([{ full_name: newCustomer.trim() }])
          .select("id")
          .single();

        if (custErr) throw custErr;
        if (newCust) customerId = newCust.id;
      }

      // 2. Insert Sale into Supabase
      const priceNum = parseFloat(newPrice);
      const generatedOrderNum = `NA${Math.floor(100000 + Math.random() * 900000)}`;

      const { error: saleErr } = await supabase.from("sales").insert([
        {
          order_number: generatedOrderNum,
          customer_id: customerId,
          subtotal: priceNum,
          total: priceNum,
          payment_method: newPayment,
          status: newStatus,
        },
      ]);

      if (saleErr) throw saleErr;

      // Reset form & reload live data
      setNewCustomer("");
      setNewPrice("");
      setIsAddDialogOpen(false);
      await fetchSalesFromSupabase();
    } catch (err: any) {
      console.error("Add Order Error:", err);
      alert(`Error creating order: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete Order from Supabase ─────────────────────────────────────────────
  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      const { error } = await supabase.from("sales").delete().eq("id", id);
      if (error) throw error;
      setOrders(orders.filter((o) => o.id !== id));
    } catch (err: any) {
      console.error("Delete Order Error:", err);
      alert(`Could not delete order: ${err.message}`);
    }
  };

  // ─── Mark Order Delivered in Supabase ───────────────────────────────────────
  const handleMarkDelivered = async (id: string) => {
    try {
      const { error } = await supabase
        .from("sales")
        .update({ status: "delivered" })
        .eq("id", id);
      if (error) throw error;
      setOrders(
        orders.map((o) => (o.id === id ? { ...o, status: "delivered" as OrderStatus } : o))
      );
    } catch (err: any) {
      console.error("Update Status Error:", err);
      alert(`Could not update order status: ${err.message}`);
    }
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30";
      case "awaiting":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30";
      case "on way":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <>

          {/* Header Bar */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1d2434] pb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Hello, Store Manager</h1>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Store Active
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1.5 font-medium">Real-time store operations, sales, and analytics.</p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => fetchSalesFromSupabase()}
                disabled={loading}
                className="p-2.5 rounded-full bg-[#111520] border border-[#1d2434] text-slate-400 hover:text-white transition-all relative cursor-pointer"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              </button>

              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search store..."
                  className="bg-[#111520] border-[#1d2434] rounded-full py-2.5 pl-11 pr-5 text-xs text-slate-200 placeholder-slate-500 w-full sm:w-64 focus:border-emerald-500"
                />
              </div>

              <button className="p-2.5 rounded-full bg-[#111520] border border-[#1d2434] text-slate-400 hover:text-white transition-all relative">
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-[#0a0d14]" />
              </button>

              <div className="flex items-center gap-3.5 pl-3 border-l border-[#1d2434]">
                <div className="w-10 h-10 rounded-full bg-emerald-600/25 border border-emerald-500/40 flex items-center justify-center font-extrabold text-sm text-emerald-400 shadow-sm">
                  CRM
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-bold text-white">Admin User</div>
                  <div className="text-xs text-slate-400 font-semibold">Store Manager</div>
                </div>
              </div>
            </div>
          </header>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-between">
              <span>Error loading store data: {errorMsg}</span>
              <Button onClick={() => fetchSalesFromSupabase()} size="sm" variant="outline" className="text-xs h-8 border-rose-500/40 text-rose-300">
                Retry Connection
              </Button>
            </div>
          )}

          {/* ─── Top KPI Cards Grid ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Revenue */}
            <Card className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-emerald-600 text-white border-none shadow-2xl shadow-indigo-600/20 p-6 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-100">Total Revenue</CardTitle>
                <div className="p-2 bg-white/15 rounded-full backdrop-blur-md">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <div className="text-4xl sm:text-5xl font-black tracking-tight">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : dynamicKPIs.totalRevenue.formattedValue}
                </div>
                <div className="flex items-center gap-2.5 mt-5 text-xs font-bold">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-400/30 text-emerald-100 text-xs font-black">
                    Active Store
                  </span>
                  <span className="text-indigo-100/90 font-semibold">calculated dynamically</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Total Orders */}
            <Card className="bg-[#111520] border-[#1d2434] text-white shadow-xl hover:border-emerald-500/40 transition-all p-6 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</CardTitle>
                <div className="p-2 bg-[#171d2b] rounded-full border border-slate-700/50">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : dynamicKPIs.totalOrders.formattedValue}
                </div>
                <div className="flex items-center gap-2.5 mt-5 text-xs font-bold">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black">
                    Active
                  </span>
                  <span className="text-slate-400 font-semibold">recorded in sales table</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Net Profit */}
            <Card className="bg-[#111520] border-[#1d2434] text-white shadow-xl hover:border-emerald-500/40 transition-all p-6 rounded-3xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Profit (Est.)</CardTitle>
                <div className="p-2 bg-[#171d2b] rounded-full border border-slate-700/50">
                  <TrendingUp className="w-5 h-5 text-teal-400" />
                </div>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <div className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : dynamicKPIs.netProfit.formattedValue}
                </div>
                <div className="flex items-center gap-2.5 mt-5 text-xs font-bold">
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-black">
                    +60% Margin
                  </span>
                  <span className="text-slate-400 font-semibold">estimated net profit</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Middle Section: Revenue Bar Chart & Interactive Donut Chart ────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Bar Chart (2 cols) */}
            <Card className="lg:col-span-2 bg-[#111520] border-[#1d2434] text-white shadow-xl hover:border-emerald-500/40 transition-all rounded-3xl p-6">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
                <div>
                  <CardTitle className="text-base font-extrabold text-white">Monthly Revenue Flow</CardTitle>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Apparel store revenue trends</p>
                </div>
                <Button
                  onClick={() => setIsViewChartOpen(true)}
                  variant="outline"
                  size="sm"
                  className="bg-[#171d2b] border-slate-700/60 text-slate-200 hover:bg-[#202839] text-xs font-bold gap-2 rounded-xl h-9 px-4"
                >
                  Expand Chart <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </Button>
              </CardHeader>
              <CardContent className="p-0 pt-6">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#171d2b", borderColor: "#2d374d", borderRadius: "12px", fontSize: "13px", fontWeight: "bold" }}
                        itemStyle={{ color: "#10b981" }}
                      />
                      <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]}>
                        {revenueChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === revenueChartData.length - 1 ? "#10b981" : "#6366f1"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sales by Category Donut Chart */}
            <Card className="bg-[#111520] border-[#1d2434] text-white shadow-xl hover:border-emerald-500/40 transition-all rounded-3xl p-6 flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
                <div>
                  <CardTitle className="text-base font-extrabold text-white">Sales by Category</CardTitle>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Hover slices for insights</p>
                </div>
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </CardHeader>
              <CardContent className="p-0 pt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        {...({
                          activeIndex: activePieIndex,
                          activeShape: renderActiveShape,
                          data: categorySalesData,
                          innerRadius: 44,
                          outerRadius: 66,
                          paddingAngle: 4,
                          dataKey: "value",
                          onMouseEnter: (_: any, index: number) => setActivePieIndex(index),
                        } as any)}
                      >
                        {categorySalesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer transition-all" />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 w-full text-xs">
                  {categorySalesData.map((item, idx) => (
                    <div
                      key={item.name}
                      onClick={() => setActivePieIndex(idx)}
                      className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all ${
                        activePieIndex === idx ? "bg-slate-800/80 font-bold" : "hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-300 font-semibold truncate">{item.name}</span>
                      </div>
                      <span className="font-extrabold text-white ml-2">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── Lower Section: Order Summary Cards + Data Table ────────────────── */}
          <div className="space-y-6 pt-6 border-t border-[#1d2434]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Order list</h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">Real-time status overview across all apparel orders</p>
              </div>

              {/* Add Order Interactive Modal Trigger */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl px-5 py-3 flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer">
                  <Plus className="w-4 h-4 stroke-[3]" /> Add order
                </DialogTrigger>
                <DialogContent className="bg-[#111520] border-[#1d2434] text-white rounded-3xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold text-white">Create Apparel Order</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddOrder} className="space-y-4 pt-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">Customer Name</label>
                      <Input
                        required
                        value={newCustomer}
                        onChange={(e) => setNewCustomer(e.target.value)}
                        placeholder="e.g. Sarah Jenkins"
                        className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">Category</label>
                      <Input
                        required
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="e.g. Apparel"
                        className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">Price ($)</label>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="e.g. 145.50"
                        className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1.5">Payment Method</label>
                      <Input
                        required
                        value={newPayment}
                        onChange={(e) => setNewPayment(e.target.value)}
                        placeholder="e.g. Credit Card"
                        className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                      />
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-[#1d2434] text-slate-300 text-xs font-bold rounded-xl h-10">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-10 flex items-center gap-2">
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit Order
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* 4 Status Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-gradient-to-br from-indigo-900/35 to-indigo-950/60 border border-indigo-500/30 rounded-3xl p-6 backdrop-blur-md shadow-lg hover:border-indigo-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">Total orders</span>
                  <PackageCheck className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-4xl font-black text-white">{orders.length}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium block mt-1.5">Live database count</span>
              </div>

              <div className="bg-gradient-to-br from-amber-900/30 to-amber-950/55 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-md shadow-lg hover:border-amber-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">Awaiting</span>
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-4xl font-black text-white">{orders.filter(o => o.status === 'awaiting').length}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium block mt-1.5">Awaiting processing</span>
              </div>

              <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/55 border border-yellow-500/30 rounded-3xl p-6 backdrop-blur-md shadow-lg hover:border-yellow-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-yellow-300">On-way orders</span>
                  <Truck className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-4xl font-black text-white">{orders.filter(o => o.status === 'on way').length}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium block mt-1.5">In transit</span>
              </div>

              <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-950/55 border border-emerald-500/30 rounded-3xl p-6 backdrop-blur-md shadow-lg hover:border-emerald-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">Delivered orders</span>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-4xl font-black text-white">{orders.filter(o => o.status === 'delivered').length}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium block mt-1.5">Completed orders</span>
              </div>
            </div>

            {/* Filter and Data Table Card */}
            <Card className="bg-[#111520] border-[#1d2434] shadow-xl p-6 rounded-3xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Left Search & Active Filters */}
                <div className="flex flex-wrap items-center gap-3.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search customer, ID, category..."
                      className="bg-[#0a0d14] border-[#1d2434] rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 w-52 sm:w-64"
                    />
                  </div>

                  <div className="flex items-center gap-2.5">
                    {activeCategory ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171d2b] text-xs text-slate-200 border border-slate-700/60 font-bold">
                        {activeCategory}{" "}
                        <X className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-pointer" onClick={() => setActiveCategory(null)} />
                      </span>
                    ) : (
                      <button onClick={() => setActiveCategory("Apparel")} className="text-xs font-bold text-slate-400 hover:text-emerald-400 border border-slate-700/60 px-3 py-1.5 rounded-xl transition-colors">
                        + Filter Apparel
                      </button>
                    )}
                    {activePayment ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171d2b] text-xs text-slate-200 border border-slate-700/60 font-bold">
                        {activePayment}{" "}
                        <X className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-pointer" onClick={() => setActivePayment(null)} />
                      </span>
                    ) : (
                      <button onClick={() => setActivePayment("PayPal")} className="text-xs font-bold text-slate-400 hover:text-emerald-400 border border-slate-700/60 px-3 py-1.5 rounded-xl transition-colors">
                        + Filter PayPal
                      </button>
                    )}
                    {(activeCategory || activePayment || searchQuery) && (
                      <button onClick={clearFilters} className="text-xs text-emerald-400 hover:underline pl-1 font-extrabold cursor-pointer">
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Sort & Action Buttons */}
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" className="bg-[#171d2b] border-slate-700/60 text-slate-200 hover:bg-[#202839] text-xs font-bold gap-2 rounded-xl h-9 px-4">
                    <Download className="w-4 h-4" /> Import
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="bg-[#171d2b] border border-slate-700/60 text-slate-200 hover:bg-[#202839] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer h-9">
                      <ArrowUpDown className="w-4 h-4" /> Sort: {sortOrder === "default" ? "default" : sortOrder === "price-desc" ? "price" : "date"}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#171d2b] border-[#293448] text-slate-200 font-semibold">
                      <DropdownMenuItem onClick={() => setSortOrder("default")} className="hover:bg-slate-800 text-xs cursor-pointer">Default</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOrder("price-desc")} className="hover:bg-slate-800 text-xs cursor-pointer">Price (High to Low)</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortOrder("date-desc")} className="hover:bg-slate-800 text-xs cursor-pointer">Date (Newest First)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto mt-6 rounded-2xl border border-[#1d2434]">
                <Table>
                  <TableHeader className="bg-[#0d1017] border-b border-[#1d2434]">
                    <TableRow className="hover:bg-transparent border-[#1d2434]">
                      <TableHead className="w-12 px-5 py-4">
                        <input type="checkbox" className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-4 h-4" />
                      </TableHead>
                      <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">ORDER NUMBER</TableHead>
                      <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">CUSTOMER</TableHead>
                      <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">CATEGORY</TableHead>
                      <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">PRICE</TableHead>
                      <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">DATE</TableHead>
                      <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">PAYMENT</TableHead>
                      <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">STATUS</TableHead>
                      <TableHead className="w-12 px-5 py-4 text-right text-xs uppercase tracking-wider text-slate-400 font-bold">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody data-testid="order-table-body" className="divide-y divide-[#171d2b]">
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12 text-slate-400 text-xs font-bold">
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> Loading sales records...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-[#171d2b] border-[#171d2b] transition-colors">
                          <TableCell className="px-5 py-4">
                            <input type="checkbox" className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 w-4 h-4" />
                          </TableCell>
                          <TableCell className="px-5 py-4 font-mono text-xs font-extrabold text-emerald-400">{order.orderNumber}</TableCell>
                          <TableCell className="px-5 py-4">
                            <div className="font-bold text-white text-sm">{order.customerName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">ID: {order.customerId ? order.customerId.slice(0, 8) : "N/A"}</div>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-slate-300 text-xs font-bold">{order.category}</TableCell>
                          <TableCell className="px-5 py-4 font-black text-white text-sm">{order.formattedPrice}</TableCell>
                          <TableCell className="px-5 py-4 text-slate-400 text-xs font-semibold">{order.date}</TableCell>
                          <TableCell className="px-5 py-4 text-slate-300 text-xs font-bold">{order.paymentMethod}</TableCell>
                          <TableCell className="px-5 py-4">
                            <Badge variant="outline" className={`capitalize font-extrabold border text-xs px-3 py-1 rounded-full ${getStatusBadgeClass(order.status)}`}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                                <MoreHorizontal className="w-5 h-5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#171d2b] border-[#293448] text-slate-200 font-bold">
                                <DropdownMenuItem onClick={() => setSelectedOrderDetails(order)} className="hover:bg-slate-800 text-xs cursor-pointer gap-2.5 py-2">
                                  <Eye className="w-4 h-4 text-blue-400" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMarkDelivered(order.id)} className="hover:bg-slate-800 text-xs cursor-pointer gap-2.5 py-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-400" /> Mark Delivered
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteOrder(order.id)} className="hover:bg-slate-800 text-xs text-rose-400 cursor-pointer gap-2.5 py-2">
                                  <Trash2 className="w-4 h-4" /> Delete Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-10 text-slate-400 text-xs font-bold">
                          No matching sales orders found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

      {/* ─── Order Details Modal ─────────────────────────────────────────────── */}
      {selectedOrderDetails && (
        <Dialog open={!!selectedOrderDetails} onOpenChange={() => setSelectedOrderDetails(null)}>
          <DialogContent className="bg-[#111520] border-[#1d2434] text-white rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-white flex items-center gap-3">
                Order Details <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">{selectedOrderDetails.orderNumber}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3.5 py-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Customer Name:</span>
                <span className="font-bold text-white text-sm">{selectedOrderDetails.customerName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Customer UUID:</span>
                <span className="font-mono text-slate-400 text-xs">{selectedOrderDetails.customerId || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Category:</span>
                <span className="text-slate-200 font-semibold">{selectedOrderDetails.category}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Price:</span>
                <span className="font-black text-emerald-400 text-sm">{selectedOrderDetails.formattedPrice}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Date:</span>
                <span className="text-slate-300 font-semibold">{selectedOrderDetails.date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Payment Method:</span>
                <span className="text-slate-300 font-semibold">{selectedOrderDetails.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 font-medium">Current Status:</span>
                <Badge variant="outline" className={`capitalize font-bold ${getStatusBadgeClass(selectedOrderDetails.status)}`}>
                  {selectedOrderDetails.status}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedOrderDetails(null)} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold w-full h-10 rounded-xl">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Revenue Chart Detailed Modal ────────────────────────────────────── */}
      <Dialog open={isViewChartOpen} onOpenChange={setIsViewChartOpen}>
        <DialogContent className="bg-[#111520] border-[#1d2434] text-white rounded-3xl max-w-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-white">Apparel Revenue Analytics</DialogTitle>
          </DialogHeader>
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} fontWeight={600} />
                <Tooltip contentStyle={{ backgroundColor: "#171d2b", borderColor: "#2d374d", borderRadius: "10px", fontWeight: "bold" }} />
                <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsViewChartOpen(false)} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-10 px-6">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
