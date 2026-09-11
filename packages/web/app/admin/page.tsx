import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken, getAdminCookieName } from "@/lib/admin-auth";
import AdminLoginForm from "./login-form";

// Auth is checked per request so a still-valid admin session skips the form.
export const dynamic = "force-dynamic";

export default async function AdminEntryPage() {
  // If the admin already has a valid (non-expired) token, don't make them type
  // credentials again — send them straight to the dashboard. The token lasts
  // 7 days, so day-to-day visits to /admin land on the dashboard directly.
  const store = await cookies();
  const token = store.get(getAdminCookieName())?.value;
  if (token && verifyAdminToken(token)) {
    redirect("/admin/dashboard");
  }

  return <AdminLoginForm />;
}
