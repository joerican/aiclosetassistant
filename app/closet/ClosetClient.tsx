"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Category, ClothingItem } from "@/types";

export default function ClosetPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories: Array<{ value: Category | "all"; label: string; icon: string }> = [
    { value: "all", label: "All", icon: "👔" },
    { value: "tops", label: "Tops", icon: "👕" },
    { value: "bottoms", label: "Bottoms", icon: "👖" },
    { value: "shoes", label: "Shoes", icon: "👟" },
    { value: "outerwear", label: "Outerwear", icon: "🧥" },
    { value: "accessories", label: "Accessories", icon: "🎩" },
  ];

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Closet
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Manage your wardrobe
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/upload"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Add Items
              </Link>
              <Link
                href="/shuffle"
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
              >
                Outfit Shuffle
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
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
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-500 dark:text-gray-400">Loading your closet...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Error Loading Items
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && items.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👗</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Your closet is empty
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start by adding some clothing items to your digital wardrobe
            </p>
            <Link
              href="/upload"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Your First Item
            </Link>
          </div>
        )}

        {/* Items Grid */}
        {!isLoading && !error && items.length > 0 && (
          <div>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Showing {items.length} {items.length === 1 ? 'item' : 'items'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
                    <img
                      src={item.background_removed_url || item.thumbnail_url}
                      alt={`${item.category} item`}
                      className="w-full h-full object-contain"
                    />
                    {item.favorite && (
                      <div className="absolute top-2 right-2 text-2xl">⭐</div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400 capitalize">
                        {item.category}
                      </span>
                      {item.times_worn > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Worn {item.times_worn}x
                        </span>
                      )}
                    </div>
                    {item.brand && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {item.brand}
                      </p>
                    )}
                    {item.color && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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
    </div>
  );
}
