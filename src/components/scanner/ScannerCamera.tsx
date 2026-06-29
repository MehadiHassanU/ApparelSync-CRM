"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Loader2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerCameraProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isActive: boolean;
  onToggleActive: () => void;
}

export default function ScannerCamera({
  onScanSuccess,
  onScanError,
  isActive,
  onToggleActive,
}: ScannerCameraProps) {
  const [cameraState, setCameraState] = useState<"idle" | "starting" | "scanning" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "pos-qr-reader";

  useEffect(() => {
    if (!isActive) {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          setCameraState("idle");
        }).catch((err) => {
          console.error("Error stopping scanner:", err);
        });
      }
      return;
    }

    setCameraState("starting");
    setErrorMessage(null);

    // Initialize scanner
    const html5Qrcode = new Html5Qrcode(elementId);
    scannerRef.current = html5Qrcode;

    const startScanner = async () => {
      try {
        // Start scanning using back camera or any available camera
        await html5Qrcode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            },
          },
          (decodedText) => {
            // Success callback
            onScanSuccess(decodedText);
          },
          (errorMessage) => {
            // verbose scan error, don't alerts user to avoid noise
            if (onScanError) onScanError(errorMessage);
          }
        );
        setCameraState("scanning");
      } catch (err: any) {
        console.error("Failed to start camera scanner:", err);
        setCameraState("error");
        setErrorMessage(err.message || "Failed to access camera. Check permissions.");
        onToggleActive(); // Stop request
      }
    };

    // Small delay to make sure DOM element is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (html5Qrcode.isScanning) {
        html5Qrcode.stop().catch((e) => console.error("Cleanup stop error:", e));
      }
    };
  }, [isActive, onScanSuccess, onScanError, onToggleActive]);

  return (
    <div className="flex flex-col items-center justify-center bg-[#111520] border border-[#1d2434] rounded-3xl p-6 relative min-h-[350px]">
      {/* Scanner Element Target */}
      <div
        id={elementId}
        className={`w-full max-w-sm aspect-square overflow-hidden rounded-2xl border-2 border-dashed ${
          cameraState === "scanning" ? "border-emerald-500" : "border-slate-700/60"
        } bg-[#0a0d14] flex items-center justify-center relative`}
      >
        {cameraState === "idle" && (
          <div className="flex flex-col items-center text-slate-500">
            <Camera className="w-16 h-16 mb-3 stroke-[1.5]" />
            <span className="text-xs font-bold uppercase tracking-wider">Camera Offline</span>
          </div>
        )}

        {cameraState === "starting" && (
          <div className="flex flex-col items-center text-emerald-400">
            <Loader2 className="w-12 h-12 animate-spin mb-3" />
            <span className="text-xs font-bold uppercase tracking-wider">Initializing Camera...</span>
          </div>
        )}

        {cameraState === "error" && (
          <div className="flex flex-col items-center text-rose-400 p-4 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">Camera Error</span>
            <span className="text-xs font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Success Scan Overlay Flasher */}
        {cameraState === "scanning" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[70%] h-[70%] border-2 border-emerald-400/40 rounded-xl relative">
              {/* Corner Indicators */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-sm" />
              {/* Laser line animation */}
              <div className="w-full h-0.5 bg-emerald-400/80 absolute top-0 left-0 animate-bounce shadow-md shadow-emerald-400/50" style={{ animationDuration: "2.5s" }} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 w-full flex justify-center">
        <Button
          onClick={onToggleActive}
          className={`font-black text-xs px-6 py-3.5 rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer ${
            isActive
              ? "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
          }`}
        >
          {isActive ? (
            <>
              <StopCircle className="w-4 h-4" /> Stop Scanner
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" /> Start Scanner
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
