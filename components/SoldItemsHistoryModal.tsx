"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Loader2 } from "lucide-react";

interface Category {
  id: number;
  name: string;
  parentCategoryId: number | null;
}

export default function SoldItemsHistoryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategory, setParentCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch categories on mount
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      fetch("/api/v1/categories")
        .then(res => res.json())
        .then(data => setCategories(data))
        .catch(err => console.error("Error fetching categories:", err));
    }
  }, [isOpen, categories.length]);

  // Fetch data
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchItems = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: "20"
        });
        
        if (subCategory) {
          query.append("subCategoryId", subCategory);
        } else if (parentCategory) {
          query.append("parentCategoryId", parentCategory);
        }
        if (fromDate) query.append("fromDate", fromDate);
        if (toDate) query.append("toDate", toDate);

        const res = await fetch(`/api/v1/dashboard/sold-items?${query.toString()}`);
        const data = await res.json();
        
        if (data.items) {
          if (page === 1) {
            setItems(data.items);
          } else {
            setItems(prev => [...prev, ...data.items]);
          }
          setHasMore(data.hasMore);
        }
      } catch (err) {
        console.error("Failed to fetch sold items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [isOpen, page, parentCategory, subCategory, fromDate, toDate]);

  // Reset page and items when filters change
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [parentCategory, subCategory, fromDate, toDate]);

  if (!isOpen) return null;

  const parents = categories.filter(c => !c.parentCategoryId);
  const subs = parentCategory 
    ? categories.filter(c => c.parentCategoryId === parseInt(parentCategory))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Sold Items History</h2>
            <p className="text-sm text-gray-500">View and filter all historical sales</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b bg-white grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Parent Category</label>
            <select
              value={parentCategory}
              onChange={(e) => {
                setParentCategory(e.target.value);
                setSubCategory("");
              }}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Categories</option>
              {parents.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subcategory</label>
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              disabled={!parentCategory}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:opacity-50"
            >
              <option value="">All Subcategories</option>
              {subs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50/30">
          <div className="border rounded-xl bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Bill No</th>
                  <th className="px-4 py-3">Product details</th>
                  <th className="px-4 py-3">IMEI / SN No.</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No sold items found.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const isLast = items.length === index + 1;
                    const date = new Date(item.bill.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric"
                    });
                    
                    const isAccessory = item.product?.productType === "accessory";
                    const identifier = isAccessory ? "NA" : (item.productUnit?.imeiNumber || "NA");
                    const billNo = item.bill?.billNumber || "N/A";
                    const customerName = item.bill?.customer?.name;
                    
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-blue-50/50 transition-colors group"
                        ref={isLast ? lastElementRef : null}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{billNo}</div>
                          {customerName && (
                            <div className="text-s text-blue-800 mt-0.5 opacity-90">{customerName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                            {item.product?.brand || "Brand"}
                          </div>
                          <div className="font-medium text-gray-900">
                            {item.product?.name || "Product"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            identifier === 'NA' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {identifier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          ₹{parseFloat(item.lineTotal).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                            item.bill?.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 
                            item.bill?.paymentStatus === 'DUE' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.bill?.paymentStatus || "UNKNOWN"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            
            {loading && (
              <div className="p-6 flex justify-center items-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
