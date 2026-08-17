"use client";

import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodeViewProps {
  value: string;
  format?: string;
  width?: number;
  height?: number;
  fontSize?: number;
  displayValue?: boolean;
  className?: string;
}

export default function BarcodeView({
  value,
  format = "CODE128",
  width = 2,
  height = 70,
  fontSize = 14,
  displayValue = true,
  className = "",
}: BarcodeViewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: format,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          font: "monospace",
          textAlign: "center",
          textPosition: "bottom",
          textMargin: 4,
          background: "#ffffff",
          lineColor: "#000000",
          margin: 10,
        });
      } catch (err) {
        console.error("JsBarcode generation error:", err);
      }
    }
  }, [value, format, width, height, fontSize, displayValue]);

  if (!value) return null;

  return (
    <div className={`flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 shadow-md ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
}
