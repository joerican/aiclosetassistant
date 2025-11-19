"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Category, ClothingItem } from "@/types";
import {
  Shirt,
  ShoppingBag,
  Footprints,
  Wind,
  Watch,
  Star,
  Pencil,
  Trash2,
  Plus,
  Shuffle,
  Icon,
  Hourglass
} from "lucide-react";
import { trousers, coatHanger } from "@lucide/lab";

// Wrapper component for lab icons
const TrousersIcon = (props: any) => <Icon iconNode={trousers} {...props} />;
const CoatHangerIcon = (props: any) => <Icon iconNode={coatHanger} {...props} />;

export default function ClosetPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Edit form states
  const [editCategory, setEditCategory] = useState<Category>("tops");
  const [editSubcategory, setEditSubcategory] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editDatePurchased, setEditDatePurchased] = useState("");
  const [editStorePurchasedFrom, setEditStorePurchasedFrom] = useState("");

  const categories: Array<{ value: Category | "all"; label: string; IconComponent: any }> = [
    { value: "all", label: "All", IconComponent: ShoppingBag },
    { value: "tops", label: "Tops", IconComponent: Shirt },
    { value: "bottoms", label: "Bottoms", IconComponent: TrousersIcon },
    { value: "shoes", label: "Shoes", IconComponent: Footprints },
    { value: "outerwear", label: "Outerwear", IconComponent: Wind },
    { value: "accessories", label: "Accessories", IconComponent: Watch },
  ];

  const fullCategories: Category[] = ["tops", "bottoms", "shoes", "outerwear", "accessories"];

  // Fetch items when component mounts or category changes
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/get-items?category=${selectedCategory}&userId=default-user`);

        if (!response.ok) {
          throw new Error('Failed to fetch items');
        }

        const data = await response.json();
        setItems(data.items || []);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError(err instanceof Error ? err.message : 'Failed to load items');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [selectedCategory]);

  const handleItemClick = (item: ClothingItem) => {
    setSelectedItem(item);
    setIsEditMode(false);
    // Initialize edit form values
    setEditCategory(item.category);
    setEditSubcategory(item.subcategory || "");
    setEditColor(item.color || "");
    setEditBrand(item.brand || "");
    setEditSize(item.size || "");
    setEditCost(item.cost ? item.cost.toString() : "");
    setEditDatePurchased(item.date_purchased ? new Date(item.date_purchased).toISOString().split('T')[0] : "");
    setEditStorePurchasedFrom(item.store_purchased_from || "");
  };

  const handleDeleteItem = async (itemId: string) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/delete-item?itemId=${itemId}&userId=default-user`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Remove item from local state
      setItems(items.filter(item => item.id !== itemId));

      // Close the modal if the deleted item was selected
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">
                My Closet
              </h1>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
                Manage your wardrobe
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/upload"
                style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}
                className="px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg inline-flex items-center gap-2"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
              >
                <Plus size={20} strokeWidth={2} />
                Add Items
              </Link>
              <Link
                href="/shuffle"
                style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}
                className="px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg inline-flex items-center gap-2"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
              >
                <Shuffle size={20} strokeWidth={2} />
                Outfit Shuffle
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                style={selectedCategory === cat.value ? {
                  backgroundColor: 'var(--accent-primary)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
                } : {
                  backgroundColor: 'white',
                  color: 'var(--text-primary)'
                }}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all border-2 border-black ${
                  selectedCategory === cat.value
                    ? ""
                    : "hover:shadow-md"
                }`}
                onMouseEnter={(e) => {
                  if (selectedCategory === cat.value) {
                    e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory === cat.value) {
                    e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                  }
                }}
              >
                <cat.IconComponent
                  size={20}
                  strokeWidth={1.5}
                  className="mr-2 inline-block"
                  style={{ color: selectedCategory === cat.value ? '#FFFFFF' : 'var(--accent-primary)' }}
                />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-16">
            <div className="mb-4 flex justify-center">
              <Hourglass size={64} strokeWidth={1.5} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>Loading your closet...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold mb-2">
              Error Loading Items
            </h3>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}
              className="px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4 flex justify-center">
              <CoatHangerIcon size={80} strokeWidth={1.5} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h3 style={{ color: 'var(--text-primary)' }} className="text-xl font-semibold mb-2">
              Your closet is empty
            </h3>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">
              Start by adding some clothing items to your digital wardrobe
            </p>
            <Link
              href="/upload"
              style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}
              className="inline-block px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg"
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
            >
              Add Your First Item
            </Link>
          </div>
        )}

        {/* Items Grid */}
        {!isLoading && !error && items.length > 0 && (
          <div>
            <div style={{ color: 'var(--text-secondary)' }} className="mb-4 text-sm">
              Showing {items.length} {items.length === 1 ? 'item' : 'items'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="bg-white border-2 border-black rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="aspect-square relative bg-white">
                    <img
                      src={item.background_removed_url || item.thumbnail_url}
                      alt={`${item.category} item`}
                      className="w-full h-full object-contain"
                    />
                    {item.favorite && (
                      <div className="absolute top-2 right-2">
                        <Star
                          size={24}
                          fill="var(--accent-primary)"
                          stroke="var(--accent-primary)"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ color: 'var(--accent-primary)' }} className="text-xs font-medium capitalize">
                        {item.subcategory || item.category}
                      </span>
                      {item.times_worn > 0 && (
                        <span style={{ color: 'var(--text-secondary)' }} className="text-xs">
                          Worn {item.times_worn}x
                        </span>
                      )}
                    </div>
                    {item.brand && (
                      <p style={{ color: 'var(--text-primary)' }} className="text-sm truncate">
                        {item.brand}
                      </p>
                    )}
                    {item.color && (
                      <p style={{ color: 'var(--text-secondary)' }} className="text-xs truncate">
                        {item.color}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Item Detail/Edit Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedItem(null);
            setIsEditMode(false);
          }}
        >
          <div
            className="bg-white border-2 border-black rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-white border-b-2 border-black sticky top-0 p-4 flex justify-between items-center">
              <h2 style={{ color: 'var(--text-primary)' }} className="text-xl font-bold">
                {isEditMode ? "Edit Item" : "Item Details"}
              </h2>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setIsEditMode(false);
                }}
                style={{ color: 'var(--text-secondary)' }}
                className="hover:opacity-70 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Image */}
              <div className="bg-white rounded-lg p-4 mb-6 border-2 border-black">
                <img
                  src={selectedItem.background_removed_url || selectedItem.original_image_url}
                  alt={`${selectedItem.category} item`}
                  className="w-full max-h-96 object-contain"
                />
              </div>

              {/* View Mode */}
              {!isEditMode && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                        Category
                      </label>
                      <p style={{ color: 'var(--text-primary)' }} className="text-lg capitalize">
                        {selectedItem.category}
                      </p>
                    </div>

                    {/* Subcategory */}
                    {selectedItem.subcategory && (
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                          Type
                        </label>
                        <p style={{ color: 'var(--text-primary)' }} className="text-lg capitalize">
                          {selectedItem.subcategory}
                        </p>
                      </div>
                    )}

                    {/* Brand */}
                    {selectedItem.brand && (
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                          Brand
                        </label>
                        <p style={{ color: 'var(--text-primary)' }} className="text-lg">
                          {selectedItem.brand}
                        </p>
                      </div>
                    )}

                    {/* Color */}
                    {selectedItem.color && (
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                          Color
                        </label>
                        <p style={{ color: 'var(--text-primary)' }} className="text-lg capitalize">
                          {selectedItem.color}
                        </p>
                      </div>
                    )}

                    {/* Size */}
                    {selectedItem.size && (
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                          Size
                        </label>
                        <p style={{ color: 'var(--text-primary)' }} className="text-lg">
                          {selectedItem.size}
                        </p>
                      </div>
                    )}

                    {/* Cost */}
                    {selectedItem.cost && (
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                          Cost
                        </label>
                        <p style={{ color: 'var(--text-primary)' }} className="text-lg">
                          ${selectedItem.cost.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {/* Date Purchased */}
                    {selectedItem.date_purchased && (
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                          Purchased
                        </label>
                        <p style={{ color: 'var(--text-primary)' }} className="text-lg">
                          {new Date(selectedItem.date_purchased).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {/* Store Purchased From */}
                    {selectedItem.store_purchased_from && (
                      <div>
                        <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                          Store
                        </label>
                        <p style={{ color: 'var(--text-primary)' }} className="text-lg">
                          {selectedItem.store_purchased_from}
                        </p>
                      </div>
                    )}

                    {/* Times Worn */}
                    <div>
                      <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                        Times Worn
                      </label>
                      <p style={{ color: 'var(--text-primary)' }} className="text-lg">
                        {selectedItem.times_worn} times
                      </p>
                    </div>

                    {/* Favorite */}
                    <div>
                      <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                        Favorite
                      </label>
                      <p style={{ color: 'var(--text-primary)' }} className="text-lg flex items-center gap-2">
                        {selectedItem.favorite ? (
                          <>
                            <Star size={20} fill="var(--accent-primary)" stroke="var(--accent-primary)" strokeWidth={1.5} />
                            Yes
                          </>
                        ) : "No"}
                      </p>
                    </div>
                  </div>

                  {/* Created Date */}
                  <div>
                    <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                      Added to Closet
                    </label>
                    <p style={{ color: 'var(--text-primary)' }} className="text-lg">
                      {new Date(selectedItem.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {/* Item ID */}
                  <div>
                    <label style={{ color: 'var(--text-secondary)' }} className="text-sm font-medium">
                      Item ID
                    </label>
                    <p style={{ color: 'var(--text-primary)' }} className="text-sm font-mono">
                      {selectedItem.id}
                    </p>
                  </div>
                </div>
              )}

              {/* Edit Mode */}
              {isEditMode && (
                <div className="space-y-4">
                  {/* Category */}
                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">
                      Category *
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as Category)}
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    >
                      {fullCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory */}
                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">
                      Subcategory (e.g., t-shirt, jeans, boots)
                    </label>
                    <input
                      type="text"
                      value={editSubcategory}
                      onChange={(e) => setEditSubcategory(e.target.value)}
                      placeholder="e.g., sneakers, hoodie, dress pants"
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    />
                  </div>

                  {/* Colors */}
                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">
                      Colors (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      placeholder="e.g., black, white"
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={editBrand}
                      onChange={(e) => setEditBrand(e.target.value)}
                      placeholder="e.g., Nike, Zara"
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    />
                  </div>

                  {/* Size */}
                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">
                      Size
                    </label>
                    <input
                      type="text"
                      value={editSize}
                      onChange={(e) => setEditSize(e.target.value)}
                      placeholder="e.g., M, 32, 10"
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    />
                  </div>

                  {/* Cost */}
                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">
                      Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      placeholder="0.00"
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    />
                  </div>

                  {/* Date Purchased */}
                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">
                      Date Purchased
                    </label>
                    <input
                      type="date"
                      value={editDatePurchased}
                      onChange={(e) => setEditDatePurchased(e.target.value)}
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    />
                  </div>

                  {/* Store Purchased From */}
                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">
                      Store Purchased From
                    </label>
                    <input
                      type="text"
                      value={editStorePurchasedFrom}
                      onChange={(e) => setEditStorePurchasedFrom(e.target.value)}
                      placeholder="e.g., Amazon, Nordstrom"
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                {!isEditMode ? (
                  <>
                    <button
                      style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}
                      className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
                      onClick={() => setIsEditMode(true)}
                    >
                      Edit Details
                    </button>
                    <button
                      className="px-4 py-2 bg-white hover:bg-red-50 rounded-lg transition-colors border-2 border-black"
                      onClick={() => handleDeleteItem(selectedItem.id)}
                      title="Delete Item"
                    >
                      <Trash2 size={20} strokeWidth={1.5} style={{ color: 'var(--status-error)' }} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}
                      className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
                      onClick={() => {
                        // TODO: Implement save
                        alert('Save functionality coming soon!');
                        setIsEditMode(false);
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                      onClick={() => setIsEditMode(false)}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
