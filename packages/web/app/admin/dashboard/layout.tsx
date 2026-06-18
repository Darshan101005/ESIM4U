import AdminSidebar from "@/components/admin/admin-sidebar";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AdminSidebar />
      <div className="lg:pl-[260px] flex flex-col min-h-screen">{children}</div>
    </div>
  );
}
