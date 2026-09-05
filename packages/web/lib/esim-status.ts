/**
 * Maps MontyeSIM's `profile_status` (the eSIM lifecycle) to a friendly label
 * and badge styling. Live values seen: "Enabled", plus "Disabled", "Released",
 * "Deleted", "Downloaded". Matched case-insensitively.
 */
export interface EsimStatusTone {
  label: string;
  className: string;
  dot: string;
}

export function esimStatusTone(status?: string | null): EsimStatusTone | null {
  if (!status) return null;
  const s = status.toLowerCase();

  if (s.includes("enable") || s.includes("active")) {
    return { label: status, className: "bg-emerald-50 text-emerald-600 border-emerald-100", dot: "bg-emerald-500" };
  }
  if (s.includes("download") || s.includes("install")) {
    return { label: status, className: "bg-blue-50 text-blue-600 border-blue-100", dot: "bg-blue-500" };
  }
  if (s.includes("release")) {
    return { label: status, className: "bg-amber-50 text-amber-600 border-amber-100", dot: "bg-amber-500" };
  }
  if (s.includes("disable")) {
    return { label: status, className: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" };
  }
  if (s.includes("delete") || s.includes("terminat")) {
    return { label: status, className: "bg-red-50 text-red-500 border-red-100", dot: "bg-red-500" };
  }
  return { label: status, className: "bg-gray-100 text-[#6B7280] border-gray-200", dot: "bg-gray-400" };
}
