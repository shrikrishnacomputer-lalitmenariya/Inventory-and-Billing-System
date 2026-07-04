"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getProducts } from "@/lib/api/inventory";
import { searchCustomer, createBill } from "@/lib/api/billing";
import { useReactToPrint } from "react-to-print";
import { useAuth } from "@/hooks/useAuth";
import CameraScanner from "@/components/CameraScanner";
import InvoiceTemplate from "@/components/InvoiceTemplate";
import { FaCamera } from "react-icons/fa";

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
  const [discount, setDiscount] = useState("");
  const [sgstPercent, setSgstPercent] = useState("");
  const [cgstPercent, setCgstPercent] = useState("");
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

  // UPI QR Modal State
  const [showUpiModal, setShowUpiModal] = useState(false);

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

  const totalAmount = taxableAmount + sgstAmt + cgstAmt;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Please add at least one item to the cart");
      return;
    }
    if (customerName.trim() === "") {
      setError("Customer Name is required to generate an invoice.");
      return;
    }
    if (phone.trim() === "") {
      setError("Customer Phone number is required to generate an invoice.");
      return;
    }
    if (phone.trim().length !== 10) {
      setError("Customer Phone number must be exactly 10 digits");
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
        customerName: customerName.trim(),
        customerPhone: phone.trim(),
        paymentMode,
        discount: discountVal,
        sgstPercent: parseFloat(sgstPercent || "0"),
        cgstPercent: parseFloat(cgstPercent || "0"),
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
    setFinanceProviderId("");
    setEmiAmount("");
    setFinanceMonths("");
  };



  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 h-[calc(100vh-8rem)]">
      
      {/* LEFT: Live Invoice Preview */}
      <div className="xl:col-span-2 flex flex-col justify-start bg-gray-50 border border-gray-200 p-4 rounded-xl overflow-y-auto max-h-full">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Live Bill Preview</span>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">Real-time update</span>
        </div>
        <InvoiceTemplate
          isDraft={true}
          billNumber="DRAFT"
          createdAt={new Date()}
          customerName={customerName}
          customerPhone={phone}
          cartItems={cart}
          subtotal={subtotal}
          discount={parseFloat(discount || "0")}
          totalAmount={totalAmount}
          sgstPercent={sgstPercent}
          cgstPercent={cgstPercent}
          paidAmount={paidAmount ? parseFloat(paidAmount) : totalAmount}
          dueAmount={paidAmount ? totalAmount - parseFloat(paidAmount) : 0}
          paymentMode={paymentMode}
        />
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
              Customer Phone (10 digits) <span className="text-red-500">*</span>
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
            {phone.trim() === "" ? (
              <span className="text-[10px] text-red-500 font-bold mt-1 block">Phone number is required</span>
            ) : phone.length !== 10 ? (
              <span className="text-[10px] text-amber-600 font-bold mt-1 block">Phone must be exactly 10 digits</span>
            ) : null}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-bold text-gray-700">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter customer name..."
              className={`mt-1 block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 ${
                customerName.trim() === ""
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20"
                  : "border-gray-300 focus:border-blue-600 focus:ring-blue-100"
              }`}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            {customerName.trim() === "" && (
              <span className="text-[10px] text-red-500 font-bold mt-1 block">Name is required</span>
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
                  onClick={() => {
                    setPaymentMode(mode);
                    if (mode === "upi") {
                      setShowUpiModal(true);
                    }
                  }}
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
              placeholder="0"
              className={`mt-1 block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 transition ${
                parseFloat(discount || "0") > subtotal 
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" 
                  : "border-gray-300 focus:border-blue-600 focus:ring-blue-100"
              }`}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              onKeyDown={(e) => handleNumberKeyDown(e, true)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
            {parseFloat(discount || "0") > subtotal && (
              <span className="text-[10px] text-red-500 font-bold mt-1 block">Discount cannot exceed subtotal (₹{subtotal})</span>
            )}
          </div>
        </div>

        {/* GST Tax Inputs */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">SGST (%)</label>
            <input
              type="number" min="0" max="100" placeholder="0"
              className={`mt-1 block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 transition ${
                parseFloat(sgstPercent) > 100 
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" 
                  : "border-gray-300 focus:border-blue-600 focus:ring-blue-100"
              }`}
              value={sgstPercent} onChange={(e) => setSgstPercent(e.target.value)} onKeyDown={(e) => handleNumberKeyDown(e, true)} onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
            {parseFloat(sgstPercent) > 100 && (
              <span className="text-[10px] text-red-500 font-bold mt-1 block">Invalid value. Max 100%</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">CGST (%)</label>
            <input
              type="number" min="0" max="100" placeholder="0"
              className={`mt-1 block w-full border-2 rounded-lg py-2 px-3 text-sm font-semibold focus:outline-none focus:ring-2 transition ${
                parseFloat(cgstPercent) > 100 
                  ? "border-red-400 focus:border-red-500 focus:ring-red-100 bg-red-50/20" 
                  : "border-gray-300 focus:border-blue-600 focus:ring-blue-100"
              }`}
              value={cgstPercent} onChange={(e) => setCgstPercent(e.target.value)} onKeyDown={(e) => handleNumberKeyDown(e, true)} onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
            {parseFloat(cgstPercent) > 100 && (
              <span className="text-[10px] text-red-500 font-bold mt-1 block">Invalid value. Max 100%</span>
            )}
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
            disabled={isSaving || cart.length === 0 || (phone.trim().length > 0 && customerName.trim() === "") || parseFloat(sgstPercent) > 100 || parseFloat(cgstPercent) > 100 || parseFloat(discount || "0") > subtotal}
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
                <InvoiceTemplate
                  isDraft={false}
                  billNumber={createdBill.billNumber}
                  createdAt={createdBill.createdAt}
                  customerName={createdBill.customer?.name || customerName || "Guest Customer"}
                  customerPhone={createdBill.customer?.phone || phone}
                  cartItems={createdBill.billItems}
                  subtotal={parseFloat(createdBill.subtotal)}
                  discount={parseFloat(createdBill.discount)}
                  totalAmount={parseFloat(createdBill.totalAmount)}
                  sgstPercent={createdBill.sgstPercent?.toString()}
                  cgstPercent={createdBill.cgstPercent?.toString()}
                  paidAmount={parseFloat(createdBill.paidAmount)}
                  dueAmount={parseFloat(createdBill.dueAmount)}
                  paymentMode={createdBill.paymentMode}
                />
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
      {/* UPI QR Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-2xl relative w-80 h-80 flex flex-col animate-fade-in border border-gray-100">
            <button
              onClick={() => setShowUpiModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <div className="text-center mt-2">
              <h2 className="text-xl font-black text-gray-900 mb-1">UPI Payment</h2>
              <p className="text-xs text-gray-500 font-medium">Scan QR to pay using any UPI app</p>
            </div>
            
            <div className="flex-1 flex justify-center items-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 my-4 group hover:border-blue-400 transition-colors">
              {/* Placeholder for actual QR code image */}
              <div className="text-7xl transform group-hover:scale-110 transition-transform duration-300">📱</div>
            </div>
            
            <div className="flex items-center justify-center px-4 py-2 bg-blue-50/50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-gray-700">Waiting for payment...</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
