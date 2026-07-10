"use client";

import React from "react";

// Indian currency to words helper
export function numberToWords(num: number): string {
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
  chunks.push(temp % 1000); // hundreds/tens/ones
  temp = Math.floor(temp / 1000);
  chunks.push(temp % 100);  // thousands
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);  // lakhs
  temp = Math.floor(temp / 100);
  chunks.push(temp % 100);  // crores

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk > 0) {
      words = count(chunk) + " " + g[i] + " " + words;
    }
  }

  return (words.trim() + " Rupees Only").replace(/\s+/g, " ");
}

export interface InvoiceTemplateProps {
  isDraft: boolean;
  billNumber: string;
  createdAt: string | Date;
  customerName: string;
  customerAddress?: string;
  customerPhone: string;
  cartItems: any[];
  subtotal: number;
  grossTotal?: number;
  discount: number;
  totalAmount: number;
  sgstPercent: string;
  cgstPercent: string;
  paidAmount: number;
  dueAmount: number;
  paymentMode: string;
}

export default function InvoiceTemplate({
  isDraft,
  billNumber,
  createdAt,
  customerName,
  customerAddress,
  customerPhone,
  cartItems,
  subtotal,
  grossTotal,
  discount,
  totalAmount,
  sgstPercent,
  cgstPercent,
  paidAmount,
  dueAmount,
  paymentMode,
}: InvoiceTemplateProps) {
  const taxableAmt = subtotal; // subtotal is now the base taxable amount
  const sAmt = taxableAmt * (parseFloat(sgstPercent || "0") / 100);
  const cAmt = taxableAmt * (parseFloat(cgstPercent || "0") / 100);

  return (
    <div className="border-[3px] border-[#1b3f8b] p-4 bg-white text-black font-sans text-[11px] select-none shadow-sm rounded-sm">
      {/* Header matching original bill */}
      <div className="border-2 border-[#1b3f8b] p-3 mb-3">
        <div className="flex justify-between items-center border-b border-[#1b3f8b] pb-2 mb-2">
          <div>
            <span className="bg-[#1b3f8b] text-white px-3 py-1 font-extrabold uppercase text-[10px] tracking-wider rounded-sm">
              Tax Invoice
            </span>
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
    MOBILE | COMPUTER | LAPTOP | PRINTER | AC | CCTV | LED TV | REFRIGERATOR | WASHING MACHINE
  </div>

</div>

        <div className="flex justify-between items-center pt-1.5 text-[10px] font-black text-[#1b3f8b]">
          <div>Owner: Lalit Menariya</div>
          <div className="flex items-center gap-1 font-bold">
            <span>📞 9928203203</span>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 border border-[#1b3f8b] mb-3 text-[10px]">
        <div className="p-2 border-r border-[#1b3f8b] flex flex-col justify-between min-h-[50px]">
          <div>
            <span className="font-extrabold text-[#1b3f8b]">M/s. </span>
            <span className="underline font-bold text-gray-800">
              {customerName || "Guest Customer"}
            </span>
          </div>
          {customerAddress && (
            <div className="mt-0.5">
              <span className="font-extrabold text-[#1b3f8b]">Address: </span>
              <span className="font-bold">{customerAddress}</span>
            </div>
          )}
          {customerPhone && (
            <div className="mt-0.5">
              <span className="font-extrabold text-[#1b3f8b]">Phone: </span>
              <span className="font-bold">{customerPhone}</span>
            </div>
          )}
        </div>
        <div className="p-2 flex flex-col justify-between min-h-[50px]">
          <div>
            <span className="font-extrabold text-[#1b3f8b]">Bill No. </span>
            <span className="font-extrabold ml-1 text-red-600">
              {isDraft ? "DRAFT" : billNumber}
            </span>
          </div>
          <div className="mt-1">
            <span className="font-extrabold text-[#1b3f8b]">Date: </span>
            <span className="font-bold">
              {createdAt instanceof Date ? createdAt.toLocaleDateString("en-IN") : new Date(createdAt).toLocaleDateString("en-IN")}
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
          {cartItems.map((item: any, idx: number) => {
            const pBrand = item.product ? item.product.brand : item.brand;
            const pName = item.product ? item.product.name : item.name;
            const pRate = item.product ? item.product.sellingPrice : parseFloat(item.unitPrice || "0");
            const pQty = item.quantity;
            const pTotal = item.product ? (item.product.sellingPrice * item.quantity) : parseFloat(item.lineTotal || "0");
            
            // Reverse calculate base amount from gross total
            const totalGstPercent = parseFloat(sgstPercent || "0") + parseFloat(cgstPercent || "0");
            const baseTotal = pTotal / (1 + totalGstPercent / 100);

            const imei = item.productUnit?.imeiNumber || ((item.product?.productType === "serialized" || item.product?.productType === "electronics") && item.product.units?.find((u: any) => u.id.toString() === item.selectedUnitId)?.imeiNumber);

            return (
              <tr key={idx} className="border-b border-[#1b3f8b]">
                <td className="border-r border-[#1b3f8b] p-1.5 text-left">{idx + 1}</td>
                <td className="border-r border-[#1b3f8b] p-1.5 text-left">
                  {pBrand && <div className="font-extrabold text-[#1b3f8b] text-[9px] uppercase tracking-wider mb-0.5">{pBrand}</div>}
                  <div className="font-bold text-gray-800">{pName}</div>
                  {imei && (
                    <div className="text-[8px] text-gray-600 font-semibold mt-0.5">
                      {item.product?.productType === "electronics" ? "S M No." : "IMEI"}: {imei}
                    </div>
                  )}
                </td>
                <td className="border-r border-[#1b3f8b] p-1.5 text-center font-bold">{pQty}</td>
                <td className="border-r border-[#1b3f8b] p-1.5 text-right font-bold">₹{pRate}</td>
                <td className="p-1.5 text-right font-bold">₹{baseTotal.toFixed(2)}</td>
              </tr>
            );
          })}
          {/* Fill remaining empty rows to maintain minimum height */}
          {Array.from({ length: Math.max(0, 4 - cartItems.length) }).map((_, idx) => (
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
            {paymentMode === "upi" && (
              <div className="flex flex-col items-center justify-center border-l border-gray-300 pl-2 ml-2">
                <div className="text-3xl">📱</div>
                <div className="text-[6px] font-bold mt-1 text-center">Scan to<br/>Pay</div>
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
                <span className="font-bold">₹{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between p-1 border-b border-[#1b3f8b] text-red-600 bg-red-50/50">
                  <span className="font-bold">Discount</span>
                  <span className="font-bold">- ₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between p-1 border-b border-[#1b3f8b]">
                <span className="font-bold text-[#1b3f8b]">CGST ({cgstPercent}%)</span>
                <span>₹{cAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-1 border-b border-[#1b3f8b]">
                <span className="font-bold text-[#1b3f8b]">SGST ({sgstPercent}%)</span>
                <span>₹{sAmt.toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-1 font-black bg-blue-50/30 text-[#1b3f8b] text-xs">
                <span>G.Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              {dueAmount > 0 && (
                <>
                  <div className="flex justify-between p-1 border-t border-[#1b3f8b] text-green-700 bg-green-50/30 font-bold">
                    <span>Paid Amount</span>
                    <span>₹{paidAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-1 border-t border-[#1b3f8b] text-red-700 bg-red-50/30 font-bold">
                    <span>Due Amount</span>
                    <span>₹{dueAmount.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-2 text-[10px]">
              <span className="font-extrabold text-[#1b3f8b]">Rs. (In Word): </span>
              <span className="italic underline font-bold text-gray-800">
                {numberToWords(totalAmount)}
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
  );
}
