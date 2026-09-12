import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TwoFactorForm from "./two-factor-form";
import { verifyPending2faToken, getAdmin2faCookieName } from "@/lib/admin-auth";

// The pending cookie is checked per request; without it there's nothing to verify.
export const dynamic = "force-dynamic";

export default async function Admin2faPage() {
  const store = await cookies();
  const token = store.get(getAdmin2faCookieName())?.value;
  if (!token || !verifyPending2faToken(token)) {
    // No valid pending login step — send them back to sign in.
    redirect("/admin");
  }
  return <TwoFactorForm />;
}
