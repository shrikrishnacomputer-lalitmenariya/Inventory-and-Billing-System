"use client";

import { useState, useEffect, useRef } from "react";

interface Category {
  id: number;
  name: string;
  parentCategoryId: number | null;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string;
  onChange: (categoryId: string) => void;
  onAddCategory?: (name: string, parentCategoryId?: number) => Promise<Category>;
  showAllOption?: boolean;
}

export default function CategorySelector({
  categories,
  selectedCategoryId,
  onChange,
  onAddCategory,
  showAllOption = false,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"parents" | "subs">("parents");
  const [activeParentId, setActiveParentId] = useState<number | null>(null);

  // Add new states
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [addingError, setAddingError] = useState("");
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setNewValue("");
        setAddingError("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update activeParentId when selectedCategoryId changes, to keep it in sync
  useEffect(() => {
    if (selectedCategoryId) {
      const selectedCat = categories.find((c) => c.id.toString() === selectedCategoryId);
      if (selectedCat) {
        if (selectedCat.parentCategoryId) {
          setActiveParentId(selectedCat.parentCategoryId);
        } else {
          setActiveParentId(selectedCat.id);
        }
      }
    }
  }, [selectedCategoryId, categories]);

  const parents = categories.filter((c) => c.parentCategoryId === null);
  const subCategories = activeParentId
    ? categories.filter((c) => c.parentCategoryId === activeParentId)
    : [];

  const activeParent = categories.find((c) => c.id === activeParentId);
  const selectedCatDirectly = categories.find((c) => c.id.toString() === selectedCategoryId);

  let displayLabel = showAllOption ? "All Categories" : "Select Category";
  if (selectedCatDirectly) {
    if (selectedCatDirectly.parentCategoryId === null) {
      displayLabel = `${selectedCatDirectly.name} (All)`;
    } else {
      const parent = categories.find((c) => c.id === selectedCatDirectly.parentCategoryId);
      displayLabel = `${parent ? parent.name : ""} > ${selectedCatDirectly.name}`;
    }
  }

  // Handle number input restriction for categories
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

  const handleSaveNew = async () => {
    if (!newValue.trim() || !onAddCategory) return;
    setLoading(true);
    setAddingError("");
    try {
      const res = await onAddCategory(newValue.trim(), activeParentId || undefined);
      setNewValue("");
      setIsAdding(false);
      if (activeParentId) {
        // If adding a subcategory, select it immediately
        onChange(res.id.toString());
        setIsOpen(false);
      } else {
        // If adding a parent category, transition to it
        setActiveParentId(res.id);
        setCurrentView("subs");
      }
    } catch (err: any) {
      setAddingError(err.message || "Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            // When opening, reset view to parents unless we have a selected category
            if (selectedCatDirectly) {
              if (selectedCatDirectly.parentCategoryId) {
                setActiveParentId(selectedCatDirectly.parentCategoryId);
              } else {
                setActiveParentId(selectedCatDirectly.id);
              }
              setCurrentView("subs");
            } else {
              setCurrentView("parents");
              setActiveParentId(null);
            }
            setIsAdding(false);
            setNewValue("");
            setAddingError("");
          }
        }}
        className="w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm flex justify-between items-center cursor-pointer text-gray-700 h-9"
      >
        <span className={selectedCatDirectly ? "text-gray-900 font-medium" : "text-gray-400"}>
          {displayLabel}
        </span>
        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden border border-gray-200">
          {currentView === "parents" ? (
            <div className="py-1">
              <div className="px-3 py-2 text-xs font-bold text-gray-500 bg-gray-50 uppercase tracking-wider">
                Select Main Category
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                {showAllOption && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex justify-between items-center cursor-pointer ${
                      !selectedCategoryId ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-700 font-medium"
                    }`}
                  >
                    <span>All Categories</span>
                    {!selectedCategoryId && (
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )}
                {parents.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActiveParentId(p.id);
                      setCurrentView("subs");
                      setIsAdding(false);
                      setNewValue("");
                      setAddingError("");
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex justify-between items-center transition-colors font-medium cursor-pointer"
                  >
                    <span>{p.name}</span>
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
                {parents.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500 italic">No categories available</div>
                )}
              </div>

              {/* Add Parent Category Option */}
              {onAddCategory && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-2">
                  {isAdding ? (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="New Category Name"
                          className="flex-1 min-w-0 border border-gray-300 rounded px-2.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          onKeyDown={handleTextOnlyKeyDown}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveNew}
                          disabled={loading || !newValue.trim()}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                        >
                          {loading ? "..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAdding(false);
                            setNewValue("");
                            setAddingError("");
                          }}
                          className="text-gray-500 hover:text-gray-700 px-1.5 text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      {addingError && (
                        <p className="text-[10px] text-red-600 font-semibold px-1">{addingError}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAdding(true)}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="text-sm">+</span> Add New Parent Category
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-1">
              <div className="flex items-center px-2 py-1.5 border-b border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView("parents");
                    setActiveParentId(null);
                    setIsAdding(false);
                    setNewValue("");
                    setAddingError("");
                  }}
                  className="flex items-center text-xs font-bold text-gray-600 hover:text-blue-600 gap-1 px-1.5 py-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
                <span className="text-xs font-bold text-gray-500 uppercase ml-2 select-none">
                  {activeParent?.name} Subcategories
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                {showAllOption && activeParent && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange(activeParent.id.toString());
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex justify-between items-center cursor-pointer ${
                      selectedCategoryId === activeParent.id.toString()
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-gray-700 font-medium"
                    }`}
                  >
                    <span>{activeParent.name} (All)</span>
                    {selectedCategoryId === activeParent.id.toString() && (
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )}
                {subCategories.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      onChange(sub.id.toString());
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors flex justify-between items-center cursor-pointer ${
                      selectedCategoryId === sub.id.toString()
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-gray-700"
                    }`}
                  >
                    <span>{sub.name}</span>
                    {selectedCategoryId === sub.id.toString() && (
                      <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
                {subCategories.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500 italic">No subcategories under {activeParent?.name}</div>
                )}
              </div>

              {/* Add Sub Category Option */}
              {onAddCategory && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-2">
                  {isAdding ? (
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="New Subcategory Name"
                          className="flex-1 min-w-0 border border-gray-300 rounded px-2.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          onKeyDown={handleTextOnlyKeyDown}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveNew}
                          disabled={loading || !newValue.trim()}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                        >
                          {loading ? "..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAdding(false);
                            setNewValue("");
                            setAddingError("");
                          }}
                          className="text-gray-500 hover:text-gray-700 px-1.5 text-xs font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                      {addingError && (
                        <p className="text-[10px] text-red-600 font-semibold px-1">{addingError}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAdding(true)}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="text-sm">+</span> Add New Subcategory
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
