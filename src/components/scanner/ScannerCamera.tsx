"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
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
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [scanFlash, setScanFlash] = useState(false);
  const [lastScannedLabel, setLastScannedLabel] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ text: string; time: number } | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);
  const elementId = "pos-qr-reader";

  // Keep callback refs fresh without triggering effect re-runs.
  // This is THE critical fix — the previous code had onScanSuccess in the
  // dependency array, which caused the entire camera to restart every time
  // the parent re-rendered (e.g. when cart state changed).
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    onScanErrorRef.current = onScanError;
  }, [onScanError]);

  // Step 1: List cameras when scanner is activated
  useEffect(() => {
    if (!isActive) {
      setDevices([]);
      setSelectedCameraId("");
      setCameraState("idle");
      setErrorMessage(null);
      setLastScannedLabel(null);
      return;
    }

    let cancelled = false;
    setCameraState("starting");
    setErrorMessage(null);

    Html5Qrcode.getCameras()
      .then((cams) => {
        if (cancelled) return;
        if (!cams || cams.length === 0) {
          setCameraState("error");
          setErrorMessage("No camera found. Please connect a camera and try again.");
          return;
        }
        setDevices(cams);
        // Prefer back/rear camera on mobile, otherwise first camera
        const back = cams.find((c) => /back|rear|environment/i.test(c.label));
        setSelectedCameraId(back ? back.id : cams[0].id);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("getCameras failed:", err);
        setCameraState("error");
        setErrorMessage(
          "Camera permission denied. Please allow camera access in your browser settings and reload."
        );
      });

    return () => {
      cancelled = true;
    };
  }, [isActive]);

  // Step 2: Start/stop scanner when selectedCameraId changes
  useEffect(() => {
    if (!isActive || !selectedCameraId) return;

    let cancelled = false;
    let scanner: Html5Qrcode | null = null;

    setCameraState("starting");
    setErrorMessage(null);

    const boot = async () => {
      // Ensure the DOM container exists and is empty
      const container = document.getElementById(elementId);
      if (!container) {
        console.error("Scanner container element not found");
        if (!cancelled) {
          setCameraState("error");
          setErrorMessage("Scanner container not found in page.");
        }
        return;
      }

      // Clean any leftover DOM from previous scanner instances
      container.innerHTML = "";

      try {
        scanner = new Html5Qrcode(elementId, /* verbose= */ false);
        scannerRef.current = scanner;

        const handleDecode = (decodedText: string) => {
          const now = Date.now();
          const last = lastScannedRef.current;

          // Throttle: same code within 3s, or any code within 1s
          if (last) {
            if (last.text === decodedText && now - last.time < 3000) return;
            if (now - last.time < 1000) return;
          }

          lastScannedRef.current = { text: decodedText, time: now };

          // Visual flash feedback
          setScanFlash(true);
          setLastScannedLabel(decodedText);
          setTimeout(() => setScanFlash(false), 400);

          // Fire callback via ref (won't cause re-mount)
          onScanSuccessRef.current(decodedText);
        };

        await scanner.start(
          selectedCameraId,
          {
            fps: 10,
            qrbox: (vw: number, vh: number) => {
              // Use 70% of the smaller video dimension, capped at 300px
              const side = Math.min(Math.floor(Math.min(vw, vh) * 0.7), 300);
              return { width: side, height: side };
            },
            disableFlip: false,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          },
          handleDecode,
          () => {}  // Silence per-frame "no QR found" noise
        );

        if (cancelled) {
          // Component unmounted during async start — tear down immediately
          await scanner.stop().catch(() => {});
          return;
        }

        setCameraState("scanning");
      } catch (err: any) {
        console.error("Scanner start failed:", err);
        if (!cancelled) {
          setCameraState("error");
          setErrorMessage(
            err?.message?.includes("Permission")
              ? "Camera permission was denied. Please allow access and try again."
              : `Camera failed to start: ${err?.message || String(err)}`
          );
        }
      }
    };

    // Brief delay for React to flush the empty container div to the DOM
    const timer = setTimeout(boot, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);

      const inst = scannerRef.current;
      scannerRef.current = null;

      if (inst) {
        // Graceful stop
        const safeStop = async () => {
          try {
            const state = inst.getState();
            if (
              state === Html5QrcodeScannerState.SCANNING ||
              state === Html5QrcodeScannerState.PAUSED
            ) {
              await inst.stop();
            }
          } catch (e) {
            // Swallow — might already be stopped
          }
          try {
            inst.clear();
          } catch (e) {}
        };
        safeStop();
      }

      // Belt-and-suspenders: force-kill any lingering MediaStream tracks
      // so the camera LED actually turns off
      try {
        const video = document.querySelector(`#${elementId} video`) as HTMLVideoElement | null;
        if (video?.srcObject) {
          (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
          video.srcObject = null;
        }
      } catch {}

      // Clear the container to prevent stale DOM from confusing the next instance
      const container = document.getElementById(elementId);
      if (container) container.innerHTML = "";
    };
  }, [isActive, selectedCameraId]); // Intentionally excludes callback props — we use refs

  const handleRetry = useCallback(() => {
    // Force a fresh camera cycle by toggling off then on
    setSelectedCameraId("");
    setCameraState("starting");
    setTimeout(() => {
      if (devices.length > 0) {
        setSelectedCameraId(devices[0].id);
      }
    }, 300);
  }, [devices]);

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
        } bg-[#0a0d14] relative flex items-center justify-center transition-all duration-200`}
      >
        {/* html5-qrcode target — must stay empty, no React children */}
        <div
          id={elementId}
          className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
        />

        {/* Overlays (pointer-events-none so they never interfere with video) */}
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
              <span className="text-[11px] font-bold uppercase tracking-wider">Starting Camera…</span>
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

          {/* Scanning overlay: corner brackets + laser */}
          {cameraState === "scanning" && (
            <>
              <div className="w-[72%] h-[72%] relative">
                {/* Corners */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-md" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-md" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-md" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-md" />

                {/* Sweeping laser line */}
                <div
                  className="absolute left-[3px] right-[3px] h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                  style={{
                    animation: "scanner-laser 2s ease-in-out infinite",
                  }}
                />
              </div>

              {/* Scan flash overlay */}
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
              Last scan: {lastScannedLabel}
            </div>
          </div>
        )}
      </div>

      {/* Camera selector — only show if multiple cameras */}
      {isActive && devices.length > 1 && (
        <div className="mt-4 w-full max-w-xs mx-auto">
          <label className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider text-center">
            Camera Source
          </label>
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="w-full bg-[#0a0d14] border border-[#1d2434] text-xs text-slate-300 h-10 rounded-xl px-3 outline-none focus:border-emerald-500 cursor-pointer"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label || `Camera ${d.id.slice(0, 8)}…`}
              </option>
            ))}
          </select>
        </div>
      )}

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
              <Camera className="w-4 h-4" /> Start Scanner
            </>
          )}
        </Button>
      </div>

      {/* Laser keyframe animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanner-laser {
          0%, 100% { top: 3px; opacity: 0.6; }
          50% { top: calc(100% - 5px); opacity: 1; }
        }
      `}} />
    </div>
  );
}
