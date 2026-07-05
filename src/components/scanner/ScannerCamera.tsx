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
  const lastScannedRef = useRef<{ text: string, time: number } | null>(null);
  const elementId = "pos-qr-reader";

  useEffect(() => {
    if (!isActive) {
      setCameraState("idle");
      return;
    }

    setCameraState("starting");
    setErrorMessage(null);

    let isMounted = true;
    let currentScanner: Html5Qrcode | null = null;

    const startScanner = async () => {
      // First attempt: Request 640x480 resolution (highly responsive & low CPU lag)
      const idealConstraints = {
        facingMode: "environment",
        width: { ideal: 640 },
        height: { ideal: 480 }
      };

      const scanConfig = {
        fps: 25, // 25 frames per second for ultra responsiveness
        qrbox: (width: number, height: number) => {
          const min = Math.min(width, height);
          const size = min > 0 ? Math.floor(min * 0.75) : 250;
          return { width: size, height: size };
        },
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        }
      };

      // Throttled scan processor to avoid database lookup floods
      const handleDecodedText = (decodedText: string) => {
        const now = Date.now();
        const last = lastScannedRef.current;

        // 1. Same item scan throttle (2.5 seconds)
        if (last && last.text === decodedText && now - last.time < 2500) {
          return;
        }

        // 2. Global scan throttle (1.2 seconds between any scans)
        if (last && now - last.time < 1200) {
          return;
        }

        lastScannedRef.current = { text: decodedText, time: now };
        console.log("QR Decoded successfully (throttled):", decodedText);
        onScanSuccess(decodedText);
      };

      try {
        currentScanner = new Html5Qrcode(elementId);
        scannerRef.current = currentScanner;

        await currentScanner.start(
          idealConstraints,
          scanConfig,
          handleDecodedText,
          (errorMessage) => {
            if (onScanError) onScanError(errorMessage);
          }
        );

        if (!isMounted) {
          console.log("Component unmounted while scanner was starting (attempt 1), shutting down stream...");
          currentScanner.stop().catch(() => {});
          return;
        }

        if (isMounted) {
          setCameraState("scanning");
        }
      } catch (err: any) {
        console.warn("Failed to start with ideal constraints, retrying with environment fallback...", err);

        // Second attempt: Fallback to basic environment facingMode
        try {
          currentScanner = new Html5Qrcode(elementId);
          scannerRef.current = currentScanner;

          await currentScanner.start(
            { facingMode: "environment" },
            scanConfig,
            handleDecodedText,
            (errorMessage) => {
              if (onScanError) onScanError(errorMessage);
            }
          );

          if (!isMounted) {
            console.log("Component unmounted while scanner was starting (attempt 2), shutting down stream...");
            currentScanner.stop().catch(() => {});
            return;
          }

          if (isMounted) {
            setCameraState("scanning");
          }
        } catch (fallbackErr: any) {
          console.warn("Failed to start with environment fallback, retrying with user (front) webcam...", fallbackErr);

          // Third attempt: Fallback to user facingMode (front webcam for laptops)
          try {
            currentScanner = new Html5Qrcode(elementId);
            scannerRef.current = currentScanner;

            await currentScanner.start(
              { facingMode: "user" },
              scanConfig,
              handleDecodedText,
              (errorMessage) => {
                if (onScanError) onScanError(errorMessage);
              }
            );

            if (!isMounted) {
              console.log("Component unmounted while scanner was starting (attempt 3), shutting down stream...");
              currentScanner.stop().catch(() => {});
              return;
            }

            if (isMounted) {
              setCameraState("scanning");
            }
          } catch (userCamErr: any) {
            console.error("Camera startup failed completely:", userCamErr);
            if (isMounted) {
              setCameraState("error");
              const detailedError = userCamErr instanceof Error
                ? `${userCamErr.name}: ${userCamErr.message}`
                : typeof userCamErr === "string"
                  ? userCamErr
                  : String(userCamErr);
              setErrorMessage(detailedError || "Failed to access camera.");
            }
          }
        }
      }
    };

    // Small delay to make sure DOM element is ready
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);

      // 1. Standard instance stop
      if (scannerRef.current) {
        const scannerInstance = scannerRef.current;
        if (scannerInstance.isScanning) {
          scannerInstance.stop().catch((e) => console.error("Cleanup stop error:", e));
        } else {
          try {
            scannerInstance.clear();
          } catch (e) {}
        }
      }

      // 2. Forced Hardware Release: Stop camera stream tracks directly from the video element
      try {
        const videoEl = document.querySelector(`#${elementId} video`) as HTMLVideoElement | null;
        if (videoEl && videoEl.srcObject) {
          const stream = videoEl.srcObject as MediaStream;
          stream.getTracks().forEach((track) => {
            track.stop();
            console.log("Forced stopped webcam track:", track.label);
          });
        }
      } catch (err) {
        console.warn("Failed to force stop camera tracks:", err);
      }
    };
  }, [isActive, onScanSuccess, onScanError, onToggleActive]);

  return (
    <div className="flex flex-col items-center justify-center bg-[#111520] border border-[#1d2434] rounded-3xl p-6 relative min-h-[350px]">
      {/* Scanner Wrapper Container */}
      <div
        className={`w-full max-w-sm aspect-square overflow-hidden rounded-2xl border-2 border-dashed ${
          cameraState === "scanning" ? "border-emerald-500" : "border-slate-700/60"
        } bg-[#0a0d14] relative flex items-center justify-center`}
      >
        {/* PURE EMPTY DIV for html5-qrcode. React never renders any children inside this to avoid DOM reconciliation conflicts. */}
        <div
          id={elementId}
          className="w-full h-full [&_video]:object-contain [&_video]:w-full [&_video]:h-full"
        />

        {/* REACT OVERLAYS (Offline, Loading, Success, Laser line). Layered on top. */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
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

          {cameraState === "scanning" && (
            <div className="w-[70%] h-[70%] border-2 border-emerald-400/40 rounded-xl relative flex items-center justify-center">
              {/* Corner Indicators */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-sm" />
              {/* Laser line animation */}
              <div className="w-full h-0.5 bg-emerald-400/80 absolute top-0 left-0 animate-bounce shadow-md shadow-emerald-400/50" style={{ animationDuration: "2.5s" }} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 w-full flex justify-center">
        <Button
          onClick={onToggleActive}
          disabled={cameraState === "starting"}
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
