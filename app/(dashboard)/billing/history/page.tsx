"use client";

import { useState, useEffect } from "react";
import { getBills, getBill } from "@/lib/api/billing";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";


function numberToWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const g = ["", "Thousand", "Lakh", "Crore"];

  const count = (n: number) => {
    let word = "";
    if (n < 20) {
      word = a[n];
    } else if (n < 100) {
      word = b[Math.floor(n / 10)] + " " + a[n % 10];
    } else {
      word = a[Math.floor(n / 100)] + " Hundred " + count(n % 100);
    }
    return word.trim();
  };

  if (num === 0) return "Zero Rupees Only";

  let words = "";
  let temp = Math.floor(num);

  let chunks = [];
  chunks.push(temp % 1000);
  temp = Math.floor(temp / 1000);
  chunks.push(temp % 100);
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk > 0) {
      words = count(chunk) + " " + g[i] + " " + words;
    }
  }

  return (words.trim() + " Rupees Only").replace(/\s+/g, " ");
}

export default function BillingHistoryPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingWhatsappId, setSendingWhatsappId] = useState<number | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "", address: "" });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const { role } = useAuth();

  useEffect(() => {
    loadBills();
  }, [search]);

  // Polling for real-time WhatsApp status updates
  useEffect(() => {
    const hasPending = bills.some((b) => b.whatsappStatus === "pending");
    if (!hasPending) return;

    const interval = setInterval(() => {
      loadBills(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [bills, search]);

  const loadBills = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getBills(search);
      setBills(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const openEditModal = (bill: any) => {
    setSelectedBill(bill);
    setEditData({
      name: bill.customer?.name || bill.customerName || "",
      phone: bill.customer?.phone || bill.customerPhone || "",
      address: bill.customer?.address || "",
    });
    setShowEditModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !selectedBill.customer) {
      alert("This is a legacy bill without a linked customer profile. Cannot edit.");
      return;
    }
    
    // Check what changed
    const oldName = selectedBill.customer.name || selectedBill.customerName || "";
    const oldPhone = selectedBill.customer.phone || selectedBill.customerPhone || "";
    const oldAddress = selectedBill.customer.address || "";
    
    let changes = [];
    if (oldName !== editData.name) changes.push(`Name: ${oldName || "(Empty)"} ➔ ${editData.name || "(Empty)"}`);
    if (oldPhone !== editData.phone) changes.push(`Phone: ${oldPhone || "(Empty)"} ➔ ${editData.phone || "(Empty)"}`);
    if (oldAddress !== editData.address) changes.push(`Address: ${oldAddress || "(Empty)"} ➔ ${editData.address || "(Empty)"}`);
    
    if (changes.length === 0) {
      setShowEditModal(false);
      return;
    }
    
    const confirmMsg = `Confirm Customer Updates:\n\n${changes.join("\n")}\n\nSave changes?`;
    if (!window.confirm(confirmMsg)) return;
    
    setSavingCustomer(true);
    try {
      const res = await fetch(`/api/v1/customers/${selectedBill.customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      
      const { customer } = await res.json();
      
      // Update local state for bills
      setBills(bills.map(b => (b.customerId === customer.id ? { ...b, customer } : b)));
      setShowEditModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleSendWhatsapp = async (bill: any) => {
    const customerPhone = bill.customer?.phone || bill.customerPhone || "";
    if (!customerPhone) {
      alert("No customer phone number attached to this bill.");
      return;
    }
    try {
      setSendingWhatsappId(bill.id);
      const { generateBillPdfBlob } = await import("@/lib/client-pdf");
      const blob = await generateBillPdfBlob(bill);

      const formData = new FormData();
      formData.append("file", blob, `SKC_Invoice_${bill.billNumber}.pdf`);
      formData.append("customerName", bill.customer?.name || "Customer");
      formData.append("mobileNumber", customerPhone);
      formData.append("billNumber", bill.billNumber);

      const res = await fetch(`/api/v1/bills/${bill.id}/whatsapp/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Failed to send WhatsApp message");
      }

      await loadBills(true); // Refresh list silently to get updated status
    } catch (err: any) {
      console.error("WhatsApp send error:", err);
      alert(err.message || "Failed to send WhatsApp message");
    } finally {
      setSendingWhatsappId(null);
    }
  };

  const handleDownloadBill = async (billId: number) => {
    try {
      const bill = await getBill(billId);
      if (!bill) return;
      const { generateBillPdfBlob } = await import("@/lib/client-pdf");
      const blob = await generateBillPdfBlob(bill);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice_${bill.billNumber || billId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download PDF", err);
      alert("Failed to download PDF bill details.");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black">Billing History</h2>
        <Link
          href="/billing"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-semibold"
        >
          New Transaction
        </Link>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by Bill Number, Customer Name or Phone..."
          className="w-full border border-gray-300 rounded px-4 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-10">Loading transactions...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(bill.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    #{bill.billNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{bill.customer?.name || "Guest"}</div>
                    {bill.customer?.phone && <div className="text-xs text-gray-500">{bill.customer.phone}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    ₹{bill.totalAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {bill.paymentMode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.status === "voided"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                      }`}>
                      {bill.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {bill.whatsappStatus ? (
                      <div>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.whatsappStatus === "sent"
                            ? "bg-green-100 text-green-800"
                            : bill.whatsappStatus === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                          {bill.whatsappStatus}
                        </span>
                        {bill.whatsappSentAt && bill.whatsappStatus === "sent" && (
                          <div className="text-[10px] text-gray-500 mt-1">
                            {new Date(bill.whatsappSentAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {role === "owner" && bill.status !== "voided" && bill.customer && (
                      <button
                        onClick={() => openEditModal(bill)}
                        title="Edit Customer Details"
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-800 transition-colors"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() => handleSendWhatsapp(bill)}
                      disabled={sendingWhatsappId === bill.id || bill.status === "voided"}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-800 transition-colors disabled:opacity-50"
                      title="Send via WhatsApp"
                    >
                      {sendingWhatsappId === bill.id ? (
                        <div className="w-4.5 h-4.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.004-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
                        </svg>
                      )}
                    </button>
                    <Link
                      href={`/billing/${bill.id}`}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-800 transition-colors"
                      title="View Details"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDownloadBill(bill.id)}
                      disabled={bill.status === "voided"}
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Download Bill"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4.5 h-4.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Edit Customer Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
            </div>
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700">Customer Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Phone Number (10 digits)</label>
                <input
                  type="text"
                  maxLength={10}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value.replace(/\D/g, "") })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700">Address</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCustomer}
                  className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {savingCustomer ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
