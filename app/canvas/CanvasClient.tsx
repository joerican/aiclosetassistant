"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Filter, X } from "lucide-react";

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

interface CanvasItem {
  id: string;
  item: ClothingItem;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export default function CanvasClient() {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [outfitName, setOutfitName] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch('/api/get-items?category=all');
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = selectedCategory === "all"
    ? items
    : items.filter(item => item.category === selectedCategory);

  const handleDragStart = (e: React.DragEvent, item: ClothingItem) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('itemId', item.id);
    e.dataTransfer.setData('isNew', 'true');
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    const isNew = e.dataTransfer.getData('isNew') === 'true';

    if (!itemId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isNew) {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const newCanvasItem: CanvasItem = {
        id: crypto.randomUUID(),
        item,
        x: x - 75, // Center on cursor (assuming 150px width)
        y: y - 75,
        width: 150,
        height: 150,
        zIndex: maxZIndex + 1,
      };

      setCanvasItems([...canvasItems, newCanvasItem]);
      setMaxZIndex(maxZIndex + 1);
    }
  };

  const handleItemMouseDown = (e: React.MouseEvent | React.TouchEvent, canvasItemId: string) => {
    e.preventDefault();
    const canvasItem = canvasItems.find(ci => ci.id === canvasItemId);
    if (!canvasItem) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const offsetX = clientX - rect.left - canvasItem.x;
    const offsetY = clientY - rect.top - canvasItem.y;

    setDraggedItem(canvasItemId);
    setDragOffset({ x: offsetX, y: offsetY });

    // Bring to front
    setCanvasItems(items =>
      items.map(ci =>
        ci.id === canvasItemId
          ? { ...ci, zIndex: maxZIndex + 1 }
          : ci
      )
    );
    setMaxZIndex(maxZIndex + 1);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedItem) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left - dragOffset.x;
    const y = clientY - rect.top - dragOffset.y;

    setCanvasItems(items =>
      items.map(ci =>
        ci.id === draggedItem
          ? { ...ci, x: Math.max(0, Math.min(x, rect.width - ci.width)), y: Math.max(0, Math.min(y, rect.height - ci.height)) }
          : ci
      )
    );
  };

  const handleMouseUp = () => {
    setDraggedItem(null);
  };

  const handleRemoveItem = (canvasItemId: string) => {
    setCanvasItems(canvasItems.filter(ci => ci.id !== canvasItemId));
  };

  const handleSaveOutfit = async () => {
    if (canvasItems.length === 0) {
      alert('Add at least one item to your canvas');
      return;
    }

    try {
      const canvasLayout = {
        items: canvasItems.map(ci => ({
          itemId: ci.item.id,
          x: ci.x,
          y: ci.y,
          width: ci.width,
          height: ci.height,
          zIndex: ci.zIndex,
        }))
      };

      const response = await fetch('/api/save-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasLayout: JSON.stringify(canvasLayout),
          isCanvasOutfit: true,
          name: outfitName || 'Canvas Outfit',
          // Required fields with null for canvas outfits
          topId: null,
          bottomId: null,
          shoesId: null,
        }),
      });

      if (response.ok) {
        alert('Canvas outfit saved!');
        setCanvasItems([]);
        setOutfitName('');
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving canvas outfit:', error);
      alert('Failed to save canvas outfit');
    }
  };

  // Track where user came from for back button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const referrer = document.referrer;
      if (referrer.includes('/outfits')) {
        sessionStorage.setItem('canvasReferrer', '/outfits');
      } else if (referrer.includes('/closet')) {
        sessionStorage.setItem('canvasReferrer', '/closet');
      }
    }
  }, []);

  const getBackLink = () => {
    if (typeof window !== 'undefined') {
      const referrer = sessionStorage.getItem('canvasReferrer');
      return referrer || '/closet';
    }
    return '/closet';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Simple back button only */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center">
          <Link href={getBackLink()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-4 space-y-4">
        {/* Title and Instructions */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">CANVAS</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Drag items from below to create your outfit. Click and drag to move items around.
          </p>
        </div>

        {/* Canvas Area */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">

          <div
            ref={canvasRef}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg touch-none"
            style={{ width: '100%', height: '450px' }}
          >
            {canvasItems.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Drop items here to create your outfit
              </div>
            )}

            {canvasItems.map(canvasItem => (
              <div
                key={canvasItem.id}
                onMouseDown={(e) => handleItemMouseDown(e, canvasItem.id)}
                onTouchStart={(e) => handleItemMouseDown(e, canvasItem.id)}
                className="absolute cursor-move group touch-none"
                style={{
                  left: canvasItem.x,
                  top: canvasItem.y,
                  width: canvasItem.width,
                  height: canvasItem.height,
                  zIndex: canvasItem.zIndex,
                }}
              >
                <img
                  src={canvasItem.item.original_image_url}
                  alt={canvasItem.item.subcategory || canvasItem.item.category}
                  className="w-full h-full object-contain pointer-events-none select-none"
                  draggable={false}
                  style={{
                    transform: canvasItem.item.rotation ? `rotate(${canvasItem.item.rotation}deg)` : undefined,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                  }}
                />
                <button
                  onClick={() => handleRemoveItem(canvasItem.id)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Items Section with Integrated Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" />
              {selectedCategory === 'all' ? 'All Items' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}
            </h3>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap mb-4">
            {['all', 'tops', 'bottoms', 'shoes', 'outerwear', 'accessories'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          {isLoading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No items</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-2">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className="flex-shrink-0 w-32 bg-white border-2 border-gray-200 rounded-lg p-2 cursor-move hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    <img
                      src={item.original_image_url}
                      alt={item.subcategory || item.category}
                      className="w-full h-28 object-contain mb-1"
                      style={{
                        transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined
                      }}
                    />
                    <div className="text-xs text-gray-600 text-center truncate">
                      {item.subcategory || item.category}
                    </div>
                    {item.color && (
                      <div className="text-xs text-gray-500 text-center truncate">
                        {item.color}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Save Section - Always visible at bottom */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
          <div>
            <label htmlFor="outfitName" className="block text-sm font-medium text-gray-700 mb-2">
              Outfit Name (Optional)
            </label>
            <input
              id="outfitName"
              type="text"
              placeholder="e.g., Weekend Casual"
              value={outfitName}
              onChange={(e) => setOutfitName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
          <button
            onClick={handleSaveOutfit}
            disabled={canvasItems.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-base transition-colors"
          >
            <Save className="w-5 h-5" />
            {canvasItems.length === 0 ? 'Add items to save' : 'Save Outfit'}
          </button>
        </div>
      </div>
    </div>
  );
}
