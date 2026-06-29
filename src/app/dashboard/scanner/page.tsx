"use client";

import React, { useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Product, CartItem, QRPayload } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import ScannerCamera from "@/components/scanner/ScannerCamera";
import Cart from "@/components/scanner/Cart";

export default function ScannerPOSPage() {
  // ─── States ────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [scanQuantity, setScanQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Checkout states
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [successOrderNum, setSuccessOrderNum] = useState<string | null>(null);

  // ─── Search / Lookup Product ───────────────────────────────────────────────
  const lookupProduct = useCallback(async (value: string, isFromQR = false) => {
    setLoadingProduct(true);
    setErrorMsg(null);
    setScannedProduct(null);
    setScanQuantity(1);

    try {
      let queryVal = value.trim();
      let queryId: string | null = null;
      let querySku: string | null = null;

      if (isFromQR) {
        try {
          // Parse QR JSON payload
          const parsed = JSON.parse(value) as QRPayload;
          if (parsed.type === "product" && parsed.id) {
            queryId = parsed.id;
          } else {
            throw new Error("Invalid QR format");
          }
        } catch {
          // If it fails to parse as JSON, fallback to treating the QR value as manual barcode/sku
          querySku = queryVal;
        }
      } else {
        querySku = queryVal;
      }

      let query = supabase.from("products").select(`
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
      `);

      if (queryId) {
        query = query.eq("id", queryId);
      } else {
        query = query.or(`sku.eq."${querySku}",barcode.eq."${querySku}"`);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error("No product found matching this code.");
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

  // ─── Scan success handler ──────────────────────────────────────────────────
  const handleScanSuccess = (decodedText: string) => {
    // Briefly stop scanner or keep running, play sound/feedback if desired
    lookupProduct(decodedText, true);
  };

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
      // 1. Find or create customer
      let customerId = null;
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
      setSuccessOrderNum(orderNumber);
      setCart([]);
      setCustomerName("");
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
                onToggleActive={() => setIsScannerActive(!isScannerActive)}
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
                    placeholder="Enter product SKU or barcode..."
                    className="bg-[#0a0d14] border-[#1d2434] rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 w-full focus:border-emerald-500"
                  />
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
                  <div className="text-2xl font-black text-emerald-400">${scannedProduct.price.toFixed(2)}</div>
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
          {successOrderNum && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-black">Transaction Completed Successfully!</span>
              </div>
              <p className="font-semibold text-slate-400 mt-1">
                Order <span className="font-mono text-emerald-400">#{successOrderNum}</span> has been processed. Product quantities are automatically deducted from the database.
              </p>
            </div>
          )}
        </div>

        {/* POS Cart Section (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-[#111520] border-[#1d2434] shadow-xl rounded-3xl p-6">
            <CardHeader className="p-0 pb-4 border-b border-[#1d2434] flex flex-row items-center justify-between">
              <CardTitle className="text-base font-extrabold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-400" /> Shopping Cart
              </CardTitle>
              <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-black px-2 py-0.5 rounded-full">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </Badge>
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
                  <Input
                    placeholder="e.g. Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
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
