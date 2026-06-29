"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Product, Category } from "@/lib/types";
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
  DialogFooter,
  DialogTrigger,
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
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Layers,
  Barcode,
  QrCode,
  Printer,
  Package,
  ArrowUpDown,
  MoreHorizontal,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function InventoryPage() {
  // ─── States ────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"name" | "stock-low" | "price-desc">("name");

  // Dialog open states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isCatOpen, setIsCatOpen] = useState(false);

  // Current selected items for edit/view
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form states for Add/Edit Product
  const [prodName, setProdName] = useState("");
  const [prodSku, setProdSku] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodBarcode, setProdBarcode] = useState("");

  // Category Form State
  const [newCatName, setNewCatName] = useState("");
  const [catSubmitting, setCatSubmitting] = useState(false);

  // ─── Fetch Data ────────────────────────────────────────────────────────────
  const fetchInventoryData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

      if (catError) throw catError;
      setCategories(catData || []);

      // Fetch Products with category join
      const { data: prodData, error: prodError } = await supabase
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
        .order("created_at", { ascending: false });

      if (prodError) throw prodError;

      if (prodData) {
        const mappedProducts: Product[] = prodData.map((item: any) => ({
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
        setProducts(mappedProducts);
      }
    } catch (err: any) {
      console.error("Inventory Fetch Error:", err);
      setErrorMsg(err.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventoryData();
  }, [fetchInventoryData]);

  // ─── Helper: Generate SKU ──────────────────────────────────────────────────
  const generateSku = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    setProdSku(`AP-${random}`);
  };

  // ─── CRUD: Add Product ──────────────────────────────────────────────────────
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodSku || !prodPrice || !prodStock) return;

    setIsSubmitting(true);
    try {
      const priceNum = parseFloat(prodPrice);
      const stockNum = parseInt(prodStock, 10);

      // Insert product
      const { data: newProd, error: insertErr } = await supabase
        .from("products")
        .insert([
          {
            name: prodName.trim(),
            sku: prodSku.trim(),
            price: priceNum,
            stock_quantity: stockNum,
            category_id: prodCategoryId ? prodCategoryId : null,
            barcode: prodBarcode.trim() || null,
          },
        ])
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      if (newProd) {
        // Auto-generate QR data string containing type, id, sku
        const qrPayload = JSON.stringify({
          type: "product",
          id: newProd.id,
          sku: prodSku.trim(),
        });

        // Update product with QR data
        const { error: updateErr } = await supabase
          .from("products")
          .update({ qr_data: qrPayload })
          .eq("id", newProd.id);

        if (updateErr) throw updateErr;
      }

      // Reset Form & Close
      setProdName("");
      setProdSku("");
      setProdPrice("");
      setProdStock("");
      setProdCategoryId("");
      setProdBarcode("");
      setIsAddOpen(false);

      await fetchInventoryData();
    } catch (err: any) {
      console.error("Add Product Error:", err);
      alert(`Error adding product: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── CRUD: Edit Product ─────────────────────────────────────────────────────
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setProdName(product.name);
    setProdSku(product.sku);
    setProdPrice(product.price.toString());
    setProdStock(product.stockQuantity.toString());
    setProdCategoryId(product.categoryId || "");
    setProdBarcode(product.barcode || "");
    setIsEditOpen(true);
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !prodName || !prodSku || !prodPrice || !prodStock) return;

    setIsSubmitting(true);
    try {
      const priceNum = parseFloat(prodPrice);
      const stockNum = parseInt(prodStock, 10);
      const qrPayload = JSON.stringify({
        type: "product",
        id: selectedProduct.id,
        sku: prodSku.trim(),
      });

      const { error: updateErr } = await supabase
        .from("products")
        .update({
          name: prodName.trim(),
          sku: prodSku.trim(),
          price: priceNum,
          stock_quantity: stockNum,
          category_id: prodCategoryId ? prodCategoryId : null,
          barcode: prodBarcode.trim() || null,
          qr_data: qrPayload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedProduct.id);

      if (updateErr) throw updateErr;

      setIsEditOpen(false);
      setSelectedProduct(null);
      await fetchInventoryData();
    } catch (err: any) {
      console.error("Edit Product Error:", err);
      alert(`Error updating product: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── CRUD: Delete Product ──────────────────────────────────────────────────
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error("Delete Product Error:", err);
      alert(`Failed to delete product: ${err.message}`);
    }
  };

  // ─── CRUD: Category Operations ──────────────────────────────────────────────
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCatSubmitting(true);
    try {
      const { error } = await supabase
        .from("categories")
        .insert([{ name: newCatName.trim() }]);

      if (error) throw error;

      setNewCatName("");
      // Refetch
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      setCategories(data || []);
    } catch (err: any) {
      console.error("Add Category Error:", err);
      alert(`Error creating category: ${err.message}`);
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? Products in this category will become Uncategorized.")) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      setCategories(categories.filter((c) => c.id !== id));
      await fetchInventoryData(); // Refresh products to show Uncategorized
    } catch (err: any) {
      console.error("Delete Category Error:", err);
      alert(`Failed to delete category: ${err.message}`);
    }
  };

  // ─── QR Code Modal ─────────────────────────────────────────────────────────
  const openQrModal = (product: Product) => {
    setSelectedProduct(product);
    setIsQrOpen(true);
  };

  const printQrCode = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const qrSvgElement = document.getElementById("qr-code-svg-element");
    if (!qrSvgElement) return;

    const svgHtml = qrSvgElement.outerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${selectedProduct?.name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              font-family: sans-serif;
              margin: 0;
            }
            .container {
              text-align: center;
              border: 1px solid #ccc;
              padding: 20px;
              border-radius: 10px;
            }
            h2 { margin: 10px 0 5px 0; }
            p { margin: 0; color: #666; font-family: monospace; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="container">
            ${svgHtml}
            <h2>${selectedProduct?.name}</h2>
            <p>SKU: ${selectedProduct?.sku}</p>
            <p>Price: $${selectedProduct?.price.toFixed(2)}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ─── Filtering & Sorting Logic ──────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        const matchesSearch =
          prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (prod.barcode && prod.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategoryFilter
          ? prod.categoryId === selectedCategoryFilter
          : true;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortOrder === "stock-low") return a.stockQuantity - b.stockQuantity;
        if (sortOrder === "price-desc") return b.price - a.price;
        return a.name.localeCompare(b.name);
      });
  }, [products, searchQuery, selectedCategoryFilter, sortOrder]);

  const kpis = useMemo(() => {
    const totalCount = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
    const lowStockCount = products.filter((p) => p.stockQuantity <= 5).length;
    const categoriesCount = categories.length;

    return { totalCount, totalStock, lowStockCount, categoriesCount };
  }, [products, categories]);

  return (
    <>
      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#1d2434] pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Product Inventory</h1>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">Manage store items, monitor stock levels, and generate QR barcodes.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchInventoryData()}
            disabled={loading}
            className="p-2.5 rounded-full bg-[#111520] border border-[#1d2434] text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Stock List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>

          <Dialog open={isCatOpen} onOpenChange={setIsCatOpen}>
            <DialogTrigger render={
              <Button variant="outline" className="bg-[#111520] border-slate-700/60 text-slate-200 hover:bg-[#1c2335] text-xs font-bold gap-2 rounded-2xl h-11 px-5" />
            }>
              <Layers className="w-4 h-4 text-emerald-400" /> Categories
            </DialogTrigger>
            <DialogContent className="bg-[#111520] border-[#1d2434] text-white rounded-3xl p-6 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-extrabold text-white">Manage Categories</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCategory} className="flex gap-2 pt-3">
                <Input
                  required
                  placeholder="New Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                />
                <Button type="submit" disabled={catSubmitting} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-10 px-4">
                  {catSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </Button>
              </form>
              <div className="max-h-60 overflow-y-auto mt-4 space-y-2 pr-1">
                {categories.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-4 font-bold">No categories exist.</p>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-2 rounded-xl bg-[#0a0d14] border border-[#1d2434]">
                      <span className="text-xs font-bold text-slate-300">{cat.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger render={
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-2xl h-11 px-5 flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all" />
            }>
              <Plus className="w-4 h-4 stroke-[3]" /> Add product
            </DialogTrigger>
            <DialogContent className="bg-[#111520] border-[#1d2434] text-white rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-extrabold text-white">Create New Product</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Product Name</label>
                    <Input
                      required
                      placeholder="e.g. Slim Fit Denim Shirt"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">SKU</label>
                    <div className="flex gap-1.5">
                      <Input
                        required
                        placeholder="AP-100492"
                        value={prodSku}
                        onChange={(e) => setProdSku(e.target.value)}
                        className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                      />
                      <Button
                        type="button"
                        onClick={generateSku}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] rounded-xl h-10 px-2 shrink-0"
                      >
                        Auto
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Category</label>
                    <select
                      value={prodCategoryId}
                      onChange={(e) => setProdCategoryId(e.target.value)}
                      className="w-full bg-[#0a0d14] border border-[#1d2434] text-xs text-slate-300 h-10 rounded-xl px-3 outline-none focus:border-emerald-500"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Price ($)</label>
                    <Input
                      required
                      type="number"
                      step="0.01"
                      placeholder="29.99"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Initial Stock</label>
                    <Input
                      required
                      type="number"
                      placeholder="100"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">Manual Barcode (Optional)</label>
                    <Input
                      placeholder="UPC / EAN string"
                      value={prodBarcode}
                      onChange={(e) => setProdBarcode(e.target.value)}
                      className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="border-[#1d2434] text-slate-300 text-xs font-bold rounded-xl h-10">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-10 flex items-center gap-2">
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Product
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center justify-between">
          <span>Error loading inventory: {errorMsg}</span>
          <Button onClick={() => fetchInventoryData()} size="sm" variant="outline" className="text-xs h-8 border-rose-500/40 text-rose-300">
            Retry Connection
          </Button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-[#111520] border-[#1d2434] text-white shadow-xl rounded-3xl p-5 hover:border-emerald-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Items</span>
            <Package className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-3xl font-black">{loading ? "-" : kpis.totalCount}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Unique product records</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111520] border-[#1d2434] text-white shadow-xl rounded-3xl p-5 hover:border-emerald-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Stock</span>
            <Barcode className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-3xl font-black">{loading ? "-" : kpis.totalStock}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Sum of physical quantities</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111520] border-[#1d2434] text-white shadow-xl rounded-3xl p-5 hover:border-emerald-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-3xl font-black text-amber-400">{loading ? "-" : kpis.lowStockCount}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Items with quantity &le; 5</p>
          </CardContent>
        </Card>

        <Card className="bg-[#111520] border-[#1d2434] text-white shadow-xl rounded-3xl p-5 hover:border-emerald-500/40 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Categories</span>
            <Layers className="w-4 h-4 text-teal-400" />
          </CardHeader>
          <CardContent className="p-0 pt-3">
            <div className="text-3xl font-black">{loading ? "-" : kpis.categoriesCount}</div>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Filter categories configured</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Stock Table Card */}
      <Card className="bg-[#111520] border-[#1d2434] shadow-xl p-6 rounded-3xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, SKU, barcode..."
                className="bg-[#0a0d14] border-[#1d2434] rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 w-52 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={selectedCategoryFilter || ""}
                onChange={(e) => setSelectedCategoryFilter(e.target.value || null)}
                className="bg-[#0a0d14] border border-[#1d2434] text-xs text-slate-300 h-9 rounded-xl px-3 outline-none focus:border-emerald-500 cursor-pointer font-bold"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {(selectedCategoryFilter || searchQuery) && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategoryFilter(null);
                  }}
                  className="text-xs text-emerald-400 hover:underline pl-1 font-extrabold cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="bg-[#171d2b] border border-slate-700/60 text-slate-200 hover:bg-[#202839] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer h-9">
                <ArrowUpDown className="w-4 h-4 text-indigo-400" /> Sort: {sortOrder === "name" ? "Name" : sortOrder === "stock-low" ? "Low Stock First" : "Price (High-Low)"}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#171d2b] border-[#293448] text-slate-200 font-semibold">
                <DropdownMenuItem onClick={() => setSortOrder("name")} className="hover:bg-slate-800 text-xs cursor-pointer">Name</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("stock-low")} className="hover:bg-slate-800 text-xs cursor-pointer">Low Stock First</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("price-desc")} className="hover:bg-slate-800 text-xs cursor-pointer">Price (High to Low)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto mt-6 rounded-2xl border border-[#1d2434]">
          <Table>
            <TableHeader className="bg-[#0d1017] border-b border-[#1d2434]">
              <TableRow className="hover:bg-transparent border-[#1d2434]">
                <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">Product</TableHead>
                <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">SKU</TableHead>
                <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">Category</TableHead>
                <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">Price</TableHead>
                <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">Stock Qty</TableHead>
                <TableHead className="px-5 py-4 text-xs uppercase tracking-wider text-slate-400 font-bold">Barcode</TableHead>
                <TableHead className="w-12 px-5 py-4 text-right text-xs uppercase tracking-wider text-slate-400 font-bold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#171d2b]">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400 text-xs font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> Loading product records...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((prod) => {
                  const isLowStock = prod.stockQuantity <= 5;
                  return (
                    <TableRow key={prod.id} className={`border-[#171d2b] transition-colors ${isLowStock ? "bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-[#171d2b]"}`}>
                      <TableCell className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{prod.name}</div>
                      </TableCell>
                      <TableCell className="px-5 py-4 font-mono text-xs font-extrabold text-emerald-400">{prod.sku}</TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 text-slate-300 border-slate-700/60">
                          {prod.categoryName}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 font-black text-white text-sm">${prod.price.toFixed(2)}</TableCell>
                      <TableCell className="px-5 py-4">
                        <span className={`text-sm font-black ${isLowStock ? "text-amber-400" : "text-white"}`}>
                          {prod.stockQuantity}
                        </span>
                        {isLowStock && (
                          <Badge className="ml-2 bg-amber-500/20 text-amber-400 border-amber-500/40 text-[9px] font-black uppercase px-1.5 py-0">
                            Low
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 font-mono text-xs text-slate-400">{prod.barcode || "N/A"}</TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                            <MoreHorizontal className="w-5 h-5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#171d2b] border-[#293448] text-slate-200 font-bold">
                            <DropdownMenuItem onClick={() => openEditModal(prod)} className="hover:bg-slate-800 text-xs cursor-pointer gap-2.5 py-2">
                              <Edit className="w-4 h-4 text-blue-400" /> Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openQrModal(prod)} className="hover:bg-slate-800 text-xs cursor-pointer gap-2.5 py-2">
                              <QrCode className="w-4 h-4 text-emerald-400" /> View QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteProduct(prod.id)} className="hover:bg-slate-800 text-xs text-rose-400 cursor-pointer gap-2.5 py-2">
                              <Trash2 className="w-4 h-4" /> Delete Product
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400 text-xs font-bold">
                    No matching products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Product Modal */}
      {selectedProduct && isEditOpen && (
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-[#111520] border-[#1d2434] text-white rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-white">Edit Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditProduct} className="space-y-4 pt-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Product Name</label>
                  <Input
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">SKU</label>
                  <Input
                    required
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Category</label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-[#1d2434] text-xs text-slate-300 h-10 rounded-xl px-3 outline-none focus:border-emerald-500"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Price ($)</label>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Stock Quantity</label>
                  <Input
                    required
                    type="number"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">Manual Barcode (Optional)</label>
                  <Input
                    value={prodBarcode}
                    onChange={(e) => setProdBarcode(e.target.value)}
                    className="bg-[#0a0d14] border-[#1d2434] text-xs text-white h-10 rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="border-[#1d2434] text-slate-300 text-xs font-bold rounded-xl h-10">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-10 flex items-center gap-2">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* QR Code Modal */}
      {selectedProduct && isQrOpen && (
        <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
          <DialogContent className="bg-[#111520] border-[#1d2434] text-white rounded-3xl p-6 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-white text-center">Product QR Badge</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl mt-4">
              <QRCodeSVG
                id="qr-code-svg-element"
                value={selectedProduct.qrData || JSON.stringify({ type: "product", id: selectedProduct.id, sku: selectedProduct.sku })}
                size={200}
                level="H"
              />
            </div>
            <div className="text-center mt-4">
              <h3 className="font-extrabold text-base text-white">{selectedProduct.name}</h3>
              <p className="font-mono text-xs text-emerald-400 mt-1">SKU: {selectedProduct.sku}</p>
              <p className="font-black text-sm text-slate-300 mt-0.5">Price: ${selectedProduct.price.toFixed(2)}</p>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={printQrCode} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl h-10 w-full flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print QR Badge
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
