import Link from "next/link";
import {
  Shirt,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Zap,
  Boxes,
  ScanLine,
  FileText,
  Users,
  Sparkles,
  Lock,
  UserPlus,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* Background Decorator Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0a0d14]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Shirt className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white">ApparelSync</span>
              <span className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase">CRM Suite</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#preview" className="hover:text-emerald-400 transition-colors">Overview</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 z-10">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-8 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Apparel Operating System</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.15] max-w-5xl mx-auto">
            Smart CRM & Inventory Control for Modern{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Apparel Brands
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
            Unify real-time inventory tracking, live camera barcode scanning, customer analytics, and automated PDF invoicing in one powerful dark-themed workspace.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-base hover:shadow-xl hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2.5 group"
            >
              <span>Access Dashboard Now</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-base transition-all flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Create Account
            </Link>
          </div>

          {/* Interactive Preview Dashboard Teaser */}
          <div id="preview" className="mt-16 relative mx-auto max-w-6xl rounded-3xl border border-slate-800/80 bg-[#111520]/90 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs font-mono text-slate-500">apparelsync-crm.dashboard.internal</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Live Overview Preview
              </span>
            </div>

            {/* Dashboard Mock Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-[#161b26] border border-slate-800/80">
                <div className="text-xs font-medium text-slate-400">Total Monthly Revenue</div>
                <div className="text-2xl font-bold text-white mt-1">৳148,920</div>
                <div className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> +18.4% vs last month
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#161b26] border border-slate-800/80">
                <div className="text-xs font-medium text-slate-400">Active SKUs</div>
                <div className="text-2xl font-bold text-white mt-1">2,480 Units</div>
                <div className="text-xs text-teal-400 font-medium mt-1">Optimal Stock Levels</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#161b26] border border-slate-800/80">
                <div className="text-xs font-medium text-slate-400">Orders Fulfilled</div>
                <div className="text-2xl font-bold text-white mt-1">1,124 Orders</div>
                <div className="text-xs text-emerald-400 font-medium mt-1">99.4% Delivery Success</div>
              </div>
              <div className="p-4 rounded-2xl bg-[#161b26] border border-slate-800/80">
                <div className="text-xs font-medium text-slate-400">Barcode Scans Today</div>
                <div className="text-2xl font-bold text-white mt-1">342 Scans</div>
                <div className="text-xs text-emerald-400 font-medium mt-1">Instant Camera Lookup</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="py-20 bg-[#0c101a] border-y border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-xs font-bold text-emerald-400 tracking-widest uppercase mb-3">Complete CRM Suite</h2>
              <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Everything you need to scale garment manufacturing & retail
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 rounded-3xl bg-[#111520] border border-slate-800 hover:border-emerald-500/40 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Boxes className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Smart Inventory Management</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Track stock levels by size, color variant, fabric batch, and warehouse location with automated low-stock warnings.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-3xl bg-[#111520] border border-slate-800 hover:border-emerald-500/40 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                  <ScanLine className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Live Barcode & QR Scanner</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Use built-in camera scanning or hardware barcode readers to process incoming shipments and order picking in real time.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-3xl bg-[#111520] border border-slate-800 hover:border-emerald-500/40 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Advanced Financial Reports</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Gain granular insights into profit margins, inventory valuation, top-selling apparel categories, and monthly revenue.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-8 rounded-3xl bg-[#111520] border border-slate-800 hover:border-emerald-500/40 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Customer Lifecycle CRM</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Manage B2B wholesale buyers and retail customers with custom pricing tiers, order histories, and loyalty scores.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-8 rounded-3xl bg-[#111520] border border-slate-800 hover:border-emerald-500/40 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Instant PDF Invoicing</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Generate professional tax-ready invoices, export packing slips, and email receipts straight from your dashboard.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-8 rounded-3xl bg-[#111520] border border-slate-800 hover:border-emerald-500/40 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Role-Based Access</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Secure admin controls with granular permissions for warehouse operators, sales agents, and financial managers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call To Action Banner */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="p-10 md:p-16 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-[#111520] to-teal-950/60 border border-emerald-500/30 relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready to Streamline Your Apparel Operations?
              </h3>
              <p className="mt-4 text-slate-300 text-base">
                Log in now or register an account to explore all ApparelSync features instantly.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2"
              >
                <span>Log In Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#080a0f] py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <Shirt className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="font-bold text-slate-300 text-sm">ApparelSync CRM</span>
            <span>&copy; {new Date().getFullYear()} ApparelSync. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium text-slate-400">
            <Link href="/login" className="hover:text-emerald-400 transition-colors">Log In</Link>
            <Link href="/register" className="hover:text-emerald-400 transition-colors">Register</Link>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              Demo System Online
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
