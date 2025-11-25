"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, Trash2, Plus, Shuffle, Shirt, Lock, Unlock, Palette } from "lucide-react";

interface SavedOutfit {
  id: string;
  top_id: string;
  bottom_id: string;
  shoes_id: string;
  outerwear_id?: string | null;
  accessories_id?: string | null;
  name: string | null;
  ai_suggestion: string | null;
  created_at: number;
  is_canvas_outfit?: number;
  canvas_layout?: string;
  canvasItems?: Array<{
    itemId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    item: any;
  }>;
  top?: any;
  bottom?: any;
  shoes?: any;
  outerwear?: any;
  accessories?: any;
}

interface ClothingItem {
  id: string;
  category: string;
  subcategory: string | null;
  color: string | null;
  brand: string | null;
  original_image_url: string;
  thumbnail_url: string;
  rotation?: number;
}

type View = 'saved' | 'create' | 'shuffle';

export default function OutfitsClient() {
  const [currentView, setCurrentView] = useState<View>('saved');
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Items for create view
  const [tops, setTops] = useState<ClothingItem[]>([]);
  const [bottoms, setBottoms] = useState<ClothingItem[]>([]);
  const [shoes, setShoes] = useState<ClothingItem[]>([]);
  const [outerwear, setOuterwear] = useState<ClothingItem[]>([]);
  const [accessories, setAccessories] = useState<ClothingItem[]>([]);

  // Selected indices for carousel
  const [selectedTopIndex, setSelectedTopIndex] = useState(0);
  const [selectedBottomIndex, setSelectedBottomIndex] = useState(0);
  const [selectedShoesIndex, setSelectedShoesIndex] = useState(0);
  const [selectedOuterwearIndex, setSelectedOuterwearIndex] = useState(0);
  const [selectedAccessoriesIndex, setSelectedAccessoriesIndex] = useState(0);

  // Lock states
  const [isTopLocked, setIsTopLocked] = useState(false);
  const [isBottomLocked, setIsBottomLocked] = useState(false);
  const [isShoesLocked, setIsShoesLocked] = useState(false);
  const [isOuterwearLocked, setIsOuterwearLocked] = useState(false);
  const [isAccessoriesLocked, setIsAccessoriesLocked] = useState(false);

  // Show optional categories
  const [showOuterwear, setShowOuterwear] = useState(false);
  const [showAccessories, setShowAccessories] = useState(false);

  useEffect(() => {
    fetchOutfits();
    if (currentView === 'create') {
      fetchItems();
    }
  }, [currentView]);

  const fetchOutfits = async () => {
    try {
      const response = await fetch('/api/get-outfits');
      if (response.ok) {
        const data = await response.json();
        setOutfits(data.outfits || []);
      }
    } catch (error) {
      console.error('Error fetching outfits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/get-items?category=all');
      if (response.ok) {
        const data = await response.json();
        setTops(data.items.filter((item: ClothingItem) => item.category === 'tops'));
        setBottoms(data.items.filter((item: ClothingItem) => item.category === 'bottoms'));
        setShoes(data.items.filter((item: ClothingItem) => item.category === 'shoes'));
        setOuterwear(data.items.filter((item: ClothingItem) => item.category === 'outerwear'));
        setAccessories(data.items.filter((item: ClothingItem) => item.category === 'accessories'));
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      const response = await fetch('/api/delete-outfit', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outfitId }),
      });

      if (response.ok) {
        setOutfits(outfits.filter(o => o.id !== outfitId));
      }
    } catch (error) {
      console.error('Error deleting outfit:', error);
    }
  };

  const handleSaveOutfit = async () => {
    // Check if at least one item is selected
    const hasAtLeastOneItem =
      tops[selectedTopIndex]?.id ||
      bottoms[selectedBottomIndex]?.id ||
      shoes[selectedShoesIndex]?.id ||
      (showOuterwear && outerwear[selectedOuterwearIndex]?.id) ||
      (showAccessories && accessories[selectedAccessoriesIndex]?.id);

    if (!hasAtLeastOneItem) {
      alert('Please select at least one item for your outfit');
      return;
    }

    try {
      const outfit = {
        top_id: tops[selectedTopIndex]?.id || null,
        bottom_id: bottoms[selectedBottomIndex]?.id || null,
        shoes_id: shoes[selectedShoesIndex]?.id || null,
        outerwear_id: showOuterwear ? outerwear[selectedOuterwearIndex]?.id : null,
        accessories_id: showAccessories ? accessories[selectedAccessoriesIndex]?.id : null,
      };

      const response = await fetch('/api/save-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outfit),
      });

      if (response.ok) {
        alert('Outfit saved!');
        setCurrentView('saved');
        fetchOutfits();
      }
    } catch (error) {
      console.error('Error saving outfit:', error);
    }
  };

  const nextItem = (category: string) => {
    switch (category) {
      case 'tops':
        if (!isTopLocked) setSelectedTopIndex((selectedTopIndex + 1) % tops.length);
        break;
      case 'bottoms':
        if (!isBottomLocked) setSelectedBottomIndex((selectedBottomIndex + 1) % bottoms.length);
        break;
      case 'shoes':
        if (!isShoesLocked) setSelectedShoesIndex((selectedShoesIndex + 1) % shoes.length);
        break;
      case 'outerwear':
        if (!isOuterwearLocked) setSelectedOuterwearIndex((selectedOuterwearIndex + 1) % outerwear.length);
        break;
      case 'accessories':
        if (!isAccessoriesLocked) setSelectedAccessoriesIndex((selectedAccessoriesIndex + 1) % accessories.length);
        break;
    }
  };

  const prevItem = (category: string) => {
    switch (category) {
      case 'tops':
        if (!isTopLocked) setSelectedTopIndex((selectedTopIndex - 1 + tops.length) % tops.length);
        break;
      case 'bottoms':
        if (!isBottomLocked) setSelectedBottomIndex((selectedBottomIndex - 1 + bottoms.length) % bottoms.length);
        break;
      case 'shoes':
        if (!isShoesLocked) setSelectedShoesIndex((selectedShoesIndex - 1 + shoes.length) % shoes.length);
        break;
      case 'outerwear':
        if (!isOuterwearLocked) setSelectedOuterwearIndex((selectedOuterwearIndex - 1 + outerwear.length) % outerwear.length);
        break;
      case 'accessories':
        if (!isAccessoriesLocked) setSelectedAccessoriesIndex((selectedAccessoriesIndex - 1 + accessories.length) % accessories.length);
        break;
    }
  };

  const toggleLock = (category: string) => {
    switch (category) {
      case 'tops':
        setIsTopLocked(!isTopLocked);
        break;
      case 'bottoms':
        setIsBottomLocked(!isBottomLocked);
        break;
      case 'shoes':
        setIsShoesLocked(!isShoesLocked);
        break;
      case 'outerwear':
        setIsOuterwearLocked(!isOuterwearLocked);
        break;
      case 'accessories':
        setIsAccessoriesLocked(!isAccessoriesLocked);
        break;
    }
  };

  const renderCarousel = (
    items: ClothingItem[],
    selectedIndex: number,
    category: string,
    isLocked: boolean
  ) => {
    if (items.length === 0) {
      return (
        <div className="text-center text-gray-500 py-8">
          No {category} in your closet
        </div>
      );
    }

    const handleItemClick = (index: number) => {
      if (isLocked) return;
      switch (category) {
        case 'tops':
          setSelectedTopIndex(index);
          break;
        case 'bottoms':
          setSelectedBottomIndex(index);
          break;
        case 'shoes':
          setSelectedShoesIndex(index);
          break;
        case 'outerwear':
          setSelectedOuterwearIndex(index);
          break;
        case 'accessories':
          setSelectedAccessoriesIndex(index);
          break;
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-medium capitalize">{category}</h3>
          <button
            onClick={() => toggleLock(category)}
            className={`p-2 rounded-lg ${isLocked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => prevItem(category)}
            disabled={isLocked}
            className="flex-shrink-0 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            ←
          </button>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 pb-2">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(index)}
                  disabled={isLocked}
                  className={`flex-shrink-0 w-32 bg-white rounded-lg p-2 border-2 transition-all ${
                    index === selectedIndex
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                >
                  <img
                    src={item.original_image_url}
                    alt={item.subcategory || category}
                    className="w-full h-28 object-contain mb-1"
                    style={{
                      transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined
                    }}
                  />
                  <div className="text-xs text-gray-600 text-center truncate">
                    {item.subcategory || category}
                  </div>
                  {item.color && (
                    <div className="text-xs text-gray-500 text-center truncate">
                      {item.color}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => nextItem(category)}
            disabled={isLocked}
            className="flex-shrink-0 p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            →
          </button>
        </div>
        <div className="text-center text-sm text-gray-500">
          {selectedIndex + 1} / {items.length}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/closet" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold">Outfits</h1>
          </div>
          {/* Primary action - Create button */}
          {currentView !== 'create' && (
            <button
              onClick={() => setCurrentView('create')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Create new outfit"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4">
        {/* Content-first approach: Show saved outfits by default */}
        {currentView === 'saved' ? (
          <div>
            {/* Saved Outfits View */}
            <div>
              {isLoading ? (
                <div className="text-center py-12 text-gray-500 text-base">Loading outfits...</div>
              ) : outfits.length === 0 ? (
                <>
                  <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
                    <Heart className="w-16 h-16 sm:w-20 sm:h-20 mx-auto text-gray-300 mb-4" />
                    <p className="text-base sm:text-lg text-gray-600 mb-2 font-medium">No saved outfits yet</p>
                    <p className="text-sm sm:text-base text-gray-500 mb-6">Create your first outfit to get started</p>
                    <button
                      onClick={() => setCurrentView('create')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-base"
                    >
                      Create Your First Outfit
                    </button>
                  </div>

                  {/* Secondary Actions - Always available */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href="/canvas"
                      className="flex-1 min-w-[140px] px-4 py-3 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Palette className="w-5 h-5" />
                      <span className="text-base font-medium">Canvas</span>
                    </Link>
                    <Link
                      href="/shuffle"
                      className="flex-1 min-w-[140px] px-4 py-3 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Shuffle className="w-5 h-5" />
                      <span className="text-base font-medium">Shuffle</span>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {outfits.map((outfit) => (
                      <div key={outfit.id} className="bg-white rounded-lg shadow-sm p-6">
                        {outfit.is_canvas_outfit && outfit.canvasItems ? (
                          // Canvas outfit display
                          <div>
                            <div className="relative bg-gray-50 rounded-lg mb-4" style={{ height: '300px' }}>
                              {outfit.canvasItems.map((canvasItem, idx) => (
                                <div
                                  key={idx}
                                  className="absolute"
                                  style={{
                                    left: `${(canvasItem.x / 800) * 100}%`,
                                    top: `${(canvasItem.y / 600) * 100}%`,
                                    width: `${(canvasItem.width / 800) * 100}%`,
                                    height: `${(canvasItem.height / 600) * 100}%`,
                                    zIndex: canvasItem.zIndex,
                                  }}
                                >
                                  <img
                                    src={canvasItem.item?.original_image_url}
                                    alt={canvasItem.item?.subcategory || 'Item'}
                                    className="w-full h-full object-contain"
                                    style={{
                                      transform: canvasItem.item?.rotation ? `rotate(${canvasItem.item.rotation}deg)` : undefined
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            {outfit.name && (
                              <div className="flex items-center gap-2 mb-2">
                                <Palette className="w-4 h-4 text-blue-600" />
                                <h3 className="font-medium">{outfit.name}</h3>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Regular outfit display
                          <div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              {outfit.top && (
                                <div>
                                  <img
                                    src={outfit.top.thumbnail_url}
                                    alt="Top"
                                    className="w-full h-32 object-contain"
                                    style={{
                                      transform: outfit.top.rotation ? `rotate(${outfit.top.rotation}deg)` : undefined
                                    }}
                                  />
                                </div>
                              )}
                              {outfit.bottom && (
                                <div>
                                  <img
                                    src={outfit.bottom.thumbnail_url}
                                    alt="Bottom"
                                    className="w-full h-32 object-contain"
                                    style={{
                                      transform: outfit.bottom.rotation ? `rotate(${outfit.bottom.rotation}deg)` : undefined
                                    }}
                                  />
                                </div>
                              )}
                              {outfit.shoes && (
                                <div>
                                  <img
                                    src={outfit.shoes.thumbnail_url}
                                    alt="Shoes"
                                    className="w-full h-32 object-contain"
                                    style={{
                                      transform: outfit.shoes.rotation ? `rotate(${outfit.shoes.rotation}deg)` : undefined
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            {outfit.name && (
                              <h3 className="font-medium mb-2">{outfit.name}</h3>
                            )}
                            {outfit.ai_suggestion && (
                              <p className="text-sm text-gray-600 mb-4">{outfit.ai_suggestion}</p>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteOutfit(outfit.id)}
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                  ))}
                </div>
              )}

              {/* Secondary Actions - Canvas and Shuffle */}
              {outfits.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/canvas"
                    className="flex-1 min-w-[140px] px-4 py-3 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Palette className="w-5 h-5" />
                    <span className="text-base font-medium">Canvas</span>
                  </Link>
                  <Link
                    href="/shuffle"
                    className="flex-1 min-w-[140px] px-4 py-3 bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Shuffle className="w-5 h-5" />
                    <span className="text-base font-medium">Shuffle</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Create Outfit View */
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Create New Outfit</h2>
              <button
                onClick={() => setCurrentView('saved')}
                className="text-gray-600 hover:text-gray-900 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
                  {renderCarousel(tops, selectedTopIndex, 'tops', isTopLocked)}
                  {renderCarousel(bottoms, selectedBottomIndex, 'bottoms', isBottomLocked)}
                  {renderCarousel(shoes, selectedShoesIndex, 'shoes', isShoesLocked)}

                  {/* Optional Categories */}
                  <div className="flex flex-wrap gap-3">
                    {!showOuterwear && (
                      <button
                        onClick={() => setShowOuterwear(true)}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-sm sm:text-base font-medium transition-colors"
                      >
                        + Add Outerwear
                      </button>
                    )}
                    {!showAccessories && (
                      <button
                        onClick={() => setShowAccessories(true)}
                        className="px-4 py-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-sm sm:text-base font-medium transition-colors"
                      >
                        + Add Accessories
                      </button>
                    )}
                  </div>

                  {showOuterwear && renderCarousel(outerwear, selectedOuterwearIndex, 'outerwear', isOuterwearLocked)}
                  {showAccessories && renderCarousel(accessories, selectedAccessoriesIndex, 'accessories', isAccessoriesLocked)}

                {/* Save Button */}
                <div className="pt-4 border-t">
                  <button
                    onClick={handleSaveOutfit}
                    className="w-full px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 font-medium text-base transition-colors"
                  >
                    Save Outfit
                  </button>
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
}
