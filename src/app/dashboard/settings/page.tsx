"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Settings as SettingsIcon,
  Store,
  CreditCard,
  ShieldCheck,
  Award,
  Receipt,
  Save,
  CheckCircle2,
  RefreshCw,
  Bell,
  Globe,
  Database,
  Lock,
  UserCheck,
  Sparkles,
  Smartphone,
  Plus,
  Trash2,
  Gift,
  Users,
  Clock,
  Zap,
} from "lucide-react";

export interface CustomGateway {
  id: string;
  name: string;
  type: string;
  merchantId?: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "tax" | "gateways" | "security" | "loyalty">("general");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Store Profile State
  const [storeName, setStoreName] = useState("ApparelSync Flagship Store");
  const [currency, setCurrency] = useState("BDT (৳)");
  const [storeEmail, setStoreEmail] = useState("support@apparelsync.com");
  const [storePhone, setStorePhone] = useState("+880 1711 000111");
  const [storeAddress, setStoreAddress] = useState("House 42, Road 11, Banani, Dhaka, Bangladesh");

  // Tax & Invoice State
  const [vatRate, setVatRate] = useState("5.0");
  const [binNumber, setBinNumber] = useState("BIN-98402910492");
  const [invoiceFooter, setInvoiceFooter] = useState("Thank you for shopping at ApparelSync! Exchange within 7 days with valid receipt.");

  // Standard Payment Gateways State
  const [bKashEnabled, setBKashEnabled] = useState(true);
  const [nagadEnabled, setNagadEnabled] = useState(true);
  const [cardEnabled, setCardEnabled] = useState(true);
  const [payPalEnabled, setPayPalEnabled] = useState(true);

  // Custom Gateway Management State
  const [customGateways, setCustomGateways] = useState<CustomGateway[]>([
    { id: "rocket", name: "Rocket DBBL Mobile Banking", type: "Mobile Wallet", merchantId: "RK-98012", enabled: true },
    { id: "upay", name: "Upay UCB Wallet", type: "Mobile Wallet", merchantId: "UP-4401", enabled: true },
  ]);
  const [isAddGatewayModalOpen, setIsAddGatewayModalOpen] = useState(false);
  const [newGwName, setNewGwName] = useState("");
  const [newGwType, setNewGwType] = useState("Mobile Wallet");
  const [newGwMerchantId, setNewGwMerchantId] = useState("");

  // Detailed Loyalty Settings State
  const [pointsPerAmount, setPointsPerAmount] = useState("10"); // 10 points per ৳1000
  const [pointValue, setPointValue] = useState("1.0"); // 1 point = ৳1
  const [welcomeBonus, setWelcomeBonus] = useState("50");
  const [minRedeemPoints, setMinRedeemPoints] = useState("50");
  const [maxRedeemPoints, setMaxRedeemPoints] = useState("500");
  const [pointsExpiryMonths, setPointsExpiryMonths] = useState("12");
  const [birthdayBonus, setBirthdayBonus] = useState("100");
  const [referralBonus, setReferralBonus] = useState("75");

  // Tier Settings
  const [bronzeThreshold, setBronzeThreshold] = useState("0");
  const [silverThreshold, setSilverThreshold] = useState("10000");
  const [silverMultiplier, setSilverMultiplier] = useState("1.25");
  const [goldThreshold, setGoldThreshold] = useState("50000");
  const [goldMultiplier, setGoldMultiplier] = useState("1.50");

  // Load from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("apparelsync_settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.storeName) setStoreName(parsed.storeName);
          if (parsed.currency) setCurrency(parsed.currency);
          if (parsed.storeEmail) setStoreEmail(parsed.storeEmail);
          if (parsed.storePhone) setStorePhone(parsed.storePhone);
          if (parsed.storeAddress) setStoreAddress(parsed.storeAddress);
          if (parsed.vatRate) setVatRate(parsed.vatRate);
          if (parsed.binNumber) setBinNumber(parsed.binNumber);
          if (parsed.invoiceFooter) setInvoiceFooter(parsed.invoiceFooter);
          if (parsed.bKashEnabled !== undefined) setBKashEnabled(parsed.bKashEnabled);
          if (parsed.nagadEnabled !== undefined) setNagadEnabled(parsed.nagadEnabled);
          if (parsed.cardEnabled !== undefined) setCardEnabled(parsed.cardEnabled);
          if (parsed.payPalEnabled !== undefined) setPayPalEnabled(parsed.payPalEnabled);
          if (parsed.customGateways) setCustomGateways(parsed.customGateways);
          if (parsed.pointsPerAmount) setPointsPerAmount(parsed.pointsPerAmount);
          if (parsed.pointValue) setPointValue(parsed.pointValue);
          if (parsed.welcomeBonus) setWelcomeBonus(parsed.welcomeBonus);
          if (parsed.minRedeemPoints) setMinRedeemPoints(parsed.minRedeemPoints);
          if (parsed.maxRedeemPoints) setMaxRedeemPoints(parsed.maxRedeemPoints);
          if (parsed.pointsExpiryMonths) setPointsExpiryMonths(parsed.pointsExpiryMonths);
          if (parsed.birthdayBonus) setBirthdayBonus(parsed.birthdayBonus);
          if (parsed.referralBonus) setReferralBonus(parsed.referralBonus);
          if (parsed.silverThreshold) setSilverThreshold(parsed.silverThreshold);
          if (parsed.silverMultiplier) setSilverMultiplier(parsed.silverMultiplier);
          if (parsed.goldThreshold) setGoldThreshold(parsed.goldThreshold);
          if (parsed.goldMultiplier) setGoldMultiplier(parsed.goldMultiplier);
        } catch {
          // Fallback to default
        }
      }
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      storeName,
      currency,
      storeEmail,
      storePhone,
      storeAddress,
      vatRate,
      binNumber,
      invoiceFooter,
      bKashEnabled,
      nagadEnabled,
      cardEnabled,
      payPalEnabled,
      customGateways,
      pointsPerAmount,
      pointValue,
      welcomeBonus,
      minRedeemPoints,
      maxRedeemPoints,
      pointsExpiryMonths,
      birthdayBonus,
      referralBonus,
      silverThreshold,
      silverMultiplier,
      goldThreshold,
      goldMultiplier,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem("apparelsync_settings", JSON.stringify(payload));
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCustomGateway = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGwName.trim()) {
      alert("Please enter a gateway name.");
      return;
    }

    const newGw: CustomGateway = {
      id: `gw-${Date.now()}`,
      name: newGwName.trim(),
      type: newGwType,
      merchantId: newGwMerchantId.trim() || undefined,
      enabled: true,
    };

    setCustomGateways((prev) => [...prev, newGw]);
    setNewGwName("");
    setNewGwMerchantId("");
    setIsAddGatewayModalOpen(false);
  };

  const handleToggleCustomGateway = (id: string) => {
    setCustomGateways((prev) =>
      prev.map((gw) => (gw.id === id ? { ...gw, enabled: !gw.enabled } : gw))
    );
  };

  const handleDeleteCustomGateway = (id: string) => {
    setCustomGateways((prev) => prev.filter((gw) => gw.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 p-4 md:p-8 space-y-8 select-none">
      {/* ─── Header & Tagline ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1d2434] pb-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <SettingsIcon className="w-8 h-8 stroke-[2]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              CRM Store Settings
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium">
              Configure store branding, tax rules, payment gateways, and advanced multi-tier customer loyalty rewards
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-500/10 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* ─── Main Tabs Layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 my-6">
        {/* Navigation Sidebar Tabs */}
        <div className="space-y-2.5">
          {[
            { id: "general", label: "Store Profile", icon: Store, tagline: "Branding & Contact Info" },
            { id: "tax", label: "Tax & Billing", icon: Receipt, tagline: "VAT & Invoice Policy" },
            { id: "gateways", label: "Payment Gateways", icon: CreditCard, tagline: "Wallets & Custom Gateways" },
            { id: "loyalty", label: "Loyalty & Rewards", icon: Award, tagline: "Tiers, Points & Bonuses" },
            { id: "security", label: "Security & Database", icon: ShieldCheck, tagline: "Supabase & Role Security" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3.5 p-4 rounded-2xl font-bold text-sm transition-all text-left ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white hover:bg-[#111520] border border-transparent hover:border-[#1d2434]"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold">{tab.label}</span>
                  <span className={`text-[10px] font-medium ${isActive ? "text-slate-900" : "text-slate-500"}`}>
                    {tab.tagline}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSaveSettings}>
            {/* Tab 1: Store Profile */}
            {activeTab === "general" && (
              <Card className="bg-[#111520] border-[#1d2434] shadow-xl">
                <CardHeader className="border-b border-[#1d2434] p-6">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Store className="w-5 h-5 text-emerald-400" />
                      Store Profile & Branding
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure your store identity, default currency, and primary contact info shown on customer invoices.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                        Store Name
                      </label>
                      <Input
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                        Default Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-[#0b0e14] border border-[#1d2434] text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                      >
                        <option value="BDT (৳)">BDT - Bangladeshi Taka (৳)</option>
                        <option value="USD ($)">USD - US Dollar ($)</option>
                        <option value="EUR (€)">EUR - Euro (€)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                        Contact Email
                      </label>
                      <Input
                        type="email"
                        value={storeEmail}
                        onChange={(e) => setStoreEmail(e.target.value)}
                        className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                        Contact Phone Number
                      </label>
                      <Input
                        type="text"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                      Store Address
                    </label>
                    <Input
                      type="text"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab 2: Tax & Billing */}
            {activeTab === "tax" && (
              <Card className="bg-[#111520] border-[#1d2434] shadow-xl">
                <CardHeader className="border-b border-[#1d2434] p-6">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-emerald-400" />
                      Tax & Invoice Configuration
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-1">
                      Set government VAT percentages, registration BIN numbers, and PDF receipt footer terms.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                        Standard VAT / Tax Rate (%)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={vatRate}
                        onChange={(e) => setVatRate(e.target.value)}
                        className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                        Business BIN / Tax Registration No.
                      </label>
                      <Input
                        type="text"
                        value={binNumber}
                        onChange={(e) => setBinNumber(e.target.value)}
                        className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                      PDF Invoice Footer Policy Text
                    </label>
                    <Input
                      type="text"
                      value={invoiceFooter}
                      onChange={(e) => setInvoiceFooter(e.target.value)}
                      className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab 3: Payment Gateways (With Custom Gateway Addition) */}
            {activeTab === "gateways" && (
              <Card className="bg-[#111520] border-[#1d2434] shadow-xl">
                <CardHeader className="border-b border-[#1d2434] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-extrabold text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-emerald-400" />
                      Payment Gateway Integrations
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage standard mobile wallets, card terminals, and register custom payment options for POS checkout.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setIsAddGatewayModalOpen(true)}
                    className="bg-[#1a2130] border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-xl flex items-center gap-2 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Custom Gateway</span>
                  </Button>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                  {/* Standard Gateways Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                      Standard Built-in Payment Gateways
                    </h3>
                    {[
                      { id: "bKash", name: "bKash Mobile Banking", state: bKashEnabled, setter: setBKashEnabled, icon: Smartphone, color: "text-pink-400" },
                      { id: "Nagad", name: "Nagad Digital Wallet", state: nagadEnabled, setter: setNagadEnabled, icon: Smartphone, color: "text-orange-400" },
                      { id: "Card", name: "Debit / Credit Card Terminal", state: cardEnabled, setter: setCardEnabled, icon: CreditCard, color: "text-blue-400" },
                      { id: "PayPal", name: "PayPal International", state: payPalEnabled, setter: setPayPalEnabled, icon: Globe, color: "text-indigo-400" },
                    ].map((gw) => {
                      const Icon = gw.icon;
                      return (
                        <div
                          key={gw.id}
                          className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-xl bg-[#161c28] border border-[#1d2434]">
                              <Icon className={`w-5 h-5 ${gw.color}`} />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-white block">{gw.name}</span>
                              <span className="text-xs text-slate-400">Accept POS & online checkout via {gw.id}</span>
                            </div>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={gw.state}
                              onChange={(e) => gw.setter(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-[#1e2738] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Gateways Section */}
                  <div className="pt-6 border-t border-[#1d2434] space-y-3">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
                      Custom Registered Payment Options ({customGateways.length})
                    </h3>
                    {customGateways.length === 0 ? (
                      <p className="text-xs text-slate-500 italic p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434]">
                        No custom payment gateways added yet. Click "+ Add Custom Gateway" above to register Rocket, Upay, Bank Transfer, etc.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {customGateways.map((gw) => (
                          <div
                            key={gw.id}
                            className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="p-2.5 rounded-xl bg-[#161c28] border border-[#1d2434]">
                                <Smartphone className="w-5 h-5 text-emerald-400" />
                              </div>
                              <div>
                                <span className="text-sm font-bold text-white block">{gw.name}</span>
                                <span className="text-xs text-slate-400">
                                  {gw.type} {gw.merchantId ? `• Merchant ID: ${gw.merchantId}` : ""}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={gw.enabled}
                                  onChange={() => handleToggleCustomGateway(gw.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-[#1e2738] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteCustomGateway(gw.id)}
                                className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg"
                                title="Remove Custom Gateway"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab 4: Detailed Loyalty & Rewards Rules */}
            {activeTab === "loyalty" && (
              <Card className="bg-[#111520] border-[#1d2434] shadow-xl">
                <CardHeader className="border-b border-[#1d2434] p-6">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-400" />
                      Detailed Customer Loyalty & Reward Rules
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure base point earning rates, tier multipliers (Bronze, Silver, Gold), redemption caps, and event bonus rewards.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-8">
                  {/* Section 1: Earning & Cash Value */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" /> Basic Earning & Cash Valuation
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                          Points Earned Per ৳1,000 Spent
                        </label>
                        <Input
                          type="number"
                          value={pointsPerAmount}
                          onChange={(e) => setPointsPerAmount(e.target.value)}
                          className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                          Point Cash Value (৳ / Point)
                        </label>
                        <Input
                          type="number"
                          step="0.1"
                          value={pointValue}
                          onChange={(e) => setPointValue(e.target.value)}
                          className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                          Welcome Bonus Points (New Customer)
                        </label>
                        <Input
                          type="number"
                          value={welcomeBonus}
                          onChange={(e) => setWelcomeBonus(e.target.value)}
                          className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Multi-Tier Thresholds */}
                  <div className="pt-6 border-t border-[#1d2434] space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Tier Spend Thresholds & Point Multipliers
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] space-y-3">
                        <span className="text-xs font-black text-amber-500 uppercase tracking-wider block">
                          Bronze Tier (Standard)
                        </span>
                        <div className="space-y-1">
                          <span className="text-xs text-slate-400">Spend Threshold: ৳0 - ৳9,999</span>
                          <span className="text-sm font-bold text-white block">1.0x Base Earning Rate</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] space-y-3">
                        <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                          Silver Tier
                        </span>
                        <div className="space-y-2">
                          <label className="text-[11px] text-slate-400 font-semibold block">Min Spend Threshold (৳)</label>
                          <Input
                            type="number"
                            value={silverThreshold}
                            onChange={(e) => setSilverThreshold(e.target.value)}
                            className="bg-[#161c28] border-[#1d2434] text-slate-100 text-xs rounded-lg"
                          />
                          <label className="text-[11px] text-slate-400 font-semibold block pt-1">Earning Multiplier (e.g. 1.25x)</label>
                          <Input
                            type="number"
                            step="0.05"
                            value={silverMultiplier}
                            onChange={(e) => setSilverMultiplier(e.target.value)}
                            className="bg-[#161c28] border-[#1d2434] text-slate-100 text-xs rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] space-y-3">
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                          Gold VIP Tier
                        </span>
                        <div className="space-y-2">
                          <label className="text-[11px] text-slate-400 font-semibold block">Min Spend Threshold (৳)</label>
                          <Input
                            type="number"
                            value={goldThreshold}
                            onChange={(e) => setGoldThreshold(e.target.value)}
                            className="bg-[#161c28] border-[#1d2434] text-slate-100 text-xs rounded-lg"
                          />
                          <label className="text-[11px] text-slate-400 font-semibold block pt-1">Earning Multiplier (e.g. 1.50x)</label>
                          <Input
                            type="number"
                            step="0.05"
                            value={goldMultiplier}
                            onChange={(e) => setGoldMultiplier(e.target.value)}
                            className="bg-[#161c28] border-[#1d2434] text-slate-100 text-xs rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Redemption & Expiry Policies */}
                  <div className="pt-6 border-t border-[#1d2434] space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" /> Redemption Rules & Points Expiration
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                          Min Points to Redeem
                        </label>
                        <Input
                          type="number"
                          value={minRedeemPoints}
                          onChange={(e) => setMinRedeemPoints(e.target.value)}
                          className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                          Max Redeemable Points Per Order
                        </label>
                        <Input
                          type="number"
                          value={maxRedeemPoints}
                          onChange={(e) => setMaxRedeemPoints(e.target.value)}
                          className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                          Points Validity Period (Months)
                        </label>
                        <select
                          value={pointsExpiryMonths}
                          onChange={(e) => setPointsExpiryMonths(e.target.value)}
                          className="w-full bg-[#0b0e14] border border-[#1d2434] text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
                        >
                          <option value="6">6 Months</option>
                          <option value="12">12 Months (1 Year)</option>
                          <option value="24">24 Months (2 Years)</option>
                          <option value="0">Never Expire</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Bonus Events */}
                  <div className="pt-6 border-t border-[#1d2434] space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Gift className="w-4 h-4 text-pink-400" /> Event & Referral Reward Bonuses
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                          Customer Birthday Bonus Points
                        </label>
                        <Input
                          type="number"
                          value={birthdayBonus}
                          onChange={(e) => setBirthdayBonus(e.target.value)}
                          className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">
                          Referral Bonus Points (Referrer & Referee)
                        </label>
                        <Input
                          type="number"
                          value={referralBonus}
                          onChange={(e) => setReferralBonus(e.target.value)}
                          className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tab 5: Security & Database Sync */}
            {activeTab === "security" && (
              <Card className="bg-[#111520] border-[#1d2434] shadow-xl">
                <CardHeader className="border-b border-[#1d2434] p-6">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-extrabold text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      Security & Database Sync Status
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-1">
                      Monitor Supabase cloud sync connections, Manager PIN policies, and audit logs.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <Database className="w-5 h-5 text-emerald-400" />
                      <div>
                        <span className="text-sm font-bold text-white block">Supabase Real-time Cloud Sync</span>
                        <span className="text-xs text-slate-400">Connected to kndtuchbhtyunhmybjmr.supabase.co</span>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#1d2434] flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <Lock className="w-5 h-5 text-indigo-400" />
                      <div>
                        <span className="text-sm font-bold text-white block">Manager Role & Access Enforcement</span>
                        <span className="text-xs text-slate-400">Enforce PIN auth for order refunds & price overrides</span>
                      </div>
                    </div>
                    <Badge className="bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                      Enforced
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save All Settings Bar */}
            <div className="pt-8 flex justify-end">
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold hover:from-emerald-400 hover:to-teal-300 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 px-8 py-3 text-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ─── Add Custom Payment Gateway Modal ────────────────────────────── */}
      <Dialog open={isAddGatewayModalOpen} onOpenChange={setIsAddGatewayModalOpen}>
        <DialogContent className="bg-[#111520] border-[#1d2434] text-white max-w-md rounded-2xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2 text-emerald-400">
              <Plus className="w-5 h-5" />
              Add Custom Payment Option
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddCustomGateway} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Gateway / Option Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Rocket, Upay, Tap, Bank Transfer"
                value={newGwName}
                onChange={(e) => setNewGwName(e.target.value)}
                className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Gateway Provider Type
              </label>
              <select
                value={newGwType}
                onChange={(e) => setNewGwType(e.target.value)}
                className="w-full bg-[#0b0e14] border border-[#1d2434] text-slate-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="Mobile Wallet">Mobile Wallet (bKash, Nagad, Rocket, Upay)</option>
                <option value="Card Terminal">Card POS Terminal</option>
                <option value="Online Payment Gateway">Online Payment Gateway</option>
                <option value="Bank Wire Transfer">Direct Bank Transfer</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Merchant / Account ID (Optional)
              </label>
              <Input
                type="text"
                placeholder="e.g. RK-98012 or Account No."
                value={newGwMerchantId}
                onChange={(e) => setNewGwMerchantId(e.target.value)}
                className="bg-[#0b0e14] border-[#1d2434] text-slate-100 focus:border-emerald-500 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-[#1d2434]">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsAddGatewayModalOpen(false)}
                className="text-slate-400 hover:text-white rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
              >
                Add Gateway Option
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
