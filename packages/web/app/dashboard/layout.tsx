import DashboardShell from "@/components/dashboard/dashboard-shell";
import { CurrencyProvider } from "@/lib/currency-context";
import { CartProvider } from "@/lib/cart-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <CartProvider>
        <DashboardShell>{children}</DashboardShell>
      </CartProvider>
    </CurrencyProvider>
  );
}
