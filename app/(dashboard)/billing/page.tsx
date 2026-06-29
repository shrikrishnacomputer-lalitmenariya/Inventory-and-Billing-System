"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getProducts } from "@/lib/api/inventory";
import { searchCustomer, createBill } from "@/lib/api/billing";
import { useReactToPrint } from "react-to-print";
import { useAuth } from "@/hooks/useAuth";
import CameraScanner from "@/components/CameraScanner";
import { FaCamera } from "react-icons/fa";

// Indian currency to words helper
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

export default function BillingPage() {
  const { user } = useAuth();

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal = false) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      return;
    }
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    if (allowDecimal && e.key === ".") {
      if (e.currentTarget.value.includes(".")) {
        e.preventDefault();
      }
      return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleTextOnlyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      e.preventDefault();
    }
  };
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  
  // Customer info
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Bill metadata
  const [paymentMode, setPaymentMode] = useState("cash");
  const [discount, setDiscount] = useState("0");
  const [sgstPercent, setSgstPercent] = useState("0");
  const [cgstPercent, setCgstPercent] = useState("0");
  const [igstPercent, setIgstPercent] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Finance states
  const [financeProviders, setFinanceProviders] = useState<any[]>([]);
  const [financeProviderId, setFinanceProviderId] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [financeMonths, setFinanceMonths] = useState("");

  // Created Bill for Print Modal
  const [createdBill, setCreatedBill] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Scanner State
  const [showScanner, setShowScanner] = useState(false);

  const printComponentRef = useRef<HTMLDivElement>(null);

  // Fetch finance providers
  useEffect(() => {
    const fetchFinanceProviders = async () => {
      try {
        const res = await fetch("/api/v1/finance/providers");
        if (res.ok) {
          const data = await res.json();
          setFinanceProviders(data);
        }
      } catch (err) {
        console.error("Failed to fetch finance providers", err);
      }
    };
    fetchFinanceProviders();
  }, []);

  // Search products
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const products = await getProducts(undefined, searchQuery);
        setSearchResults(products.filter((p: any) => p.quantityInStock > 0));
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Add product to cart
  const addToCart = async (product: any) => {
    const existing = cart.find((item) => item.product.id === product.id);
    
    if (existing && product.productType === "quantity") {
      if (existing.quantity < product.quantityInStock) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/v1/products/${product.id}`);
      const fullProduct = await res.json();
      
      const newItem = {
        product: fullProduct,
        quantity: 1,
        selectedUnitId: fullProduct.units && fullProduct.units.length > 0 ? fullProduct.units[0].id.toString() : "",
      };

      setCart([...cart, newItem]);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Scan Result
  const handleScanSuccess = useCallback(async (code: string) => {
    setShowScanner(false);
    try {
      const res = await fetch(`/api/v1/products/scan?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || "Failed to find product via scan");
        return;
      }
      
      const result = await res.json();
      
      if (result.type === "product") {
        addToCart(result.data);
      } else if (result.type === "imei") {
        // Find if product already in cart
        const product = result.data;
        const unitId = result.unitId.toString();
        
        setCart((prev) => {
          const existing = prev.find((item) => item.product.id === product.id && item.selectedUnitId === unitId);
          if (existing) {
            alert("This specific unit (IMEI) is already in the cart.");
            return prev;
          }
          return [...prev, { product, quantity: 1, selectedUnitId: unitId }];
        });
      }
    } catch (err) {
      console.error("Scan processing error", err);
      alert("Error processing scan result");
    }
  }, [addToCart]);

  // Handle phone changes to search customer
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);

    if (value.length === 10) {
      setIsSearchingCustomer(true);
      try {
        const cust = await searchCustomer(value);
        if (cust && cust.name) {
          // Only auto-fill the name if the user hasn't already typed something
          setCustomerName((prev) => prev.trim() === "" ? cust.name : prev);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingCustomer(false);
      }
    }
  };



  const removeFromCart = (productId: number, unitId?: string) => {
    setCart(cart.filter((item) => !(item.product.id === productId && (!unitId || item.selectedUnitId === unitId))));
  };

  const updateQuantity = (productId: number, qty: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const updateSelectedUnit = (productId: number, unitId: string) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, selectedUnitId: unitId } : item
      )
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const discountVal = parseFloat(discount || "0");
  const taxableAmount = subtotal - discountVal;

  const sgstAmt = taxableAmount * (parseFloat(sgstPercent || "0") / 100);
  const cgstAmt = taxableAmount * (parseFloat(cgstPercent || "0") / 100);
  const igstAmt = taxableAmount * (parseFloat(igstPercent || "0") / 100);

  const totalAmount = taxableAmount + sgstAmt + cgstAmt + igstAmt;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Please add at least one item to the cart");
      return;
    }
    if (phone.trim() !== "" && phone.trim().length !== 10) {
      setError("Customer Phone number must be exactly 10 digits");
      return;
    }
    if (phone.trim() !== "" && customerName.trim() === "") {
      setError("Customer Name is required when a Phone number is entered");
      return;
    }
    if (paymentMode.toLowerCase() === "finance") {
      if (!financeProviderId) {
        setError("Please select a Finance Provider");
        return;
      }
      if (!emiAmount || parseFloat(emiAmount) <= 0) {
        setError("Please enter a valid EMI Amount");
        return;
      }
      if (!financeMonths || parseInt(financeMonths) <= 0) {
        setError("Please enter valid Months");
        return;
      }
    }
    setError("");
    setIsSaving(true);

    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        productUnitId: (item.product.productType === "serialized" || item.product.productType === "electronics")
          ? parseInt(item.selectedUnitId)
          : undefined,
      }));

      const billData: any = {
        customerName: customerName || "Guest Customer",
        customerPhone: phone || undefined,
        paymentMode,
        discount: discountVal,
        sgstPercent: parseFloat(sgstPercent || "0"),
        cgstPercent: parseFloat(cgstPercent || "0"),
        igstPercent: parseFloat(igstPercent || "0"),
        paidAmount: paidAmount === "" ? totalAmount : parseFloat(paidAmount),
        items: itemsPayload,
      };

      if (paymentMode.toLowerCase() === "finance") {
        billData.financeProviderId = financeProviderId;
        billData.emiAmount = emiAmount;
        billData.financeMonths = financeMonths;
      }

      const bill = await createBill(billData);
      setCreatedBill(bill);
      setShowPrintModal(true);
      
      // Auto-send WhatsApp if phone number exists
      if (billData.customerPhone) {
        try {
          const { generateBillPdfBlob } = await import("@/lib/client-pdf");
          const blob = await generateBillPdfBlob(bill);
          const formData = new FormData();
          formData.append("file", blob, `SKC_Invoice_${bill.billNumber}.pdf`);
          formData.append("customerName", billData.customerName);
          formData.append("mobileNumber", billData.customerPhone);
          formData.append("billNumber", bill.billNumber);
          
          // Don't await this so it happens in the background
          fetch(`/api/v1/bills/${bill.id}/whatsapp/upload`, {
            method: "POST",
            body: formData,
          }).catch(err => console.error("Auto-whatsapp send failed", err));
        } catch (err) {
          console.error("Auto PDF generation failed", err);
        }
      }

      // Don't clear form here — wait until print modal is closed
      // so the modal can still access customerName for display
    } catch (err: any) {
      setError(err.message || "Failed to create invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `SKC_Invoice_${createdBill?.billNumber || ""}`,
  });

  const closePrintModal = () => {
    setShowPrintModal(false);
    setCreatedBill(null);
    setCart([]);
    setPhone("");
    setCustomerName("");
    setDiscount("0");
    setPaidAmount("");
    setSgstPercent("0");
    setCgstPercent("0");
    setIgstPercent("0");
    setFinanceProviderId("");
    setEmiAmount("");
    setFinanceMonths("");
  };

  // Shareable render invoice helper
  const renderInvoiceContent = (
    isDraft: boolean,
    billNumber: string,
    createdAt: string | Date,
    custName: string,
    custPhone: string,
    cartItems: any[],
    subtotalVal: number,
    discountVal: number,
    totalVal: number,
    sgstPercentVal: string = "0",
    cgstPercentVal: string = "0",
    igstPercentVal: string = "0"
  ) => {
    const taxableAmt = subtotalVal - discountVal;
    const sAmt = taxableAmt * (parseFloat(sgstPercentVal || "0") / 100);
    const cAmt = taxableAmt * (parseFloat(cgstPercentVal || "0") / 100);
    const iAmt = taxableAmt * (parseFloat(igstPercentVal || "0") / 100);

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
              <svg viewBox="0 0 64 64" className="w-14 h-14 text-[#1b3f8b]" stroke="currentColor" strokeWidth="1.5" fill="none">
                <path d="M30 38 C32 30, 38 18, 48 10 C54 18, 52 30, 42 36 C38 38, 34 39, 30 38 Z" fill="#1b3f8b" fillOpacity="0.2" />
                <path d="M34 34 C36 28, 40 20, 46 15 C50 20, 48 28, 42 32 C38 34, 36 34, 34 34 Z" fill="#1b3f8b" fillOpacity="0.5" />
                <path d="M37 31 C38 27, 41 23, 44 20 C46 23, 44 27, 41 28 Z" fill="#1b3f8b" />
                <path d="M25 42 C22 32, 12 20, 6 20" />
                <line x1="4" y1="58" x2="60" y2="22" strokeWidth="2" strokeLinecap="round" />
                <circle cx="14" cy="52" r="1.5" fill="currentColor" />
                <circle cx="22" cy="47" r="1.5" fill="currentColor" />
                <circle cx="30" cy="42" r="1.5" fill="currentColor" />
                <circle cx="38" cy="37" r="1.5" fill="currentColor" />
                <circle cx="46" cy="32" r="1.5" fill="currentColor" />
              </svg>
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

        {/* Metadata */}
        <div className="grid grid-cols-2 border border-[#1b3f8b] mb-3 text-[10px]">
          <div className="p-2 border-r border-[#1b3f8b] flex flex-col justify-between min-h-[50px]">
            <div>
              <span className="font-extrabold text-[#1b3f8b]">M/s. </span>
              <span className="underline font-bold text-gray-800">
                {custName || "Guest Customer"}
              </span>
            </div>
            {custPhone && (
              <div className="mt-1">
                <span className="font-extrabold text-[#1b3f8b]">Phone: </span>
                <span className="font-bold">{custPhone}</span>
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
              const pName = item.product ? item.product.name : item.name;
              const pRate = item.product ? item.product.sellingPrice : parseFloat(item.unitPrice || "0");
              const pQty = item.quantity;
              const pTotal = item.product ? (item.product.sellingPrice * item.quantity) : parseFloat(item.lineTotal || "0");
              const imei = item.productUnit?.imeiNumber || ((item.product?.productType === "serialized" || item.product?.productType === "electronics") && item.product.units?.find((u: any) => u.id.toString() === item.selectedUnitId)?.imeiNumber);

              return (
                <tr key={idx} className="border-b border-[#1b3f8b]">
                  <td className="border-r border-[#1b3f8b] p-1.5 text-left">{idx + 1}</td>
                  <td className="border-r border-[#1b3f8b] p-1.5 text-left">
                    <div className="font-bold text-gray-800">{pName}</div>
                    {imei && (
                      <div className="text-[8px] text-gray-600 font-semibold mt-0.5">
                        {item.product?.productType === "electronics" ? "S M No." : "IMEI"}: {imei}
                      </div>
                    )}
                  </td>
                  <td className="border-r border-[#1b3f8b] p-1.5 text-center font-bold">{pQty}</td>
                  <td className="border-r border-[#1b3f8b] p-1.5 text-right font-bold">₹{pRate}</td>
                  <td className="p-1.5 text-right font-bold">₹{pTotal}</td>
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
            <div className="border border-[#1b3f8b] p-2 text-[8px] leading-normal text-gray-800">
              <div className="font-extrabold text-[#1b3f8b] underline mb-1 uppercase text-[9px]">Bank Details:</div>
              <div>Bank : <span className="font-bold">State Bank of India</span></div>
              <div>IFSE : <span className="font-bold">SBIN0032015</span></div>
              <div>A/c No. : <span className="font-bold">61181530264</span></div>
              <div>A/c No. : <span className="font-bold">61130908984</span></div>
            </div>
          </div>

          <div className="border border-[#1b3f8b] text-[10px]">
            <div className="flex justify-between p-1 border-b border-[#1b3f8b]">
              <span className="font-bold text-[#1b3f8b]">Subtotal</span>
              <span className="font-bold">₹{subtotalVal}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between p-1 border-b border-[#1b3f8b] text-red-600 bg-red-50/50">
                <span className="font-bold">Discount</span>
                <span className="font-bold">- ₹{discountVal}</span>
              </div>
            )}
            <div className="flex justify-between p-1 border-b border-[#1b3f8b] bg-gray-50/50">
              <span className="font-bold text-[#1b3f8b]">Taxable Amount</span>
              <span className="font-bold">₹{taxableAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-1 border-b border-[#1b3f8b]">
              <span className="font-bold text-[#1b3f8b]">CGST ({cgstPercentVal}%)</span>
              <span>₹{cAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-1 border-b border-[#1b3f8b]">
              <span className="font-bold text-[#1b3f8b]">SGST ({sgstPercentVal}%)</span>
              <span>₹{sAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-1 border-b border-[#1b3f8b]">
              <span className="font-bold text-[#1b3f8b]">IGST ({igstPercentVal}%)</span>
              <span>₹{iAmt.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-1 font-black bg-blue-50/30 text-[#1b3f8b] text-xs">
              <span>G.Total</span>
              <span>₹{totalVal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 text-[10px]">
          <span className="font-extrabold text-[#1b3f8b]">Rs. (In Word): </span>
          <span className="italic underline font-bold text-gray-800">
            {numberToWords(totalVal)}
          </span>
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
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-[calc(100vh-8rem)]">
      
      {/* LEFT: Live Invoice Preview */}
      <div className="xl:col-span-2 flex flex-col justify-start bg-gray-50 border border-gray-200 p-4 rounded-xl overflow-y-auto max-h-full">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Live Bill Preview</span>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">Real-time update</span>
        </div>
        {renderInvoiceContent(
          true,
          "DRAFT",
          new Date(),
          customerName,
          phone,
          cart,
          subtotal,
          parseFloat(discount || "0"),
          totalAmount,
          sgstPercent,
          cgstPercent,
          igstPercent
        )}
      </div>

      {/* RIGHT: Input form & Terminal */}
      <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2 flex items-center justify-between">
          <span>POS Billing Terminal</span>
          <span className="text-xs text-red-500 font-normal">* Required fields</span>
        </h2>

        {error && <div className="mb-4 text-red-600 bg-red-50 p-3 border border-red-100 rounded-lg text-sm font-semibold">{error}</div>}

        {/* Product Search - Required highlight */}
        <div className="mb-5">
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Search & Add Products <span className="text-red-500">*</span>
          </label>
          <div className="relative flex gap-2">
            <input
              type="text"
              placeholder="Type brand, product name, or scan barcode..."
              className="w-full border-2 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-4 py-2 text-sm font-medium transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={() => setShowScanner(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg font-bold flex items-center justify-center transition shadow-sm whitespace-nowrap"
            >
              <FaCamera className="mr-2" /> Scan
            </button>
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 bg-white border border-gray-200 mt-1 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between border-b last:border-0"
                    onClick={() => addToCart(p)}
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{p.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({p.brand})</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-900 font-bold mr-3">₹{p.sellingPrice}</span>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        In Stock: {p.quantityInStock}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Item Listing - Required highlight */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg mb-5 min-h-[150px]">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <span className="text-3xl mb-2">🛒</span>
              <span className="text-sm font-semibold">Cart is currently empty</span>
              <span className="text-xs text-gray-400 mt-1">Search above to add products to the invoice</span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase">Item</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase">Qty / IMEI</th>
                  <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2.5 text-right text-xs font-bold text-gray-500 uppercase"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {cart.map((item, idx) => (
                  <tr key={`${item.product.id}-${idx}`} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-bold text-gray-900">{item.product.name}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{item.product.productType}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-medium">
                      ₹{item.product.sellingPrice}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {item.product.productType === "serialized" || item.product.productType === "electronics" ? (
                        <select
                          className="border border-gray-300 rounded-md px-2 py-1 text-xs max-w-[180px] font-medium focus:ring-1 focus:ring-blue-500"
                          value={item.selectedUnitId}
                          onChange={(e) => updateSelectedUnit(item.product.id, e.target.value)}
                        >
                          {item.product.units?.map((u: any) => (
                            <option key={u.id} value={u.id}>
                              {u.imeiNumber}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          max={item.product.quantityInStock}
                          className="border border-gray-300 rounded-md px-2 py-1 text-xs w-16 text-center font-semibold focus:ring-1 focus:ring-blue-500"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product.id, Math.min(item.product.quantityInStock, Math.max(1, parseInt(e.target.value) || 1)))}
                          onKeyDown={(e) => handleNumberKeyDown(e, false)}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900 text-right">
                      ₹{item.product.sellingPrice * item.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                      <button
                        onClick={() => removeFromCart(item.product.id, item.selectedUnitId)}
                        className="text-red-600 hover:text-red-900 font-bold"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Inputs forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
          
          {/* Customer Phone */}
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Customer Phone (10 digits)
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                placeholder="e.g. 9876543210"
                maxLength={10}
                className={`block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-100 ${
                  phone && phone.length !== 10
                    ? "border-amber-400 focus:border-amber-500"
                    : "border-gray-300 focus:border-blue-600"
                }`}
                value={phone}
                onChange={handlePhoneChange}
                onKeyDown={(e) => handleNumberKeyDown(e, false)}
              />
              {isSearchingCustomer && <span className="absolute right-3 top-2.5 text-xs text-blue-500 font-bold">Searching...</span>}
            </div>
            {phone && phone.length !== 10 && (
              <span className="text-[10px] text-amber-600 font-bold mt-1 block">Phone must be exactly 10 digits</span>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Customer Name {phone.trim().length > 0 && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              placeholder={phone.trim().length > 0 ? "Enter customer name..." : "Guest Customer"}
              className={`mt-1 block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
                phone.trim().length > 0 && customerName.trim() === ""
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                  : "border-gray-300 focus:border-blue-600 focus:ring-blue-100"
              }`}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            {phone.trim().length > 0 && customerName.trim() === "" && (
              <span className="text-[10px] text-red-500 font-bold mt-1 block">Name is required when phone is entered</span>
            )}
          </div>

          {/* Payment Method - Highlighted selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Payment Mode <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {["cash", "upi", "card", "finance"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`py-2 text-center rounded-lg border-2 capitalize text-xs font-bold transition ${
                    paymentMode === mode
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Finance Fields */}
          {paymentMode === "finance" && (
            <div className="grid grid-cols-5 gap-3 mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 truncate">Finance Provider</label>
                <div className="relative mt-1">
                  <select
                    className="peer appearance-none block w-full border-2 border-gray-300 rounded-lg py-2 pl-2 pr-6 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
                    value={financeProviderId}
                    onChange={(e) => {
                      setFinanceProviderId(e.target.value);
                      e.target.blur();
                    }}
                  >
                    <option value="">Select...</option>
                    {financeProviders.map(provider => (
                      <option key={provider.id} value={provider.id}>{provider.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500 peer-focus:rotate-90 transition-transform duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 truncate">EMI Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg py-2 px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
                  value={emiAmount}
                  onChange={(e) => setEmiAmount(e.target.value)}
                  onKeyDown={(e) => handleNumberKeyDown(e, true)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-gray-700 truncate">Months</label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 block w-full border-2 border-gray-300 rounded-lg py-2 px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
                  value={financeMonths}
                  onChange={(e) => setFinanceMonths(e.target.value)}
                  onKeyDown={(e) => handleNumberKeyDown(e, false)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>
            </div>
          )}

          {/* Discount Amount */}
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Discount Amount (₹)
            </label>
            <input
              type="number"
              min="0"
              max={subtotal}
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              onKeyDown={(e) => handleNumberKeyDown(e, true)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
        </div>

        {/* GST Tax Inputs */}
        <div className="grid grid-cols-3 gap-4 border-t pt-4 mt-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">SGST (%)</label>
            <input
              type="number" min="0" max="100"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
              value={sgstPercent} onChange={(e) => setSgstPercent(e.target.value)} onKeyDown={(e) => handleNumberKeyDown(e, true)} onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">CGST (%)</label>
            <input
              type="number" min="0" max="100"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
              value={cgstPercent} onChange={(e) => setCgstPercent(e.target.value)} onKeyDown={(e) => handleNumberKeyDown(e, true)} onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">IGST (%)</label>
            <input
              type="number" min="0" max="100"
              className="mt-1 block w-full border-2 border-gray-300 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition"
              value={igstPercent} onChange={(e) => setIgstPercent(e.target.value)} onKeyDown={(e) => handleNumberKeyDown(e, true)} onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
        </div>

        {/* Amount Paid */}
        <div className="border-t pt-4 mt-4">
          <label className="block text-sm font-bold text-gray-700">
            Amount Paid (₹) <span className="text-gray-400 text-xs ml-1 font-normal">(Leave empty if full payment)</span>
          </label>
          <input
            type="number" min="0" max={totalAmount}
            className="mt-1 block w-full border-2 border-gray-300 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition bg-green-50"
            placeholder={`e.g. ${totalAmount}`}
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            onKeyDown={(e) => handleNumberKeyDown(e, true)}
            onWheel={(e) => (e.target as HTMLInputElement).blur()}
          />
        </div>

        {/* Generate Invoice Button */}
        <div className="border-t pt-4 mt-4">
          <button
            onClick={handleCheckout}
            disabled={isSaving || cart.length === 0 || (phone.trim().length > 0 && customerName.trim() === "")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
          >
            {isSaving ? "Creating Invoice..." : "Generate & Print Invoice"}
          </button>
        </div>

      </div>

      {/* PRINT RECEIPT MODAL */}
      {showPrintModal && createdBill && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center rounded-t-lg">
              <h3 className="text-lg font-bold text-gray-900">Tax Invoice Generated Successfully</h3>
              <button
                onClick={closePrintModal}
                className="text-gray-400 hover:text-gray-500 text-2xl font-semibold focus:outline-none"
              >
                &times;
              </button>
            </div>

            {/* Printable Area - identical structure */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
              <div
                ref={printComponentRef}
                className="p-1"
                style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}
              >
                {renderInvoiceContent(
                  false,
                  createdBill.billNumber,
                  createdBill.createdAt,
                  createdBill.customer?.name || customerName || "Guest Customer",
                  createdBill.customer?.phone || phone,
                  createdBill.billItems,
                  parseFloat(createdBill.subtotal),
                  parseFloat(createdBill.discount),
                  parseFloat(createdBill.totalAmount),
                  createdBill.sgstPercent?.toString(),
                  createdBill.cgstPercent?.toString(),
                  createdBill.igstPercent?.toString()
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-lg">
              <button
                onClick={closePrintModal}
                className="bg-white border border-gray-300 rounded-md py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md py-2 px-5 text-sm"
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <CameraScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
