"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
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
  Hourglass,
  Menu,
  X,
  Home,
  Info,
  Sparkles,
  RotateCcw,
  RotateCw,
  Dices,
  Heart,
  User,
  LogOut,
  Settings
} from "lucide-react";
import { trousers, coatHanger } from "@lucide/lab";
import Logo from "../components/Logo";

// Wrapper component for lab icons
const TrousersIcon = (props: any) => <Icon iconNode={trousers} {...props} />;
const CoatHangerIcon = (props: any) => <Icon iconNode={coatHanger} {...props} />;

export default function ClosetPage() {
  const { signOut } = useClerk();
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // Edit form states
  const [editCategory, setEditCategory] = useState<Category>("tops");
  const [editSubcategory, setEditSubcategory] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editDatePurchased, setEditDatePurchased] = useState("");
  const [editStorePurchasedFrom, setEditStorePurchasedFrom] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const categories: Array<{ value: Category | "all"; label: string; IconComponent: any }> = [
    { value: "all", label: "All", IconComponent: ShoppingBag },
    { value: "tops", label: "Tops", IconComponent: Shirt },
    { value: "bottoms", label: "Bottoms", IconComponent: TrousersIcon },
    { value: "shoes", label: "Footwear", IconComponent: Footprints },
    { value: "outerwear", label: "Outerwear", IconComponent: Wind },
    { value: "accessories", label: "Accessories", IconComponent: Watch },
  ];

  // Category order for grouped display
  const categoryOrder: Category[] = ["tops", "bottoms", "shoes", "outerwear", "accessories"];
  const categoryLabels: Record<Category, string> = {
    tops: "Tops",
    bottoms: "Bottoms",
    shoes: "Footwear",
    outerwear: "Outerwear",
    accessories: "Accessories"
  };
  const categoryIcons: Record<Category, any> = {
    tops: Shirt,
    bottoms: TrousersIcon,
    shoes: Footprints,
    outerwear: Wind,
    accessories: Watch
  };

  const fullCategories: Category[] = ["tops", "bottoms", "shoes", "outerwear", "accessories"];

  // Helper to build image URL with rotation param
  const getImageUrl = (item: ClothingItem, width?: number) => {
    // Use original_image_url (processed WebP with transparent background)
    const baseUrl = item.original_image_url || item.thumbnail_url;
    if (!baseUrl) return '';

    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (item.rotation && item.rotation !== 0) params.set('rotate', item.rotation.toString());

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  // Fetch items when component mounts or category changes
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/get-items?category=${selectedCategory}`);

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
    setShowItemDetails(false);  // Always start with main view (image + Create Outfit)
    // Initialize edit form values - use empty string for null/undefined
    setEditCategory(item.category);
    setEditSubcategory(item.subcategory ?? "");
    setEditColor(item.color ?? "");
    setEditBrand(item.brand ?? "");
    setEditSize(item.size ?? "");
    setEditCost(item.cost != null ? item.cost.toString() : "");
    setEditDatePurchased(item.date_purchased ? new Date(item.date_purchased).toISOString().split('T')[0] : "");
    setEditStorePurchasedFrom(item.store_purchased_from ?? "");
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/update-item', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedItem.id,
          category: editCategory,
          subcategory: editSubcategory || null,
          color: editColor || null,
          brand: editBrand || null,
          size: editSize || null,
          cost: editCost || null,
          date_purchased: editDatePurchased ? new Date(editDatePurchased).getTime().toString() : null,
          store_purchased_from: editStorePurchasedFrom || null,
          rotation: selectedItem.rotation || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update item');
      }

      // Update local state
      setItems(items.map(item =>
        item.id === selectedItem.id
          ? {
              ...item,
              category: editCategory,
              subcategory: editSubcategory || undefined,
              color: editColor || undefined,
              brand: editBrand || undefined,
              size: editSize || undefined,
              cost: editCost ? parseFloat(editCost) : undefined,
              date_purchased: editDatePurchased ? new Date(editDatePurchased).getTime() : undefined,
              store_purchased_from: editStorePurchasedFrom || undefined,
            }
          : item
      ));

      // Update selected item
      setSelectedItem({
        ...selectedItem,
        category: editCategory,
        subcategory: editSubcategory || undefined,
        color: editColor || undefined,
        brand: editBrand || undefined,
        size: editSize || undefined,
        cost: editCost ? parseFloat(editCost) : undefined,
        date_purchased: editDatePurchased ? new Date(editDatePurchased).getTime() : undefined,
        store_purchased_from: editStorePurchasedFrom || undefined,
      });

      setIsEditMode(false);
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Failed to update item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    console.log('[handleDeleteItem] Called with itemId:', itemId);

    // Confirm deletion
    const confirmed = confirm('Are you sure you want to delete this item? This action cannot be undone.');
    console.log('[handleDeleteItem] User confirmed:', confirmed);

    if (!confirmed) {
      console.log('[handleDeleteItem] User cancelled deletion');
      return;
    }

    try {
      console.log('[handleDeleteItem] Making DELETE request to /api/delete-item');
      const response = await fetch(`/api/delete-item?itemId=${itemId}`, {
        method: 'DELETE',
      });

      console.log('[handleDeleteItem] Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Remove item from local state
      setItems(items.filter(item => item.id !== itemId));

      // Close the modal if the deleted item was selected
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }

      console.log('[handleDeleteItem] Item deleted successfully');
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    if (items.length === 0) {
      alert('No items to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ALL ${items.length} items? This cannot be undone.`)) {
      return;
    }

    // Double confirm for safety
    if (!confirm('This will permanently delete all items from your closet. Are you absolutely sure?')) {
      return;
    }

    try {
      // Delete all items in parallel batches
      const BATCH_SIZE = 6;
      for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(item =>
            fetch(`/api/delete-item?itemId=${item.id}`, {
              method: 'DELETE',
            })
          )
        );
      }

      setItems([]);
      setSelectedItem(null);
      alert('All items deleted successfully');
    } catch (err) {
      console.error('Error deleting all items:', err);
      alert('Failed to delete all items. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex justify-between items-center">
            {/* Left side: Hamburger + Logo (mobile) */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
              </button>

              {/* Logo - left aligned on mobile, center on desktop */}
              <div className="block sm:hidden scale-75">
                <Logo size="lg" />
              </div>
            </div>

            {/* Logo - centered on desktop only */}
            <div className="hidden sm:block absolute left-1/2 -translate-x-1/2">
              <Logo size="lg" />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Add Button */}
              <Link
                href="/upload"
                className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
              </Link>

              {/* Shuffle Button */}
              <Link
                href="/shuffle"
                className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
              >
                <Dices className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
              </Link>

              {/* Saved Outfits Button */}
              <Link
                href="/outfits"
                className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
              </Link>

              {/* Account Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setShowAccountMenu(!showAccountMenu)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 transition-colors"
                >
                  <User className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                </button>

                {/* Account Menu Dropdown */}
                {showAccountMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowAccountMenu(false)}
                    />

                    {/* Menu Panel */}
                    <div className="absolute right-0 mt-2 w-56 bg-white shadow-lg border border-gray-200 z-50">
                      <div className="py-2">
                        {/* Account Settings */}
                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            // TODO: Navigate to account settings page
                            alert('Account settings coming soon!');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors"
                        >
                          <Settings size={18} strokeWidth={1.5} />
                          <span>Account Settings</span>
                        </button>

                        {/* Debug Logs */}
                        <Link
                          href="/logs"
                          onClick={() => setShowAccountMenu(false)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-lg">🐛</span>
                          <span>Debug Logs</span>
                        </Link>

                        {/* Logout */}
                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors text-red-600"
                        >
                          <LogOut size={18} strokeWidth={1.5} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dropdown Menu - opens below header */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel - positioned below header */}
          <div className="absolute left-0 right-0 z-50 bg-white shadow-lg border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              {/* Menu Items */}
              <div className="py-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-6 py-4 text-left transition-colors ${
                      selectedCategory === cat.value
                        ? "bg-gray-100 text-black"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <cat.IconComponent size={20} strokeWidth={1.5} />
                    <span className="text-sm">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Outfit Shuffle Link */}
              <div className="px-6 py-4 border-t border-gray-200">
                <Link
                  href="/shuffle"
                  className="flex items-center gap-4 text-gray-600 hover:text-black transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shuffle size={20} strokeWidth={1.5} />
                  <span className="text-sm">Outfit Shuffle</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <div className="animate-spin h-6 w-6 border-2 border-black border-t-transparent rounded-full mx-auto mb-6"></div>
            <p className="text-xs uppercase tracking-widest text-gray-400">Loading collection</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-20">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Error loading items</p>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs uppercase tracking-widest text-black border-b border-black pb-1 hover:opacity-70 transition-opacity"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && items.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">Your collection is empty</p>
            <Link
              href="/upload"
              className="inline-block px-8 py-3 border border-black text-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Add First Item
            </Link>
          </div>
        )}

        {/* Items Grid */}
        {!isLoading && !error && items.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-6">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>

            {selectedCategory === "all" ? (
              // Grouped view by category
              <div className="space-y-8">
                {categoryOrder.map((cat) => {
                  const categoryItems = items
                    .filter(item => item.category === cat)
                    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

                  if (categoryItems.length === 0) return null;

                  const IconComponent = categoryIcons[cat];
                  return (
                    <div key={cat}>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-black mb-4 flex items-center gap-2">
                        <IconComponent size={18} strokeWidth={1.5} />
                        {categoryLabels[cat]}
                      </h3>
                      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className="group cursor-pointer"
                          >
                            <div className="aspect-square relative bg-gray-50 mb-1.5 sm:mb-3 overflow-hidden">
                              <img
                                src={getImageUrl(item, 200)}
                                alt={`${item.category} item`}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                              />
                              {item.favorite && (
                                <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                                  <Star
                                    className="w-3 h-3 sm:w-4 sm:h-4"
                                    fill="black"
                                    stroke="black"
                                    strokeWidth={1.5}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="space-y-0.5 sm:space-y-1">
                              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 truncate">
                                {item.subcategory || item.category}
                              </p>
                              {item.brand && (
                                <p className="text-xs sm:text-sm truncate">{item.brand}</p>
                              )}
                              {item.color && (
                                <p className="text-[10px] sm:text-xs text-gray-400 truncate">{item.color}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Single category view
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
                {items
                  .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
                  .map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-square relative bg-gray-50 mb-1.5 sm:mb-3 overflow-hidden">
                      <img
                        src={getImageUrl(item, 200)}
                        alt={`${item.category} item`}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.favorite && (
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                          <Star
                            className="w-3 h-3 sm:w-4 sm:h-4"
                            fill="black"
                            stroke="black"
                            strokeWidth={1.5}
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 truncate">
                        {item.subcategory || item.category}
                      </p>
                      {item.brand && (
                        <p className="text-xs sm:text-sm truncate">{item.brand}</p>
                      )}
                      {item.color && (
                        <p className="text-[10px] sm:text-xs text-gray-400 truncate">{item.color}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete All Button */}
        {items.length > 0 && (
          <div className="mt-12 pb-8 text-center">
            <button
              onClick={handleDeleteAll}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Delete All Items ({items.length})
            </button>
          </div>
        )}
      </main>

      {/* Item Detail/Edit Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedItem(null);
            setIsEditMode(false);
            setShowItemDetails(false);
          }}
        >
          <div
            className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main View - Image + Actions */}
            {!showItemDetails && !isEditMode && (
              <div className="p-6">
                {/* Centered Image - No border */}
                <div className="flex justify-center mb-4">
                  <img
                    src={getImageUrl(selectedItem)}
                    alt={`${selectedItem.category} item`}
                    className="max-h-80 object-contain"
                  />
                </div>

                {/* Rotation Controls */}
                <div className="flex justify-center gap-6 mb-6">
                  <button
                    onClick={async () => {
                      const newRotation = ((selectedItem.rotation || 0) - 90 + 360) % 360;
                      // Update in DB
                      await fetch('/api/update-item', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          itemId: selectedItem.id,
                          category: selectedItem.category,
                          subcategory: selectedItem.subcategory,
                          color: selectedItem.color,
                          brand: selectedItem.brand,
                          size: selectedItem.size,
                          cost: selectedItem.cost,
                          date_purchased: selectedItem.date_purchased,
                          store_purchased_from: selectedItem.store_purchased_from,
                          rotation: newRotation,
                        }),
                      });
                      // Update local state
                      const updatedItem = { ...selectedItem, rotation: newRotation };
                      setSelectedItem(updatedItem);
                      setItems(items.map(item =>
                        item.id === selectedItem.id ? updatedItem : item
                      ));
                    }}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                    title="Rotate left"
                  >
                    <RotateCcw size={20} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={async () => {
                      const newRotation = ((selectedItem.rotation || 0) + 90) % 360;
                      // Update in DB
                      await fetch('/api/update-item', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          itemId: selectedItem.id,
                          category: selectedItem.category,
                          subcategory: selectedItem.subcategory,
                          color: selectedItem.color,
                          brand: selectedItem.brand,
                          size: selectedItem.size,
                          cost: selectedItem.cost,
                          date_purchased: selectedItem.date_purchased,
                          store_purchased_from: selectedItem.store_purchased_from,
                          rotation: newRotation,
                        }),
                      });
                      // Update local state
                      const updatedItem = { ...selectedItem, rotation: newRotation };
                      setSelectedItem(updatedItem);
                      setItems(items.map(item =>
                        item.id === selectedItem.id ? updatedItem : item
                      ));
                    }}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                    title="Rotate right"
                  >
                    <RotateCw size={20} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Create Outfit Button */}
                <button
                  className="w-full py-4 bg-black text-white text-xs uppercase tracking-widest hover:bg-gray-900 transition-colors mb-6"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles size={16} strokeWidth={1.5} />
                    Create Outfit
                  </div>
                </button>

                {/* Action Bar */}
                <div className="flex justify-center gap-8">
                  {/* Back to Closet */}
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      setShowItemDetails(false);
                    }}
                    className="flex flex-col items-center gap-2 text-gray-500 hover:text-black transition-colors"
                  >
                    <Home size={24} strokeWidth={1.5} />
                    <span className="text-xs">Closet</span>
                  </button>

                  {/* View Details */}
                  <button
                    onClick={() => setShowItemDetails(true)}
                    className="flex flex-col items-center gap-2 text-gray-500 hover:text-black transition-colors"
                  >
                    <Info size={24} strokeWidth={1.5} />
                    <span className="text-xs">Details</span>
                  </button>
                </div>
              </div>
            )}

            {/* Details View */}
            {showItemDetails && !isEditMode && (
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <button
                    onClick={() => setShowItemDetails(false)}
                    className="text-gray-400 hover:text-black transition-colors"
                  >
                    ← Back
                  </button>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="text-black hover:opacity-70 transition-opacity"
                    >
                      <Pencil size={20} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(selectedItem.id)}
                      className="text-black hover:opacity-70 transition-opacity"
                    >
                      <Trash2 size={20} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Details Content */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-wider text-gray-400">Category</label>
                      <p className="text-sm capitalize">{selectedItem.category}</p>
                    </div>

                    {selectedItem.subcategory && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Type</label>
                        <p className="text-sm capitalize">{selectedItem.subcategory}</p>
                      </div>
                    )}

                    {selectedItem.brand && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Brand</label>
                        <p className="text-sm">{selectedItem.brand}</p>
                      </div>
                    )}

                    {selectedItem.color && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Color</label>
                        <p className="text-sm capitalize">{selectedItem.color}</p>
                      </div>
                    )}

                    {selectedItem.size && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Size</label>
                        <p className="text-sm">{selectedItem.size}</p>
                      </div>
                    )}

                    {selectedItem.fit && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Fit</label>
                        <p className="text-sm capitalize">{selectedItem.fit}</p>
                      </div>
                    )}

                    {selectedItem.style && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Style</label>
                        <p className="text-sm capitalize">{selectedItem.style}</p>
                      </div>
                    )}

                    {selectedItem.season && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Season</label>
                        <p className="text-sm capitalize">{selectedItem.season}</p>
                      </div>
                    )}

                    {selectedItem.material && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Material</label>
                        <p className="text-sm capitalize">{selectedItem.material}</p>
                      </div>
                    )}

                    {selectedItem.boldness && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Boldness</label>
                        <p className="text-sm capitalize">{selectedItem.boldness}</p>
                      </div>
                    )}

                    {selectedItem.cost && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Cost</label>
                        <p className="text-sm">${selectedItem.cost.toFixed(2)}</p>
                      </div>
                    )}

                    {selectedItem.date_purchased && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Purchased</label>
                        <p className="text-sm">
                          {new Date(selectedItem.date_purchased).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {selectedItem.store_purchased_from && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Store</label>
                        <p className="text-sm">{selectedItem.store_purchased_from}</p>
                      </div>
                    )}

                    {selectedItem.original_filename && (
                      <div>
                        <label className="text-xs uppercase tracking-wider text-gray-400">Filename</label>
                        <p className="text-sm truncate" title={selectedItem.original_filename}>{selectedItem.original_filename}</p>
                      </div>
                    )}

                    <div>
                      <label className="text-xs uppercase tracking-wider text-gray-400">Times Worn</label>
                      <p className="text-sm">{selectedItem.times_worn}</p>
                    </div>

                    <div>
                      <label className="text-xs uppercase tracking-wider text-gray-400">Favorite</label>
                      <p className="text-sm flex items-center gap-1">
                        {selectedItem.favorite ? (
                          <>
                            <Star size={14} fill="black" stroke="black" strokeWidth={1.5} />
                            Yes
                          </>
                        ) : "No"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedItem.description && (
                    <div className="pt-4 border-t border-gray-100">
                      <label className="text-xs uppercase tracking-wider text-gray-400">Description</label>
                      <p className="text-sm">{selectedItem.description}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div className="pt-4 border-t border-gray-100">
                      <label className="text-xs uppercase tracking-wider text-gray-400">Tags</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedItem.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-100">
                    <label className="text-xs uppercase tracking-wider text-gray-400">Added</label>
                    <p className="text-sm">
                      {new Date(selectedItem.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider text-gray-400">Item ID</label>
                    <p className="text-xs font-mono text-gray-400">{selectedItem.id}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Mode */}
            {isEditMode && (
              <div className="p-6 space-y-4">
                {/* Category */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as Category)}
                    className="w-full px-4 py-3 border border-gray-300 bg-white text-sm focus:border-black focus:outline-none transition-colors"
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
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">
                    Store
                  </label>
                  <input
                    type="text"
                    value={editStorePurchasedFrom}
                    onChange={(e) => setEditStorePurchasedFrom(e.target.value)}
                    placeholder="e.g., Amazon, Nordstrom"
                    className="w-full px-4 py-3 border border-gray-300 bg-white text-sm focus:border-black focus:outline-none transition-colors"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    className={`flex-1 py-3 text-xs uppercase tracking-widest transition-colors ${
                      isSaving
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-black text-white hover:bg-gray-900'
                    }`}
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="flex-1 py-3 border border-gray-300 text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors"
                    onClick={() => setIsEditMode(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
