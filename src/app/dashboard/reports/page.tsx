"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FinancialTransaction,
  FinancialSummary,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
} from "@/lib/financialTypes";
import {
  getFinancialTransactions,
  saveFinancialTransaction,
  calculateSummary,
  getCategoryBreakdown,
  getPaymentMethodBreakdown,
  getTimelineData,
  filterByTimeframe,
  TimeframePreset,
  exportTransactionsToCSV,
} from "@/lib/financialService";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Building2,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Printer,
  Sparkles,
  Receipt,
  BarChart3,
  X,
  Smartphone,
  Globe,
  Coins,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

export default function ReportsPage() {
  // ─── States ──────────────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Timeframe Presets: "today" | "week" | "month" | "yearly" | "all"
  const [timelinePreset, setTimelinePreset] = useState<TimeframePreset>("all");

  // Selected Month (Format "YYYY-MM") for Monthly preset
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-08");

  // Available Months for dropdown selector
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();

    const months = [
      "2026-08",
      "2026-07",
      "2026-06",
      "2026-05",
      "2026-04",
      "2026-03",
      "2026-02",
      "2026-01",
    ];
    months.forEach((m) => monthSet.add(m));

    transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthSet.add(t.date.slice(0, 7));
      }
    });

    return Array.from(monthSet).sort().reverse();
  }, [transactions]);

  // Filters & Search for Ledger
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);

  // Form State for New Transaction
  const [newType, setNewType] = useState<TransactionType>("income");
  const [newCategory, setNewCategory] = useState("Apparel Sales");
  const [newAmount, setNewAmount] = useState("");
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>("bKash");
  const [newPartyName, setNewPartyName] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newStatus, setNewStatus] = useState<TransactionStatus>("completed");
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getFinancialTransactions();
    setTransactions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Timeframe Filtered Transactions for Summary & Timeline ────────────────
  const timeframeFilteredTransactions = useMemo(() => {
    return filterByTimeframe(
      transactions,
      timelinePreset,
      timelinePreset === "month" ? selectedMonth : undefined
    );
  }, [transactions, timelinePreset, selectedMonth]);

  // ─── Fully Filtered Ledger Transactions ─────────────────────────────────────
  const ledgerTransactions = useMemo(() => {
    return timeframeFilteredTransactions.filter((t) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        t.transactionNumber.toLowerCase().includes(query) ||
        t.partyName.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        (t.notes && t.notes.toLowerCase().includes(query)) ||
        (t.orderId && t.orderId.toLowerCase().includes(query));

      const matchesType = selectedType === "all" || t.type === selectedType;
      const matchesPayment = selectedPayment === "all" || t.paymentMethod === selectedPayment;
      const matchesStatus = selectedStatus === "all" || t.status === selectedStatus;

      return matchesSearch && matchesType && matchesPayment && matchesStatus;
    });
  }, [timeframeFilteredTransactions, searchQuery, selectedType, selectedPayment, selectedStatus]);

  // ─── Metrics & Summaries ───────────────────────────────────────────────────
  const summary: FinancialSummary = useMemo(
    () => calculateSummary(timeframeFilteredTransactions),
    [timeframeFilteredTransactions]
  );
  const categoryBreakdown = useMemo(
    () => getCategoryBreakdown(timeframeFilteredTransactions),
    [timeframeFilteredTransactions]
  );
  const paymentBreakdown = useMemo(
    () => getPaymentMethodBreakdown(timeframeFilteredTransactions),
    [timeframeFilteredTransactions]
  );
  const timelineData = useMemo(
    () =>
      getTimelineData(
        transactions,
        timelinePreset,
        timelinePreset === "month" ? selectedMonth : undefined
      ),
    [transactions, timelinePreset, selectedMonth]
  );

  const formatMonthLabel = (mStr: string) => {
    const parts = mStr.split("-");
    if (parts.length === 2) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    return mStr;
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount)) || Number(newAmount) <= 0) {
      alert("Please enter a valid numeric amount.");
      return;
    }
    if (!newPartyName.trim()) {
      alert("Please enter customer or vendor name.");
      return;
    }

    saveFinancialTransaction({
      date: newDate || new Date().toISOString().split("T")[0],
      type: newType,
      category: newCategory,
      amount: Number(newAmount),
      paymentMethod: newPaymentMethod,
      status: newStatus,
      partyName: newPartyName.trim(),
      notes: newNotes.trim() || undefined,
    });

    setNewAmount("");
    setNewPartyName("");
    setNewNotes("");
    setIsLogModalOpen(false);
    loadData();
  };

  const handlePrintReceipt = (t: FinancialTransaction) => {
    generateInvoicePDF({
      id: t.id,
      orderNumber: t.transactionNumber,
      customerName: t.partyName,
      category: t.category,
      price: t.amount,
      formattedPrice: `৳${t.amount.toLocaleString()}`,
      date: t.date,
      paymentMethod: t.paymentMethod,
      status: t.status === "completed" ? "delivered" : "processing",
    });
  };

  // ─── Badges & Icons ─────────────────────────────────────────────────────────
  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case "income":
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
            <ArrowUpRight className="w-3.5 h-3.5" /> Income
          </span>
        );
      case "expense":
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 w-fit">
            <ArrowDownRight className="w-3.5 h-3.5" /> Expense
          </span>
        );
      case "refund":
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 w-fit">
            <RefreshCw className="w-3.5 h-3.5" /> Refund
          </span>
        );
      case "discount":
        return (
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5 w-fit">
            <Tag className="w-3.5 h-3.5" /> Discount
          </span>
        );
    }
  };

  const getStatusBadge = (status: TransactionStatus) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Completed
          </span>
        );
      case "processing":
      case "pending":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Pending
          </span>
        );
      case "failed":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            Failed
          </span>
        );
    }
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case "bKash":
      case "Nagad":
        return <Smartphone className="w-3.5 h-3.5 text-pink-400" />;
      case "Card":
        return <CreditCard className="w-3.5 h-3.5 text-blue-400" />;
      case "PayPal":
        return <Globe className="w-3.5 h-3.5 text-indigo-400" />;
      case "Cash":
      default:
        return <Coins className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      "from-emerald-500 to-teal-400",
      "from-blue-500 to-cyan-400",
      "from-indigo-500 to-purple-400",
      "from-amber-500 to-orange-400",
      "from-rose-500 to-pink-400",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 p-4 md:p-8 space-y-8 select-none">
      {/* ─── Header & Actions ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1d2434] pb-6 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <FileText className="w-7 h-7 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Financial Reports & Ledger
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-0.5">
              Comprehensive financial transactions tracking, multi-period timeline analysis, and operational performance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => exportTransactionsToCSV(ledgerTransactions)}
            variant="outline"
            className="bg-[#111520] border-[#1d2434] text-slate-300 hover:text-white hover:bg-[#1a2130] rounded-xl flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </Button>

          <Button
            onClick={() => setIsLogModalOpen(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-300 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log Transaction</span>
          </Button>
        </div>
      </div>

      {/* ─── Top KPI Metric Cards Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Card 1: Gross Revenue */}
        <Card className="bg-[#111520] border-[#1d2434] shadow-xl hover:border-emerald-500/40 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Gross Revenue</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                ৳{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center gap-1 border border-emerald-500/20">
                <ArrowUpRight className="w-3 h-3" /> Sales Income
              </span>
              <span className="text-slate-400 font-medium">{summary.totalTransactions} items</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Operating Expenses */}
        <Card className="bg-[#111520] border-[#1d2434] shadow-xl hover:border-rose-500/40 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Expenses & Refunds</span>
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                ৳{summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-rose-400 font-bold">
                ৳{summary.totalRefunds.toLocaleString()} refunds
              </span>
              <span className="text-slate-400 font-medium">• COGS & Utilities</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Net Profit */}
        <Card className="bg-[#111520] border-[#1d2434] shadow-xl hover:border-teal-500/40 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Net Profit</span>
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
                ৳{summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 font-extrabold border border-teal-500/30">
                {summary.profitMargin.toFixed(1)}% Margin
              </span>
              <span className="text-slate-400 font-medium">Net Profitability</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Avg Transaction */}
        <Card className="bg-[#111520] border-[#1d2434] shadow-xl hover:border-indigo-500/40 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Avg Transaction</span>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl md:text-3xl font-black text-white tracking-tight">
                ৳{summary.avgTransactionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-bold">{summary.completedCount} Completed</span>
              <span className="text-slate-400 font-medium">• {summary.pendingCount} Pending</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Timeline & Distribution Section ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-8">
        {/* Timeline Chart Widget */}
        <Card className="lg:col-span-2 bg-[#111520] border-[#1d2434] shadow-xl">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-[#1d2434]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-white">Financial Timeline</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Revenue & Expense flow over selected timeframe</p>
              </div>
            </div>

            {/* Timeframe Presets Buttons & Month Selector */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1 bg-[#0b0e14] p-1.5 rounded-xl border border-[#1d2434]">
                {[
                  { id: "today", label: "Today" },
                  { id: "week", label: "Last Week" },
                  { id: "month", label: "Monthly" },
                  { id: "yearly", label: "Yearly" },
                  { id: "all", label: "All Time" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setTimelinePreset(item.id as TimeframePreset)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      timelinePreset === item.id
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white hover:bg-[#161c28]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Month Selector Dropdown */}
              {timelinePreset === "month" && (
                <div className="relative flex items-center">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-[#0b0e14] border border-emerald-500/40 text-emerald-400 font-extrabold rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer shadow-lg shadow-emerald-500/10"
                  >
                    {availableMonths.map((mStr) => (
                      <option key={mStr} value={mStr} className="bg-[#111520] text-slate-200">
                        {formatMonthLabel(mStr)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Quick Stat Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] flex flex-col justify-between">
                <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Period Income</span>
                <span className="text-lg md:text-xl font-black text-emerald-400 mt-1.5">
                  ৳{summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] flex flex-col justify-between">
                <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Period Expenses</span>
                <span className="text-lg md:text-xl font-black text-rose-400 mt-1.5">
                  ৳{summary.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] flex flex-col justify-between">
                <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">Net Profit</span>
                <span className="text-lg md:text-xl font-black text-teal-300 mt-1.5">
                  ৳{summary.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {timelineData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-sm gap-2 bg-[#0b0e14] rounded-2xl border border-[#1d2434] p-6 text-center">
                <Calendar className="w-8 h-8 text-slate-600 animate-pulse" />
                <span className="font-semibold text-slate-300">No financial data for {timelinePreset === "month" ? formatMonthLabel(selectedMonth) : "the selected timeframe"}.</span>
                <span className="text-xs text-slate-500">Try selecting a different month or timeframe preset above.</span>
              </div>
            ) : (
              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1d2434" vertical={false} />
                    <XAxis dataKey="displayDate" stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111520",
                        borderColor: "#232d42",
                        borderRadius: "14px",
                        color: "#fff",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
                      }}
                      formatter={(val: any) => [`৳${Number(val).toLocaleString()}`, ""]}
                    />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Income (৳)"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Expense (৳)"
                      stroke="#f43f5e"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorExpense)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Distribution Widget (With Generous Margins & Padding) */}
        <Card className="bg-[#111520] border-[#1d2434] shadow-xl flex flex-col justify-between">
          <CardHeader className="p-6 border-b border-[#1d2434]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400">
                <PieChartIcon className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-white">Financial Distribution</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Category revenue & payment gateway share</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Category Progress Bars */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3.5">
                Revenue by Category
              </h3>
              {categoryBreakdown.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] text-center text-slate-500 text-xs italic">
                  No category revenue records for this timeframe.
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryBreakdown.slice(0, 4).map((c, idx) => (
                    <div key={c.category} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-200">{c.category}</span>
                        <span className="text-emerald-400">৳{c.amount.toLocaleString()} ({c.percentage}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#0b0e14] rounded-full overflow-hidden border border-[#1d2434]">
                        <div
                          className={`h-full bg-gradient-to-r ${getCategoryColor(idx)} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(c.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method Distribution Grid */}
            <div className="pt-6 border-t border-[#1d2434] space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3.5">
                Payment Method Shares
              </h3>
              {paymentBreakdown.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] text-center text-slate-500 text-xs italic">
                  No payment gateway records.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {paymentBreakdown.map((pm) => (
                    <div
                      key={pm.method}
                      className="p-3.5 rounded-xl bg-[#0b0e14] border border-[#1d2434] hover:border-emerald-500/30 transition-all flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {getPaymentIcon(pm.method)}
                          <span className="text-xs font-extrabold text-slate-200">{pm.method}</span>
                        </div>
                        <span className="text-xs font-bold text-white block">৳{pm.amount.toLocaleString()}</span>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-[#161c28] text-[10px] font-bold text-emerald-400 border border-[#1d2434]">
                        {pm.count} tx
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Financial Transactions Ledger Table Card (Generous Margins & Padding) ── */}
      <Card className="bg-[#111520] border-[#1d2434] shadow-2xl mt-10 mb-8">
        <CardHeader className="border-b border-[#1d2434] p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
            <div>
              <CardTitle className="text-lg md:text-xl font-extrabold text-white flex items-center gap-3">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Financial Transactions Ledger
              </CardTitle>
              <p className="text-xs md:text-sm text-slate-400 mt-1.5">
                Showing {ledgerTransactions.length} of {timeframeFilteredTransactions.length} entries for timeframe:{" "}
                <span className="text-emerald-400 font-bold uppercase">
                  {timelinePreset === "month" ? formatMonthLabel(selectedMonth) : timelinePreset}
                </span>
              </p>
            </div>

            {/* Filter Search Bar & Selectors with Increased Spacing */}
            <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="text"
                  placeholder="Search ID, party, category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-8 bg-[#0b0e14] border-[#1d2434] text-slate-100 placeholder:text-slate-500 rounded-xl focus:border-emerald-500 text-xs py-2"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-[#0b0e14] border border-[#1d2434] text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="all">All Types</option>
                <option value="income">Income (+৳)</option>
                <option value="expense">Expense (-৳)</option>
                <option value="refund">Refund (-৳)</option>
                <option value="discount">Discount</option>
              </select>

              {/* Gateway Filter */}
              <select
                value={selectedPayment}
                onChange={(e) => setSelectedPayment(e.target.value)}
                className="bg-[#0b0e14] border border-[#1d2434] text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="all">All Gateways</option>
                <option value="bKash">bKash</option>
                <option value="Nagad">Nagad</option>
                <option value="Card">Card</option>
                <option value="Cash">Cash</option>
                <option value="PayPal">PayPal</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#0b0e14] border border-[#1d2434] text-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Pending</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <span className="font-semibold text-sm">Loading ledger data...</span>
            </div>
          ) : ledgerTransactions.length === 0 ? (
            <div className="p-14 text-center text-slate-500 space-y-3">
              <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-base font-bold text-slate-300">No matching transactions found.</p>
              <p className="text-xs text-slate-500">Adjust your search query or timeframe preset filters above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#151b28] border-b border-[#1d2434]">
                <TableRow className="border-b-[#1d2434] hover:bg-transparent">
                  <TableHead className="py-4 px-6 text-slate-400 font-extrabold text-xs uppercase tracking-wider">Transaction ID & Date</TableHead>
                  <TableHead className="py-4 px-6 text-slate-400 font-extrabold text-xs uppercase tracking-wider">Type</TableHead>
                  <TableHead className="py-4 px-6 text-slate-400 font-extrabold text-xs uppercase tracking-wider">Party (Customer / Vendor)</TableHead>
                  <TableHead className="py-4 px-6 text-slate-400 font-extrabold text-xs uppercase tracking-wider">Category</TableHead>
                  <TableHead className="py-4 px-6 text-slate-400 font-extrabold text-xs uppercase tracking-wider">Payment Method</TableHead>
                  <TableHead className="py-4 px-6 text-slate-400 font-extrabold text-xs uppercase tracking-wider">Status</TableHead>
                  <TableHead className="py-4 px-6 text-slate-400 font-extrabold text-xs uppercase tracking-wider text-right">Amount (BDT)</TableHead>
                  <TableHead className="py-4 px-6 text-slate-400 font-extrabold text-xs uppercase tracking-wider text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerTransactions.map((t) => {
                  const isIncome = t.type === "income";
                  const isExpense = t.type === "expense" || t.type === "refund";

                  return (
                    <TableRow key={t.id} className="border-b-[#1d2434] hover:bg-[#161c28]/70 transition-colors">
                      <TableCell className="py-4 px-6 font-semibold">
                        <div className="flex flex-col">
                          <span className="text-white font-mono text-xs font-extrabold">{t.transactionNumber}</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">{t.date}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6">{getTypeBadge(t.type)}</TableCell>

                      <TableCell className="py-4 px-6 text-slate-200 font-medium text-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{t.partyName}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-slate-300 text-xs font-medium">{t.category}</TableCell>

                      <TableCell className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-[#1d2434] text-slate-300 text-xs font-semibold flex items-center gap-1.5 w-fit">
                          {getPaymentIcon(t.paymentMethod)}
                          {t.paymentMethod}
                        </span>
                      </TableCell>

                      <TableCell className="py-4 px-6">{getStatusBadge(t.status)}</TableCell>

                      <TableCell className="py-4 px-6 text-right font-mono font-black text-sm">
                        <span className={isIncome ? "text-emerald-400" : isExpense ? "text-rose-400" : "text-slate-200"}>
                          {isIncome ? "+" : isExpense ? "-" : ""}৳{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSelectedTransaction(t)}
                            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#1d2434] rounded-lg"
                            title="View Transaction Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handlePrintReceipt(t)}
                            className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg"
                            title="Download PDF Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ─── Log New Transaction Modal ─────────────────────────────────────── */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="bg-[#111520] border-[#1d2434] text-white max-w-lg rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2 text-emerald-400">
              <Plus className="w-5 h-5" />
              Log Financial Transaction
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTransaction} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Transaction Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => {
                    const val = e.target.value as TransactionType;
                    setNewType(val);
                    if (val === "income") setNewCategory("Apparel Sales");
                    else if (val === "expense") setNewCategory("Supplier Inventory");
                    else if (val === "refund") setNewCategory("Customer Refund");
                  }}
                  className="w-full bg-[#0b0e14] border border-[#1d2434] text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="income">Income (+৳)</option>
                  <option value="expense">Operating Expense (-৳)</option>
                  <option value="refund">Refund (-৳)</option>
                  <option value="discount">Discount</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Amount (BDT ৳)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Apparel Sales, Utilities"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Payment Method
                </label>
                <select
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-[#0b0e14] border border-[#1d2434] text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Customer / Vendor / Organization Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Rahim Chowdhury or TexFab Mills"
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Date
                </label>
                <Input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TransactionStatus)}
                  className="w-full bg-[#0b0e14] border border-[#1d2434] text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="completed">Completed</option>
                  <option value="processing">Pending</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Notes / Description
              </label>
              <Input
                type="text"
                placeholder="Optional description of transaction..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-[#1d2434]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
              >
                Save Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Transaction Detail Modal ───────────────────────────────────────── */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="bg-[#111520] border-[#1d2434] text-white max-w-md rounded-2xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold flex items-center justify-between">
                <span>Transaction Details</span>
                {getTypeBadge(selectedTransaction.type)}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4 text-sm">
              <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Transaction ID:</span>
                  <span className="font-mono text-emerald-400 font-extrabold">{selectedTransaction.transactionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Date & Time:</span>
                  <span className="font-semibold text-slate-200">{selectedTransaction.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Status:</span>
                  <span>{getStatusBadge(selectedTransaction.status)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Party / Customer:</span>
                  <span className="font-bold text-white">{selectedTransaction.partyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Category:</span>
                  <span className="text-slate-200 font-medium">{selectedTransaction.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Payment Gateway:</span>
                  <span className="text-slate-200 font-semibold">{selectedTransaction.paymentMethod}</span>
                </div>
                {selectedTransaction.orderId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Linked Order ID:</span>
                    <span className="font-mono text-slate-300 font-semibold">{selectedTransaction.orderId}</span>
                  </div>
                )}
                {selectedTransaction.notes && (
                  <div className="pt-2 border-t border-[#1d2434]">
                    <span className="text-slate-400 text-xs block font-medium">Notes:</span>
                    <p className="text-xs text-slate-300 mt-1 italic bg-[#0b0e14] p-2.5 rounded-lg border border-[#1d2434]">
                      "{selectedTransaction.notes}"
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-300">Total Transaction Amount</span>
                <span className="text-xl font-black text-emerald-400">
                  ৳{selectedTransaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-[#1d2434] flex gap-2">
              <Button
                variant="outline"
                onClick={() => handlePrintReceipt(selectedTransaction)}
                className="bg-[#1a2130] border-[#1d2434] text-emerald-400 hover:text-emerald-300 rounded-xl flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </Button>
              <Button
                onClick={() => setSelectedTransaction(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
