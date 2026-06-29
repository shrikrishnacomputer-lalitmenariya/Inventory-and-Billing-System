"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendType, setTrendType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [statsRes, notifRes] = await Promise.all([
        fetch("/api/v1/dashboard/stats"),
        fetch("/api/v1/dashboard/notifications")
      ]);

      if (!statsRes.ok || !notifRes.ok) {
        throw new Error("Failed to load dashboard metrics");
      }

      const statsData = await statsRes.json();
      const notifData = await notifRes.json();

      setStats(statsData);
      setNotifications(notifData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while loading dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  // Safe chart rendering check
  const renderChart = (chartNode: React.ReactNode) => {
    if (!mounted) return <div className="h-64 flex items-center justify-center text-gray-400">Loading chart...</div>;
    return chartNode;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium">Loading Shree Krishna Computer stats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-4 text-center">
        <h3 className="text-lg font-bold text-red-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Define curated colors for Recharts
  const COLORS = ["#4f46e5", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

  // Prepare trend data
  const trendData = stats?.trends?.[trendType] || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Quick Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Shree Krishna Computer</h2>
          <p className="text-sm text-gray-500 mt-1">
            Real-time business inventory status and billing sales overview.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold py-2 px-3 border border-gray-200 rounded-lg text-sm transition"
          >
            🔄 Refresh
          </button>
          <Link
            href="/billing"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition shadow-sm"
          >
            ➕ New Invoice
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Total Products */}
        <div className="relative group overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-100">
          <div className="absolute top-0 left-0 h-1 w-full bg-blue-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Products</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{stats?.totalProducts}</h3>
            </div>
            <span className="p-2 bg-blue-55 rounded-lg text-blue-600 text-lg">📦</span>
          </div>
          <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <span>Active SKU catalog items</span>
          </p>
        </div>

        {/* Total Stock Units */}
        <div className="relative group overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-emerald-100">
          <div className="absolute top-0 left-0 h-1 w-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Stock Units</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{stats?.totalStockUnits}</h3>
            </div>
            <span className="p-2 bg-emerald-55 rounded-lg text-emerald-600 text-lg">📊</span>
          </div>
          <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <span>Total units currently in warehouse</span>
          </p>
        </div>

        {/* Total Categories */}
        <div className="relative group overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-purple-100">
          <div className="absolute top-0 left-0 h-1 w-full bg-purple-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Categories</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-2">{stats?.totalCategories}</h3>
            </div>
            <span className="p-2 bg-purple-55 rounded-lg text-purple-600 text-lg">🏷️</span>
          </div>
          <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <span>Distinct product groupings</span>
          </p>
        </div>

        {/* Today's Sales */}
        <div className="relative group overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-100">
          <div className="absolute top-0 left-0 h-1 w-full bg-indigo-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today's Sales</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-2">₹{stats?.todaySales?.toFixed(2)}</h3>
            </div>
            <span className="p-2 bg-indigo-55 rounded-lg text-indigo-600 text-lg">💰</span>
          </div>
          <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <span className="text-green-600 font-semibold">📈 Current Day</span>
            <span>revenue generated</span>
          </p>
        </div>

        {/* Monthly Sales */}
        <div className="relative group overflow-hidden bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-cyan-100">
          <div className="absolute top-0 left-0 h-1 w-full bg-cyan-500"></div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Monthly Sales</p>
              <h3 className="text-3xl font-extrabold text-gray-800 mt-2">₹{stats?.monthlySales?.toFixed(2)}</h3>
            </div>
            <span className="p-2 bg-cyan-55 rounded-lg text-cyan-600 text-lg">📅</span>
          </div>
          <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <span>Cumulative calendar month total</span>
          </p>
        </div>
      </div>

      {/* Main Charts & Notifications Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Trend Chart (Col span 2) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Sales Analytics Trend</h3>
              <p className="text-xs text-gray-400">Track earnings growth over different periods</p>
            </div>
            
            {/* Trend Filter Toggles */}
            <div className="flex border border-gray-200 rounded-lg p-0.5 bg-gray-50">
              {(["daily", "weekly", "monthly"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTrendType(type)}
                  className={`py-1.5 px-3 rounded-md text-xs font-bold capitalize transition ${
                    trendType === type
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            {renderChart(
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Sales"]} 
                  />
                  <Area type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Low Stock Alerts Notification Widget */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between max-h-[400px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Inventory Alerts</h3>
              <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">
                {notifications.length} Alerts
              </span>
            </div>
            
            {/* Scrollable list */}
            <div className="overflow-y-auto space-y-3 pr-1 max-h-[280px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-center">
                  <span className="text-3xl mb-2">✅</span>
                  <span className="text-sm font-semibold">All products in healthy stock</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border flex flex-col gap-1 transition hover:shadow-sm ${
                      notif.severity === "critical"
                        ? "bg-rose-50/50 border-rose-200"
                        : notif.severity === "danger"
                        ? "bg-amber-50/50 border-amber-200"
                        : "bg-yellow-50/20 border-yellow-200"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-sm truncate max-w-[150px]">{notif.name}</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                          notif.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : notif.severity === "danger"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {notif.severity === "critical" ? "OUT OF STOCK" : "LOW STOCK"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>Brand: {notif.brand || "Generic"}</span>
                      <span>Stock: <strong className={notif.severity === "critical" ? "text-red-600" : "text-amber-600"}>{notif.quantity}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="border-t pt-3 mt-3 flex justify-between items-center text-xs">
            <span className="text-gray-400">Sorted by critical severity</span>
            <Link href="/inventory" className="text-blue-600 hover:underline font-bold">
              Manage Stock &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* Categories & Fast/Slow Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Category distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Stock by Category</h3>
          <p className="text-xs text-gray-400 mb-6 font-medium">Visual distribution of inventory categories</p>
          
          <div className="h-64">
            {renderChart(
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.categoryStock || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6", borderRadius: "8px" }}
                    formatter={(value) => [value, "Stock units"]}
                  />
                  <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                    {(stats?.categoryStock || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Fast-Moving Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">🚀 Fast-Moving Products</h3>
            <p className="text-xs text-gray-400 mb-6">Top selling items by quantities sold</p>
            
            <div className="space-y-4">
              {stats?.movement?.fastMoving?.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">No sales recorded yet.</div>
              ) : (
                stats?.movement?.fastMoving?.map((item: any, idx: number) => (
                  <div key={item.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-800 text-sm truncate max-w-[180px]">{item.name}</span>
                    </div>
                    <span className="bg-green-55 text-green-700 text-xs font-extrabold px-2.5 py-1 rounded-full">
                      {item.quantity} sold
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Slow-Moving Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">⏳ Slow-Moving Items</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium">In-stock items with minimal sales</p>
            
            <div className="space-y-4">
              {stats?.movement?.slowMoving?.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">No slow moving items detected.</div>
              ) : (
                stats?.movement?.slowMoving?.map((item: any, idx: number) => (
                  <div key={item.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-purple-55 text-purple-600 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-800 text-sm truncate max-w-[180px]">{item.name}</span>
                    </div>
                    <span className="bg-amber-55 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {item.quantity} sold
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Quick Action Navigation Grid */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Management Utilities</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Link
            href="/billing"
            className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-lg hover:bg-blue-50/50 hover:border-blue-200 transition text-center text-decoration-none"
          >
            <span className="text-2xl mb-2">🧾</span>
            <span className="text-xs font-bold text-gray-700">Record Sale</span>
          </Link>
          <Link
            href="/inventory"
            className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-lg hover:bg-emerald-50/50 hover:border-emerald-200 transition text-center text-decoration-none"
          >
            <span className="text-2xl mb-2">📦</span>
            <span className="text-xs font-bold text-gray-700">Add Product</span>
          </Link>
          <Link
            href="/inventory"
            className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-lg hover:bg-purple-50/50 hover:border-purple-200 transition text-center text-decoration-none"
          >
            <span className="text-2xl mb-2">🏷️</span>
            <span className="text-xs font-bold text-gray-700">Add Category</span>
          </Link>
          <Link
            href="/inventory"
            className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-lg hover:bg-cyan-50/50 hover:border-cyan-200 transition text-center text-decoration-none"
          >
            <span className="text-2xl mb-2">🔄</span>
            <span className="text-xs font-bold text-gray-700">Update Stock</span>
          </Link>
          <Link
            href="/analytics"
            className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-lg hover:bg-amber-50/50 hover:border-amber-200 transition text-center text-decoration-none"
          >
            <span className="text-2xl mb-2">📊</span>
            <span className="text-xs font-bold text-gray-700">Generate Report</span>
          </Link>
        </div>
      </div>

    </div>
  );
}
