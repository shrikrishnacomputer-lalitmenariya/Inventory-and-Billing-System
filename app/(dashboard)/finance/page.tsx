"use client";

import React, { useState, useEffect } from "react";
import { FaSearch, FaCog, FaTrash, FaPlus, FaWallet } from "react-icons/fa";

export default function FinancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [showManageModal, setShowManageModal] = useState(false);
  const [newProviderName, setNewProviderName] = useState("");
  const [isManaging, setIsManaging] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [searchQuery]);

  useEffect(() => {
    if (showManageModal) {
      fetchProviders();
    }
  }, [showManageModal]);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/finance/records?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error("Failed to fetch finance records", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/v1/finance/providers");
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (err) {
      console.error("Failed to fetch providers", err);
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderName.trim()) return;

    try {
      setIsManaging(true);
      const res = await fetch("/api/v1/finance/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProviderName }),
      });
      if (res.ok) {
        setNewProviderName("");
        await fetchProviders();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to add provider");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsManaging(false);
    }
  };

  const handleRemoveProvider = async (id: number) => {
    if (!confirm("Are you sure you want to remove this finance provider?")) return;

    try {
      const res = await fetch(`/api/v1/finance/providers/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchProviders();
      }
    } catch (err) {
      console.error("Failed to remove provider", err);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <FaWallet className="text-blue-600" /> Financed Bills
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Track customers who purchased via Finance.</p>
        </div>
        <button
          onClick={() => setShowManageModal(true)}
          className="flex items-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg shadow-sm transition"
        >
          <FaCog /> Manage Providers
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or bill no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition font-medium text-sm"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bill No.</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer Details</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Finance Provider</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">EMI Amount</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Months</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Bill Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-medium">Loading records...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FaWallet className="text-4xl text-gray-300 mb-3" />
                      <p className="text-lg font-semibold text-gray-600">No finance records found.</p>
                      <p className="text-sm">When you bill items via Finance, they will appear here.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                      #{record.billNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{record.customerName}</div>
                      <div className="text-xs text-gray-500 font-medium">{record.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                        {record.providerName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      ₹{parseFloat(record.emiAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      {record.months ? record.months : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                      ₹{parseFloat(record.totalAmount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Providers Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Manage Finance Providers</h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <form onSubmit={handleAddProvider} className="mb-6 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter provider name (e.g. Bajaj)"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  className="flex-1 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-blue-500 transition"
                  required
                />
                <button
                  type="submit"
                  disabled={isManaging}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
                >
                  <FaPlus /> Add
                </button>
              </form>

              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Active Providers</h4>
              <ul className="space-y-2">
                {providers.length === 0 ? (
                  <li className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg">No active providers found.</li>
                ) : (
                  providers.map(provider => (
                    <li key={provider.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg">
                      <span className="font-bold text-gray-800">{provider.name}</span>
                      <button
                        onClick={() => handleRemoveProvider(provider.id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-md transition"
                        title="Remove Provider"
                      >
                        <FaTrash />
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowManageModal(false)}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 px-6 rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
