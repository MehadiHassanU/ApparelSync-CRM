"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CustomerSuggestion {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
}

export interface CustomerPickerProps {
  /** Controlled text value — the typed/selected customer name */
  value: string;
  /** Called on every keystroke; parent should update its name state and reset selectedId to null */
  onChange: (name: string) => void;
  /** Called when the user clicks a suggestion; parent stores the id */
  onSelect: (id: string, name: string) => void;
  /** Called on blur when no suggestion has been selected (lets parent clear its stored id) */
  onClear: () => void;
  /** Forwarded to the underlying <Input> — must match whatever the tests expect */
  placeholder?: string;
  /** Extra Tailwind classes applied to the <Input> element */
  inputClassName?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CustomerPicker({
  value,
  onChange,
  onSelect,
  onClear,
  placeholder = "Search customer name or phone...",
  inputClassName = "",
}: CustomerPickerProps) {
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  // Track whether the current value came from a confirmed selection so we
  // know whether to call onClear on blur.
  const isSelectedRef = useRef(false);

  // ─── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const { data } = await supabase
          .from("customers")
          .select("id, full_name, phone, email")
          .or(
            `full_name.ilike.%${value.trim()}%,phone.ilike.%${value.trim()}%`
          )
          .limit(5);

        if (data) setSuggestions(data as CustomerSuggestion[]);
      } catch (e) {
        console.error("CustomerPicker suggestion error:", e);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [value]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isSelectedRef.current = false;
    onChange(e.target.value);
  };

  const handleSelect = (suggestion: CustomerSuggestion) => {
    isSelectedRef.current = true;
    setSuggestions([]);
    onSelect(suggestion.id, suggestion.full_name);
  };

  const handleBlur = () => {
    // Delay so onMouseDown on a suggestion fires before the blur closes the list
    setTimeout(() => {
      setSuggestions([]);
      if (!isSelectedRef.current) {
        onClear();
      }
    }, 200);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={inputClassName}
        autoComplete="off"
      />

      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-[#111520] border border-[#1d2434] rounded-2xl overflow-y-auto max-h-[180px] z-50 shadow-2xl divide-y divide-[#1d2434]">
          {suggestions.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => handleSelect(c)}
              className="w-full text-left px-4 py-2.5 hover:bg-[#1c2333] transition-colors flex items-center justify-between text-xs cursor-pointer border-0 outline-none"
            >
              <span className="font-bold text-white">{c.full_name}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {c.phone || c.email || "Registered Profile"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
