"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getBill, voidBill } from "@/lib/api/billing";
import { useReactToPrint } from "react-to-print";
import InvoiceTemplate from "@/components/InvoiceTemplate";

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { role } = useAuth();

  const unwrappedParams = use(params);
  const billId = unwrappedParams.id;

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voiding, setVoiding] = useState(false);
  const [error, setError] = useState("");
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const printComponentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBill();
  }, []);

  const loadBill = async () => {
    try {
      setLoading(true);
      const data = await getBill(parseInt(billId));
      setBill(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `SKC_Invoice_${bill?.billNumber || ""}`,
  });

  const handleVoid = async () => {
    if (!confirm("Are you sure you want to void this bill? This action is irreversible and restores stock levels.")) {
      return;
    }
    setVoiding(true);
    setError("");
    try {
      await voidBill(parseInt(billId));
      await loadBill();
    } catch (err: any) {
      setError(err.message || "Failed to void invoice");
      setVoiding(false);
    }
  };

  const handleSendWhatsapp = async () => {
    if (!bill) return;
    const customerPhone = bill.customer?.phone || bill.customerPhone || "";
    if (!customerPhone) {
      setWhatsappStatus({ type: "error", message: "No customer phone number on this bill." });
      return;
    }
    try {
      setSendingWhatsapp(true);
      setWhatsappStatus(null);

      // Generate PDF client-side
      const { generateBillPdfBlob } = await import("@/lib/client-pdf");
      const blob = await generateBillPdfBlob(bill);

      // Upload PDF and trigger WhatsApp delivery
      const formData = new FormData();
      formData.append("file", blob, `SKC_Invoice_${bill.billNumber}.pdf`);
      formData.append("customerName", bill.customer?.name || bill.customerName || "Customer");
      formData.append("customerAddress", bill.customer?.address || "");
      formData.append("mobileNumber", customerPhone);
      formData.append("billNumber", bill.billNumber);

      const res = await fetch(`/api/v1/bills/${bill.id}/whatsapp/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setWhatsappStatus({ type: "success", message: `Invoice sent to ${customerPhone} via WhatsApp!` });
      } else {
        setWhatsappStatus({ type: "error", message: data.error || "Failed to send WhatsApp message." });
      }
    } catch (err: any) {
      console.error("WhatsApp send error:", err);
      setWhatsappStatus({ type: "error", message: err.message || "Failed to send WhatsApp message." });
    } finally {
      setSendingWhatsapp(false);
    }
  };

  // Check if same calendar day
  const isSameDay = () => {
    if (!bill) return false;
    const billDate = new Date(bill.createdAt);
    const today = new Date();
    return (
      billDate.getFullYear() === today.getFullYear() &&
      billDate.getMonth() === today.getMonth() &&
      billDate.getDate() === today.getDate()
    );
  };

  if (loading) return <div className="text-center py-10">Loading invoice...</div>;
  if (!bill) return <div className="text-center py-10 text-red-500">Invoice not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/billing/history")}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm"
          >
            ← Back to History
          </button>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-800">
            Bill #{bill.billNumber}
          </span>
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bill.status === "voided"
            ? "bg-red-100 text-red-800"
            : "bg-green-100 text-green-800"
            }`}>
            {bill.status}
          </span>
        </div>

        <div className="flex gap-2">
          {bill.status !== "voided" && (
            <button
              onClick={handleSendWhatsapp}
              disabled={sendingWhatsapp}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded text-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {sendingWhatsapp ? (
                <>
                  <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                  Sending...
                </>
              ) : (
                "📲 Send via WhatsApp"
              )}
            </button>
          )}
          {role === "owner" && bill.status !== "voided" && !bill.isSettled && isSameDay() && (
            <button
              onClick={handleVoid}
              disabled={voiding}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded text-sm disabled:opacity-50"
            >
              {voiding ? "Voiding..." : "Void Bill"}
            </button>
          )}
          {bill.status !== "voided" && (
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm"
            >
              Print Receipt
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-3 rounded text-sm">{error}</div>}

      {whatsappStatus && (
        <div className={`p-3 rounded text-sm font-semibold ${whatsappStatus.type === "success"
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-red-50 text-red-700 border border-red-200"
          }`}>
          {whatsappStatus.type === "success" ? "✅" : "❌"} {whatsappStatus.message}
        </div>
      )}

      {/* Print-only styles */}
      <style>{`
        @media print {
          /* Set a definitive top margin on the physical printed page */
          @page {
            margin: 20mm auto 0 auto; 
          }

          /* Ensure body doesn't interfere with print */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* CRITICAL: Fix vertical alignment for the print wrapper */
          .print-page-wrapper {
            min-height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            page-break-inside: avoid !important;
          }

          /* Fix vertical alignment for the content container */
          .print-page-wrapper > div {
            margin: auto !important;
            transform: scale(1) !important;
            transform-origin: center center !important;
            position: relative !important;
            top: auto !important;
            left: auto !important;
            right: auto !important;
            bottom: auto !important;
          }

          /* Ensure the actual invoice content is captured properly */
          .print-page-wrapper [ref] {
            opacity: 1 !important;
            display: block !important;
            visibility: visible !important;
            position: relative !important;
          }

          /* Hide UI elements during print */
          button, .hidden-on-print {
            display: none !important;
          }

          /* Maintain proper colors and appearance */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Ensure print display classes work */
        .print-page-wrapper.print\\:bg-white.print\\:flex.print\\:items-center.print\\:justify-center > div {
          background: white !important;
        }
      `}</style>

      {/* Invoice sheet preview with proper print classes */}
      <div className="bg-white p-8 rounded-lg shadow overflow-x-auto flex justify-center print-page-wrapper print\:bg-white print\:flex print\:items-center print\:justify-center">
        <div
          ref={printComponentRef}
          style={{ width: "100%", maxWidth: "650px", margin: "0 auto", paddingTop: "20px" }}
        >
          <InvoiceTemplate
            isDraft={false}
            billNumber={bill.billNumber}
            createdAt={bill.createdAt}
            customerName={bill.customer?.name || bill.customerName || "Guest Customer"}
            customerAddress={bill.customer?.address || undefined}
            customerPhone={bill.customer?.phone || bill.customerPhone || ""}
            cartItems={bill.billItems || []}
            subtotal={Number(bill.subtotal)}
            grossTotal={Number(bill.totalAmount)}
            discount={Number(bill.discount)}
            totalAmount={Number(bill.totalAmount)}
            sgstPercent={bill.sgstPercent?.toString() || "0"}
            cgstPercent={bill.cgstPercent?.toString() || "0"}
            paidAmount={Number(bill.paidAmount || 0)}
            dueAmount={Number(bill.dueAmount || 0)}
            paymentMode={bill.paymentMode || "cash"}
          />
        </div>
      </div>
    </div>
  );
}
