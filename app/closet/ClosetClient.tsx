"use client";

import { useState } from "react";
import Link from "next/link";
import { Category } from "@/types";

export default function ClosetPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");

  const categories: Array<{ value: Category | "all"; label: string; icon: string }> = [
    { value: "all", label: "All", icon: "👔" },
    { value: "tops", label: "Tops", icon: "👕" },
    { value: "bottoms", label: "Bottoms", icon: "👖" },
    { value: "shoes", label: "Shoes", icon: "👟" },
    { value: "outerwear", label: "Outerwear", icon: "🧥" },
    { value: "accessories", label: "Accessories", icon: "🎩" },
  ];

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
        {/* Empty State */}
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
      </main>
    </div>
  );
}
