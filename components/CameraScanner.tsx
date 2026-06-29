"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface CameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const FORMATS_TO_SUPPORT = [
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.QR_CODE,
];

export default function CameraScanner({ onScanSuccess, onClose }: CameraScannerProps) {
  const [error, setError] = useState<string>("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const readerId = useRef(`reader-${Math.random().toString(36).substring(7)}`);
  const hasScanned = useRef(false);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let isMounted = true;
    let html5QrCode: Html5Qrcode | null = null;
    const startPromiseRef: { current: Promise<any> | null } = { current: null };

    const initScanner = async () => {
      try {
        setError("");
        html5QrCode = new Html5Qrcode(readerId.current, {
          verbose: false,
          formatsToSupport: FORMATS_TO_SUPPORT,
        });
        html5QrcodeRef.current = html5QrCode;

        const scanConfig = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => ({
            width: Math.floor(viewfinderWidth * 0.85),
            height: Math.floor(viewfinderHeight * 0.35),
          }),
          aspectRatio: 16 / 9,
          disableFlip: false,
          videoConstraints: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            advanced: [{ focusMode: "continuous" }] as any,
          }
        };

        startPromiseRef.current = html5QrCode.start(
          { facingMode: "environment" },
          scanConfig,
          (decodedText: string) => {
            if (hasScanned.current) return;
            hasScanned.current = true;

            html5QrCode?.stop()
              .catch(() => {})
              .finally(() => {
                if (isMounted) {
                  onScanSuccess(decodedText.trim());
                }
              });
          },
          () => {} // ignore scan failures
        );

        await startPromiseRef.current;

        // Probe for torch support
        if (isMounted) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities() as any;
            if (capabilities?.torch) {
              setTorchSupported(true);
            }
            stream.getTracks().forEach((t) => t.stop());
          } catch (probeErr) {
            // Ignore probe errors
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Camera start error:", err);
          setError("Could not access camera. Please allow camera permissions in your browser.");
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      const cleanup = async () => {
        if (startPromiseRef.current) {
          try {
            await startPromiseRef.current;
            await html5QrCode?.stop();
            html5QrCode?.clear();
          } catch {
            // DOM cleanup errors from html5-qrcode during React strict-mode double-mount are safe to ignore
          }
        }
      };
      cleanup();
    };
  }, [onScanSuccess]);

  const toggleTorch = async () => {
    const newVal = !torchOn;
    try {
      await html5QrcodeRef.current?.applyVideoConstraints({
        advanced: [{ torch: newVal }] as any,
      });
      setTorchOn(newVal);
    } catch {
      // Torch not supported at constraint level; silently ignore
    }
  };

  const retryInit = () => {
    hasScanned.current = false;
    setError("");
    // The effect doesn't automatically re-run on retryInit without a dependency change, 
    // but unmounting and remounting is easier, or we can just trigger a state change. 
    // To make it simple, we can just call onClose and let user reopen it, or we can 
    // refactor initScanner. For simplicity, just onClose.
    onClose();
  };

  return (
    <>
      <style>{`
        @keyframes scanline {
          0%   { top: 10%; }
          50%  { top: 85%; }
          100% { top: 10%; }
        }

        .scan-line {
          position: absolute;
          left: 7.5%;
          width: 85%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #22c55e, #4ade80, #22c55e, transparent);
          box-shadow: 0 0 6px 1px #22c55e88;
          border-radius: 2px;
          animation: scanline 2s ease-in-out infinite;
          pointer-events: none;
        }
      `}</style>
      <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-base font-semibold text-gray-800">Scan Barcode / IMEI</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl font-bold leading-none">
              ×
            </button>
          </div>

          {/* Viewport or Error */}
          <div className="p-4 bg-gray-900 flex flex-col gap-3">
            {error ? (
              <div className="text-center p-6 bg-red-900/50 rounded-xl border border-red-500/50">
                <p className="text-red-200 text-sm mb-4">{error}</p>
                <button
                  onClick={retryInit}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg"
                >
                  Close & Try Again
                </button>
              </div>
            ) : (
              <div className="relative w-full bg-black rounded-xl overflow-hidden border border-gray-700 min-h-[240px]">
                <div id={readerId.current} className="w-full" />
                <div className="scan-line" />
              </div>
            )}

            {/* Torch toggle — only if supported */}
            {torchSupported && !error && (
              <button
                onClick={toggleTorch}
                className="self-center text-sm text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full flex items-center gap-2 transition"
              >
                {torchOn ? "🔦 Torch On" : "💡 Torch Off"}
              </button>
            )}

            {/* Hint text */}
            {!error && (
              <p className="text-center text-xs text-gray-400">
                Aim at the IMEI barcode printed on the phone box or back of device.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
