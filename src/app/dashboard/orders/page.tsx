"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Order, OrderStatus } from "@/lib/mockData";
import { supabase } from "@/lib/supabaseClient";
import { Customer } from "@/lib/types";
import { generateInvoicePDF } from "@/lib/invoiceGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  ArrowUpDown,
  Download,
  X,
  MoreHorizontal,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  Loader2,
  RefreshCw,
  ShoppingBag,
  User,
  DollarSign,
  FileCheck,
  Award,
  Sparkles,
  Gift,
} from "lucide-react";
import {
  calculateEarnedPoints,
  calculateDiscountFromPoints,
  getMaxRedeemablePoints,
  getCustomerTier,
  getTierBadgeClass,
  recordPointTransaction,
} from "@/lib/loyalty";

export default function OrdersPage() {
  // ─── States ──────────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"default" | "price-desc" | "date-desc">("default");

  // Modal Dialogs
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Create Order Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("new");
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [newCategory, setNewCategory] = useState("Apparel");
  const [newPrice, setNewPrice] = useState("");
  const [newPayment, setNewPayment] = useState("PayPal");
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // ─── Fetch Sales & Customers from Supabase ──────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch Customers list
      const { data: customerData, error: custErr } = await supabase
        .from("customers")
        .select("*")
        .order("full_name", { ascending: true });

      if (custErr) {
        console.warn("Could not fetch customers from Supabase:", custErr);
      } else if (customerData) {
        setCustomers(
          customerData.map((c: any) => ({
            id: c.id,
            fullName: c.full_name,
            email: c.email || null,
            phone: c.phone || null,
            address: c.address || null,
            city: c.city || null,
            notes: c.notes || null,
            rewardPoints: c.reward_points || 0,
            tier: c.tier || getCustomerTier(c.reward_points || 0),
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          }))
        );
      }

      // 2. Fetch Sales list
      const { data: salesData, error: salesErr } = await supabase
        .from("sales")
        .select(`
          id,
          order_number,
          total,
          payment_method,
          status,
          sale_date,
          customer_id,
          points_earned,
          points_redeemed,
          discount_amount,
          customer:customers ( full_name )
        `)
        .order("sale_date", { ascending: false });

      if (salesErr) {
        throw salesErr;
      }

      if (salesData) {
        const mappedOrders: Order[] = salesData.map((item: any) => {
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
            formattedPrice: `$${Number(item.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            date: item.sale_date ? item.sale_date.split("T")[0] : new Date().toISOString().split("T")[0],
            paymentMethod: item.payment_method || "Cash",
            status: statusStr,
            pointsEarned: item.points_earned || Math.floor(Number(item.total || 0) / 10),
            pointsRedeemed: item.points_redeemed || 0,
            discountAmount: item.discount_amount || 0,
          };
        });
        setOrders(mappedOrders);
      }
    } catch (err: any) {
      console.error("Orders Fetch Error:", err);
      setErrorMsg(err.message || "Failed to load sales data from Supabase");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Filtered & Sorted Orders ──────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const matchesSearch =
          order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = activeStatus ? order.status === activeStatus : true;
        const matchesPayment = activePayment ? order.paymentMethod === activePayment : true;

        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => {
        if (sortOrder === "price-desc") return b.price - a.price;
        if (sortOrder === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
        return 0;
      });
  }, [orders, searchQuery, activeStatus, activePayment, sortOrder]);

  // ─── Create New Order Handler ──────────────────────────────────────────────
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice || isNaN(Number(newPrice))) {
      alert("Please enter a valid price amount");
      return;
    }

    let finalCustomerName = "";
    let finalCustomerId: string | null = null;

    if (selectedCustomerId !== "new") {
      const existing = customers.find((c) => c.id === selectedCustomerId);
      if (existing) {
        finalCustomerId = existing.id;
        finalCustomerName = existing.fullName;
      }
    } else {
      finalCustomerName = customerNameInput.trim() || "Walk-in Customer";
    }

    setIsSubmitting(true);
    try {
      // If adding a new customer name, create it in Supabase `customers` table first
      if (selectedCustomerId === "new" && customerNameInput.trim()) {
        const { data: newCustData, error: custErr } = await supabase
          .from("customers")
          .insert([{ full_name: customerNameInput.trim() }])
          .select()
          .single();

        if (!custErr && newCustData) {
          finalCustomerId = newCustData.id;
          finalCustomerName = newCustData.full_name;
        }
      }

      const generatedOrderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
      const priceVal = parseFloat(newPrice);

      // Selected customer details
      const selectedCustomerObj = customers.find((c) => c.id === finalCustomerId);
      const custTier = selectedCustomerObj?.tier || "Bronze";
      const custAvailablePoints = selectedCustomerObj?.rewardPoints || 0;

      // Redemption & Earnings Calculations
      const safePointsToRedeem = Math.min(pointsToRedeem, custAvailablePoints);
      const discountVal = calculateDiscountFromPoints(safePointsToRedeem);
      const finalPayableTotal = Math.max(0, priceVal - discountVal);
      const pointsEarnedVal = calculateEarnedPoints(finalPayableTotal, custTier);

      // Insert new Sale into Supabase with constraint fallback
      let saleData: any = null;
      let saleErr: any = null;

      const primaryRes = await supabase
        .from("sales")
        .insert([
          {
            order_number: generatedOrderNumber,
            customer_id: finalCustomerId,
            total: finalPayableTotal,
            payment_method: newPayment,
            status: newStatus,
            sale_date: new Date().toISOString(),
            points_earned: pointsEarnedVal,
            points_redeemed: safePointsToRedeem,
            discount_amount: discountVal,
          },
        ])
        .select(`
          id,
          order_number,
          total,
          payment_method,
          status,
          sale_date,
          customer_id,
          points_earned,
          points_redeemed,
          discount_amount,
          customer:customers ( full_name )
        `)
        .single();

      saleData = primaryRes.data;
      saleErr = primaryRes.error;

      // Fallback if legacy sales_status_check constraint error occurs
      if (saleErr && saleErr.message?.includes("sales_status_check")) {
        const legacyStatus = newStatus === "processing" ? "on way" : newStatus === "delivered" ? "completed" : "pending";
        const fallbackRes = await supabase
          .from("sales")
          .insert([
            {
              order_number: generatedOrderNumber,
              customer_id: finalCustomerId,
              total: finalPayableTotal,
              payment_method: newPayment,
              status: legacyStatus,
              sale_date: new Date().toISOString(),
              points_earned: pointsEarnedVal,
              points_redeemed: safePointsToRedeem,
              discount_amount: discountVal,
            },
          ])
          .select(`
            id,
            order_number,
            total,
            payment_method,
            status,
            sale_date,
            customer_id,
            points_earned,
            points_redeemed,
            discount_amount,
            customer:customers ( full_name )
          `)
          .single();

        saleData = fallbackRes.data;
        saleErr = fallbackRes.error;
      }

      if (saleErr) throw saleErr;

      // Handle Points Ledger Update in Supabase
      if (finalCustomerId) {
        // 1. Log Redeemed Points
        if (safePointsToRedeem > 0) {
          await recordPointTransaction(
            finalCustomerId,
            -safePointsToRedeem,
            "REDEEMED",
            `Redeemed for $${discountVal.toFixed(2)} discount on Order #${generatedOrderNumber}`,
            saleData.id
          );
        }

        // 2. Log Earned Points
        if (pointsEarnedVal > 0) {
          await recordPointTransaction(
            finalCustomerId,
            pointsEarnedVal,
            "EARNED",
            `Earned from purchase on Order #${generatedOrderNumber}`,
            saleData.id
          );
        }
      }

      const createdOrder: Order = {
        id: saleData.id,
        orderNumber: saleData.order_number,
        customerName: (saleData.customer as any)?.full_name || finalCustomerName,
        customerId: saleData.customer_id,
        category: newCategory,
        price: finalPayableTotal,
        formattedPrice: `$${finalPayableTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        date: new Date().toISOString().split("T")[0],
        paymentMethod: newPayment,
        status: (saleData.status as OrderStatus) || "processing",
        pointsEarned: pointsEarnedVal,
        pointsRedeemed: safePointsToRedeem,
        discountAmount: discountVal,
      };

      setOrders((prev) => [createdOrder, ...prev]);

      // Reset Form & Close Modal
      setCustomerNameInput("");
      setSelectedCustomerId("new");
      setNewPrice("");
      setNewCategory("Apparel");
      setNewStatus("processing");
      setPointsToRedeem(0);
      setIsAddDialogOpen(false);

      // Refresh customers list if a new customer was created
      fetchData();
    } catch (err: any) {
      console.error("Error creating order:", err);
      alert(err.message || "Failed to create order in Supabase");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Update Order Status Handler ───────────────────────────────────────────
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      let { error } = await supabase
        .from("sales")
        .update({ status: nextStatus })
        .eq("id", orderId);

      // Fallback if legacy sales_status_check constraint fails
      if (error && error.message?.includes("sales_status_check")) {
        const legacyStatus = nextStatus === "delivered" ? "completed" : nextStatus === "processing" ? "on way" : "pending";
        const fb = await supabase
          .from("sales")
          .update({ status: legacyStatus })
          .eq("id", orderId);
        error = fb.error;
      }

      if (error) throw error;

      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id === orderId) {
            const updated = { ...ord, status: nextStatus };
            // If updated to delivered, trigger PDF invoice download
            if (nextStatus === "delivered") {
              generateInvoicePDF(updated);
            }
            return updated;
          }
          return ord;
        })
      );
    } catch (err: any) {
      console.error("Error updating order status:", err);
      alert(err.message || "Failed to update order status");
    }
  };

  // ─── Delete Order Handler ──────────────────────────────────────────────────
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) return;

    try {
      const { error } = await supabase.from("sales").delete().eq("id", orderId);

      if (error) throw error;

      setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
      if (selectedOrderDetails?.id === orderId) {
        setSelectedOrderDetails(null);
      }
    } catch (err: any) {
      console.error("Error deleting order:", err);
      alert(err.message || "Failed to delete order");
    }
  };

  // Status Badge Helper
  const renderStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "processing":
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 font-semibold flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" />
            Processing
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 font-semibold flex items-center gap-1.5 w-fit">
            <CheckCircle className="w-3.5 h-3.5" />
            Delivered
          </Badge>
        );
      case "awaiting":
        return (
          <Badge className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-3 py-1 font-semibold flex items-center gap-1.5 w-fit">
            <Truck className="w-3.5 h-3.5" />
            Awaiting
          </Badge>
        );
      default:
        return <Badge className="bg-slate-800 text-slate-300">{status}</Badge>;
    }
  };

  // Order Metrics Breakdown
  const orderMetrics = useMemo(() => {
    const totalCount = orders.length;
    const processingCount = orders.filter((o) => o.status === "processing").length;
    const deliveredCount = orders.filter((o) => o.status === "delivered").length;
    const totalRevenue = orders.reduce((acc, o) => acc + o.price, 0);

    return { totalCount, processingCount, deliveredCount, totalRevenue };
  }, [orders]);

  return (
    <>
      {/* ─── Header & Top Actions ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />
            Order Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Create customer orders, track processing lifecycle, and download PDF invoices.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            Refresh
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger
              render={
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-bold shadow-lg shadow-emerald-500/20" />
              }
            >
              <Plus className="w-4 h-4 mr-2 stroke-[3]" />
              Create Order
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                  Create New Customer Order
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateOrder} className="flex flex-col gap-4 mt-2">
                {/* Customer Selection or New Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-400">Select Customer</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="new">+ Enter New Customer Name</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomerId === "new" && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Customer Full Name</label>
                    <Input
                      placeholder="e.g. Jane Doe"
                      value={customerNameInput}
                      onChange={(e) => setCustomerNameInput(e.target.value)}
                      className="bg-slate-950 border-slate-800 focus:border-emerald-500 text-white"
                      required
                    />
                    <p className="text-[11px] text-emerald-400">
                      * Entering a new name will automatically register them in Customer Profiles.
                    </p>
                  </div>
                )}

                {/* Category & Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Apparel">Apparel & Suits</option>
                      <option value="Footwear">Footwear & Shoes</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Laptops">Laptops & Tech</option>
                      <option value="Electronics">Electronics</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Total Price ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="120.00"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="bg-slate-950 border-slate-800 focus:border-emerald-500 text-white"
                      required
                    />
                  </div>
                </div>

                {/* Payment & Initial Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Payment Method</label>
                    <select
                      value={newPayment}
                      onChange={(e) => setNewPayment(e.target.value)}
                      className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="PayPal">PayPal</option>
                      <option value="POS">POS Scanner</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-400">Initial Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                      className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="processing">Processing</option>
                      <option value="delivered">Delivered</option>
                      <option value="awaiting">Awaiting</option>
                    </select>
                  </div>
                </div>

                {/* Loyalty Points Redemption & Summary Box */}
                {selectedCustomerId !== "new" && (() => {
                  const selCust = customers.find((c) => c.id === selectedCustomerId);
                  const availPts = selCust?.rewardPoints || 0;
                  const custTier = selCust?.tier || "Bronze";
                  const inputPrice = parseFloat(newPrice) || 0;
                  const maxRedeem = getMaxRedeemablePoints(inputPrice, availPts);
                  const currentDiscount = calculateDiscountFromPoints(Math.min(pointsToRedeem, maxRedeem));
                  const payableTotal = Math.max(0, inputPrice - currentDiscount);
                  const estimatedEarned = calculateEarnedPoints(payableTotal, custTier);

                  return (
                    <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-white">Loyalty & Rewards</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${getTierBadgeClass(custTier)}`}>
                          {custTier} VIP ({availPts} PTS)
                        </Badge>
                      </div>

                      {availPts > 0 && inputPrice > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                            <span>Redeem Points for Discount:</span>
                            <span className="text-emerald-400 font-bold">100 pts = $5 off</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={maxRedeem}
                              step={10}
                              value={pointsToRedeem || ""}
                              onChange={(e) => setPointsToRedeem(Math.min(maxRedeem, Math.max(0, parseInt(e.target.value) || 0)))}
                              placeholder={`Max ${maxRedeem} pts`}
                              className="bg-slate-900 border-slate-800 text-xs h-8 text-white focus:border-emerald-500"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setPointsToRedeem(maxRedeem)}
                              className="h-8 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20"
                            >
                              Max
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      <div className="border-t border-slate-800/80 pt-2 flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-400">Points Earned:</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> +{estimatedEarned} PTS
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <DialogFooter className="mt-4 gap-2">
                  <DialogClose
                    render={
                      <Button type="button" variant="outline" className="border-slate-800 text-slate-300" />
                    }
                  >
                    Cancel
                  </DialogClose>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Order
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ─── Metrics Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-xl !p-5 !gap-3">
          <CardHeader className="flex flex-row items-center justify-between !p-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Orders
            </CardTitle>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="!p-0">
            <div className="text-2xl font-black text-white">{orderMetrics.totalCount}</div>
            <p className="text-xs text-slate-500 mt-1">Recorded sales orders</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-xl !p-5 !gap-3">
          <CardHeader className="flex flex-row items-center justify-between !p-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Processing
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent className="!p-0">
            <div className="text-2xl font-black text-amber-400">{orderMetrics.processingCount}</div>
            <p className="text-xs text-slate-500 mt-1">Active orders in pipeline</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-xl !p-5 !gap-3">
          <CardHeader className="flex flex-row items-center justify-between !p-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Delivered
            </CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="!p-0">
            <div className="text-2xl font-black text-emerald-400">{orderMetrics.deliveredCount}</div>
            <p className="text-xs text-slate-500 mt-1">Fulfilled orders with invoice</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800/80 backdrop-blur-xl !p-5 !gap-3">
          <CardHeader className="flex flex-row items-center justify-between !p-0">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Order Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-teal-400" />
          </CardHeader>
          <CardContent className="!p-0">
            <div className="text-2xl font-black text-white">
              ${orderMetrics.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-500 mt-1">Cumulative sales total</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── Search & Filters Bar ─────────────────────────────────────────── */}
      <Card className="bg-slate-900/60 border-slate-800/80 p-4">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by Order # or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-500 px-2 font-semibold">Status:</span>
              <button
                onClick={() => setActiveStatus(null)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  activeStatus === null ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveStatus("processing")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  activeStatus === "processing" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Processing
              </button>
              <button
                onClick={() => setActiveStatus("delivered")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  activeStatus === "delivered" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"
                }`}
              >
                Delivered
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="default">Default Sort</option>
              <option value="date-desc">Newest First</option>
              <option value="price-desc">Highest Amount</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ─── Orders Table ─────────────────────────────────────────────────── */}
      <Card className="bg-slate-900/60 border-slate-800/80 overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            Orders Registry ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm font-medium">Loading orders data...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <ShoppingBag className="w-10 h-10 text-slate-600 stroke-[1.5]" />
              <p className="font-semibold text-slate-300">No orders found matching criteria</p>
              <p className="text-xs text-slate-500">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-950/60 border-b border-slate-800">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-bold text-xs">ORDER #</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs">CUSTOMER</TableHead>
                  <TableHead className="hidden sm:table-cell text-slate-400 font-bold text-xs">DATE</TableHead>
                  <TableHead className="hidden md:table-cell text-slate-400 font-bold text-xs">PAYMENT</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs">TOTAL</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs">STATUS</TableHead>
                  <TableHead className="text-right text-slate-400 font-bold text-xs">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                    <TableCell className="font-mono font-bold text-emerald-400">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        {order.customerName}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-slate-400 text-xs">{order.date}</TableCell>
                    <TableCell className="hidden md:table-cell text-slate-300 text-xs">{order.paymentMethod}</TableCell>
                    <TableCell className="font-bold text-white">{order.formattedPrice}</TableCell>
                    <TableCell>{renderStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        {/* Status Action Button */}
                        {order.status === "processing" ? (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, "delivered")}
                            className="hidden sm:inline-flex bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold h-8 px-2.5"
                          >
                            Mark Delivered
                          </Button>
                        ) : order.status === "delivered" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generateInvoicePDF(order)}
                            className="hidden sm:inline-flex border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold h-8 px-2.5 items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Invoice
                          </Button>
                        ) : null}

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white" />
                            }
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                            <DropdownMenuItem
                              onClick={() => setSelectedOrderDetails(order)}
                              className="hover:bg-slate-800 cursor-pointer flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4 text-slate-400" />
                              View Order Details
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => generateInvoicePDF(order)}
                              className="hover:bg-slate-800 cursor-pointer flex items-center gap-2 text-emerald-400"
                            >
                              <Download className="w-4 h-4" />
                              Download PDF Invoice
                            </DropdownMenuItem>

                            {order.status !== "delivered" && (
                              <DropdownMenuItem
                                onClick={() => handleUpdateStatus(order.id, "delivered")}
                                className="hover:bg-slate-800 cursor-pointer flex items-center gap-2 text-emerald-400"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Change Status to Delivered
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => handleDeleteOrder(order.id)}
                              className="hover:bg-rose-500/10 text-rose-400 cursor-pointer flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ─── Order Details Preview Modal ─────────────────────────────────────── */}
      {selectedOrderDetails && (
        <Dialog open={!!selectedOrderDetails} onOpenChange={() => setSelectedOrderDetails(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
                <span>Order #{selectedOrderDetails.orderNumber}</span>
                {renderStatusBadge(selectedOrderDetails.status)}
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-3 text-sm">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Customer</span>
                  <span className="text-base font-bold text-white">{selectedOrderDetails.customerName}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Order Date</span>
                  <span className="text-slate-200">{selectedOrderDetails.date}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Payment Mode</span>
                  <span className="text-slate-200">{selectedOrderDetails.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Total Amount</span>
                  <span className="text-lg font-extrabold text-emerald-400">
                    {selectedOrderDetails.formattedPrice}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedOrderDetails(null)}
                className="border-slate-800 text-slate-300"
              >
                Close
              </Button>
              <Button
                onClick={() => generateInvoicePDF(selectedOrderDetails)}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download PDF Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
