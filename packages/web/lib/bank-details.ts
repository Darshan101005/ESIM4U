import { SupportedCurrency } from "@/lib/fx";

/**
 * Beneficiary bank details shown to customers paying by direct bank transfer.
 * Pure constants (no server imports) so this is safe to use in client
 * components too. SWIFT/BIC for Monzo is MONZGB2L (verify with the client).
 * IBAN must be copied from the client's Monzo app (Account details ->
 * International) — left blank until supplied; the row stays hidden while empty.
 */
export interface BankDetails {
  accountName: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  sortCode: string;
  swift: string;
  iban: string;
}

/**
 * Default beneficiary bank details. These seed the editable settings row in the
 * database (admins can change them from the Verify Payments page). SWIFT/BIC for
 * Monzo is MONZGB2L. IBAN comes from the client's Monzo app (International).
 */
export const DEFAULT_BANK_DETAILS: BankDetails = {
  accountName: "ESIM4U",
  bankName: "MONZO BANK LIMITED",
  accountHolder: "INAYAT TRADERS LIMITED",
  accountNumber: "36913516",
  sortCode: "04-00-03",
  swift: "MONZGB2L",
  iban: "", // filled from Monzo app for international senders
};

/** Non-editable presentation constants. */
export const BANK_LOGO = "/assets/monzo_bank.png";
/** Currency the beneficiary account settles in — customers are asked to pay this. */
export const BANK_PAY_CURRENCY: SupportedCurrency = "GBP";

/** Back-compat combined object used where the full set is convenient. */
export const BANK_DETAILS = {
  ...DEFAULT_BANK_DETAILS,
  logo: BANK_LOGO,
  payCurrency: BANK_PAY_CURRENCY,
};
