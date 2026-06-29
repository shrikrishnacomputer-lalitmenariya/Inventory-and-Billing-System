"use client";

import { useState, useEffect, useCallback } from "react";
import { getProducts, getCategories, updateProduct, deleteProduct, createCategory } from "@/lib/api/inventory";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import CategorySelector from "@/components/CategorySelector";
import CameraScanner from "@/components/CameraScanner";
import { FaCamera, FaSpinner, FaSearch } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [showStockScanner, setShowStockScanner] = useState(false);

  // Edit modal states
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    brand: "",
    categoryId: "",
    costPrice: "",
    sellingPrice: "",
    lowStockThreshold: "",
    imageUrl: "",
    barcode: "",
  });
  const [editImageSourceType, setEditImageSourceType] = useState<"file" | "url">("file");
  const [editFileInputKey, setEditFileInputKey] = useState(Date.now());
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const [showEditScanner, setShowEditScanner] = useState(false);
  const [isFetchingAPI, setIsFetchingAPI] = useState(false);

  // Category Selector states are fully encapsulated in CategorySelector component

  useEffect(() => {
    loadData();
  }, [search, selectedCategory]);

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

  const handleStockScanSuccess = useCallback(async (code: string) => {
    setShowStockScanner(false);
    try {
      const res = await fetch(`/api/v1/products/scan?code=${encodeURIComponent(code)}`);
      if (!res.ok) {
        alert("Product not found for this barcode.");
        return;
      }
      const result = await res.json();
      const product = result.data;
      router.push(`/inventory/${product.id}/stock`);
    } catch (err) {
      console.error(err);
      alert("Error finding product.");
    }
  }, [router]);

  const fetchProductDetails = async (barcode: string) => {
    if (!barcode) return;
    setIsFetchingAPI(true);
    try {
      const res = await fetch(`/api/v1/proxy/upc?upc=${encodeURIComponent(barcode)}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data && data.items && data.items.length > 0) {
        const item = data.items[0];
        setEditFormData((prev) => ({
          ...prev,
          name: item.title || prev.name,
          brand: item.brand || prev.brand,
          imageUrl: (item.images && item.images.length > 0) ? item.images[0] : prev.imageUrl
        }));
        if (item.images && item.images.length > 0) {
          setEditImageSourceType("url");
        }
      } else {
        alert("Product details not found in global database.");
      }
    } catch (err) {
      console.error("Failed to fetch from UPC API:", err);
      alert("Could not fetch product details automatically.");
    } finally {
      setIsFetchingAPI(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        getProducts(selectedCategory, search),
        getCategories()
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      brand: product.brand || "",
      categoryId: product.categoryId.toString(),
      costPrice: product.costPrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      lowStockThreshold: product.lowStockThreshold.toString(),
      imageUrl: product.imageUrl || "",
      barcode: product.barcode || "",
    });
    setEditImageSourceType(product.imageUrl?.startsWith("data:") ? "file" : "url");
    setEditError("");
  };

  const handleCreateCategory = async (name: string, parentCategoryId?: number) => {
    try {
      const cat = await createCategory({ name, parentCategoryId });
      setCategories((prev) => [...prev, cat]);
      return cat;
    } catch (err) {
      setEditError("Failed to create category");
      throw err;
    }
  };

  const handleDeleteClick = async (productId: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId);
        loadData();
      } catch (err: any) {
        alert(err.message || "Failed to delete product");
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError("");

    const threshold = parseInt(editFormData.lowStockThreshold) || 0;
    if (threshold <= 0) {
      setEditError("Low Stock Threshold must be a positive number.");
      setSavingEdit(false);
      return;
    }

    try {
      await updateProduct(editingProduct.id, {
        name: editFormData.name,
        brand: editFormData.brand,
        categoryId: parseInt(editFormData.categoryId),
        costPrice: parseFloat(editFormData.costPrice),
        sellingPrice: parseFloat(editFormData.sellingPrice),
        lowStockThreshold: threshold,
        imageUrl: editFormData.imageUrl || null,
        barcode: editFormData.barcode || null,
      });
      setEditingProduct(null);
      loadData();
    } catch (err: any) {
      setEditError(err.message || "Failed to update product");
      setSavingEdit(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Inventory</h2>
        {role === "owner" && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowStockScanner(true)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold flex items-center justify-center shadow-sm"
              title="Scan barcode to quickly find product and add stock"
            >
              <FaCamera className="mr-2" /> Scan to Add Stock
            </button>
            <Link
              href="/inventory/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-bold shadow-sm"
            >
              + Add Product
            </Link>
          </div>
        )}
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="flex-1 border border-gray-300 rounded px-4 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="w-72">
          <CategorySelector
            categories={categories}
            selectedCategoryId={selectedCategory?.toString() || ""}
            onChange={(catId) => setSelectedCategory(catId ? Number(catId) : undefined)}
            showAllOption={true}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading inventory...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                {role === "owner" && (
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost Price</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                {role === "owner" && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 object-contain rounded border border-gray-200 bg-white"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-[10px] font-bold">
                          No Img
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.brand && <div className="text-sm text-gray-500">{product.brand}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category?.name}
                  </td>
                  {role === "owner" && (
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{product.costPrice}
                     </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{product.sellingPrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.quantityInStock <= product.lowStockThreshold 
                        ? "bg-red-100 text-red-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {product.quantityInStock}
                    </span>
                  </td>
                  {role === "owner" && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link
                        href={`/inventory/${product.id}/stock`}
                        className="inline-block text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors text-xs font-bold"
                      >
                        + Stock
                      </Link>
                      <button
                        onClick={() => handleEditClick(product)}
                        className="text-amber-600 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors text-xs font-bold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors text-xs font-bold"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={role === "owner" ? 6 : 4} className="px-6 py-4 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full h-[85vh] min-h-[600px] p-8 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 border-b pb-3 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-800">Edit Product Details</h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {editError && (
              <div className="mb-4 text-red-600 bg-red-50 p-3 rounded border border-red-100 text-sm font-semibold flex-shrink-0">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6 flex flex-col justify-between">
              <div className="space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Product Name</label>
                    <input
                      type="text"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Brand</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.brand}
                      onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                    <CategorySelector
                      categories={categories}
                      selectedCategoryId={editFormData.categoryId}
                      onChange={(catId) => setEditFormData({ ...editFormData, categoryId: catId })}
                      onAddCategory={handleCreateCategory}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Barcode (Optional)</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        placeholder="Scan or type barcode"
                        className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={editFormData.barcode}
                        onChange={(e) => setEditFormData({ ...editFormData, barcode: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditScanner(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-md flex items-center justify-center transition shadow-sm"
                        title="Scan Barcode to Auto-Fill"
                      >
                        <FaCamera />
                      </button>
                      <button
                        type="button"
                        onClick={() => fetchProductDetails(editFormData.barcode)}
                        disabled={!editFormData.barcode || isFetchingAPI}
                        className="bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700 px-3 rounded-md flex items-center justify-center transition disabled:opacity-50"
                        title="Fetch Details from Barcode"
                      >
                        {isFetchingAPI ? <FaSpinner className="animate-spin text-blue-600" /> : <FaSearch />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Product Image Section */}
                <div className="border border-gray-200 rounded-lg p-5 bg-gray-50/50">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Product Image</label>
                  <div className="flex gap-3 mb-3">
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                        editImageSourceType === "file"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setEditImageSourceType("file")}
                    >
                      Upload Local File
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                        editImageSourceType === "url"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => setEditImageSourceType("url")}
                    >
                      Image URL
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    {editFormData.imageUrl ? (
                      <div className="relative w-28 h-28 border border-gray-300 rounded-lg overflow-hidden bg-white flex items-center justify-center group shadow-sm flex-shrink-0">
                        <img
                          src={editFormData.imageUrl}
                          alt="Product preview"
                          className="object-contain w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData({ ...editFormData, imageUrl: "" });
                            setEditFileInputKey(Date.now());
                          }}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="w-28 h-28 border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-100/50 text-gray-400 text-xs flex-shrink-0">
                        No Image Selected
                      </div>
                    )}

                    <div className="flex-1">
                      {editImageSourceType === "file" ? (
                        <div>
                          <input
                            key={editFileInputKey}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  setEditError("Image size must be less than 5MB.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setEditFormData({ ...editFormData, imageUrl: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 file:hover:bg-blue-100 cursor-pointer"
                          />
                          <span className="text-[10px] text-gray-500 mt-1 block">Supports JPG, PNG, WEBP (Max 5MB)</span>
                        </div>
                      ) : (
                        <input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={editFormData.imageUrl.startsWith("data:") ? "" : editFormData.imageUrl}
                          onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.costPrice}
                      onChange={(e) => setEditFormData({ ...editFormData, costPrice: e.target.value })}
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
                      className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={editFormData.sellingPrice}
                      onChange={(e) => setEditFormData({ ...editFormData, sellingPrice: e.target.value })}
                      onKeyDown={(e) => handleNumberKeyDown(e, true)}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700">Low Stock Threshold</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 5"
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={editFormData.lowStockThreshold}
                    onChange={(e) => {
                      const cleanValue = e.target.value.replace(/\D/g, "");
                      setEditFormData({ ...editFormData, lowStockThreshold: cleanValue });
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-white border border-gray-300 rounded-md py-2 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-blue-600 border border-transparent rounded-md py-2 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 font-bold"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStockScanner && (
        <CameraScanner
          onScanSuccess={handleStockScanSuccess}
          onClose={() => setShowStockScanner(false)}
        />
      )}

      {showEditScanner && (
        <CameraScanner
          onScanSuccess={useCallback(async (code: string) => {
            setShowEditScanner(false);
            if (code.length === 15 && /^\d+$/.test(code)) {
              alert(`Scanned code ${code} is an IMEI. You cannot add initial stock when editing. Please go to the Inventory list and click "Scan to Add Stock" to add this device.`);
            } else {
              setEditFormData((prev) => ({ ...prev, barcode: code }));
              await fetchProductDetails(code);
            }
          }, [])}
          onClose={() => setShowEditScanner(false)}
        />
      )}
    </div>
  );
}
