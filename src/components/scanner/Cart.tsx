"use client";

import React from "react";
import { CartItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: string, newQty: number) => void;
  onRemoveItem: (productId: string) => void;
}

export default function Cart({ items, onUpdateQuantity, onRemoveItem }: CartProps) {
  const calculateItemTotal = (item: CartItem) => {
    return item.product.price * item.quantity;
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 bg-[#0a0d14] rounded-2xl border border-[#1d2434] min-h-[300px]">
        <ShoppingCart className="w-12 h-12 mb-3 text-slate-600 stroke-[1.5]" />
        <p className="text-xs font-extrabold uppercase tracking-wider">Your cart is empty</p>
        <p className="text-[11px] text-slate-600 mt-1">Scan items or type SKU to add them</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scrollable list of items */}
      <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1.5">
        {items.map((item) => {
          const product = item.product;
          const isAtLimit = item.quantity >= product.stockQuantity;

          return (
            <div
              key={product.id}
              className="flex items-center justify-between p-3.5 bg-[#0a0d14] border border-[#1d2434] hover:border-slate-800 rounded-2xl transition-all"
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="font-extrabold text-white text-sm truncate">{product.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[10px] text-emerald-400 font-extrabold uppercase">
                    {product.sku}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    ${product.price.toFixed(2)} each
                  </span>
                </div>
              </div>

              {/* Quantity Adjuster */}
              <div className="flex items-center gap-1.5 bg-[#111520] border border-[#1d2434] p-1 rounded-xl shrink-0 mr-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateQuantity(product.id, item.quantity - 1)}
                  className="h-7 w-7 p-0 hover:bg-slate-850 hover:text-white rounded-lg text-slate-400"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-xs font-black text-white w-5 text-center">
                  {item.quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isAtLimit}
                  onClick={() => onUpdateQuantity(product.id, item.quantity + 1)}
                  className="h-7 w-7 p-0 hover:bg-slate-850 hover:text-white rounded-lg text-slate-400 disabled:opacity-30"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {/* Item Line Price & Delete */}
              <div className="flex items-center gap-3.5 shrink-0">
                <div className="text-right">
                  <div className="font-black text-white text-sm">
                    ${calculateItemTotal(item).toFixed(2)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(product.id)}
                  className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Summary Totals */}
      <div className="pt-4 border-t border-[#1d2434] space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-400">
          <span>Subtotal</span>
          <span className="text-slate-200">${calculateGrandTotal().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs font-bold text-slate-400 pb-2">
          <span>Tax (0.00%)</span>
          <span className="text-slate-200">$0.00</span>
        </div>
        <div className="flex justify-between items-center pt-2.5 border-t border-dashed border-[#1d2434]">
          <span className="text-sm font-black text-white">Grand Total</span>
          <span className="text-lg font-black text-emerald-400">
            ${calculateGrandTotal().toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
