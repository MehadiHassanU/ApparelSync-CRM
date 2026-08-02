"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
  Plus,
  ArrowRight,
  Eye,
  Trash,
  Loader2,
  AlertCircle,
  PieChart as PieChartIcon,
  Search,
} from "lucide-react";
import CustomerPicker from "@/components/customers/CustomerPicker";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ─── Order Data Interface ───────────────────────────────────────────────────
export type OrderStatus = "delivered" | "on way" | "awaiting" | "processing";

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerId?: string | null;
  category: string;
  price: number;
  formattedPrice: string;
  date: string;
  paymentMethod: string;
  status: OrderStatus;
}

// Fixed Category Donut Data
const categoryDistribution = [
  { name: "Shirts & Polos", value: 45, color: "#10b981" },
  { name: "Denim & Pants", value: 25, color: "#6366f1" },
  { name: "Outerwear & Jackets", value: 18, color: "#f59e0b" },
  { name: "Activewear", value: 12, color: "#06b6d4" },
];

export default function Dashboard() {
  // ─── Live Supabase State ─────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter & Modal States
  const [searchQuery, setSearchQuery] = useState("");
  const [isViewChartOpen, setIsViewChartOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [activePieIndex, setActivePieIndex] = useState(0);

  // Form states for adding new order
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState("");
  const [newCustomerId, setNewCustomerId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("Apparel");
  const [newPrice, setNewPrice] = useState("");
  const [newPayment, setNewPayment] = useState("PayPal");
  const [newStatus, setNewStatus] = useState<OrderStatus>("on way");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      if (error) throw error;

      if (data) {
        const mappedOrders: Order[] = data.map((item: any) => {
          let statusStr: OrderStatus = "delivered";
          if (item.status === "processing" || item.status === "on way") {
            statusStr = "processing";
          } else if (item.status === "awaiting") {
            statusStr = "awaiting";
          }

          return {
            id: item.id,
            orderNumber: item.order_number || `ORD-${item.id.slice(0, 5)}`,
            customerName: item.customer?.full_name || "Walk-in Customer",
            customerId: item.customer_id,
            category: "Apparel",
            price: Number(item.total),
            formattedPrice: formatCurrency(Number(item.total)),
            date: item.sale_date ? new Date(item.sale_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
            paymentMethod: item.payment_method || "Cash",
            status: statusStr,
          };
        });
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
    const netProf = totalRev * 0.6;

    return {
      totalRevenue: {
        formattedValue: formatCurrency(totalRev),
        value: totalRev,
      },
      totalOrders: {
        formattedValue: totalOrd.toString(),
        value: totalOrd,
      },
      netProfit: {
        formattedValue: formatCurrency(netProf),
        value: netProf,
      },
    };
  }, [orders]);

  // Dynamic Revenue Chart Data
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
      const d = o.date.slice(5);
      map[d] = (map[d] || 0) + o.price;
    });
    return Object.entries(map)
      .map(([date, revenue]) => ({ date, revenue }))
      .slice(0, 7)
      .reverse();
  }, [orders]);

  // Processing orders list
  const processingOrders = useMemo(() => {
    return orders
      .filter((o) => o.status === "processing" || o.status === "on way" || o.status === "awaiting")
      .filter((o) =>
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [orders, searchQuery]);

  // ─── CRUD: Add New Order Payload to Supabase ──────────────────────────────
  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer || !newPrice) return;

    setIsSubmitting(true);
    try {
      let customerId = newCustomerId;

      if (!customerId) {
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
      }

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

      setIsAddDialogOpen(false);
      setNewCustomer("");
      setNewCustomerId(null);
      setNewPrice("");
      await fetchSalesFromSupabase();
    } catch (err: any) {
      console.error("Add Order Error:", err);
      alert(`Error adding order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── CRUD: Mark Delivered ──────────────────────────────────────────────────
  const handleMarkDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("sales")
        .update({ status: "delivered" })
        .eq("id", orderId);

      if (error) throw error;
      await fetchSalesFromSupabase();
    } catch (err: any) {
      console.error("Update Status Error:", err);
      alert(`Failed to update status: ${err.message}`);
    }
  };

  // ─── CRUD: Delete Order ────────────────────────────────────────────────────
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      const { error } = await supabase.from("sales").delete().eq("id", orderId);
      if (error) throw error;
      await fetchSalesFromSupabase();
    } catch (err: any) {
      console.error("Delete Order Error:", err);
      alert(`Failed to delete order: ${err.message}`);
    }
  };

  return (
    <>
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1d2434] pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white flex items-center gap-3">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-2 font-medium">
            Welcome back! Real-time telemetry, live POS orders, and inventory overview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/orders">
            <Button className="bg-[#111520] hover:bg-[#1c2335] text-slate-200 border border-slate-700/60 font-bold text-xs rounded-2xl h-11 px-5 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" /> Orders Center
            </Button>
          </Link>
          <Link href="/dashboard/scanner">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl h-11 px-5 flex items-center gap-2 shadow-lg shadow-emerald-500/25">
              <Plus className="w-4 h-4 stroke-[3]" /> Launch POS Scanner
            </Button>
          </Link>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6 relative overflow-hidden">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Total Revenue
            </CardTitle>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {dynamicKPIs.totalRevenue.formattedValue}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                +14.2% month
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6 relative overflow-hidden">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Total Orders
            </CardTitle>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {dynamicKPIs.totalOrders.formattedValue}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold px-2 py-0.5">
                Live Sales
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6 relative overflow-hidden">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Estimated Net Profit
            </CardTitle>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {dynamicKPIs.netProfit.formattedValue}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5">
                60% Margin
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-[#111520] border-[#1d2434] shadow-2xl rounded-3xl p-6 sm:p-8">
          <CardHeader className="p-0 pb-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-white">Revenue Telemetry</CardTitle>
              <p className="text-xs text-slate-400 mt-1 font-medium">Daily transaction volume trends</p>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0a0d14", borderColor: "#1d2434", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Share Donut */}
        <Card className="bg-[#111520] border-[#1d2434] shadow-2xl rounded-3xl p-6 sm:p-8 flex flex-col justify-between">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-lg font-black text-white flex items-center justify-between">
              <span>Category Distribution</span>
              <PieChartIcon className="w-5 h-5 text-slate-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col items-center">
            <div className="w-full h-[180px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#111520" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {categoryDistribution[activePieIndex].name}
                </span>
                <span className="text-2xl font-black text-white">
                  {categoryDistribution[activePieIndex].value}%
                </span>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-2 mt-4">
              {categoryDistribution.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 font-semibold truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Management Table Workspace */}
      <Card className="bg-[#111520] border-[#1d2434] shadow-2xl rounded-3xl p-6 sm:p-8">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <Clock className="w-6 h-6 text-amber-400" />
                Active / Processing Orders
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                Active orders currently being fulfilled ({processingOrders.length} active)
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger render={
                  <Button className="bg-[#1c2335] hover:bg-[#252f47] text-white border border-[#2a3652] font-black text-xs rounded-2xl px-4 py-2.5 flex items-center gap-2 transition-all cursor-pointer" />
                }>
                  <Plus className="w-4 h-4 stroke-[3] text-emerald-400" /> Add Order
                </DialogTrigger>
                <DialogContent className="bg-[#111520] border-[#1d2434] text-white rounded-3xl p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold text-white">Create Apparel Order</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddOrder} className="space-y-4 mt-4">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Customer Profile Name</label>
                      <CustomerPicker
                        value={newCustomer}
                        onChange={(name) => {
                          setNewCustomer(name);
                          setNewCustomerId(null);
                        }}
                        onSelect={(id, name) => {
                          setNewCustomerId(id);
                          setNewCustomer(name);
                        }}
                        onClear={() => setNewCustomerId(null)}
                        placeholder="e.g. Walk-in Customer"
                        inputClassName="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">Total Amount (BDT)</label>
                      <Input
                        required
                        type="number"
                        step="0.01"
                        placeholder="e.g. 1500"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Payment Method</label>
                        <select
                          value={newPayment}
                          onChange={(e) => setNewPayment(e.target.value)}
                          className="w-full bg-[#0a0d14] border border-[#1d2434] text-xs text-white h-10 rounded-xl px-3 outline-none focus:border-emerald-500"
                        >
                          <option value="Cash">Cash</option>
                          <option value="PayPal">PayPal</option>
                          <option value="Credit Card">Credit Card</option>
                          <option value="bKash">bKash</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1">Initial Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                          className="w-full bg-[#0a0d14] border border-[#1d2434] text-xs text-white h-10 rounded-xl px-3 outline-none focus:border-emerald-500"
                        >
                          <option value="on way">On Way</option>
                          <option value="awaiting">Awaiting</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                      <DialogClose render={
                        <Button type="button" variant="ghost" className="text-slate-400 text-xs font-bold" />
                      }>
                        Cancel
                      </DialogClose>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl px-5 h-10"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Order"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Link href="/dashboard/orders">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl px-5 py-3 flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer">
                  See All Orders
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Table Search & Filter Bar */}
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              placeholder="Search active orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0a0d14] border-[#1d2434] rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 w-full focus:border-emerald-500"
            />
          </div>

          {/* Processing Orders Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Loading orders database...</span>
              </div>
            ) : processingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <CheckCircle className="w-12 h-12 mb-3 text-emerald-400/50 stroke-[1.5]" />
                <span className="text-sm font-bold text-slate-300">All orders fulfilled!</span>
                <span className="text-xs text-slate-500 mt-1">No active processing orders matching search.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1d2434] text-[11px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Total</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1d2434] text-xs font-medium text-slate-300">
                  {processingOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#151b2a] transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-white">#{ord.orderNumber}</td>
                      <td className="py-4 px-4 font-bold text-slate-200">{ord.customerName}</td>
                      <td className="py-4 px-4 font-black text-emerald-400">{ord.formattedPrice}</td>
                      <td className="py-4 px-4">
                        <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase px-2 py-0.5">
                          {ord.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkDelivered(ord.id)}
                            className="h-8 px-3 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-xl"
                          >
                            Mark Delivered
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10 rounded-xl"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Card>
    </>
  );
}
