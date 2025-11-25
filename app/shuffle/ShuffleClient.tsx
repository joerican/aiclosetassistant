"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ClothingItem } from "@/types";
import { Dices, ArrowLeft, Sparkles, RefreshCw, Lock, Unlock, Heart, Check, ThumbsDown } from "lucide-react";

export default function ShufflePage() {
  const [isShuffling, setIsShuffling] = useState(false);
  const [items, setItems] = useState<{
    tops: ClothingItem[];
    bottoms: ClothingItem[];
    shoes: ClothingItem[];
  }>({ tops: [], bottoms: [], shoes: [] });
  const [currentOutfit, setCurrentOutfit] = useState<{
    top?: ClothingItem;
    bottom?: ClothingItem;
    shoes?: ClothingItem;
  }>({});
  const [locked, setLocked] = useState<{
    top: boolean;
    bottom: boolean;
    shoes: boolean;
  }>({ top: false, bottom: false, shoes: false });
  const [isLoading, setIsLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [debugLog, setDebugLog] = useState<string>('');
  const [isAiPicked, setIsAiPicked] = useState(false);
  const [previousOutfit, setPreviousOutfit] = useState<{
    top?: ClothingItem;
    bottom?: ClothingItem;
    shoes?: ClothingItem;
  }>({});

  // Fetch items on mount
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/get-items');
        if (!response.ok) throw new Error('Failed to fetch items');
        const data = await response.json();

        // Group items by category
        const grouped = {
          tops: data.items.filter((item: ClothingItem) => item.category === 'tops'),
          bottoms: data.items.filter((item: ClothingItem) => item.category === 'bottoms'),
          shoes: data.items.filter((item: ClothingItem) => item.category === 'shoes'),
        };

        setItems(grouped);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  const getRandomItem = (itemList: ClothingItem[]) => {
    if (itemList.length === 0) return undefined;
    return itemList[Math.floor(Math.random() * itemList.length)];
  };

  const handleShuffle = async () => {
    if (items.tops.length === 0 || items.bottoms.length === 0 || items.shoes.length === 0) {
      return;
    }

    setIsShuffling(true);
    setAiSuggestion(null);
    setSaved(false);
    setDisliked(false);
    setIsAiPicked(false);

    // Start shuffle animation
    const animationInterval = setInterval(() => {
      setCurrentOutfit(prev => ({
        top: locked.top ? prev.top : getRandomItem(items.tops),
        bottom: locked.bottom ? prev.bottom : getRandomItem(items.bottoms),
        shoes: locked.shoes ? prev.shoes : getRandomItem(items.shoes),
      }));
    }, 100);

    // Minimum shuffle duration for visual effect
    const minShuffleDuration = 1500;
    const startTime = Date.now();

    try {
      // Call AI to generate matching outfit
      const response = await fetch('/api/generate-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locked,
          currentOutfit,
          previousOutfit,
        }),
      });

      // Wait for minimum duration
      const elapsed = Date.now() - startTime;
      if (elapsed < minShuffleDuration) {
        await new Promise(resolve => setTimeout(resolve, minShuffleDuration - elapsed));
      }

      clearInterval(animationInterval);

      if (response.ok) {
        const data = await response.json();
        setDebugLog(`suggestion: ${data.suggestion || 'null'}\nkeys: ${Object.keys(data).join(', ')}`);
        const newOutfit = {
          top: data.top,
          bottom: data.bottom,
          shoes: data.shoes,
        };
        setPreviousOutfit(currentOutfit);
        setCurrentOutfit(newOutfit);
        setAiSuggestion(data.suggestion);
        setIsAiPicked(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setDebugLog(`API error: ${response.status}\n${JSON.stringify(errorData)}`);
        // Fallback to random if AI fails
        setCurrentOutfit(prev => ({
          top: locked.top ? prev.top : getRandomItem(items.tops),
          bottom: locked.bottom ? prev.bottom : getRandomItem(items.bottoms),
          shoes: locked.shoes ? prev.shoes : getRandomItem(items.shoes),
        }));
        setIsAiPicked(false);
      }
    } catch (error) {
      console.error('Error generating outfit:', error);
      clearInterval(animationInterval);
      setCurrentOutfit(prev => ({
        top: locked.top ? prev.top : getRandomItem(items.tops),
        bottom: locked.bottom ? prev.bottom : getRandomItem(items.bottoms),
        shoes: locked.shoes ? prev.shoes : getRandomItem(items.shoes),
      }));
    } finally {
      setIsShuffling(false);
    }
  };

  const toggleLock = (slot: 'top' | 'bottom' | 'shoes') => {
    setLocked(prev => ({ ...prev, [slot]: !prev[slot] }));
  };

  const handleSaveOutfit = async () => {
    if (!currentOutfit.top || !currentOutfit.bottom || !currentOutfit.shoes) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/save-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topId: currentOutfit.top.id,
          bottomId: currentOutfit.bottom.id,
          shoesId: currentOutfit.shoes.id,
          aiSuggestion,
        }),
      });

      if (response.ok) {
        setSaved(true);
      }
    } catch (error) {
      console.error('Error saving outfit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDislikeOutfit = async () => {
    if (!currentOutfit.top || !currentOutfit.bottom || !currentOutfit.shoes) return;

    setIsDisliking(true);
    try {
      const response = await fetch('/api/dislike-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topId: currentOutfit.top.id,
          bottomId: currentOutfit.bottom.id,
          shoesId: currentOutfit.shoes.id,
        }),
      });

      if (response.ok) {
        setDisliked(true);
      }
    } catch (error) {
      console.error('Error disliking outfit:', error);
    } finally {
      setIsDisliking(false);
    }
  };

  const getImageUrl = (item: ClothingItem) => {
    const baseUrl = item.background_removed_url || item.thumbnail_url || item.original_image_url;
    if (!baseUrl) return '';

    // Add rotation parameter if item has rotation
    if (item.rotation && item.rotation !== 0) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}rotate=${item.rotation}`;
    }
    return baseUrl;
  };

  const canShuffle = items.tops.length > 0 && items.bottoms.length > 0 && items.shoes.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Loading your closet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/closet"
              className="p-2 hover:bg-gray-100 transition-colors rounded-lg"
            >
              <ArrowLeft size={24} strokeWidth={1.5} />
            </Link>
            <h1 className="text-xl font-bold">Outfit Shuffle</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6">
        {!canShuffle ? (
          <div className="text-center py-12">
            <Dices className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold mb-2">Not enough items</h2>
            <p className="text-gray-500 mb-6">
              You need at least one top, one bottom, and one pair of shoes to shuffle outfits.
            </p>
            <p className="text-sm text-gray-400 mb-4">
              Current: {items.tops.length} tops, {items.bottoms.length} bottoms, {items.shoes.length} shoes
            </p>
            <Link
              href="/upload"
              className="inline-block px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Add Items
            </Link>
          </div>
        ) : (
          <>
            {/* Slot Machine Grid - Vertical Stack */}
            <div className="space-y-3 mb-6">
              {/* Top Slot */}
              <div
                className={`bg-gray-50 border border-gray-200 rounded-xl p-4 transition-all ${
                  isShuffling && !locked.top ? 'animate-pulse border-yellow-400' : ''
                } ${locked.top ? 'ring-2 ring-blue-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Top</div>
                  <button
                    onClick={() => toggleLock('top')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      locked.top ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-400'
                    }`}
                    disabled={!currentOutfit.top}
                  >
                    {locked.top ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-36 h-36 bg-white rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {currentOutfit.top ? (
                      <img
                        src={getImageUrl(currentOutfit.top)}
                        alt={currentOutfit.top.subcategory || 'Top'}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-3xl text-gray-300">👕</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {currentOutfit.top ? (
                      <>
                        <p className="font-medium truncate">{currentOutfit.top.subcategory || 'Top'}</p>
                        <p className="text-sm text-gray-500 truncate">{currentOutfit.top.color}</p>
                        {currentOutfit.top.style && (
                          <p className="text-xs text-gray-400">{currentOutfit.top.style}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">Tap shuffle to start</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Slot */}
              <div
                className={`bg-gray-50 border border-gray-200 rounded-xl p-4 transition-all ${
                  isShuffling && !locked.bottom ? 'animate-pulse border-yellow-400' : ''
                } ${locked.bottom ? 'ring-2 ring-blue-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bottom</div>
                  <button
                    onClick={() => toggleLock('bottom')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      locked.bottom ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-400'
                    }`}
                    disabled={!currentOutfit.bottom}
                  >
                    {locked.bottom ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-36 h-36 bg-white rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {currentOutfit.bottom ? (
                      <img
                        src={getImageUrl(currentOutfit.bottom)}
                        alt={currentOutfit.bottom.subcategory || 'Bottom'}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-3xl text-gray-300">👖</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {currentOutfit.bottom ? (
                      <>
                        <p className="font-medium truncate">{currentOutfit.bottom.subcategory || 'Bottom'}</p>
                        <p className="text-sm text-gray-500 truncate">{currentOutfit.bottom.color}</p>
                        {currentOutfit.bottom.style && (
                          <p className="text-xs text-gray-400">{currentOutfit.bottom.style}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">Tap shuffle to start</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shoes Slot */}
              <div
                className={`bg-gray-50 border border-gray-200 rounded-xl p-4 transition-all ${
                  isShuffling && !locked.shoes ? 'animate-pulse border-yellow-400' : ''
                } ${locked.shoes ? 'ring-2 ring-blue-400' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Shoes</div>
                  <button
                    onClick={() => toggleLock('shoes')}
                    className={`p-1.5 rounded-lg transition-colors ${
                      locked.shoes ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200 text-gray-400'
                    }`}
                    disabled={!currentOutfit.shoes}
                  >
                    {locked.shoes ? <Lock size={16} /> : <Unlock size={16} />}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-36 h-36 bg-white rounded-lg border border-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {currentOutfit.shoes ? (
                      <img
                        src={getImageUrl(currentOutfit.shoes)}
                        alt={currentOutfit.shoes.subcategory || 'Shoes'}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-3xl text-gray-300">👟</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {currentOutfit.shoes ? (
                      <>
                        <p className="font-medium truncate">{currentOutfit.shoes.subcategory || 'Shoes'}</p>
                        <p className="text-sm text-gray-500 truncate">{currentOutfit.shoes.color}</p>
                        {currentOutfit.shoes.style && (
                          <p className="text-xs text-gray-400">{currentOutfit.shoes.style}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">Tap shuffle to start</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Suggestion */}
            {aiSuggestion && !isShuffling && (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-purple-600 mb-1 uppercase tracking-wide">AI Stylist</p>
                    <p className="text-sm text-gray-700">{aiSuggestion}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Shuffle Button */}
              <button
                onClick={handleShuffle}
                disabled={isShuffling}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                  isShuffling
                    ? 'bg-yellow-400 text-black'
                    : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.98]'
                }`}
              >
                <Dices className={`w-6 h-6 ${isShuffling ? 'animate-spin' : ''}`} />
                {isShuffling ? 'Matching...' : 'Shuffle Outfit'}
              </button>

              {/* Like/Dislike Buttons */}
              {currentOutfit.top && currentOutfit.bottom && currentOutfit.shoes && !isShuffling && (
                <div className="flex gap-3">
                  {/* Dislike Button */}
                  <button
                    onClick={handleDislikeOutfit}
                    disabled={isDisliking || disliked || saved}
                    className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border ${
                      disliked
                        ? 'bg-red-50 border-red-200 text-red-600'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <ThumbsDown className="w-5 h-5" />
                    {disliked ? 'Noted' : isDisliking ? '...' : 'Nope'}
                  </button>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveOutfit}
                    disabled={isSaving || saved || disliked}
                    className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border ${
                      saved
                        ? 'bg-green-50 border-green-200 text-green-600'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {saved ? (
                      <>
                        <Check className="w-5 h-5" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5" />
                        {isSaving ? '...' : 'Save'}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 text-center text-xs text-gray-400">
              {items.tops.length} tops • {items.bottoms.length} bottoms • {items.shoes.length} shoes
            </div>

            {/* AI/Random Indicator */}
            {currentOutfit.top && !isShuffling && (
              <div className={`mt-4 text-center text-xs font-medium ${isAiPicked ? 'text-purple-600' : 'text-orange-500'}`}>
                {isAiPicked ? '✨ AI Matched' : '🎲 Random'}
              </div>
            )}

            {/* Debug Log */}
            {debugLog && (
              <div className="mt-4 p-3 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap">
                {debugLog}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
