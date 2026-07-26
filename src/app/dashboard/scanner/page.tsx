"use client";

import React, { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Product, CartItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CustomerPicker from "@/components/customers/CustomerPicker";
import {
  Loader2,
  ScanLine,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  AlertTriangle,
  User,
  CreditCard,
  CheckCircle,
  Trash,
  Printer,
} from "lucide-react";
import ScannerCamera from "@/components/scanner/ScannerCamera";
import Cart from "@/components/scanner/Cart";

export default function ScannerPOSPage() {
  // ─── States ────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanQuantity, setScanQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Checkout states
  const [customerName, setCustomerName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successOrderNum, setSuccessOrderNum] = useState<string | null>(null);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
=======
>>>>>>> main

  // Autocomplete fetcher inside useEffect to decouple state updates
  React.useEffect(() => {
    if (manualInput.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        let query = supabase
          .from("products")
          .select(`
            id,
            name,
            sku,
            price,
            stock_quantity,
            category_id,
            barcode,
            qr_data,
            created_at,
            updated_at,
            category:categories ( name )
          `)
          .or(`name.ilike.%${manualInput}%,sku.ilike.%${manualInput}%,barcode.ilike.%${manualInput}%`);

        if (query && typeof (query as any).limit === "function") {
          query = (query as any).limit(5);
        }

        const { data, error } = await query;

        if (error) throw error;
        if (data) {
          const mapped: Product[] = data.map((item: any) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            price: Number(item.price),
            stockQuantity: Number(item.stock_quantity),
            categoryId: item.category_id,
            categoryName: item.category?.name || "Uncategorized",
            barcode: item.barcode,
            qrData: item.qr_data,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
          setSuggestions(mapped);
        }
      } catch (err) {
        console.error("Suggestions fetch error:", err);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 150);

    return () => clearTimeout(timer);
  }, [manualInput]);

  const handleSelectSuggestion = (prod: Product) => {
    setScannedProduct(prod);
    setScanQuantity(1);
    setSuggestions([]);
    setManualInput("");
    setErrorMsg(null);
  };

  // ─── Search / Lookup Product ───────────────────────────────────────────────
  const lookupProduct = useCallback(async (value: string, isFromQR = false) => {
    setLoadingProduct(true);
    setErrorMsg(null);
    setScannedProduct(null);
    setScanQuantity(1);

    try {
      const queryVal = value.trim();
      if (!queryVal) return;

      // Match either the SKU directly or the manual Barcode (UPC/EAN)
      // This is highly flexible, supporting low-density QR codes (which store the SKU string) and standard barcodes.
      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          price,
          stock_quantity,
          category_id,
          barcode,
          qr_data,
          created_at,
          updated_at,
          category:categories ( name )
        `)
        .or(`sku.eq."${queryVal}",barcode.eq."${queryVal}"`)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(`No product found matching code: "${queryVal}"`);
      }

      const foundProduct: Product = {
        id: data.id,
        name: data.name,
        sku: data.sku,
        price: Number(data.price),
        stockQuantity: Number(data.stock_quantity),
        categoryId: data.category_id,
        categoryName: (data.category as any)?.name || "Uncategorized",
        barcode: data.barcode,
        qrData: data.qr_data,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setScannedProduct(foundProduct);

      // Auto-add to cart if stock available
      if (foundProduct.stockQuantity > 0) {
        setCart((prevCart) => {
          const existingItemIndex = prevCart.findIndex((i) => i.product.id === foundProduct.id);
          if (existingItemIndex > -1) {
            const currentQty = prevCart[existingItemIndex].quantity;
            if (currentQty < foundProduct.stockQuantity) {
              const updated = [...prevCart];
              updated[existingItemIndex] = {
                ...updated[existingItemIndex],
                quantity: currentQty + 1,
              };
              return updated;
            }
            return prevCart;
          }
          return [...prevCart, { product: foundProduct, quantity: 1 }];
        });
      }
    } catch (err: any) {
      console.error("Lookup product error:", err);
      setErrorMsg(err.message || "Failed to retrieve product information.");
    } finally {
      setLoadingProduct(false);
    }
  }, []);

  // Synthesize a scan beep sound using Web Audio API (cross-browser, no asset files required)
  const playBeep = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = 880; // High register A5 pitch
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio feedback beep failed:", e);
    }
  }, []);

  // ─── Scan success handler ──────────────────────────────────────────────────
  const handleScanSuccess = useCallback((decodedText: string) => {
    playBeep();
    lookupProduct(decodedText, true);
  }, [lookupProduct, playBeep]);

  const handleToggleScanner = useCallback(() => {
    setIsScannerActive((prev) => !prev);
  }, []);

  const handleClearCart = useCallback(() => {
    if (confirm("Are you sure you want to empty the shopping cart?")) {
      setCart([]);
    }
  }, []);

  // ─── Cart Manipulations ─────────────────────────────────────────────────────
  const handleManualLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    lookupProduct(manualInput, false);
    setManualInput("");
  };

  const updateCartQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          // Bound it to stock quantity
          const stock = item.product.stockQuantity;
          return { ...item, quantity: Math.min(newQty, stock) };
        }
        return item;
      })
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleAddPreviewToCart = () => {
    if (!scannedProduct) return;
    if (scannedProduct.stockQuantity === 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.product.id === scannedProduct.id);
      if (existing) {
        const targetQty = Math.min(existing.quantity + scanQuantity, scannedProduct.stockQuantity);
        return prevCart.map((i) => (i.product.id === scannedProduct.id ? { ...i, quantity: targetQty } : i));
      }
      return [...prevCart, { product: scannedProduct, quantity: scanQuantity }];
    });

    setScannedProduct(null);
  };

  // ─── Checkout Flow ──────────────────────────────────────────────────────────
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsCheckingOut(true);
    setSuccessOrderNum(null);

    try {
      // 1. Resolve customer id — skip DB lookup when picker already gave us one
      let customerId: string | null = selectedCustomerId;

      if (!customerId) {
        const targetCustomer = customerName.trim() || "Walk-in Customer";

        const { data: existingCust } = await supabase
          .from("customers")
          .select("id")
          .eq("full_name", targetCustomer)
          .maybeSingle();

        if (existingCust) {
          customerId = existingCust.id;
        } else {
          const { data: newCust, error: custErr } = await supabase
            .from("customers")
            .insert([{ full_name: targetCustomer }])
            .select("id")
            .single();

          if (custErr) throw custErr;
          if (newCust) customerId = newCust.id;
        }
      }

      // 2. Generate transaction details
      const orderNumber = `NA${Math.floor(100000 + Math.random() * 900000)}`;
      const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      // 3. Create Sale record
      const { data: newSale, error: saleErr } = await supabase
        .from("sales")
        .insert([
          {
            order_number: orderNumber,
            customer_id: customerId,
            subtotal: cartTotal,
            total: cartTotal,
            payment_method: paymentMethod,
            status: "delivered", // POS sales are immediate/completed
          },
        ])
        .select("id")
        .single();

      if (saleErr) throw saleErr;

      // 4. Create Sale Line Items & Deduct Stock
      for (const item of cart) {
        const lineTotal = item.product.price * item.quantity;

        // Insert sale_item
        const { error: itemErr } = await supabase.from("sale_items").insert([
          {
            sale_id: newSale.id,
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit_price: item.product.price,
            total_price: lineTotal,
          },
        ]);

        if (itemErr) throw itemErr;

        // Deduct inventory stock
        const newStock = item.product.stockQuantity - item.quantity;
        const { error: stockErr } = await supabase
          .from("products")
          .update({ stock_quantity: newStock })
          .eq("id", item.product.id);

        if (stockErr) throw stockErr;
      }

      // Complete checkout state
      setLastOrderTotal(cartTotal);
      setSuccessOrderNum(orderNumber);
      setCart([]);
      setCustomerName("");
      setSelectedCustomerId(null);
      setScannedProduct(null);
    } catch (err: any) {
      console.error("POS Checkout Error:", err);
      alert(`POS Checkout Failed: ${err.message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* Header Bar */}
      <header className="border-b border-[#1d2434] pb-6">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
          <ScanLine className="w-9 h-9 text-emerald-400 stroke-[2]" /> Scanner POS
        </h1>
        <p className="text-slate-400 text-sm mt-1.5 font-medium">
          Scan products to build cart, update customer inventory, and process transactions.
        </p>
      </header>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Scanner camera + search input (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Scanner view */}
          <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-extrabold text-white">Live Camera Scanner</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScannerCamera
                isActive={isScannerActive}
                onToggleActive={handleToggleScanner}
                onScanSuccess={handleScanSuccess}
              />
            </CardContent>
          </Card>

          {/* Manual Entry Lookup Form */}
          <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6">
            <form onSubmit={handleManualLookup} className="space-y-4">
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Manual Barcode / SKU Entry
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                    placeholder="Enter product SKU or barcode..."
                    className="bg-[#0a0d14] border-[#1d2434] rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 w-full focus:border-emerald-500"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 bg-[#111520] border border-[#1d2434] rounded-2xl overflow-y-auto max-h-[220px] z-50 shadow-2xl divide-y divide-[#1d2434]">
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onMouseDown={() => handleSelectSuggestion(s)}
                          className="w-full text-left px-4 py-3 hover:bg-[#1c2333] transition-colors flex items-center justify-between text-xs cursor-pointer border-0 outline-none"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-white">{s.name}</span>
                            <span className="font-mono text-slate-400 text-[10px] uppercase">
                              SKU: {s.sku} | Barcode: {s.barcode || "N/A"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-emerald-400">{formatCurrency(s.price)}</span>
                            <div className="text-[9px] text-slate-500 font-bold">Stock: {s.stockQuantity}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loadingProduct}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl px-5 h-10 flex items-center gap-2"
                >
                  {loadingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : "Look up"}
                </Button>
              </div>
            </form>
          </Card>

          {/* Product Scanned Feedback/Preview */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {scannedProduct && (
            <Card className="bg-[#111520] border-emerald-500/40 border shadow-2xl rounded-3xl p-6 animate-pulse">
              <div className="flex justify-between items-start">
                <div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase px-2 py-0.5 mb-2">
                    Scanned Product
                  </Badge>
                  <h3 className="text-lg font-black text-white">{scannedProduct.name}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="font-mono text-xs text-slate-400 font-bold uppercase">
                      SKU: {scannedProduct.sku}
                    </span>
                    <span className="text-slate-500 text-xs font-semibold">|</span>
                    <span className="text-xs text-slate-300 font-bold">
                      Category: {scannedProduct.categoryName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">{formatCurrency(scannedProduct.price)}</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-1">
                    Stock Available: {scannedProduct.stockQuantity}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#1d2434] pt-4 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Qty to add:</span>
                  <div className="flex items-center bg-[#0a0d14] border border-[#1d2434] p-1 rounded-xl">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScanQuantity(Math.max(1, scanQuantity - 1))}
                      className="h-7 w-7 p-0 text-slate-400 rounded-lg hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="text-xs font-black text-white w-6 text-center">{scanQuantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={scanQuantity >= scannedProduct.stockQuantity}
                      onClick={() => setScanQuantity(Math.min(scannedProduct.stockQuantity, scanQuantity + 1))}
                      className="h-7 w-7 p-0 text-slate-400 rounded-lg hover:text-white disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleAddPreviewToCart}
                  disabled={scannedProduct.stockQuantity === 0}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-10 px-5 flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25"
                >
                  <ShoppingCart className="w-4 h-4" /> Add to Cart
                </Button>
              </div>
            </Card>
          )}

          {/* Success Dialog */}
          {/* Success Dialog / Receipt */}
          {successOrderNum && (
            <Card className="bg-[#111520] border-emerald-500/30 border shadow-2xl rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <CheckCircle className="w-6 h-6 stroke-[2.5]" />
                <span className="text-base font-black">Sale Completed!</span>
              </div>
              
              {/* Receipt Ticket Shape */}
              <div className="bg-[#0a0d14] border border-[#1d2434] rounded-2xl p-5 font-mono text-xs text-slate-300 space-y-3 relative">
                {/* Decorative cutouts at top/bottom */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-[90%] border-t-2 border-dashed border-[#1d2434]" />
                
                <div className="text-center pb-2 border-b border-dashed border-[#1d2434]">
                  <h4 className="font-black text-white uppercase text-sm tracking-widest">ApparelSync POS</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Official Transaction Receipt</p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Order ID:</span>
                    <span className="text-white font-bold">#{successOrderNum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date:</span>
                    <span className="text-white">
                      {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment:</span>
                    <span className="text-emerald-400 font-bold">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="text-indigo-400 font-extrabold uppercase text-[10px] tracking-wider">Paid / Delivered</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-[#1d2434] flex justify-between items-center text-sm font-black text-white">
                  <span>TOTAL PAID</span>
                  <span className="text-emerald-400">{formatCurrency(lastOrderTotal)}</span>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <Button
                  onClick={() => setSuccessOrderNum(null)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-11 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/25 transition-all"
                >
                  Start New Sale
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* POS Cart Section (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6">
            <CardHeader className="p-0 pb-4 border-b border-[#1d2434] flex flex-row items-center justify-between">
              <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-400" /> Shopping Cart
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </Badge>
                {cart.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClearCart}
                    className="h-7 px-2.5 text-[10px] font-black text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash className="w-3.5 h-3.5" /> Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-6">
              <Cart
                items={cart}
                onUpdateQuantity={updateCartQuantity}
                onRemoveItem={removeCartItem}
              />
            </CardContent>
          </Card>

          {/* Checkout Info / Checkout Action */}
          {cart.length > 0 && (
            <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6">
              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Customer Profile Name
                  </label>
                  <CustomerPicker
                    value={customerName}
                    onChange={(name) => {
                      setCustomerName(name);
                      setSelectedCustomerId(null);
                    }}
                    onSelect={(id, name) => {
                      setSelectedCustomerId(id);
                      setCustomerName(name);
                    }}
                    onClear={() => setSelectedCustomerId(null)}
                    placeholder="e.g. Walk-in Customer (or search existing profile)"
                    inputClassName="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Payment Mode
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-[#1d2434] text-xs text-slate-300 h-10 rounded-xl px-3 outline-none focus:border-emerald-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Mobile Payment">Mobile Payment</option>
                  </select>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isCheckingOut}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-11 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing Sale...
                      </>
                    ) : (
                      "Complete POS Sale"
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
