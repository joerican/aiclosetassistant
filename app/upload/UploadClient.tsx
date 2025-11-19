"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Category } from "@/types";
import { Upload, Camera } from "lucide-react";

// Size options based on category and subcategory
const sizeOptions = {
  tops: {
    default: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"],
  },
  bottoms: {
    women: [
      "00/24", "0/25", "2/26", "4/27", "6/28", "8/29", "10/30", "12/31",
      "14/32", "16/33", "18/34", "20/35", "22/36", "24/37"
    ],
    womenLength: ["Crop", "Short", "Regular", "Long", "Extra Long"],
    men: ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40", "42", "44"],
    menLength: ["28", "30", "32", "34", "36"],
  },
  shoes: {
    women: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"],
    men: ["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "12.5", "13", "14", "15"],
  },
  outerwear: {
    default: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"],
  },
  accessories: {
    default: ["One Size", "XS", "S", "M", "L", "XL"],
  },
};

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [processedPreview, setProcessedPreview] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [aiMetadata, setAiMetadata] = useState<{
    category?: string;
    subcategory?: string;
    colors?: string[];
    brand?: string;
    description?: string;
    tags?: string[];
  } | null>(null);

  // Required fields
  const [category, setCategory] = useState<Category>("tops");
  const [subcategory, setSubcategory] = useState<string>("");
  const [customSubcategory, setCustomSubcategory] = useState<string>("");
  const [colors, setColors] = useState<string>("");

  // Optional fields (collapsed by default)
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [brand, setBrand] = useState<string>("");
  const [sizeType, setSizeType] = useState<string>("women");
  const [size, setSize] = useState<string>("");
  const [sizeLength, setSizeLength] = useState<string>("");
  const [customSize, setCustomSize] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [datePurchased, setDatePurchased] = useState<string>("");
  const [storePurchasedFrom, setStorePurchasedFrom] = useState<string>("");

  const [showConfirmation, setShowConfirmation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const categories: Category[] = ["tops", "bottoms", "shoes", "outerwear", "accessories"];

  const subcategoryOptions: Record<Category, string[]> = {
    tops: ["t-shirt", "shirt", "blouse", "sweater", "hoodie", "tank top", "cardigan", "polo"],
    bottoms: ["jeans", "pants", "shorts", "skirt", "leggings", "dress pants", "joggers"],
    shoes: ["sneakers", "boots", "sandals", "heels", "flats", "loafers", "dress shoes"],
    outerwear: ["jacket", "coat", "blazer", "windbreaker", "parka", "vest", "trench coat"],
    accessories: ["hat", "scarf", "belt", "bag", "sunglasses", "watch", "jewelry", "tie"]
  };

  const getCurrentSizeOptions = (): string[] => {
    if (category === "bottoms") {
      return sizeType === "men"
        ? sizeOptions.bottoms.men
        : sizeOptions.bottoms.women;
    }
    if (category === "shoes") {
      return sizeType === "men"
        ? sizeOptions.shoes.men
        : sizeOptions.shoes.women;
    }
    return sizeOptions[category]?.default || [];
  };

  const getSizeLengthOptions = (): string[] => {
    if (category === "bottoms") {
      return sizeType === "men"
        ? sizeOptions.bottoms.menLength
        : sizeOptions.bottoms.womenLength;
    }
    return [];
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setProcessedPreview("");
      };
      reader.readAsDataURL(file);
      analyzeAndProcessImage(file);
    }
  };

  const handleCameraSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setProcessedPreview("");
      };
      reader.readAsDataURL(file);
      analyzeAndProcessImage(file);
    }
  };

  const hashImageFile = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const checkDuplicate = async (hash: string): Promise<{ duplicate: boolean; existingItem?: any }> => {
    try {
      const response = await fetch('/api/check-duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageHash: hash,
          userId: 'default-user'
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Duplicate check failed:', error);
      return { duplicate: false };
    }
  };

  const analyzeAndProcessImage = async (imageFile: File) => {
    setIsAnalyzing(true);
    setIsProcessing(true);

    try {
      // Run AI analysis and background removal in parallel
      const analysisPromise = analyzeImage(imageFile);
      const bgRemovalPromise = removeBackground(imageFile);
      await Promise.all([analysisPromise, bgRemovalPromise]);
      setIsAnalyzing(false);
      setIsProcessing(false);
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error during image processing:', error);
      setIsAnalyzing(false);
      setIsProcessing(false);
      alert('Failed to process image. Please try again.');
    }
  };

  const analyzeImage = async (imageFile: File) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        console.error('AI analysis failed');
        return;
      }
      const result = await response.json();
      if (result.success && result.metadata) {
        setAiMetadata(result.metadata);
        if (result.metadata.category && categories.includes(result.metadata.category as Category)) {
          const aiCategory = result.metadata.category as Category;
          setCategory(aiCategory);

          // Check if AI subcategory matches our predefined list
          if (result.metadata.subcategory) {
            const aiSubcategory = result.metadata.subcategory.toLowerCase();
            const matchingOption = subcategoryOptions[aiCategory].find(
              option => option.toLowerCase() === aiSubcategory
            );

            if (matchingOption) {
              setSubcategory(matchingOption);
              setCustomSubcategory("");
            } else {
              setSubcategory("Other");
              setCustomSubcategory(result.metadata.subcategory);
            }
          }
        } else if (result.metadata.subcategory) {
          // If category doesn't match but we have subcategory, check against current category
          const aiSubcategory = result.metadata.subcategory.toLowerCase();
          const matchingOption = subcategoryOptions[category].find(
            option => option.toLowerCase() === aiSubcategory
          );

          if (matchingOption) {
            setSubcategory(matchingOption);
            setCustomSubcategory("");
          } else {
            setSubcategory("Other");
            setCustomSubcategory(result.metadata.subcategory);
          }
        }
        if (result.metadata.colors && result.metadata.colors.length > 0) {
          setColors(result.metadata.colors.join(", "));
        }
        if (result.metadata.brand) {
          setBrand(result.metadata.brand);
        }
        if (result.metadata.description) {
          setDescription(result.metadata.description);
        }
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
    }
  };

  const removeBackground = async (imageFile: File) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const response = await fetch('/api/remove-background', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        console.error('Background removal failed');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setProcessedPreview(url);
    } catch (error) {
      console.error("Error removing background:", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !category) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('originalImage', selectedFile);
      formData.append('category', category);
      formData.append('userId', 'default-user');

      // Use custom subcategory if "Other" is selected, otherwise use the selected value
      const finalSubcategory = subcategory === "Other" ? customSubcategory : subcategory;
      if (finalSubcategory) formData.append('subcategory', finalSubcategory);

      if (colors) formData.append('color', colors);
      if (brand) formData.append('brand', brand);

      let fullSize = customSize || size;
      if (category === "bottoms" && size && sizeLength) {
        fullSize = `${size} (${sizeLength})`;
      }
      if (fullSize) formData.append('size', fullSize);

      if (description) formData.append('description', description);
      if (notes) formData.append('notes', notes);
      if (cost) formData.append('cost', cost);
      if (datePurchased) {
        const timestamp = new Date(datePurchased).getTime();
        formData.append('date_purchased', timestamp.toString());
      }
      if (storePurchasedFrom) formData.append('store_purchased_from', storePurchasedFrom);

      // Add AI metadata if available
      if (aiMetadata) {
        formData.append('aiMetadata', JSON.stringify(aiMetadata));
      }

      if (processedPreview) {
        const processedBlob = await fetch(processedPreview).then(r => r.blob());
        const processedFile = new File([processedBlob], 'processed.png', { type: 'image/png' });
        formData.append('processedImage', processedFile);
      }

      const response = await fetch('/api/upload-item', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();

        // Handle duplicate error specially
        if (result.error === 'duplicate') {
          const shouldContinue = confirm(result.message + '\n\nWould you like to go back and try a different item?');
          if (shouldContinue) {
            // Reset the form
            setSelectedFile(null);
            setPreview("");
            setProcessedPreview("");
            setShowConfirmation(false);
            setAiMetadata(null);
          }
          return;
        }

        throw new Error(result.error || 'Failed to upload item');
      }

      window.location.href = "/closet";
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold">Add Item</h1>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-1">
                Upload or take a photo of your clothing
              </p>
            </div>
            <Link
              href="/closet"
              style={{ color: 'var(--text-secondary)' }}
              className="hover:opacity-70 transition-opacity"
            >
              Back to Closet
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border-2 border-black rounded-lg p-6">
          {!selectedFile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-black rounded-lg p-8 text-center">
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraSelect}
                  className="hidden"
                />
                <div className="mb-4 flex justify-center">
                  <Camera size={64} strokeWidth={1.5} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}
                  className="px-6 py-3 text-white rounded-lg font-medium transition-all hover:shadow-lg"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
                >
                  Take Photo
                </button>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-3">
                  Use your camera
                </p>
              </div>

              <div className="border-2 border-dashed border-black rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="mb-4 flex justify-center">
                  <Upload size={64} strokeWidth={1.5} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ backgroundColor: 'var(--accent-primary)', boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)' }}
                  className="px-6 py-3 text-white rounded-lg font-medium transition-all hover:shadow-lg"
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
                >
                  Upload from Device
                </button>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm mt-3">
                  Choose a photo from your device
                </p>
              </div>
            </div>
          )}

          {selectedFile && !showConfirmation && (
            <div className="relative">
              <img src={preview} alt="Selected" className="w-full rounded-lg border-2 border-black" />
              {(isAnalyzing || isProcessing) && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70 flex items-center justify-center rounded-lg overflow-hidden">
                  <div className="absolute inset-0">
                    <div className="absolute w-full h-0.5 animate-scan-line" style={{
                      background: `linear-gradient(90deg, transparent 0%, var(--accent-primary) 50%, transparent 100%)`,
                      boxShadow: `0 0 20px var(--accent-primary), 0 0 40px var(--accent-primary)`
                    }}></div>
                  </div>
                  <div className="text-center text-white z-10">
                    <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-lg font-semibold relative inline-block">
                      <span className="relative">
                        Analyzing with AI...
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-50 animate-shimmer"></span>
                      </span>
                    </p>
                    <p className="text-sm opacity-80 mt-2">
                      {isAnalyzing && isProcessing ? "Detecting details & removing background" :
                       isAnalyzing ? "Detecting category, colors, and details" :
                       "Removing background"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedFile && showConfirmation && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="bg-white rounded-lg p-4 max-w-md border-2 border-black">
                  <img src={processedPreview || preview} alt="Item preview" className="w-full rounded-lg" />
                  {processedPreview && (
                    <p style={{ color: 'var(--text-secondary)' }} className="text-xs text-center mt-2">✓ Background removed</p>
                  )}
                </div>
              </div>

              {aiMetadata && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">✓ AI Detected</h4>
                  <p className="text-sm text-green-700">
                    {aiMetadata.description || "Successfully analyzed"}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h3 style={{ color: 'var(--text-primary)' }} className="text-lg font-semibold">Required Details</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value as Category);
                        setSize("");
                        setSizeLength("");
                        setCustomSize("");
                      }}
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Type *</label>
                    <select
                      value={subcategory}
                      onChange={(e) => {
                        setSubcategory(e.target.value);
                        if (e.target.value !== "Other") setCustomSubcategory("");
                      }}
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    >
                      <option value="">Select type...</option>
                      {subcategoryOptions[category].map((option) => (
                        <option key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {subcategory === "Other" && (
                    <div>
                      <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Custom Type *</label>
                      <input
                        type="text"
                        value={customSubcategory}
                        onChange={(e) => setCustomSubcategory(e.target.value)}
                        placeholder="Enter custom type"
                        style={{ color: 'var(--text-primary)' }}
                        className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Colors *</label>
                    <input
                      type="text"
                      value={colors}
                      onChange={(e) => setColors(e.target.value)}
                      placeholder="e.g., black, white"
                      style={{ color: 'var(--text-primary)' }}
                      className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Collapsible Optional Fields */}
                <button
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  style={{ color: 'var(--accent-primary)' }}
                  className="text-sm font-medium hover:underline flex items-center gap-2"
                >
                  {showOptionalFields ? "▼" : "▶"} Add More Details (optional)
                </button>

                {showOptionalFields && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border-2 border-black">
                    <div>
                      <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Brand</label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g., Nike, Zara"
                        style={{ color: 'var(--text-primary)' }}
                        className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                      />
                    </div>

                    {(category === "bottoms" || category === "shoes") && (
                      <div>
                        <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Size Type</label>
                        <select
                          value={sizeType}
                          onChange={(e) => {
                            setSizeType(e.target.value);
                            setSize("");
                            setSizeLength("");
                          }}
                          style={{ color: 'var(--text-primary)' }}
                          className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                        >
                          <option value="women">Women's</option>
                          <option value="men">Men's</option>
                        </select>
                      </div>
                    )}

                    <div className={category === "bottoms" || category === "shoes" ? "" : "col-span-2"}>
                      <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">
                        Size {category === "bottoms" && "(Waist)"}
                      </label>
                      <select
                        value={size}
                        onChange={(e) => {
                          setSize(e.target.value);
                          if (e.target.value !== "Other") setCustomSize("");
                        }}
                        style={{ color: 'var(--text-primary)' }}
                        className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                      >
                        <option value="">Select size...</option>
                        {getCurrentSizeOptions().map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {category === "bottoms" && size && size !== "Other" && (
                      <div>
                        <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Length</label>
                        <select
                          value={sizeLength}
                          onChange={(e) => setSizeLength(e.target.value)}
                          style={{ color: 'var(--text-primary)' }}
                          className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                        >
                          <option value="">Select length...</option>
                          {getSizeLengthOptions().map((l) => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {size === "Other" && (
                      <div className="col-span-2">
                        <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Custom Size</label>
                        <input
                          type="text"
                          value={customSize}
                          onChange={(e) => setCustomSize(e.target.value)}
                          placeholder="Enter custom size"
                          style={{ color: 'var(--text-primary)' }}
                          className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="col-span-2">
                      <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the item..."
                        rows={2}
                        style={{ color: 'var(--text-primary)' }}
                        className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="0.00"
                        style={{ color: 'var(--text-primary)' }}
                        className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Date Purchased</label>
                      <input
                        type="date"
                        value={datePurchased}
                        onChange={(e) => setDatePurchased(e.target.value)}
                        style={{ color: 'var(--text-primary)' }}
                        className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Store</label>
                      <input
                        type="text"
                        value={storePurchasedFrom}
                        onChange={(e) => setStorePurchasedFrom(e.target.value)}
                        placeholder="e.g., Amazon, Nordstrom"
                        style={{ color: 'var(--text-primary)' }}
                        className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label style={{ color: 'var(--text-primary)' }} className="block text-sm font-medium mb-2">Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes..."
                        rows={2}
                        style={{ color: 'var(--text-primary)' }}
                        className="w-full px-4 py-2 border-2 border-black rounded-lg bg-white focus:ring-2 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleUpload}
                  disabled={
                    isUploading ||
                    !category ||
                    !subcategory ||
                    (subcategory === "Other" && !customSubcategory) ||
                    !colors
                  }
                  style={{
                    backgroundColor: (isUploading || !category || !subcategory || (subcategory === "Other" && !customSubcategory) || !colors) ? '#9CA3AF' : 'var(--accent-primary)',
                    boxShadow: (isUploading || !category || !subcategory || (subcategory === "Other" && !customSubcategory) || !colors) ? 'none' : '0 4px 12px rgba(212, 175, 55, 0.3)'
                  }}
                  className="flex-1 px-4 py-2 disabled:opacity-100 text-white rounded-lg font-medium transition-all hover:shadow-lg"
                  onMouseEnter={(e) => {
                    if (!isUploading && category && subcategory && !(subcategory === "Other" && !customSubcategory) && colors) {
                      e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isUploading && category && subcategory && !(subcategory === "Other" && !customSubcategory) && colors) {
                      e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                    }
                  }}
                >
                  {isUploading ? "Uploading..." : "Save to Closet"}
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview("");
                    setProcessedPreview("");
                    setShowConfirmation(false);
                    setAiMetadata(null);
                  }}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        @keyframes scan-line {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
