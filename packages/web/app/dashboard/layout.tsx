import DashboardSidebar from "@/components/dashboard/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans">
      <DashboardSidebar />
      <div className="lg:ml-[260px] min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
