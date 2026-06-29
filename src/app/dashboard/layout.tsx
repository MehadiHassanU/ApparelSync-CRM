import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 font-sans flex w-full overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      <Sidebar />
      <main className="flex-1 pl-20 transition-all duration-300 w-full min-w-0">
        <div className="w-full max-w-[1800px] mx-auto p-6 md:p-10 space-y-10">
          {children}
        </div>
      </main>
    </div>
  );
}
