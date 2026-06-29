"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface AlertItem {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  threshold: number;
  severity: "critical" | "danger" | "warning";
  message: string;
}

export default function NotificationBell() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedKeys, setDismissedKeys] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAlerts();
    // Poll every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Read from localStorage only on client mount / update
    const dismissed = getDismissed();
    setDismissedKeys(dismissed);
    const activeUnread = alerts.filter(
      (alert) => !dismissed.includes(`${alert.id}-${alert.quantity}`)
    );
    setUnreadCount(activeUnread.length);
  }, [alerts]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/v1/dashboard/notifications");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications in bell:", err);
    }
  };

  const getDismissed = (): string[] => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("dismissed_alerts");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const markAllAsRead = () => {
    try {
      const currentKeys = alerts.map((alert) => `${alert.id}-${alert.quantity}`);
      localStorage.setItem("dismissed_alerts", JSON.stringify(currentKeys));
      setDismissedKeys(currentKeys);
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState) {
            markAllAsRead();
          }
        }}
        className="relative p-1.5 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Notification center"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-red-600 rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <span className="font-bold text-gray-800 text-sm">Inventory Alerts</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-bold text-blue-600 hover:underline hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {alerts.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-400 text-sm">
                No active notifications
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`px-4 py-3 flex flex-col gap-1 hover:bg-gray-50 transition ${
                    dismissedKeys.includes(`${alert.id}-${alert.quantity}`) ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800 text-xs truncate max-w-[150px]">
                      {alert.name}
                    </span>
                    <span
                      className={`text-[8px] font-extrabold px-1 py-0.5 rounded uppercase ${
                        alert.severity === "critical"
                          ? "bg-red-100 text-red-800"
                          : alert.severity === "danger"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {alert.severity === "critical" ? "OUT" : "LOW"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100 text-center bg-gray-50/50">
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-blue-600 hover:underline hover:text-blue-800 block w-full"
            >
              View all alerts
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
