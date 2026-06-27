import React from "react";
import { kpiMetrics, orderList, OrderStatus } from "../../lib/mockData";

export default function Dashboard() {
  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "awaiting":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "on way":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Overview of your apparel CRM revenue, orders, and sales performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Live Metrics
            </span>
          </div>
        </div>

        {/* KPI Cards Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Revenue Card */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</p>
            <h2 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{kpiMetrics.totalRevenue.formattedValue}</h2>
            <div className="flex items-center gap-2 mt-4 text-xs font-medium">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${kpiMetrics.totalRevenue.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {kpiMetrics.totalRevenue.isPositive ? '↑' : '↓'} {Math.abs(kpiMetrics.totalRevenue.percentageChange)}%
              </span>
              <span className="text-slate-500">vs last month</span>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Orders</p>
            <h2 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{kpiMetrics.totalOrders.formattedValue}</h2>
            <div className="flex items-center gap-2 mt-4 text-xs font-medium">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${kpiMetrics.totalOrders.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {kpiMetrics.totalOrders.isPositive ? '↑' : '↓'} {Math.abs(kpiMetrics.totalOrders.percentageChange)}%
              </span>
              <span className="text-slate-500">vs last month</span>
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-16 h-16 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Profit</p>
            <h2 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{kpiMetrics.netProfit.formattedValue}</h2>
            <div className="flex items-center gap-2 mt-4 text-xs font-medium">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${kpiMetrics.netProfit.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {kpiMetrics.netProfit.isPositive ? '↑' : '↓'} {Math.abs(kpiMetrics.netProfit.percentageChange)}%
              </span>
              <span className="text-slate-500">vs last month</span>
            </div>
          </div>
        </div>

        {/* Data Table Bottom Section */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Recent Orders</h3>
            <span className="text-xs text-slate-400 font-medium">Showing {orderList.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Order Number</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Customer Name</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Category</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Price</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Date</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Payment Method</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60" data-testid="order-table-body">
                {orderList.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-indigo-400">{order.orderNumber}</td>
                    <td className="px-6 py-4 font-medium text-white">{order.customerName}</td>
                    <td className="px-6 py-4 text-slate-300">{order.category}</td>
                    <td className="px-6 py-4 font-semibold text-white">{order.formattedPrice}</td>
                    <td className="px-6 py-4 text-slate-400">{order.date}</td>
                    <td className="px-6 py-4 text-slate-300">{order.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
