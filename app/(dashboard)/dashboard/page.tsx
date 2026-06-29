"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
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
  const [overduePayments, setOverduePayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendType, setTrendType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [mounted, setMounted] = useState(false);

  // WhatsApp connection states
  const [whatsappSettings, setWhatsappSettings] = useState<any>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappDisconnecting, setWhatsappDisconnecting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData();
    fetchWhatsappSettings();
  }, []);

  useEffect(() => {
    if (!whatsappSettings) return;
    
    // Auto-close modal when WhatsApp connects successfully
    if (whatsappSettings.status === "connected" && showQrModal) {
      setShowQrModal(false);
      return;
    }

    // Only poll if we are connecting, or if the modal is actively shown
    if (whatsappSettings.status !== "connecting" && whatsappSettings.status !== "QR_READY" && !showQrModal) {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        console.log("Polling WhatsApp Settings...");
        const res = await fetch(`/api/v1/whatsapp/settings?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setWhatsappSettings(data);
          
          // Continue polling if still connecting or modal is open
          if (data.status === "connecting" || data.status === "QR_READY" || showQrModal) {
             if (data.status !== "connected") {
                timeoutId = setTimeout(poll, 2000);
             }
          }
        }
      } catch (err) {
        console.error("Failed to fetch WhatsApp settings:", err);
        timeoutId = setTimeout(poll, 2000);
      }
    };

    timeoutId = setTimeout(poll, 2000);

    return () => clearTimeout(timeoutId);
  }, [whatsappSettings?.status, showQrModal]);

  const fetchWhatsappSettings = async () => {
    try {
      const res = await fetch(`/api/v1/whatsapp/settings?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setWhatsappSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch WhatsApp settings:", err);
    }
  };

  const handleConnectWhatsapp = async () => {
    try {
      setWhatsappLoading(true);
      setShowQrModal(true);
      const res = await fetch("/api/v1/whatsapp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "connecting" }),
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleDisconnectWhatsapp = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp? This will log out the session and clear credentials.")) {
      return;
    }
    try {
      setWhatsappDisconnecting(true);
      const res = await fetch("/api/v1/whatsapp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "disconnected" }),
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWhatsappDisconnecting(false);
    }
  };

  const handleCancelPairing = async () => {
    setShowQrModal(false);
    try {
      setWhatsappDisconnecting(true);
      const res = await fetch("/api/v1/whatsapp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "disconnected" }),
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWhatsappDisconnecting(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsRes, notifRes, overdueRes] = await Promise.all([
        fetch("/api/v1/dashboard/stats"),
        fetch("/api/v1/dashboard/notifications"),
        fetch("/api/v1/due-payments?overdue=true")
      ]);

      if (!statsRes.ok || !notifRes.ok || !overdueRes.ok) {
        throw new Error("Failed to load dashboard metrics");
      }

      const statsData = await statsRes.json();
      const notifData = await notifRes.json();
      const overdueData = await overdueRes.json();

      setStats(statsData);
      setNotifications(notifData);
      setOverduePayments(overdueData);
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

      {/* WhatsApp Integration Status Banner/Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 hover:shadow-md">
        <div className="flex items-start gap-4">
         <div className="p-3 bg-green-50 text-green-600 rounded-xl shrink-0">
            <FaWhatsapp className="w-8 h-8" />
         </div> 
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              WhatsApp Invoice Delivery
              {whatsappSettings?.enabled && (
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${whatsappSettings.status === "connected"
                    ? "bg-green-100 text-green-800 animate-pulse"
                    : whatsappSettings.status === "connecting" || whatsappSettings.status === "QR_READY"
                      ? "bg-amber-100 text-amber-800 animate-pulse"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                  {whatsappSettings.status}
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xl">
              Connect Lalit Menariya's WhatsApp account to automatically deliver professionally-formatted PDF invoices directly to clients upon checkout.
            </p>
            {whatsappSettings?.status === "connected" && whatsappSettings?.ownerPhone && (
              <p className="text-xs font-semibold text-green-700 mt-2 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-550 animate-ping"></span>
                ✓ Currently paired with: {whatsappSettings.ownerPhone}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-3">
          {!whatsappSettings || whatsappSettings.status === "disconnected" ? (
            <button
              onClick={handleConnectWhatsapp}
              disabled={whatsappLoading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition shadow-sm hover:shadow-md disabled:opacity-50"
            >
              {whatsappLoading ? "Initializing..." : "🔌 Connect Now"}
            </button>
          ) : whatsappSettings.status === "connected" ? (
            <button
              onClick={handleDisconnectWhatsapp}
              disabled={whatsappDisconnecting}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-lg text-sm border border-red-200 transition"
            >
              {whatsappDisconnecting ? "Disconnecting..." : "❌ Disconnect Session"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition shadow-sm hover:shadow-md"
              >
                📋 Scan QR Code
              </button>
              <button
                onClick={handleCancelPairing}
                disabled={whatsappDisconnecting}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-4 rounded-lg text-sm border border-red-200 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* OVERDUE PAYMENTS REMINDER COMPONENT */}
      {overduePayments.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-red-800">Urgent: Overdue Payments (15+ Days)</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overduePayments.map((bill) => {
              const openWhatsApp = () => {
                const phone = bill.customer?.phone;
                if (!phone) return;
                const formattedPhone = phone.length === 10 ? `91${phone}` : phone;
                const msg = `Hello ${bill.customer?.name || "Customer"}, this is Shree Krishna Computer. Your pending due of ₹${parseFloat(bill.dueAmount).toFixed(2)} from bill #${bill.billNumber} is overdue. Please settle it at your earliest convenience.`;
                window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
              };

              return (
                <div key={bill.id} className="bg-white rounded-lg p-4 shadow-sm border border-red-100 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-gray-900 truncate" title={bill.customer?.name}>
                        {bill.customer?.name || "Guest"}
                      </div>
                      <Link href={`/billing/${bill.id}`} className="text-xs font-bold text-blue-600 hover:underline">
                        #{bill.billNumber}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{bill.customer?.phone || "No Phone"}</div>
                    <div className="text-sm font-black text-red-600">Due: ₹{parseFloat(bill.dueAmount).toFixed(2)}</div>
                    <div className="text-xs text-gray-500 mt-1">Bill Date: {new Date(bill.createdAt).toLocaleDateString()}</div>
                  </div>
                  
                  {bill.customer?.phone && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                      <a 
                        href={`tel:${bill.customer.phone}`}
                        className="flex-1 flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 py-1.5 rounded-md text-sm font-bold transition"
                      >
                        📞 Call
                      </a>
                      <button 
                        onClick={openWhatsApp}
                        className="flex-1 flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-1.5 rounded-md text-sm font-bold transition"
                      >
                        WhatsApp
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  className={`py-1.5 px-3 rounded-md text-xs font-bold capitalize transition ${trendType === type
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
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01} />
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
                    className={`p-3 rounded-lg border flex flex-col gap-1 transition hover:shadow-sm ${notif.severity === "critical"
                        ? "bg-rose-50/50 border-rose-200"
                        : notif.severity === "danger"
                          ? "bg-amber-50/50 border-amber-200"
                          : "bg-yellow-50/20 border-yellow-200"
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-800 text-sm truncate max-w-[150px]">{notif.name}</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${notif.severity === "critical"
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
      {/* Official WhatsApp QR Connection Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transform transition-all scale-100">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-green-600 text-white flex justify-between items-center">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <span>💬</span> Link WhatsApp Device
              </h3>
              <button
                onClick={handleCancelPairing}
                className="text-white hover:text-gray-200 text-2xl font-bold focus:outline-none"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col items-center text-center">
              <p className="text-sm font-semibold text-gray-700 mb-5">
                Scan the QR code below using WhatsApp on your phone to link your account.
              </p>

              {/* QR Display Area */}
              <div className="w-52 h-52 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center p-3 relative mb-5">
                {whatsappSettings?.qrCode ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappSettings.qrCode)}`}
                    alt="Scan QR Code"
                    className="w-full h-full object-contain rounded-lg bg-white shadow-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                    <span className="text-xs font-bold text-gray-500">Generating QR code...</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-left w-full bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 space-y-2">
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
                  How to link your phone:
                </p>
                <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1.5 font-semibold">
                  <li>Open WhatsApp on your phone</li>
                  <li>Tap Menu (Android) or Settings (iPhone)</li>
                  <li>Select <span className="font-extrabold text-gray-800">Linked Devices</span></li>
                  <li>Tap <span className="font-extrabold text-green-600">Link a Device</span> and point your camera here</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 w-full border-t pt-4">
                <button
                  onClick={handleCancelPairing}
                  disabled={whatsappDisconnecting}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold py-2.5 px-5 rounded-lg text-xs transition disabled:opacity-50"
                >
                  Cancel Pairing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
