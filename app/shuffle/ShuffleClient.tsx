"use client";

import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ClothingItem } from "@/types";

export default function ShufflePage() {
  interface MockItem {
    id: string;
    category: "tops" | "bottoms" | "shoes";
    name: string;
  }

  const [isShuffling, setIsShuffling] = useState(false);
  const [currentOutfit, setCurrentOutfit] = useState<{
    top?: MockItem;
    bottom?: MockItem;
    shoes?: MockItem;
  }>({});

  // Mock data for demonstration
  const mockItems = {
    tops: [
      { id: "1", category: "tops" as const, name: "White T-Shirt" },
      { id: "2", category: "tops" as const, name: "Blue Shirt" },
      { id: "3", category: "tops" as const, name: "Black Hoodie" },
    ],
    bottoms: [
      { id: "4", category: "bottoms" as const, name: "Blue Jeans" },
      { id: "5", category: "bottoms" as const, name: "Black Pants" },
      { id: "6", category: "bottoms" as const, name: "Khaki Shorts" },
    ],
    shoes: [
      { id: "7", category: "shoes" as const, name: "White Sneakers" },
      { id: "8", category: "shoes" as const, name: "Black Boots" },
      { id: "9", category: "shoes" as const, name: "Brown Loafers" },
    ],
  };

  const getRandomItem = (items: any[]) => {
    return items[Math.floor(Math.random() * items.length)];
  };

  const handleShuffle = () => {
    setIsShuffling(true);

    // Simulate slot machine spinning
    const spinDuration = 2000;
    const intervalTime = 100;
    let elapsed = 0;

    const interval = setInterval(() => {
      setCurrentOutfit({
        top: getRandomItem(mockItems.tops),
        bottom: getRandomItem(mockItems.bottoms),
        shoes: getRandomItem(mockItems.shoes),
      });

      elapsed += intervalTime;

      if (elapsed >= spinDuration) {
        clearInterval(interval);
        setIsShuffling(false);
      }
    }, intervalTime);
  };

  const handleSaveOutfit = () => {
    // TODO: Implement save outfit to database
    alert("Outfit saved! (Feature coming soon)");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 dark:from-gray-900 dark:to-black">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Outfit Shuffle
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Discover new outfit combinations
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/closet"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Back to Closet
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Pull the lever to shuffle!
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Get inspired with random outfit combinations from your closet
          </p>
        </div>

        {/* Slot Machine */}
        <div className="bg-gradient-to-b from-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl mb-8">
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Top Slot */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 min-h-[300px] flex flex-col items-center justify-center transition-transform ${isShuffling ? "animate-pulse" : ""}`}>
              <div className="text-6xl mb-4">👕</div>
              <h3 className="text-lg font-bold mb-2">Top</h3>
              {currentOutfit.top ? (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-4xl">👕</span>
                  </div>
                  <p className="text-sm font-medium">{currentOutfit.top.name}</p>
                </div>
              ) : (
                <p className="text-gray-400">Pull to shuffle</p>
              )}
            </div>

            {/* Bottom Slot */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 min-h-[300px] flex flex-col items-center justify-center transition-transform ${isShuffling ? "animate-pulse" : ""}`}>
              <div className="text-6xl mb-4">👖</div>
              <h3 className="text-lg font-bold mb-2">Bottom</h3>
              {currentOutfit.bottom ? (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-4xl">👖</span>
                  </div>
                  <p className="text-sm font-medium">{currentOutfit.bottom.name}</p>
                </div>
              ) : (
                <p className="text-gray-400">Pull to shuffle</p>
              )}
            </div>

            {/* Shoes Slot */}
            <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 min-h-[300px] flex flex-col items-center justify-center transition-transform ${isShuffling ? "animate-pulse" : ""}`}>
              <div className="text-6xl mb-4">👟</div>
              <h3 className="text-lg font-bold mb-2">Shoes</h3>
              {currentOutfit.shoes ? (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                    <span className="text-4xl">👟</span>
                  </div>
                  <p className="text-sm font-medium">{currentOutfit.shoes.name}</p>
                </div>
              ) : (
                <p className="text-gray-400">Pull to shuffle</p>
              )}
            </div>
          </div>

          {/* Lever/Control */}
          <div className="flex flex-col items-center">
            <button
              onClick={handleShuffle}
              disabled={isShuffling}
              className="relative group"
            >
              <div className="w-24 h-24 bg-yellow-400 rounded-full shadow-lg transform transition-transform group-hover:scale-110 group-active:scale-95 flex items-center justify-center disabled:opacity-50">
                <span className="text-4xl">🎰</span>
              </div>
              <div className="mt-2 text-white font-bold text-lg">
                {isShuffling ? "Shuffling..." : "Pull!"}
              </div>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        {currentOutfit.top && currentOutfit.bottom && currentOutfit.shoes && !isShuffling && (
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleShuffle}
              className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Shuffle Again
            </button>
            <button
              onClick={handleSaveOutfit}
              className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
            >
              Save This Outfit
            </button>
          </div>
        )}

        {/* Empty State */}
        {!currentOutfit.top && !isShuffling && (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You need at least one item in each category to shuffle
            </p>
            <Link
              href="/upload"
              className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Items to Your Closet
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
