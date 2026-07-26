"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Camera, Loader2, StopCircle, Zap, AlertCircle, RefreshCw } from "lucide-react";
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
  const [scanFlash, setScanFlash] = useState(false);
  const [lastScannedLabel, setLastScannedLabel] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerReady = useRef(false);
  const lockRef = useRef(false);
  const lastScannedRef = useRef<{ text: string; time: number } | null>(null);

  // Keep callback refs fresh without triggering effect re-runs
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);
  useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);
  useEffect(() => { onScanErrorRef.current = onScanError; }, [onScanError]);

  const elementId = "pos-qr-reader";

  // ── Stop camera (reusable) ──────────────────────────────────────────────────
  const stopCamera = useCallback(async () => {
    if (scannerRef.current && readerReady.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      readerReady.current = false;
    }
    scannerRef.current = null;
    lockRef.current = false;
  }, []);

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    lockRef.current = false;
    setCameraState("starting");
    setErrorMessage(null);

    // Create a fresh instance configured for 1D Barcodes + QR fallback
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(elementId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
        ],
        verbose: false,
      });
      readerReady.current = false;
    }

    if (!readerReady.current) {
      try {
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 12,
            qrbox: { width: 280, height: 160 }, // Rectangular viewport optimized for 1D linear barcodes
            disableFlip: true,
          },
          (decoded) => {
            if (lockRef.current) return;

            // Throttle: same code 3s, any code 1s
            const now = Date.now();
            const last = lastScannedRef.current;
            if (last) {
              if (last.text === decoded && now - last.time < 3000) return;
              if (now - last.time < 1000) return;
            }

            lockRef.current = true;
            lastScannedRef.current = { text: decoded, time: now };

            // Visual flash
            setScanFlash(true);
            setLastScannedLabel(decoded);
            setTimeout(() => setScanFlash(false), 400);

            // Pause scanning while we process, then unlock after a beat
            try { scannerRef.current?.pause(true); } catch {}

            onScanSuccessRef.current(decoded);

            // Resume after 1.5s to allow next scan
            setTimeout(() => {
              try { scannerRef.current?.resume(); } catch {}
              lockRef.current = false;
            }, 1500);
          },
          () => {} // silence per-frame "no barcode found"
        );
        readerReady.current = true;
        setCameraState("scanning");
      } catch (err: any) {
        console.error("Camera start failed:", err);
        setCameraState("error");
        setErrorMessage(
          err?.message?.includes("Permission")
            ? "Camera permission denied. Please allow access and try again."
            : `Camera failed: ${err?.message || String(err)}`
        );
      }
    } else {
      // Already started before — just resume
      try { scannerRef.current?.resume(); } catch {}
      lockRef.current = false;
      setCameraState("scanning");
    }
  }, []);

  // ── Lifecycle: start/stop based on isActive ─────────────────────────────────
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => startCamera(), 150);
      return () => clearTimeout(timer);
    } else {
      stopCamera();
      setCameraState("idle");
      setLastScannedLabel(null);
    }
  }, [isActive, startCamera, stopCamera]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────
  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const handleRetry = useCallback(() => {
    stopCamera().then(() => {
      setTimeout(() => startCamera(), 200);
    });
  }, [stopCamera, startCamera]);

  return (
    <div className="flex flex-col items-center justify-center bg-[#111520] border border-[#1d2434] rounded-3xl p-6 relative min-h-[350px]">
      {/* Scanner Viewport */}
      <div
        className={`w-full max-w-sm aspect-square overflow-hidden rounded-2xl border-2 ${
          scanFlash
            ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)]"
            : cameraState === "scanning"
              ? "border-emerald-500/50 border-dashed"
              : "border-slate-700/60 border-dashed"
        } bg-black relative flex items-center justify-center transition-all duration-200`}
      >
        {/* html5-qrcode mounts its own video/canvas here */}
        <div id={elementId} />

        {/* Overlays */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          {cameraState === "idle" && (
            <div className="flex flex-col items-center text-slate-500">
              <Camera className="w-14 h-14 mb-3 stroke-[1.5]" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Camera Offline</span>
            </div>
          )}

          {cameraState === "starting" && (
            <div className="flex flex-col items-center text-emerald-400">
              <Loader2 className="w-10 h-10 animate-spin mb-3" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Starting Barcode Scanner…</span>
            </div>
          )}

          {cameraState === "error" && (
            <div className="flex flex-col items-center text-rose-400 p-4 text-center max-w-[280px]">
              <AlertCircle className="w-10 h-10 mb-2 stroke-[1.5]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-1.5">
                Camera Error
              </span>
              <span className="text-[11px] text-rose-300/80 leading-relaxed">{errorMessage}</span>
              <button
                onClick={handleRetry}
                className="pointer-events-auto mt-3 flex items-center gap-1.5 text-[10px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-wider transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {/* Scanning overlay: rectangular 1D Barcode sweep frame */}
          {cameraState === "scanning" && (
            <>
              <div className="w-[82%] h-[48%] relative">
                <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-md" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-md" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-md" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-md" />
                <div
                  className="absolute left-[4px] right-[4px] h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                  style={{ animation: "scanner-laser 1.8s ease-in-out infinite" }}
                />
              </div>

              {scanFlash && (
                <div className="absolute inset-0 bg-emerald-400/15 rounded-2xl transition-opacity duration-200" />
              )}
            </>
          )}
        </div>

        {/* Last scanned indicator */}
        {lastScannedLabel && cameraState === "scanning" && (
          <div className="absolute bottom-2 left-2 right-2 z-20 pointer-events-none">
            <div className="bg-emerald-500/90 backdrop-blur-sm text-slate-950 text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 justify-center">
              <Zap className="w-3 h-3" />
              Last barcode: {lastScannedLabel}
            </div>
          </div>
        )}
      </div>

      {/* Start/Stop button */}
      <div className="mt-5 w-full flex justify-center">
        <Button
          onClick={onToggleActive}
          disabled={cameraState === "starting"}
          className={`font-black text-xs px-6 py-3.5 rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer ${
            isActive
              ? "bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
          }`}
        >
          {cameraState === "starting" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Starting…
            </>
          ) : isActive ? (
            <>
              <StopCircle className="w-4 h-4" /> Stop Scanner
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" /> Start Barcode Scanner
            </>
          )}
        </Button>
      </div>

      {/* Force html5-qrcode video to fill viewport & hide library UI controls */}
      <style dangerouslySetInnerHTML={{ __html: `
        #${elementId} {
          width: 100% !important;
          height: 100% !important;
          border: none !important;
        }
        #${elementId} video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        #${elementId} img,
        #${elementId} button,
        #${elementId} select,
        #${elementId} span {
          display: none !important;
        }
        @keyframes scanner-laser {
          0%, 100% { top: 4px; opacity: 0.5; }
          50% { top: calc(100% - 6px); opacity: 1; }
        }
      `}} />
    </div>
  );
}
