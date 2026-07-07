"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaWhatsapp, FaPhone, FaCheckSquare, FaSquare } from "react-icons/fa";

export default function DuePaymentsPage() {
  const [dues, setDues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [settlingId, setSettlingId] = useState<number | null>(null);
  const [sendingWhatsappId, setSendingWhatsappId] = useState<number | null>(null);

  useEffect(() => {
    fetchDues();
  }, [searchQuery]);

  const fetchDues = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/due-payments?search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to fetch due payments");
      const data = await res.json();
      setDues(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSettleToggle = async (billId: number, currentStatus: string) => {
    if (currentStatus === "PAID") return; // Already paid

    const confirmSettle = window.confirm("Has the customer paid the due?");
    if (!confirmSettle) return; // If NO, do nothing (checkbox remains unchecked)

    try {
      setSettlingId(billId);
      const res = await fetch(`/api/v1/due-payments/${billId}/settle`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to settle payment");
      
      // Determine bill details before updating state
      const existingBill = dues.find(d => d.id === billId);
      
      // Remove from list since it's no longer due
      setDues(dues.filter(d => d.id !== billId));

      // Send the settled invoice automatically if there's a phone number
      if (existingBill && (existingBill.customer?.phone || existingBill.customerPhone)) {
        try {
          const fullBill = { 
            ...existingBill, 
            paymentStatus: "PAID", 
            paidAmount: existingBill.totalAmount, 
            dueAmount: 0,
            isSettled: true 
          };
          
          const { generateBillPdfBlob } = await import("@/lib/client-pdf");
          const blob = await generateBillPdfBlob(fullBill);

          const formData = new FormData();
          formData.append("file", blob, `SKC_Invoice_${fullBill.billNumber}.pdf`);
          formData.append("customerName", fullBill.customer?.name || "Customer");
          formData.append("mobileNumber", fullBill.customer?.phone || fullBill.customerPhone);
          formData.append("billNumber", fullBill.billNumber);
          
          const settledMsg = `🎉 *Payment Successful!*\n\nHello ${fullBill.customer?.name || 'Customer'},\nYour payment of ₹${existingBill.dueAmount} for Invoice #${fullBill.billNumber} has been completely settled.\n\nThank you for choosing *Shree Krishna Computer*.`;
          formData.append("customMessage", settledMsg);

          await fetch(`/api/v1/bills/${fullBill.id}/whatsapp/upload`, {
            method: "POST",
            body: formData,
          });
        } catch (e) {
          console.error("Failed to send settled whatsapp message", e);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Failed to settle due payment. Please try again.");
    } finally {
      setSettlingId(null);
    }
  };

  const calculateDaysPassed = (dateString: string) => {
    const created = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
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
      } else {
        alert("WhatsApp message with PDF sent successfully!");
      }
    } catch (err: any) {
      console.error("WhatsApp send error:", err);
      alert(err.message || "Failed to send WhatsApp message");
    } finally {
      setSendingWhatsappId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-black">Due Payments</h1>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by Bill No, Name, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 shadow-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Bill No</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-red-500 uppercase tracking-wider">Due</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Settle</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Remind</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 font-medium">Loading dues...</span>
                    </div>
                  </td>
                </tr>
              ) : dues.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">
                    No pending due payments found.
                  </td>
                </tr>
              ) : (
                dues.map((bill) => {
                  const daysPassed = calculateDaysPassed(bill.createdAt);
                  const isOverdue = daysPassed >= 15;
                  
                  return (
                    <tr key={bill.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                        <Link href={`/billing/${bill.id}`}>
                          #{bill.billNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                        <div>{new Date(bill.createdAt).toLocaleDateString()}</div>
                        {isOverdue ? (
                          <div className="text-[10px] text-red-600 font-bold mt-0.5 bg-red-100 px-1.5 py-0.5 rounded inline-block">Overdue ({daysPassed} days)</div>
                        ) : (
                          <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{daysPassed} days ago</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{bill.customer?.name || "Guest"}</div>
                        <div className="text-xs text-gray-500 font-medium">{bill.customer?.phone || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        ₹{parseFloat(bill.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                        ₹{parseFloat(bill.paidAmount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black text-red-600 bg-red-50/30">
                        ₹{parseFloat(bill.dueAmount).toFixed(2)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button 
                          onClick={() => handleSettleToggle(bill.id, bill.paymentStatus)}
                          disabled={settlingId === bill.id}
                          className="text-gray-400 hover:text-green-600 transition disabled:opacity-50"
                          title="Click to mark as Fully Paid"
                        >
                          {settlingId === bill.id ? (
                            <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full mx-auto" />
                          ) : (
                            <FaSquare className="h-5 w-5 mx-auto" />
                          )}
                        </button>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center items-center gap-3">
                          {bill.customer?.phone ? (
                            <>
                              <button 
                                onClick={() => handleSendWhatsapp(bill)}
                                disabled={sendingWhatsappId === bill.id}
                                className="text-gray-400 hover:text-green-600 bg-gray-100 hover:bg-green-50 p-2 rounded-full transition disabled:opacity-50"
                                title="Send WhatsApp Reminder with Invoice PDF"
                              >
                                {sendingWhatsappId === bill.id ? (
                                  <div className="animate-spin h-[1.1rem] w-[1.1rem] border-2 border-green-600 border-t-transparent rounded-full mx-auto" />
                                ) : (
                                  <FaWhatsapp className="text-[1.1rem]" />
                                )}
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">No Phone</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
