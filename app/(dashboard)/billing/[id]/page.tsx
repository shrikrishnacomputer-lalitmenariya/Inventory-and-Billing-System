"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getBill, voidBill } from "@/lib/api/billing";
import { useReactToPrint } from "react-to-print";

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
          className="border-[3px] border-[#1b3f8b] p-4 bg-white text-black font-sans text-[11px] select-none shadow-sm rounded-sm"
          style={{ width: "100%", maxWidth: "650px", margin: "0 auto", paddingTop: "20px" }}
        >
          {/* Header matching original bill */}
          <div className="border-2 border-[#1b3f8b] p-3 mb-3">
            <div className="flex justify-between items-center border-b border-[#1b3f8b] pb-2 mb-2">
              <div className="flex items-center">
                <span className="bg-[#1b3f8b] text-white px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider rounded-sm">
                  Tax Invoice
                </span>
                {bill.status === "voided" && (
                  <span className="border border-red-600 text-red-600 px-2 py-0.5 font-bold uppercase text-[10px] ml-2 rounded-sm bg-red-50">
                    VOIDED / CANCELLED
                  </span>
                )}
              </div>
              <div className="text-right text-[#1b3f8b]">
                <span className="font-extrabold text-[11px] tracking-wide">GSTIN : 08BROPM8088G2Z0</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 mb-2">
              {/* Logo icon of Lord Krishna flute/peacock feather */}
              <div className="flex-shrink-0">
                <img src="/shreekrishnalogo1.jpg" alt="Logo" className="w-16 h-16 object-contain rounded-md" />
              </div>

              <div className="text-center flex-1">
                <h1 className="text-2xl font-black tracking-tight text-[#1b3f8b] leading-none uppercase">
                  Shree Krishna Computer
                </h1>
                <p className="text-[10px] text-gray-700 font-bold mt-1">
                  Main Bus Stand Kanore, Distt. Udaipur
                </p>
                <p className="text-[10px] text-gray-700 font-bold">
                  ✉ s.krishnacom.kanore@gmail.com
                </p>
              </div>

              <div className="w-14"></div>
            </div>

            <div className="bg-[#1b3f8b] rounded-md py-3 px-4 flex items-center">

              <div className="bg-yellow-400 text-[#1b3f8b] font-black px-4 py-1 rounded mr-4 text-sm">
                WE BELIEVE IN QUALITY
              </div>

              <div className="flex-1 text-center text-white text-xs font-bold tracking-wide">
                MOBILE | COMPUTER | AC | CCTV | LED TV | REFRIGERATOR | WASHING MACHINE
              </div>

            </div>

            <div className="flex justify-between items-center pt-1.5 text-[10px] font-black text-[#1b3f8b]">
              <div>Owner: Lalit Menariya</div>
              <div className="flex items-center gap-1 font-bold">
                <span>📞 9928203203</span>
              </div>
            </div>
          </div>

          {/* Metadata matching original bill */}
          <div className="grid grid-cols-2 border border-[#1b3f8b] mb-3 text-[10px]">
            <div className="p-2 border-r border-[#1b3f8b] flex flex-col justify-between min-h-[50px]">
              <div>
                <span className="font-extrabold text-[#1b3f8b]">M/s. </span>
                <span className="underline font-bold text-gray-800">
                  {bill.customer?.name || "Guest Customer"}
                </span>
              </div>
              {bill.customer?.phone && (
                <div className="mt-1">
                  <span className="font-extrabold text-[#1b3f8b]">Phone: </span>
                  <span className="font-bold">{bill.customer.phone}</span>
                </div>
              )}
            </div>
            <div className="p-2 flex flex-col justify-between min-h-[50px]">
              <div>
                <span className="font-extrabold text-[#1b3f8b]">Bill No. </span>
                <span className="font-extrabold ml-1 text-red-600">
                  {bill.billNumber}
                </span>
              </div>
              <div className="mt-1">
                <span className="font-extrabold text-[#1b3f8b]">Date: </span>
                <span className="font-bold">
                  {new Date(bill.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse border border-[#1b3f8b] mb-3 text-[10px]">
            <thead>
              <tr className="border-b border-[#1b3f8b] bg-blue-50/30 text-[#1b3f8b]">
                <th className="border-r border-[#1b3f8b] p-1.5 text-left w-10 font-extrabold">No.</th>
                <th className="border-r border-[#1b3f8b] p-1.5 text-left font-extrabold">Particulars</th>
                <th className="border-r border-[#1b3f8b] p-1.5 text-center w-12 font-extrabold">Qty.</th>
                <th className="border-r border-[#1b3f8b] p-1.5 text-right w-20 font-extrabold">Rate</th>
                <th className="p-1.5 text-right w-24 font-extrabold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bill.billItems?.map((item: any, idx: number) => (
                <tr key={item.id} className="border-b border-[#1b3f8b]">
                  <td className="border-r border-[#1b3f8b] p-1.5 text-left">{idx + 1}</td>
                  <td className="border-r border-[#1b3f8b] p-1.5 text-left">
                    <div className="font-bold text-gray-800">{item.product.name}</div>
                    {item.productUnit?.imeiNumber && (
                      <div className="text-[8px] text-gray-600 font-semibold mt-0.5">
                        IMEI: {item.productUnit.imeiNumber}
                      </div>
                    )}
                  </td>
                  <td className="border-r border-[#1b3f8b] p-1.5 text-center font-bold">{item.quantity}</td>
                  <td className="border-r border-[#1b3f8b] p-1.5 text-right font-bold">₹{item.unitPrice}</td>
                  <td className="p-1.5 text-right font-bold">₹{item.lineTotal}</td>
                </tr>
              ))}
              {/* Fill remaining empty rows to maintain minimum height */}
              {Array.from({ length: Math.max(0, 4 - (bill.billItems?.length || 0)) }).map((_, idx) => (
                <tr key={`empty-${idx}`} className="border-b border-[#1b3f8b] h-8">
                  <td className="border-r border-[#1b3f8b] p-1.5"></td>
                  <td className="border-r border-[#1b3f8b] p-1.5"></td>
                  <td className="border-r border-[#1b3f8b] p-1.5"></td>
                  <td className="border-r border-[#1b3f8b] p-1.5"></td>
                  <td className="p-1.5"></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Bottom section with totals & bank details */}
          <div className="grid grid-cols-2 gap-4 mb-3 text-[10px]">
            <div>
              {/* Bank Details */}
              <div className="border border-[#1b3f8b] p-2 text-[8px] leading-normal text-gray-800 flex justify-between items-center">
                <div>
                  <div className="font-extrabold text-[#1b3f8b] underline mb-1 uppercase text-[9px]">Bank Details:</div>
                  <div>Bank : <span className="font-bold">State Bank of India</span></div>
                  <div>IFSE : <span className="font-bold">SBIN0032015</span></div>
                  <div>A/c No. : <span className="font-bold">61181530264</span></div>
                  <div>A/c No. : <span className="font-bold">61130908984</span></div>
                </div>
                {bill.paymentMode === "upi" && (
                  <div className="flex flex-col items-center justify-center border-l border-gray-300 pl-2 ml-2">
                    <div className="text-3xl">📱</div>
                    <div className="text-[6px] font-bold mt-1 text-center">Scan to<br />Pay</div>
                  </div>
                )}
              </div>
              <div className="mt-3 text-[8px] text-gray-700 leading-tight">
                <div className="font-bold underline mb-1">Terms & Conditions:</div>
                <ol className="list-decimal pl-3 space-y-0.5">
                  <li>Warranty is subject to company policy.</li>
                  <li>Servicing is strictly limited to authorized service centers.</li>
                  <li>Water damage and physical breakage are not covered in warranty.</li>
                </ol>
              </div>
            </div>

            <div>
              <div className="border border-[#1b3f8b] text-[10px]">
                <div className="flex justify-between p-1 border-b border-[#1b3f8b]">
                  <span className="font-bold text-[#1b3f8b]">Subtotal</span>
                  <span className="font-bold">₹{bill.subtotal}</span>
                </div>
                {bill.discount > 0 && (
                  <div className="flex justify-between p-1 border-b border-[#1b3f8b] text-red-600 bg-red-50/50">
                    <span className="font-bold">Discount</span>
                    <span className="font-bold">- ₹{bill.discount}</span>
                  </div>
                )}
                <div className="flex justify-between p-1 border-b border-[#1b3f8b] bg-gray-50/50">
                  <span className="font-bold text-[#1b3f8b]">Taxable Amount</span>
                  <span className="font-bold">₹{(Number(bill.subtotal) - Number(bill.discount)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-1 border-b border-[#1b3f8b]">
                  <span className="font-bold text-[#1b3f8b]">CGST ({bill.cgstPercent || 0}%)</span>
                  <span>₹{Number(bill.cgstAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-1 border-b border-[#1b3f8b]">
                  <span className="font-bold text-[#1b3f8b]">SGST ({bill.sgstPercent || 0}%)</span>
                  <span>₹{Number(bill.sgstAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between p-1 font-black bg-blue-50/30 text-[#1b3f8b] text-xs">
                  <span>G.Total</span>
                  <span>₹{bill.totalAmount}</span>
                </div>
                {Number(bill.dueAmount) > 0 && (
                  <>
                    <div className="flex justify-between p-1 border-t border-[#1b3f8b] text-green-700 bg-green-50/30 font-bold">
                      <span>Paid Amount</span>
                      <span>₹{Number(bill.paidAmount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-1 border-t border-[#1b3f8b] text-red-700 bg-red-50/30 font-bold">
                      <span>Due Amount</span>
                      <span>₹{Number(bill.dueAmount).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-2 text-[10px]">
                <span className="font-extrabold text-[#1b3f8b]">Rs. (In Word): </span>
                <span className="italic underline font-bold text-gray-800">
                  {numberToWords(parseFloat(bill.totalAmount))}
                </span>
              </div>
            </div>
          </div>



          {/* Signatures */}
          <div className="flex justify-between items-end pt-4 text-[10px] text-[#1b3f8b]">
            <div className="text-center w-32 border-t border-[#1b3f8b] pt-1 font-bold">
              Cust.Signature
            </div>
            <div className="text-center w-48">
              <div className="text-[9px] font-black mb-6">For-SHREE KRISHNA COMPUTER</div>
              <div className="border-t border-[#1b3f8b] pt-1 font-bold">
                Auth.Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
