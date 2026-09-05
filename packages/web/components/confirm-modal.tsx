"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Styled confirmation dialog to replace the browser's native window.confirm().
 * Used for destructive admin actions (delete customer, delete chat, etc.).
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && onCancel()} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <button
          onClick={() => !loading && onCancel()}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-[#1A1D20]" />
        </button>

        <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-4 ${danger ? "bg-red-50" : "bg-[#FFF4F0]"}`}>
          <AlertTriangle className={`w-5 h-5 ${danger ? "text-red-500" : "text-[#FF561E]"}`} />
        </div>

        <h3 className="text-[17px] font-bold text-[#1A1D20] mb-1.5 pr-6">{title}</h3>
        {message && <p className="text-[13.5px] text-[#6B7280] leading-relaxed">{message}</p>}

        <div className="flex items-center gap-2.5 mt-6">
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-[14px] font-bold text-white transition-colors disabled:opacity-70 ${
              danger ? "bg-red-500 hover:bg-red-600" : "bg-[#FF561E] hover:bg-[#E04B18]"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
          <button
            onClick={() => !loading && onCancel()}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-[14px] font-semibold text-[#6B7280] hover:bg-gray-50 transition-colors disabled:opacity-70"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
