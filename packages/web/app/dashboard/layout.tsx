import DashboardSidebar from "@/components/dashboard/sidebar";
import { CurrencyProvider } from "@/lib/currency-context";
import { CartProvider } from "@/lib/cart-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <CartProvider>
        <div className="min-h-screen bg-[#F8F9FB] font-sans">
          <DashboardSidebar />
          <div className="lg:ml-[260px] min-h-screen flex flex-col">
            {children}
          </div>
        </div>
      </CartProvider>
    </CurrencyProvider>
  );
}
