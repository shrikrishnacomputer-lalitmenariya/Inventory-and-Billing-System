"use client";

import { useState, useEffect, useCallback } from "react";
import { getCategories, createCategory, createProduct } from "@/lib/api/inventory";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import CategorySelector from "@/components/CategorySelector";
import CameraScanner from "@/components/CameraScanner";
import { FaCamera, FaSpinner, FaSearch } from "react-icons/fa";

export default function NewProductPage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [isFetchingAPI, setIsFetchingAPI] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    categoryId: "",
    productType: "quantity",
    costPrice: "",
    sellingPrice: "",
    lowStockThreshold: "5",
    initialQuantity: "0",
    imeis: "",
    imageUrl: "",
    barcode: "",
  });

  const [imageSourceType, setImageSourceType] = useState<"file" | "url">("file");
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  // Category Selector states are fully encapsulated in CategorySelector component

  useEffect(() => {
    if (!authLoading && role !== "owner") {
      router.push("/inventory");
    }
    loadCategories();
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

  const handleScanSuccess = useCallback(async (code: string) => {
    setShowScanner(false);
    
    // Distinguish between IMEI (15 digits) and Barcode
    if (code.length === 15 && /^\d+$/.test(code)) {
      setFormData((prev) => {
        const existing = prev.imeis ? prev.imeis + ", " : "";
        return { ...prev, imeis: existing + code, productType: "serialized" };
      });
      alert(`IMEI ${code} added to initial stock. You can scan again for more.`);
    } else {
      setFormData((prev) => ({ ...prev, barcode: code }));
      await fetchProductDetails(code);
    }
  }, []);

  const fetchProductDetails = async (barcode: string) => {
    if (!barcode) return;
    setIsFetchingAPI(true);
    try {
      const res = await fetch(`/api/v1/proxy/upc?upc=${encodeURIComponent(barcode)}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data && data.items && data.items.length > 0) {
        const item = data.items[0];
        setFormData((prev) => ({
          ...prev,
          name: item.title || prev.name,
          brand: item.brand || prev.brand,
          imageUrl: (item.images && item.images.length > 0) ? item.images[0] : prev.imageUrl
        }));
        if (item.images && item.images.length > 0) {
          setImageSourceType("url");
        }
      } else {
        alert("Product details not found in global database. You can enter them manually.");
      }
    } catch (err) {
      console.error("Failed to fetch from UPC API:", err);
      alert("Could not fetch product details automatically. Please enter them manually.");
    } finally {
      setIsFetchingAPI(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (name: string, parentCategoryId?: number) => {
    try {
      const cat = await createCategory({ name, parentCategoryId });
      setCategories((prev) => [...prev, cat]);
      return cat;
    } catch (err) {
      setError("Failed to create category");
      throw err;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (value: string) => {
    setFormData({ ...formData, imageUrl: value });
  };

  const handleClearImage = () => {
    setFormData({ ...formData, imageUrl: "" });
    setFileInputKey(Date.now());
  };

  const handleThresholdChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, ""); // Remove all non-digits
    setFormData({ ...formData, lowStockThreshold: cleanValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const threshold = parseInt(formData.lowStockThreshold) || 0;
    if (threshold <= 0) {
      setError("Low Stock Threshold must be a positive number.");
      setLoading(false);
      return;
    }
    
    try {
      const payload = {
        categoryId: formData.categoryId,
        name: formData.name,
        brand: formData.brand,
        productType: formData.productType,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        lowStockThreshold: threshold,
        initialQuantity: formData.productType === "quantity" ? parseInt(formData.initialQuantity) || 0 : 0,
        imeis: (formData.productType === "serialized" || formData.productType === "electronics")
          ? formData.imeis.split(",").map(i => i.trim()).filter(Boolean)
          : [],
        imageUrl: formData.imageUrl || undefined,
        barcode: formData.barcode || undefined,
      };

      await createProduct(payload);
      router.push("/inventory");
    } catch (err: any) {
      setError(err.message || "Failed to create product");
      setLoading(false);
    }
  };

  if (authLoading || role !== "owner") return null;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6 font-sans text-gray-800 border-b pb-3">Add New Product</h2>
      
      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded border border-red-100 font-semibold">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Product Name</label>
            <input
              type="text"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Brand</label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
            <CategorySelector
              categories={categories}
              selectedCategoryId={formData.categoryId}
              onChange={(catId) => setFormData({ ...formData, categoryId: catId })}
              onAddCategory={handleCreateCategory}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Barcode (Optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Scan or type barcode"
                className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-md flex items-center justify-center transition shadow-sm"
                title="Scan Barcode to Auto-Fill"
              >
                <FaCamera />
              </button>
              <button
                type="button"
                onClick={() => fetchProductDetails(formData.barcode)}
                disabled={!formData.barcode || isFetchingAPI}
                className="bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700 px-3 rounded-md flex items-center justify-center transition disabled:opacity-50"
                title="Fetch Details from Barcode"
              >
                {isFetchingAPI ? <FaSpinner className="animate-spin text-blue-600" /> : <FaSearch />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">Product Type</label>
          <select
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.productType}
            onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
          >
            <option value="quantity">Quantity Based (e.g. Chargers, Cables)</option>
            <option value="serialized">Serialized (e.g. Mobile Phones with IMEIs)</option>
            <option value="electronics">Electronics (with S M No.)</option>
          </select>
        </div>

        {/* Product Image Section */}
        <div className="border border-gray-200 rounded-md p-4 bg-gray-50/50">
          <label className="block text-sm font-bold text-gray-700 mb-2">Product Image</label>
          <div className="flex gap-4 mb-3">
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                imageSourceType === "file"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setImageSourceType("file")}
            >
              Upload Local Image
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                imageSourceType === "url"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => setImageSourceType("url")}
            >
              Image URL
            </button>
          </div>

          <div className="flex items-center gap-4">
            {formData.imageUrl ? (
              <div className="relative w-20 h-20 border border-gray-300 rounded-md overflow-hidden bg-white flex items-center justify-center group shadow-sm">
                <img
                  src={formData.imageUrl}
                  alt="Product preview"
                  className="object-contain w-full h-full"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-100/50 text-gray-400 text-xs">
                No Image
              </div>
            )}

            <div className="flex-1">
              {imageSourceType === "file" ? (
                <div>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 file:hover:bg-blue-100 cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Supports JPG, PNG, WEBP (Max 5MB)</span>
                </div>
              ) : (
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.imageUrl.startsWith("data:") ? "" : formData.imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700">Cost Price (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              onKeyDown={(e) => handleNumberKeyDown(e, true)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Selling Price (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={formData.sellingPrice}
              onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
              onKeyDown={(e) => handleNumberKeyDown(e, true)}
              onWheel={(e) => (e.target as HTMLInputElement).blur()}
            />
          </div>
        </div>

        {/* Initial Stock Setup Field */}
        <div className="border-t pt-4 mt-4 space-y-4">
          <h3 className="text-sm font-bold text-gray-800">Initial Stock Setup</h3>
          {formData.productType === "quantity" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">Initial Stock Quantity</label>
              <input
                type="number"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.initialQuantity}
                onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
                onKeyDown={(e) => handleNumberKeyDown(e, false)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {formData.productType === "electronics"
                    ? "Initial S M Numbers (Comma Separated)"
                    : "Initial IMEIs (Comma Separated)"}
                </label>
                <textarea
                  placeholder={
                    formData.productType === "electronics"
                      ? "e.g. SN1000234, SN1000235"
                      : "e.g. 866365081122723, 866365081122724"
                  }
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.imeis}
                  onChange={(e) => setFormData({ ...formData, imeis: e.target.value })}
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {formData.productType === "electronics"
                    ? "Separate multiple S M Numbers with commas. The initial stock will count the number of entered S M Numbers."
                    : "Separate multiple IMEI numbers with commas. The initial stock will count the number of entered IMEIs."}
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700">Low Stock Threshold</label>
          <input
            type="text"
            required
            placeholder="e.g. 5"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={formData.lowStockThreshold}
            onChange={(e) => handleThresholdChange(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.push("/inventory")}
            className="bg-white border border-gray-300 rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 border border-transparent rounded-md shadow-sm py-2 px-4 inline-flex justify-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>

      {showScanner && (
        <CameraScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
