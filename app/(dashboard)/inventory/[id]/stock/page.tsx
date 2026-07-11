"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { addStock } from "@/lib/api/inventory";

export default function AddStockPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  
  const unwrappedParams = use(params);
  const productId = unwrappedParams.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState("1");
  const [imeiInput, setImeiInput] = useState(""); // text area for pasted IMEIs
  const [costPrice, setCostPrice] = useState("");
  
  const [showEditImei, setShowEditImei] = useState(false);
  const [editingImeis, setEditingImeis] = useState<Record<number, string>>({});
  const [savingImeiId, setSavingImeiId] = useState<number | null>(null);

  const handleSaveImei = async (unitId: number, oldImei: string) => {
    const newImei = editingImeis[unitId];
    if (!newImei || newImei === oldImei) return;
    
    if (!window.confirm(`Are you sure you want to change IMEI/SN: ${oldImei} -> ${newImei}?`)) {
      return;
    }

    try {
      setSavingImeiId(unitId);
      const res = await fetch(`/api/v1/product-units/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imeiNumber: newImei }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update IMEI");
      
      alert(`Success! IMEI/SN changed from ${oldImei} to ${newImei}`);
      await loadProduct(); 
    } catch (err: any) {
      alert(err.message || "Failed to update IMEI");
    } finally {
      setSavingImeiId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && role !== "owner") {
      router.push("/inventory");
      return;
    }
    loadProduct();
  }, [authLoading, role]);

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

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/products/${productId}`);
      if (!res.ok) throw new Error("Failed to load product");
      const data = await res.json();
      setProduct(data);
      setCostPrice(data.costPrice);
      
      // Initialize editing states for IMEIs
      if (data.units) {
        const initialEdits: Record<number, string> = {};
        data.units.forEach((u: any) => {
          initialEdits[u.id] = u.imeiNumber;
        });
        setEditingImeis(initialEdits);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload: any = {
        costPrice: parseFloat(costPrice) || undefined,
      };

      if (product.productType === "serialized" || product.productType === "electronics") {
        const imeis = imeiInput
          .split(/[\n,]/)
          .map((i) => i.trim())
          .filter((i) => i.length > 0);
          
        if (imeis.length === 0) {
          throw new Error(
            product.productType === "electronics"
              ? "Please enter at least one S M Number"
              : "Please enter at least one IMEI"
          );
        }
        payload.imeis = imeis;
      } else {
        payload.quantity = parseInt(quantity);
      }

      await addStock(parseInt(productId), payload);
      router.push("/inventory");
    } catch (err: any) {
      setError(err.message || "Failed to add stock");
      setSubmitting(false);
    }
  };

  if (loading || authLoading) return <div className="text-center py-10">Loading...</div>;
  if (!product) return <div className="text-center py-10 text-red-500">Product not found</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-2 text-black">Add Stock: {product.name}</h2>
      <div className="text-gray-500 mb-6 text-sm">
        Current Stock: {product.quantityInStock} | Type: {product.productType}
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {product.productType === "serialized" || product.productType === "electronics" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {product.productType === "electronics"
                ? "S M Numbers (Comma separated or one per line)"
                : "IMEI Numbers (Comma separated or one per line)"}
            </label>
            <textarea
              required
              rows={5}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder={
                product.productType === "electronics"
                  ? "e.g. SN123456, SN123457"
                  : "e.g. 359123456789012, 359123456789013"
              }
              value={imeiInput}
              onChange={(e) => setImeiInput(e.target.value)}
            />
            <p className="mt-1 text-sm text-gray-500">
              {product.productType === "electronics"
                ? "Stock quantity will be calculated based on the number of S M Numbers provided."
                : "Stock quantity will be calculated based on the number of IMEIs provided."}
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity to Add</label>
            <input
              type="number"
              required
              min="1"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={(e) => handleNumberKeyDown(e, false)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
        )}

        {(product.productType === "serialized" || product.productType === "electronics") && product.units && product.units.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowEditImei(!showEditImei)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-2 transition"
            >
              ✏️ {showEditImei ? "Hide Existing IMEIs" : "Edit Existing IMEIs"}
            </button>
            
            {showEditImei && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                {product.units.map((unit: any) => (
                  <div key={unit.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                    <input 
                      type="text"
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
                      value={editingImeis[unit.id] || ""}
                      onChange={(e) => setEditingImeis(prev => ({ ...prev, [unit.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSaveImei(unit.id, unit.imeiNumber);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveImei(unit.id, unit.imeiNumber)}
                      disabled={savingImeiId === unit.id || editingImeis[unit.id] === unit.imeiNumber}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold disabled:opacity-50 transition"
                    >
                      {savingImeiId === unit.id ? "..." : "Save"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.push("/inventory")}
            className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Confirm Stock In"}
          </button>
        </div>
      </form>
    </div>
  );
}
