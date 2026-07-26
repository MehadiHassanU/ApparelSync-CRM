"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Customer, CustomerRow, CustomerOrderHistory } from "@/lib/types";
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
  Users,
  Search,
  Plus,
  UserCheck,
  DollarSign,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  TrendingUp,
  CreditCard,
  X,
} from "lucide-react";

export default function CustomersPage() {
  // ─── States ────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "repeat" | "new">("all");

  // Dialog States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail View State
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrderHistory[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  const fetchCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Customers
      const { data: customerData, error: custErr } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (custErr) throw custErr;

      // 2. Fetch Sales to aggregate LTV, total orders, last order date
      const { data: salesData, error: salesErr } = await supabase
        .from("sales")
        .select("id, customer_id, total, sale_date");

      if (salesErr) throw salesErr;

      // Build customer sales aggregation map
      const aggMap: Record<
        string,
        { totalOrders: number; totalSpent: number; lastOrderDate: string | null }
      > = {};

      if (salesData) {
        for (const s of salesData) {
          if (!s.customer_id) continue;
          if (!aggMap[s.customer_id]) {
            aggMap[s.customer_id] = { totalOrders: 0, totalSpent: 0, lastOrderDate: null };
          }
          aggMap[s.customer_id].totalOrders += 1;
          aggMap[s.customer_id].totalSpent += Number(s.total) || 0;

          const saleDate = s.sale_date;
          if (
            saleDate &&
            (!aggMap[s.customer_id].lastOrderDate ||
              new Date(saleDate) > new Date(aggMap[s.customer_id].lastOrderDate!))
          ) {
            aggMap[s.customer_id].lastOrderDate = saleDate;
          }
        }
      }

      // Map raw customer rows to Customer objects
      const mapped: Customer[] = (customerData || []).map((c: CustomerRow) => {
        const stats = aggMap[c.id] || { totalOrders: 0, totalSpent: 0, lastOrderDate: null };
        const avgValue = stats.totalOrders > 0 ? stats.totalSpent / stats.totalOrders : 0;

        return {
          id: c.id,
          fullName: c.full_name,
          email: c.email || null,
          phone: c.phone || null,
          address: c.address || null,
          city: c.city || null,
          notes: c.notes || null,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          totalOrders: stats.totalOrders,
          totalSpent: stats.totalSpent,
          lastOrderDate: stats.lastOrderDate,
          averageOrderValue: avgValue,
        };
      });

      setCustomers(mapped);
    } catch (err: any) {
      console.error("Fetch customers error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  // ─── Fetch Purchase History for Selected Customer ─────────────────────────
  const fetchCustomerOrders = useCallback(async (customerId: string) => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("id, order_number, total, payment_method, status, sale_date")
        .eq("customer_id", customerId)
        .order("sale_date", { ascending: false });

      if (error) throw error;

      const history: CustomerOrderHistory[] = (data || []).map((s: any) => ({
        id: s.id,
        orderNumber: s.order_number,
        total: Number(s.total) || 0,
        paymentMethod: s.payment_method || "N/A",
        status: s.status || "completed",
        createdAt: s.sale_date,
      }));

      setCustomerOrders(history);
    } catch (err) {
      console.error("Fetch customer purchase history error:", err);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const handleOpenDetail = (cust: Customer) => {
    setViewCustomer(cust);
    fetchCustomerOrders(cust.id);
  };

  // ─── CRUD Handlers ────────────────────────────────────────────────────────
  const resetForm = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setNotes("");
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("customers").insert([
        {
          full_name: fullName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          notes: notes.trim() || null,
        },
      ]);

      if (error) throw error;

      resetForm();
      setIsAddOpen(false);
      await fetchCustomerData();
    } catch (err: any) {
      console.error("Add customer error:", err);
      alert(`Error adding customer: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (cust: Customer) => {
    setSelectedCustomer(cust);
    setFullName(cust.fullName);
    setEmail(cust.email || "");
    setPhone(cust.phone || "");
    setAddress(cust.address || "");
    setCity(cust.city || "");
    setNotes(cust.notes || "");
    setIsEditOpen(true);
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !fullName.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          full_name: fullName.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          city: city.trim() || null,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedCustomer.id);

      if (error) throw error;

      setIsEditOpen(false);
      setSelectedCustomer(null);
      resetForm();
      await fetchCustomerData();
    } catch (err: any) {
      console.error("Edit customer error:", err);
      alert(`Error updating customer: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer profile?")) return;
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
      if (viewCustomer?.id === id) setViewCustomer(null);
      await fetchCustomerData();
    } catch (err: any) {
      console.error("Delete customer error:", err);
      alert(`Failed to delete customer: ${err.message}`);
    }
  };

  // ─── Filtered Data & KPI Calculations ─────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery)) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (filterType === "repeat") return (c.totalOrders || 0) >= 2;
      if (filterType === "new") return (c.totalOrders || 0) <= 1;
      return true;
    });
  }, [customers, searchQuery, filterType]);

  const stats = useMemo(() => {
    const totalCount = customers.length;
    const repeatCount = customers.filter((c) => (c.totalOrders || 0) >= 2).length;
    const totalSpentSum = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
    const avgLtv = totalCount > 0 ? totalSpentSum / totalCount : 0;

    return { totalCount, repeatCount, totalSpentSum, avgLtv };
  }, [customers]);

  return (
    <>
      {/* Page Header */}
      <header className="border-b border-[#1d2434] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Users className="w-9 h-9 text-emerald-400 stroke-[2]" /> Customer Profiles
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">
            Manage revisiting customers, track purchase history, and analyze customer lifetime value (LTV).
          </p>
        </div>

        {/* Add Customer Modal Trigger */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger render={
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl px-5 h-11 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 self-start md:self-auto" />
          }>
            <Plus className="w-4 h-4 stroke-[3]" /> Add New Customer
          </DialogTrigger>
          <DialogContent className="bg-[#111520] border-[#1d2434] text-white rounded-3xl max-w-lg p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" /> Create Customer Profile
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
                  <Input
                    placeholder="e.g. +1 555-0192"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                  <Input
                    type="email"
                    placeholder="e.g. sarah@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">City / Region</label>
                  <Input
                    placeholder="e.g. New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Address</label>
                  <Input
                    placeholder="e.g. 742 Evergreen Terrace"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Notes / Preferences</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Prefers cotton shirts, VIP Wholesale buyer"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1d2434] text-xs text-white p-3 rounded-xl outline-none focus:border-emerald-500"
                />
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
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Customer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Total Customers
            </CardTitle>
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-white tracking-tight">{stats.totalCount}</div>
            <div className="text-[11px] text-slate-500 font-bold mt-1">Registered profiles</div>
          </CardContent>
        </Card>

        <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Repeat Customers
            </CardTitle>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-emerald-400 tracking-tight">{stats.repeatCount}</div>
            <div className="text-[11px] text-slate-500 font-bold mt-1">
              {stats.totalCount > 0
                ? `${Math.round((stats.repeatCount / stats.totalCount) * 100)}% returning buyer rate`
                : "0% returning rate"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Total Customer LTV
            </CardTitle>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-white tracking-tight">
              {formatCurrency(stats.totalSpentSum)}
            </div>
            <div className="text-[11px] text-slate-500 font-bold mt-1">Cumulative sales revenue</div>
          </CardContent>
        </Card>

        <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
              Average LTV / Profile
            </CardTitle>
            <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-3xl font-black text-teal-400 tracking-tight">
              {formatCurrency(stats.avgLtv)}
            </div>
            <div className="text-[11px] text-slate-500 font-bold mt-1">Average spent per customer</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Workspace */}
      <Card className="bg-[#111520] border-[#1d2434] shadow-2xl rounded-3xl p-6">
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-[#1d2434]">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              placeholder="Search by name, phone, email, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0a0d14] border-[#1d2434] rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 w-full focus:border-emerald-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === "all"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-[#0a0d14] text-slate-400 border border-[#1d2434] hover:text-slate-200"
              }`}
            >
              All Profiles ({customers.length})
            </button>
            <button
              onClick={() => setFilterType("repeat")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === "repeat"
                  ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                  : "bg-[#0a0d14] text-slate-400 border border-[#1d2434] hover:text-slate-200"
              }`}
            >
              Repeat Buyers ({stats.repeatCount})
            </button>
            <button
              onClick={() => setFilterType("new")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === "new"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-[#0a0d14] text-slate-400 border border-[#1d2434] hover:text-slate-200"
              }`}
            >
              Single/New Buyers ({customers.length - stats.repeatCount})
            </button>
          </div>
        </div>

        {/* Customer Directory Table */}
        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading Customer Directory...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Users className="w-12 h-12 mb-3 stroke-[1.5]" />
              <span className="text-sm font-bold text-slate-300">No customer profiles found</span>
              <span className="text-xs text-slate-500 mt-1">
                {searchQuery ? "Try refining your search query." : "Click 'Add New Customer' to create a profile."}
              </span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1d2434] text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Spent</th>
                  <th className="py-3.5 px-4 text-right">Last Order</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1d2434] text-xs font-medium text-slate-300">
                {filteredCustomers.map((cust) => {
                  const isRepeat = (cust.totalOrders || 0) >= 2;
                  const initials = cust.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={cust.id} className="hover:bg-[#151b2a] transition-colors group">
                      {/* Name + Badge */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-teal-500/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-300 text-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-extrabold text-white flex items-center gap-2">
                              {cust.fullName}
                              {isRepeat && (
                                <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase px-1.5 py-0.2">
                                  VIP / Repeat
                                </Badge>
                              )}
                            </div>
                            {cust.notes && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                                {cust.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {cust.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-500" /> {cust.phone}
                            </div>
                          ) : (
                            <span className="text-slate-600 text-[10px] italic">No Phone</span>
                          )}
                          {cust.email && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                              <Mail className="w-3 h-3 text-slate-500" /> {cust.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4">
                        {cust.city ? (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" /> {cust.city}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[10px] italic">N/A</span>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="font-black text-white bg-[#0a0d14] px-2.5 py-1 rounded-lg border border-[#1d2434]">
                          {cust.totalOrders || 0}
                        </span>
                      </td>

                      {/* LTV Total Spent */}
                      <td className="py-4 px-4 text-right font-black text-emerald-400 text-sm">
                        {formatCurrency(cust.totalSpent || 0)}
                      </td>

                      {/* Last Order Date */}
                      <td className="py-4 px-4 text-right text-slate-400 text-[11px]">
                        {cust.lastOrderDate
                          ? new Date(cust.lastOrderDate).toLocaleDateString()
                          : "No orders yet"}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(cust)}
                            className="h-8 px-2.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg text-xs font-bold cursor-pointer"
                            title="View History & Details"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" /> View
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(cust)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomer(cust.id)}
                            className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                            title="Delete Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#111520] border-[#1d2434] text-white rounded-3xl max-w-lg p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-indigo-400" /> Edit Customer Profile
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCustomer} className="space-y-4 mt-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">City / Region</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Address</label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Notes / Preferences</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0a0d14] border border-[#1d2434] text-xs text-white p-3 rounded-xl outline-none focus:border-emerald-500"
              />
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
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl px-5 h-10"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customer Profile & Purchase History Slide-Over Drawer / Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#111520] border-l border-[#1d2434] h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between shadow-2xl">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1d2434] pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shadow-lg shadow-emerald-500/20">
                    {viewCustomer.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white">{viewCustomer.fullName}</h2>
                    <span className="text-xs text-emerald-400 font-bold">Customer ID: #{viewCustomer.id.slice(0, 8)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewCustomer(null)}
                  className="h-9 w-9 p-0 text-slate-400 hover:text-white rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-[#0a0d14] border border-[#1d2434] rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Lifetime Orders
                  </span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {viewCustomer.totalOrders || 0}
                  </span>
                </div>

                <div className="bg-[#0a0d14] border border-[#1d2434] rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Spent (LTV)
                  </span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {formatCurrency(viewCustomer.totalSpent || 0)}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mt-6 bg-[#0a0d14] border border-[#1d2434] rounded-2xl p-5 space-y-3">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2">
                  Contact Details
                </h4>

                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{viewCustomer.phone || "No phone number provided"}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{viewCustomer.email || "No email address provided"}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {viewCustomer.address || viewCustomer.city
                      ? `${viewCustomer.address || ""} ${viewCustomer.city ? `(${viewCustomer.city})` : ""}`
                      : "No address recorded"}
                  </span>
                </div>

                {viewCustomer.notes && (
                  <div className="pt-2 border-t border-[#1d2434] mt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Notes / Remarks
                    </span>
                    <p className="text-xs text-slate-400 bg-[#111520] p-3 rounded-xl border border-[#1d2434]">
                      {viewCustomer.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Purchase History Section */}
              <div className="mt-8">
                <h3 className="text-base font-black text-white flex items-center justify-between mb-4">
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-indigo-400" /> Purchase History
                  </span>
                  <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-black px-2 py-0.5">
                    {customerOrders.length} Transactions
                  </Badge>
                </h3>

                {loadingOrders ? (
                  <div className="py-10 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Loading transaction history...
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="bg-[#0a0d14] border border-[#1d2434] rounded-2xl p-6 text-center text-slate-500 text-xs">
                    No completed purchases linked to this customer profile yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-[#0a0d14] border border-[#1d2434] hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-xs">#{ord.orderNumber}</span>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase px-1.5 py-0.2">
                              {ord.status}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3 text-slate-500" />
                              {ord.paymentMethod}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-emerald-400 text-sm">{formatCurrency(ord.total)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Close Button */}
            <div className="pt-6 border-t border-[#1d2434] mt-8">
              <Button
                onClick={() => setViewCustomer(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl h-11"
              >
                Close Customer Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
