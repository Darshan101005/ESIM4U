/**
 * Data-usage unit helpers shared across the customer and admin views.
 *
 * MontyeSIM reports consumption as floats in `data_unit` (normally "MB").
 * We keep MB as the internal base and let the UI switch between MB and GB.
 * Formatting keeps enough precision that small usage (e.g. 1 MB on a 1 GB
 * plan) is never rounded away to "0 GB" — which matters for support.
 */

export type DataUnit = "MB" | "GB";

/** Normalise a MontyeSIM value to MB based on its reported unit (default MB). */
export function toMb(value?: number | null, unit?: string | null): number {
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  switch ((unit || "MB").toUpperCase()) {
    case "GB":
      return v * 1024;
    case "KB":
      return v / 1024;
    case "B":
    case "BYTE":
    case "BYTES":
      return v / (1024 * 1024);
    default:
      return v; // already MB
  }
}

/** Round to `dp` decimals and drop trailing zeros ("1.50" -> "1.5"). */
function trim(n: number, dp: number): string {
  return String(parseFloat(n.toFixed(dp)));
}

/**
 * Format a value given in MB into the chosen display unit.
 * - MB: up to 2 decimals (so 0.5 MB, 1 MB, 512 MB all show exactly).
 * - GB: 2 decimals at/above 1 GB, otherwise 3 decimals so tiny non-zero
 *   usage still shows (1 MB -> "0.001 GB" rather than "0 GB").
 */
export function formatData(mb: number, unit: DataUnit): string {
  const v = Number.isFinite(mb) && mb > 0 ? mb : 0;
  if (unit === "GB") {
    const gb = v / 1024;
    return `${trim(gb, gb >= 1 ? 2 : 3)} GB`;
  }
  return `${trim(v, 2)} MB`;
}
