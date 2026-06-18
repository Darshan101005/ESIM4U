"use client";

import { useState } from "react";
import { Copy, Check, Smartphone } from "lucide-react";

interface QrDisplayProps {
  qrCodeUrl?: string | null;
  activationCode?: string | null;
  smdpAddress?: string | null;
  matchingId?: string | null;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] text-[#6B7280] font-medium">{label}</p>
        <p className="text-[13px] font-semibold text-[#1A1D20] truncate">{value}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-[#FFF4F0] transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-[#6B7280]" />}
      </button>
    </div>
  );
}

export default function QrDisplay({ qrCodeUrl, activationCode, smdpAddress, matchingId }: QrDisplayProps) {
  if (!qrCodeUrl && !activationCode) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-center">
        <p className="text-[14px] text-amber-700 font-medium">
          eSIM activation details are being prepared. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-6">
        {qrCodeUrl ? (
          <img src={qrCodeUrl} alt="eSIM QR Code" className="w-56 h-56" />
        ) : (
          <div className="w-56 h-56 flex items-center justify-center bg-gray-50 rounded-xl">
            <Smartphone className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <p className="mt-4 text-[12px] text-[#6B7280] text-center max-w-[240px]">
          Scan this QR code from your phone camera or eSIM settings to install.
        </p>
      </div>

      <div className="space-y-3">
        {activationCode && <CopyField label="Activation Code (LPA)" value={activationCode} />}
        {smdpAddress && <CopyField label="SM-DP+ Address" value={smdpAddress} />}
        {matchingId && <CopyField label="Activation / Matching ID" value={matchingId} />}

        <div className="rounded-xl bg-[#FFF4F0] border border-orange-100 p-4">
          <p className="text-[12px] font-semibold text-[#1A1D20] mb-2">Manual installation</p>
          <ol className="text-[12px] text-[#6B7280] space-y-1 list-decimal list-inside">
            <li>Open Settings, then Cellular or Mobile Data</li>
            <li>Tap Add eSIM or Add Data Plan</li>
            <li>Choose Enter Details Manually</li>
            <li>Paste the SM-DP+ Address and Activation ID</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
