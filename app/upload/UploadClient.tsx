"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Category } from "@/types";
import { Upload, Camera, ArrowLeft, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import Logo from "../components/Logo";

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

// Color with percentage and RGB for palette display
interface ColorWithPercent {
  name: string;
  percent: number;
  rgb?: [number, number, number];
}

// Type for queued items
interface QueuedItem {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'ready' | 'uploading' | 'done' | 'error';
  processedPreview?: string;
  processedImage?: Blob | null;  // null when stored in R2
  itemId?: string;  // Server-assigned item ID
  imageUrl?: string;  // R2 image URL
  imageHash?: string;  // Perceptual hash
  rotation?: number;  // Per-item rotation
  isDuplicate?: boolean;  // Flag for duplicate items
  duplicateInfo?: {  // Info about existing item
    subcategory?: string;
    color?: string;
    brand?: string;
  };
  metadata?: {
    category?: string;
    subcategory?: string;
    colors?: string[] | ColorWithPercent[];
    brand?: string;
    description?: string;
    tags?: string[];
  };
  error?: string;
}

export default function UploadPage() {
  // Queue state for multiple images
  const [imageQueue, setImageQueue] = useState<QueuedItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Legacy single-file states (used for current item display)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [processedPreview, setProcessedPreview] = useState<string>("");
  const [processedImage, setProcessedImage] = useState<Blob | null>(null);  // Single PNG
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);


  const [aiMetadata, setAiMetadata] = useState<{
    category?: string;
    subcategory?: string;
    colors?: string[] | ColorWithPercent[];
    brand?: string;
    description?: string;
    tags?: string[];
  } | null>(null);

  // Color palette state (max 8 colors with percentages)
  const [colorPalette, setColorPalette] = useState<ColorWithPercent[]>([]);

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
  const [rotation, setRotation] = useState(0);

  // Batch processing state
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [allProcessingComplete, setAllProcessingComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const rotateLeft = () => {
    const newRotation = (rotation - 90 + 360) % 360;
    setRotation(newRotation);
    // Save to queue item
    setImageQueue(prev => prev.map((q, idx) =>
      idx === currentIndex ? { ...q, rotation: newRotation } : q
    ));
  };
  const rotateRight = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    // Save to queue item
    setImageQueue(prev => prev.map((q, idx) =>
      idx === currentIndex ? { ...q, rotation: newRotation } : q
    ));
  };

  // Apply rotation to image blob
  const applyRotation = async (imageBlob: Blob, degrees: number): Promise<Blob> => {
    if (degrees === 0) return imageBlob;

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Swap dimensions for 90/270 degree rotations
        if (degrees === 90 || degrees === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        // Move to center, rotate, draw
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create rotated blob'));
          }
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for rotation'));
      };

      img.src = URL.createObjectURL(imageBlob);
    });
  };

  const categories: Category[] = ["tops", "bottoms", "shoes", "outerwear", "accessories"];

  // Convert color name to hex code for display
  const colorNameToHex = (name: string): string => {
    const colors: Record<string, string> = {
      black: '#000000',
      white: '#FFFFFF',
      gray: '#808080',
      grey: '#808080',
      red: '#EF4444',
      blue: '#3B82F6',
      navy: '#1E3A5A',
      green: '#22C55E',
      yellow: '#EAB308',
      orange: '#F97316',
      pink: '#EC4899',
      purple: '#A855F7',
      brown: '#92400E',
      beige: '#D4B896',
      tan: '#D2B48C',
      cream: '#FFFDD0',
      ivory: '#FFFFF0',
      gold: '#FFD700',
      silver: '#C0C0C0',
      maroon: '#800000',
      burgundy: '#800020',
      olive: '#808000',
      teal: '#008080',
      coral: '#FF7F50',
      turquoise: '#40E0D0',
      lavender: '#E6E6FA',
      charcoal: '#36454F',
      khaki: '#C3B091',
      denim: '#1560BD',
      mint: '#98FF98',
    };
    return colors[name.toLowerCase()] || '#808080';
  };

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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: QueuedItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newItems.push({
          id: `${Date.now()}-${i}`,
          file,
          preview,
          status: 'pending'
        });
      }
    }

    if (newItems.length > 0) {
      setImageQueue(newItems);
      setCurrentIndex(0);
      // Set up batch processing state
      setTotalToProcess(newItems.length);
      setProcessedCount(0);
      setAllProcessingComplete(false);
      // Show first item preview while processing
      setSelectedFile(newItems[0].file);
      setPreview(newItems[0].preview);
      setProcessedPreview("");
      setIsProcessing(true);
      setIsAnalyzing(true);
      // Start processing all items in background
      processQueueInBackground(newItems);
    }
  };

  const handleCameraSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const newItem: QueuedItem = {
        id: `${Date.now()}`,
        file,
        preview,
        status: 'pending'
      };

      setImageQueue([newItem]);
      setCurrentIndex(0);
      // Set up batch processing state
      setTotalToProcess(1);
      setProcessedCount(0);
      setAllProcessingComplete(false);
      // Show item while processing
      setSelectedFile(file);
      setPreview(preview);
      setProcessedPreview("");
      setIsProcessing(true);
      setIsAnalyzing(true);
      processQueueInBackground([newItem]);
    }
  };

  // Process all items in background with parallel batches
  const processQueueInBackground = async (items: QueuedItem[]) => {
    console.log('[Queue] Starting processing of', items.length, 'items');
    let successCount = 0;
    let completedCount = 0;
    const BATCH_SIZE = 6; // Process 6 items concurrently

    // Process in batches of BATCH_SIZE
    for (let batchStart = 0; batchStart < items.length; batchStart += BATCH_SIZE) {
      const batch = items.slice(batchStart, batchStart + BATCH_SIZE);
      console.log('[Queue] Processing batch starting at', batchStart, 'with', batch.length, 'items');

      // Mark all items in batch as processing
      setImageQueue(prev => prev.map(q => {
        if (batch.some(b => b.id === q.id)) {
          return { ...q, status: 'processing' };
        }
        return q;
      }));

      // Process batch in parallel
      const batchPromises = batch.map(async (item, batchIdx) => {
        const itemNum = batchStart + batchIdx + 1;
        try {
          addLog(`Processing item ${itemNum}...`);
          const result = await processItemInBackground(item);
          console.log('[Queue] Item', itemNum, 'completed successfully');
          addLog(`Item ${itemNum} ✓`);

          // Update with results
          const updatedItem = { ...item, ...result, status: 'ready' as const };
          setImageQueue(prev => prev.map(q =>
            q.id === item.id ? updatedItem : q
          ));

          return { success: true, item: updatedItem };
        } catch (error) {
          console.error('[Queue] Error processing item', itemNum, ':', error);
          const errorMessage = String(error);
          const isSkipped = errorMessage.includes('Duplicate skipped');

          if (isSkipped) {
            addLog(`Item ${itemNum} skipped (duplicate)`);
          } else {
            addLog(`Item ${itemNum} ✗ error`);
          }

          setImageQueue(prev => prev.map(q =>
            q.id === item.id ? { ...q, status: 'error', error: errorMessage } : q
          ));

          return { success: false, error: errorMessage };
        }
      });

      // Wait for all items in batch to complete
      const results = await Promise.all(batchPromises);

      // Update counts
      const batchSuccesses = results.filter(r => r.success).length;
      successCount += batchSuccesses;
      completedCount += batch.length;
      setProcessedCount(completedCount);

      console.log('[Queue] Batch complete:', batchSuccesses, 'successful,', completedCount, 'total processed');
    }

    console.log('[Queue] All items processed:', successCount, 'successful of', items.length);

    // Mark all processing complete
    setAllProcessingComplete(true);
    setIsProcessing(false);
    setIsAnalyzing(false);

    // Find first ready item and show it
    // Need to get the latest queue state
    setImageQueue(prev => {
      const firstReadyIdx = prev.findIndex(item => item.status === 'ready');
      console.log('[Queue] Looking for first ready item, found at index:', firstReadyIdx);

      if (firstReadyIdx >= 0) {
        const readyItem = prev[firstReadyIdx];
        console.log('[Queue] Showing first ready item:', readyItem.id);

        // Use setTimeout to ensure state updates happen after this setter completes
        setTimeout(() => {
          setCurrentIndex(firstReadyIdx);
          updateDisplayFromQueueItem(readyItem);
          setShowConfirmation(true);
        }, 0);
      } else {
        console.log('[Queue] No ready items found - all failed or skipped');
        setTimeout(() => {
          setShowConfirmation(false);
          // Reset if nothing to show
          setSelectedFile(null);
          setPreview("");
          alert('All items failed to process or were skipped.');
        }, 0);
      }
      return prev;
    });
  };

  // Processing log for UI
  const [processingLog, setProcessingLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setProcessingLog(prev => [...prev.slice(-9), message]); // Keep last 10 messages
  };

  // Process a single item and return results
  const processItemInBackground = async (item: QueuedItem): Promise<Partial<QueuedItem>> => {
    try {
      // Client resize to 600px JPEG (fast upload)
      const resizedBlob = await resizeImage(item.file, 600, 0.85, 'image/jpeg');

      // Compute hash for duplicate detection
      const imageHash = await hashImageFile(item.file);

      // Check for duplicates before processing
      const duplicateResult = await checkDuplicate(imageHash);
      let isDuplicate = false;
      let duplicateInfo = undefined;

      if (duplicateResult.duplicate && duplicateResult.existingItem) {
        isDuplicate = true;
        duplicateInfo = {
          subcategory: duplicateResult.existingItem.subcategory,
          color: duplicateResult.existingItem.color,
          brand: duplicateResult.existingItem.brand,
        };
      }

      // Send to server for BG removal + AI analysis
      const formData = new FormData();
      formData.append('image', new File([resizedBlob], 'image.jpg', { type: 'image/jpeg' }));
      formData.append('imageHash', imageHash);
      formData.append('userId', 'default-user');

      const response = await fetch('/api/process-item', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const result = await response.json();

      // Server stores image in R2, just use the URL for preview
      const processedPreview = result.imageUrl;

      return {
        metadata: result.metadata,
        processedPreview,
        processedImage: null, // Image already in R2
        itemId: result.itemId,
        imageUrl: result.imageUrl,
        imageHash: result.imageHash,
        isDuplicate,
        duplicateInfo,
      } as Partial<QueuedItem> & { itemId: string; imageUrl: string; imageHash: string };
    } catch (error) {
      console.error('Error in processItemInBackground:', error);
      throw error;
    }
  };

  // Update display state from queue item
  const updateDisplayFromQueueItem = (item: QueuedItem) => {
    setSelectedFile(item.file);
    setPreview(item.preview);
    setProcessedPreview(item.processedPreview || "");
    setProcessedImage(item.processedImage || null);
    setShowConfirmation(item.status === 'ready');
    setIsProcessing(item.status === 'processing');
    setIsAnalyzing(item.status === 'processing');
    setRotation(item.rotation || 0);  // Load rotation from item

    // Apply metadata to form fields
    if (item.metadata) {
      setAiMetadata(item.metadata);
      if (item.metadata.category && categories.includes(item.metadata.category as Category)) {
        const aiCategory = item.metadata.category as Category;
        setCategory(aiCategory);

        if (item.metadata.subcategory) {
          const aiSubcategory = item.metadata.subcategory.toLowerCase();
          // Priority: exact match > starts with option > AI contains option > option contains AI
          const matches = subcategoryOptions[aiCategory]
            .map(option => {
              const optLower = option.toLowerCase();
              if (optLower === aiSubcategory) return { option, score: 4 };
              if (aiSubcategory.startsWith(optLower)) return { option, score: 3, len: optLower.length };
              if (aiSubcategory.includes(optLower)) return { option, score: 2, len: optLower.length };
              if (optLower.includes(aiSubcategory)) return { option, score: 1 };
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => {
              if (b!.score !== a!.score) return b!.score - a!.score;
              // For same score, prefer longer matches (more specific)
              return ((b as any).len || 0) - ((a as any).len || 0);
            });

          if (matches.length > 0) {
            setSubcategory(matches[0]!.option);
            setCustomSubcategory("");
          } else {
            setSubcategory("Other");
            setCustomSubcategory(item.metadata.subcategory);
          }
        }
      }
      if (item.metadata.colors && item.metadata.colors.length > 0) {
        // Handle both old string array and new ColorWithPercent array
        const colorsArray = item.metadata.colors;
        if (typeof colorsArray[0] === 'object' && 'name' in colorsArray[0]) {
          // New format with percentages
          const colorObjs = colorsArray as ColorWithPercent[];
          setColorPalette(colorObjs);
          const colorNames = colorObjs.map(c =>
            c.name.charAt(0).toUpperCase() + c.name.slice(1).toLowerCase()
          );
          setColors(colorNames.join(", "));
        } else {
          // Old format - just strings
          const colorStrings = colorsArray as string[];
          const capitalizedColors = colorStrings.map(
            (c: string) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
          );
          setColors(capitalizedColors.join(", "));
          // Convert to palette format with equal percentages
          const percent = Math.floor(100 / colorStrings.length);
          setColorPalette(colorStrings.map((c, i) => ({
            name: c,
            percent: i === colorStrings.length - 1 ? 100 - (percent * (colorStrings.length - 1)) : percent
          })));
        }
      } else if ((item.metadata as any).color_details) {
        // Fallback: extract colors from color_details if colors array is empty
        const colorDetails = (item.metadata as any).color_details;
        const extractedColors: string[] = [];
        if (colorDetails.primary) extractedColors.push(colorDetails.primary);
        if (colorDetails.secondary) extractedColors.push(colorDetails.secondary);
        if (colorDetails.accent) extractedColors.push(colorDetails.accent);

        if (extractedColors.length > 0) {
          const capitalizedColors = extractedColors.map(
            (c: string) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
          );
          setColors(capitalizedColors.join(", "));
          const percent = Math.floor(100 / extractedColors.length);
          setColorPalette(extractedColors.map((c, i) => ({
            name: c,
            percent: i === extractedColors.length - 1 ? 100 - (percent * (extractedColors.length - 1)) : percent
          })));
        }
      }
      if (item.metadata.brand) {
        setBrand(item.metadata.brand);
      }
      if (item.metadata.description) {
        setDescription(item.metadata.description);
      }
    } else {
      // Reset form fields
      setAiMetadata(null);
      setCategory("tops");
      setSubcategory("");
      setCustomSubcategory("");
      setColors("");
      setColorPalette([]);
      setBrand("");
      setDescription("");
    }
  };

  // Move to next item in queue after successful upload
  const moveToNextItem = () => {
    const nextIndex = currentIndex + 1;

    // Collapse optional fields and scroll to top for next item
    setShowOptionalFields(false);
    setRotation(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (nextIndex < imageQueue.length) {
      setCurrentIndex(nextIndex);
      const nextItem = imageQueue[nextIndex];
      updateDisplayFromQueueItem(nextItem);
    } else {
      // All done - reset everything
      setImageQueue([]);
      setCurrentIndex(0);
      setSelectedFile(null);
      setPreview("");
      setProcessedPreview("");
      setShowConfirmation(false);
    }
  };

  // Analyze image for queue (returns metadata without updating state)
  const analyzeImageForQueue = async (imageFile: File | Blob): Promise<QueuedItem['metadata']> => {
    try {
      const formData = new FormData();
      // Convert Blob to File if needed
      const file = imageFile instanceof File
        ? imageFile
        : new File([imageFile], 'processed.png', { type: 'image/png' });
      formData.append('image', file);
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) return undefined;
      const result = await response.json();
      return result.success ? result.metadata : undefined;
    } catch (error) {
      console.error("Error analyzing image:", error);
      return undefined;
    }
  };

  // Remove background for queue (takes pre-resized blob)
  const removeBackgroundForQueueWithBlob = async (resizedBlob: Blob): Promise<{
    processedPreview: string;
    processedImage: Blob;
  }> => {
    // Send to server for background removal
    const formData = new FormData();
    formData.append('image', new File([resizedBlob], 'image.jpg', { type: 'image/jpeg' }));

    const response = await fetch('/api/remove-background', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Background removal failed');

    const bgRemovedBlob = await response.blob();

    // Crop transparent areas
    const croppedBlob = await cropTransparentImage(bgRemovedBlob);

    // Create final 512px PNG for storage (single image, transforms on-the-fly)
    const processedPng = await resizeImage(new File([croppedBlob], 'image.png', { type: 'image/png' }), 512, 0.9, 'image/png');

    const previewUrl = URL.createObjectURL(processedPng);

    return {
      processedPreview: previewUrl,
      processedImage: processedPng
    };
  };

  // Simple perceptual hash (dHash - Difference Hash)
  // This detects visual similarity regardless of file format/metadata/compression
  const hashImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Resize to 9x8 for dHash algorithm (simple and effective)
        canvas.width = 9;
        canvas.height = 8;

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image resized to 9x8
        ctx.drawImage(img, 0, 0, 9, 8);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, 9, 8);
        const pixels = imageData.data;

        // Convert to grayscale and compute dHash
        const grayscale: number[] = [];
        for (let i = 0; i < pixels.length; i += 4) {
          // Grayscale = 0.299*R + 0.587*G + 0.114*B
          const gray = Math.round(
            pixels[i] * 0.299 +
            pixels[i + 1] * 0.587 +
            pixels[i + 2] * 0.114
          );
          grayscale.push(gray);
        }

        // Compute dHash: compare each pixel to the one on its right
        let hash = '';
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const index = row * 9 + col;
            const left = grayscale[index];
            const right = grayscale[index + 1];
            // If left < right, append '1', else append '0'
            hash += left < right ? '1' : '0';
          }
        }

        // Convert binary string to hex for easier storage
        let hexHash = '';
        for (let i = 0; i < hash.length; i += 4) {
          const nibble = hash.substring(i, i + 4);
          hexHash += parseInt(nibble, 2).toString(16);
        }

        URL.revokeObjectURL(img.src);
        resolve(hexHash);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // Tightly crop transparent PNG to content bounds
  const cropTransparentImage = async (imageBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image to canvas
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data to find bounds
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const pixels = imageData.data;

        let minX = img.width;
        let minY = img.height;
        let maxX = 0;
        let maxY = 0;

        // Scan all pixels to find bounds of non-transparent pixels
        for (let y = 0; y < img.height; y++) {
          for (let x = 0; x < img.width; x++) {
            const alpha = pixels[(y * img.width + x) * 4 + 3];
            if (alpha > 10) { // Pixel is not fully transparent (threshold to handle anti-aliasing)
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // Add small padding (5px on each side)
        const padding = 5;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(img.width - 1, maxX + padding);
        maxY = Math.min(img.height - 1, maxY + padding);

        const cropWidth = maxX - minX + 1;
        const cropHeight = maxY - minY + 1;

        console.log('Cropping from', img.width, 'x', img.height, 'to', cropWidth, 'x', cropHeight);

        // Create new canvas with cropped dimensions
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d');

        if (!croppedCtx) {
          reject(new Error('Could not get cropped canvas context'));
          return;
        }

        croppedCanvas.width = cropWidth;
        croppedCanvas.height = cropHeight;

        // Draw cropped region
        croppedCtx.drawImage(
          canvas,
          minX, minY, cropWidth, cropHeight,
          0, 0, cropWidth, cropHeight
        );

        // Convert to blob
        croppedCanvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create cropped blob'));
          }
        }, 'image/png');
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for cropping'));
      };

      img.src = URL.createObjectURL(imageBlob);
    });
  };

  // Resize image to specified max width while maintaining aspect ratio
  const resizeImage = async (
    imageBlob: Blob,
    maxWidth: number,
    quality: number = 0.9,
    format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/webp'
  ): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        console.log(`Resizing from ${img.width}x${img.height} to ${width}x${height}`);

        // Set canvas size and draw resized image
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(img.src);
          if (blob) {
            console.log(`Resized to ${format}, size: ${(blob.size / 1024).toFixed(2)}KB`);
            resolve(blob);
          } else {
            reject(new Error('Failed to create resized blob'));
          }
        }, format, quality);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for resizing'));
      };

      img.src = URL.createObjectURL(imageBlob);
    });
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
    try {
      // Step 1: Hash the file FIRST before any processing
      console.log('Hashing file to check for duplicates...');
      const imageHash = await hashImageFile(imageFile);
      console.log('File hash:', imageHash);

      // Step 2: Check if this hash already exists in the database
      console.log('Checking for duplicates...');
      const duplicateResult = await checkDuplicate(imageHash);
      console.log('Duplicate check result:', duplicateResult);

      if (duplicateResult.duplicate && duplicateResult.existingItem) {
        const itemInfo = duplicateResult.existingItem;
        const itemDescription = [
          itemInfo.subcategory,
          itemInfo.color,
          itemInfo.brand
        ].filter(Boolean).join(', ') || 'an item';

        const shouldContinue = confirm(
          `You've already uploaded ${itemDescription} to your closet.\n\nDo you want to upload it again as a duplicate?`
        );

        if (!shouldContinue) {
          // User declined - reset and return to upload
          setSelectedFile(null);
          setPreview("");
          return;
        }
        // User wants to upload anyway - continue with processing
      }

      // Step 3: No duplicate (or user wants duplicate) - proceed with processing
      setIsAnalyzing(true);
      setIsProcessing(true);

      try {
        // Run analysis and background removal in parallel
        const analysisPromise = analyzeImage(imageFile);
        const bgRemovalPromise = removeBackgroundClientSide(imageFile);
        await Promise.all([analysisPromise, bgRemovalPromise]);

        setIsAnalyzing(false);
        setIsProcessing(false);
        setShowConfirmation(true);
      } catch (processingError) {
        console.error('Error during image processing:', processingError);
        const errorMessage = processingError instanceof Error ? processingError.message : 'Unknown error';
        alert(`Processing failed: ${errorMessage}\n\nPlease try uploading a smaller image or try again.`);
        setIsAnalyzing(false);
        setIsProcessing(false);
        // Reset to allow retry
        setSelectedFile(null);
        setPreview("");
      }
    } catch (error) {
      console.error('Error during image analysis:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`An error occurred: ${errorMessage}\n\nPlease try again.`);
      setIsAnalyzing(false);
      setIsProcessing(false);
      setSelectedFile(null);
      setPreview("");
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
            const matches = subcategoryOptions[aiCategory]
              .map(option => {
                const optLower = option.toLowerCase();
                if (optLower === aiSubcategory) return { option, score: 4 };
                if (aiSubcategory.startsWith(optLower)) return { option, score: 3, len: optLower.length };
                if (aiSubcategory.includes(optLower)) return { option, score: 2, len: optLower.length };
                if (optLower.includes(aiSubcategory)) return { option, score: 1 };
                return null;
              })
              .filter(Boolean)
              .sort((a, b) => {
                if (b!.score !== a!.score) return b!.score - a!.score;
                return ((b as any).len || 0) - ((a as any).len || 0);
              });

            if (matches.length > 0) {
              setSubcategory(matches[0]!.option);
              setCustomSubcategory("");
            } else {
              setSubcategory("Other");
              setCustomSubcategory(result.metadata.subcategory);
            }
          }
        } else if (result.metadata.subcategory) {
          // If category doesn't match but we have subcategory, check against current category
          const aiSubcategory = result.metadata.subcategory.toLowerCase();
          const matches = subcategoryOptions[category]
            .map(option => {
              const optLower = option.toLowerCase();
              if (optLower === aiSubcategory) return { option, score: 4 };
              if (aiSubcategory.startsWith(optLower)) return { option, score: 3, len: optLower.length };
              if (aiSubcategory.includes(optLower)) return { option, score: 2, len: optLower.length };
              if (optLower.includes(aiSubcategory)) return { option, score: 1 };
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => {
              if (b!.score !== a!.score) return b!.score - a!.score;
              return ((b as any).len || 0) - ((a as any).len || 0);
            });

          if (matches.length > 0) {
            setSubcategory(matches[0]!.option);
            setCustomSubcategory("");
          } else {
            setSubcategory("Other");
            setCustomSubcategory(result.metadata.subcategory);
          }
        }
        if (result.metadata.colors && result.metadata.colors.length > 0) {
          // Capitalize each color
          const capitalizedColors = result.metadata.colors.map(
            (c: string) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
          );
          setColors(capitalizedColors.join(", "));
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

  const removeBackgroundClientSide = async (imageFile: File) => {
    let imageBlob: Blob | null = null;

    try {
      console.log('Starting new image processing flow...');

      // Chrome-only memory API (optional)
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        console.log('Memory before processing:', {
          used: memoryInfo.usedJSHeapSize,
          total: memoryInfo.totalJSHeapSize,
          limit: memoryInfo.jsHeapSizeLimit
        });
      }

      // Step 1: Resize original to 800px first (reduces memory for BG removal)
      console.log('Step 1: Resizing to 800px...');
      const resized800Blob = await resizeImage(imageFile, 800, 0.9, 'image/png');
      console.log('Resized to 800px, size:', (resized800Blob.size / 1024).toFixed(2), 'KB');

      // Step 2: Remove background on the 800px image
      console.log('Step 2: Removing background...');
      const { removeBackground } = await import('@imgly/background-removal');

      imageBlob = await removeBackground(resized800Blob, {
        model: 'isnet_quint8',
        output: {
          format: 'image/png',
          quality: 0.9,
        },
      });

      console.log('Background removal complete');

      if (memoryInfo) {
        console.log('Memory after BG removal:', {
          used: memoryInfo.usedJSHeapSize,
          total: memoryInfo.totalJSHeapSize,
          limit: memoryInfo.jsHeapSizeLimit
        });
      }

      // Step 3: Crop the transparent image to content bounds
      console.log('Step 3: Cropping to content bounds...');
      const croppedBlob = await cropTransparentImage(imageBlob);
      console.log('Image cropped, size:', (croppedBlob.size / 1024).toFixed(2), 'KB');

      // Clean up the intermediate blob to free memory
      imageBlob = null;

      // Step 4: Resize cropped image to 512px PNG for storage (transforms on-the-fly)
      console.log('Step 4: Creating 512px PNG for storage...');
      const image512 = await resizeImage(croppedBlob, 512, 0.9, 'image/png');
      console.log('512px version created, size:', (image512.size / 1024).toFixed(2), 'KB');
      setProcessedImage(image512);

      // Force garbage collection hint (browser may ignore)
      if (typeof window !== 'undefined' && 'gc' in window) {
        // @ts-ignore - gc() only available with --expose-gc flag
        window.gc();
      }

      if (memoryInfo) {
        console.log('Memory after cleanup:', {
          used: memoryInfo.usedJSHeapSize,
          total: memoryInfo.totalJSHeapSize,
          limit: memoryInfo.jsHeapSizeLimit
        });
      }

      // Revoke old URL to free memory before creating new one
      if (processedPreview) {
        URL.revokeObjectURL(processedPreview);
      }

      // Use 512px version for preview
      const url = URL.createObjectURL(image512);
      setProcessedPreview(url);

      console.log('Image processing complete! Ready for upload.');
    } catch (error) {
      console.error("Error processing image:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Clean up on error
      imageBlob = null;

      alert(`Image processing failed: ${errorMessage}\n\nPlease try again.`);
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !category) return;
    setIsUploading(true);
    try {
      // Get current queue item for itemId, imageUrl, imageHash
      const currentItem = imageQueue[currentIndex];
      if (!currentItem?.itemId || !currentItem?.imageUrl) {
        throw new Error('Item not processed yet');
      }

      // Use custom subcategory if "Other" is selected
      const finalSubcategory = subcategory === "Other" ? customSubcategory : subcategory;

      let fullSize = customSize || size;
      if (category === "bottoms" && size && sizeLength) {
        fullSize = `${size} (${sizeLength})`;
      }

      // Save metadata to database (image already in R2)
      const response = await fetch('/api/save-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: currentItem.itemId,
          imageUrl: currentItem.imageUrl,
          imageHash: currentItem.imageHash,
          userId: 'default-user',
          category,
          subcategory: finalSubcategory || null,
          color: colors || null,
          brand: brand || null,
          size: fullSize || null,
          description: description || null,
          notes: notes || null,
          cost: cost ? parseFloat(cost) : null,
          datePurchased: datePurchased ? new Date(datePurchased).getTime() : null,
          storePurchasedFrom: storePurchasedFrom || null,
          aiMetadata: aiMetadata || null,
          rotation: currentItem.rotation || 0,
          originalFilename: currentItem.file.name || null,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save item');
      }

      // Mark current item as done
      setImageQueue(prev => prev.map((q, idx) =>
        idx === currentIndex ? { ...q, status: 'done' } : q
      ));

      // If there are more items, move to next one
      if (currentIndex < imageQueue.length - 1) {
        moveToNextItem();
      } else {
        // All done - go to closet
        window.location.href = "/closet";
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Save failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <Logo size="sm" />
            <Link
              href="/closet"
              className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
            >
              <ArrowLeft size={14} />
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Page Title - only show when no file selected */}
        {!selectedFile && (
          <div className="text-center mb-12">
            <h1 className="text-sm uppercase tracking-widest text-gray-500 mb-2">Add to Collection</h1>
            <p className="text-xs text-gray-400">Upload or photograph your item</p>
          </div>
        )}

        <div className="max-w-lg mx-auto">
          {!selectedFile && (
            <div className="space-y-4">
              {/* Camera Button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-6 border border-black bg-black text-white hover:bg-gray-900 transition-colors"
              >
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraSelect}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3">
                  <Camera size={20} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest">Take Photo</span>
                </div>
              </button>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 border border-black bg-white text-black hover:bg-gray-50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-3">
                  <Upload size={20} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest">Upload from Library</span>
                </div>
              </button>
            </div>
          )}

          {selectedFile && !showConfirmation && (
            <div className="relative">
              <img src={preview} alt="Selected" className="w-full border border-gray-200" />
              {(isAnalyzing || isProcessing) && (
                <div className="absolute inset-0 bg-white flex items-center justify-center overflow-hidden">
                  <style>{`
                    @keyframes pulse3d {
                      0%, 100% { transform: scale(0.85); opacity: 0.2; }
                      50% { transform: scale(1.15); opacity: 0.6; }
                    }
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                    @keyframes spinReverse {
                      0% { transform: rotate(360deg); }
                      100% { transform: rotate(0deg); }
                    }
                  `}</style>

                  {/* 15 concentric circles with varied speed spinning arches */}
                  <div className="relative flex items-center justify-center">
                    {[
                      { size: 200, speed: 1.2, reverse: false },
                      { size: 186, speed: 4, reverse: true },
                      { size: 172, speed: 2.5, reverse: false },
                      { size: 158, speed: 0.8, reverse: true },
                      { size: 144, speed: 3, reverse: false },
                      { size: 130, speed: 1.5, reverse: true },
                      { size: 116, speed: 5, reverse: false },
                      { size: 102, speed: 2, reverse: true },
                      { size: 88, speed: 0.6, reverse: false },
                      { size: 74, speed: 3.5, reverse: true },
                      { size: 60, speed: 1.8, reverse: false },
                      { size: 46, speed: 4.5, reverse: true },
                      { size: 32, speed: 2.2, reverse: false },
                      { size: 18, speed: 1, reverse: true },
                      { size: 8, speed: 3, reverse: false },
                    ].map((ring, i) => (
                      <div key={i}>
                        <div
                          className="absolute rounded-full border border-gray-200"
                          style={{
                            width: `${ring.size}px`,
                            height: `${ring.size}px`,
                            left: `${-ring.size/2}px`,
                            top: `${-ring.size/2}px`,
                            animation: `pulse3d 3s ease-in-out infinite`,
                            animationDelay: `${-i * 0.2}s`,
                          }}
                        />
                        <div
                          className="absolute rounded-full border-2 border-transparent border-t-black"
                          style={{
                            width: `${ring.size}px`,
                            height: `${ring.size}px`,
                            left: `${-ring.size/2}px`,
                            top: `${-ring.size/2}px`,
                            animation: `${ring.reverse ? 'spinReverse' : 'spin'} ${ring.speed}s linear infinite`,
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Status text with progress */}
                  <div className="absolute bottom-6 text-center w-full px-4">
                    {totalToProcess > 1 ? (
                      <>
                        <div className="text-black text-lg font-light mb-1">
                          {processedCount}/{totalToProcess}
                        </div>
                        <div className="text-black/40 text-[10px] uppercase tracking-[0.4em] font-light">
                          Completed
                        </div>
                        <div className="mt-3 w-40 h-1.5 bg-gray-200 rounded-full overflow-hidden mx-auto">
                          <div
                            className="h-full bg-black transition-all duration-300"
                            style={{ width: `${(processedCount / totalToProcess) * 100}%` }}
                          />
                        </div>
                        {/* Processing log */}
                        {processingLog.length > 0 && (
                          <div className="mt-4 max-h-24 overflow-y-auto">
                            {processingLog.map((log, idx) => (
                              <div key={idx} className="text-[9px] text-gray-400 font-mono">
                                {log}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-black/40 text-[10px] uppercase tracking-[0.4em] font-light">
                        Analyzing
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedFile && showConfirmation && (
            <div className="space-y-8">
              {/* Top Action Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => {
                    // Discard current item and move to next
                    if (imageQueue.length > 1 && currentIndex < imageQueue.length - 1) {
                      setImageQueue(prev => prev.filter((_, idx) => idx !== currentIndex));
                      const nextItem = imageQueue[currentIndex + 1];
                      if (nextItem) updateDisplayFromQueueItem(nextItem);
                    } else if (imageQueue.length > 1 && currentIndex > 0) {
                      // Last item but not first - go back
                      setImageQueue(prev => prev.filter((_, idx) => idx !== currentIndex));
                      setCurrentIndex(currentIndex - 1);
                      const prevItem = imageQueue[currentIndex - 1];
                      if (prevItem) updateDisplayFromQueueItem(prevItem);
                    } else {
                      // Only item - reset everything
                      setImageQueue([]);
                      setCurrentIndex(0);
                      setSelectedFile(null);
                      setPreview("");
                      setProcessedPreview("");
                      setShowConfirmation(false);
                    }
                  }}
                  className="text-xs uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleUpload}
                  disabled={
                    isUploading ||
                    !category ||
                    !subcategory ||
                    (subcategory === "Other" && !customSubcategory) ||
                    !colors
                  }
                  className={`text-xs uppercase tracking-widest transition-colors ${
                    isUploading || !category || !subcategory || (subcategory === "Other" && !customSubcategory) || !colors
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-black hover:text-gray-600'
                  }`}
                >
                  {isUploading ? "Saving..." : "Save"}
                </button>
              </div>

              {/* Duplicate Warning */}
              {imageQueue[currentIndex]?.isDuplicate && (
                <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 mb-4">
                  <p className="text-xs text-yellow-800">
                    <span className="font-medium">Duplicate detected:</span> You already have{' '}
                    {[
                      imageQueue[currentIndex].duplicateInfo?.subcategory,
                      imageQueue[currentIndex].duplicateInfo?.color,
                      imageQueue[currentIndex].duplicateInfo?.brand
                    ].filter(Boolean).join(', ') || 'this item'}{' '}
                    in your closet.
                  </p>
                </div>
              )}

              {/* Queue Progress Indicator */}
              {imageQueue.length > 1 && (
                <div className="text-center mb-4">
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                    Item {currentIndex + 1} of {imageQueue.length}
                  </p>
                  <div className="flex justify-center gap-1">
                    {imageQueue.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`w-2 h-2 rounded-full ${
                          idx < currentIndex
                            ? 'bg-green-500'
                            : idx === currentIndex
                            ? 'bg-black'
                            : item.status === 'ready'
                            ? 'bg-gray-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Image Preview */}
              <div className="flex flex-col items-center">
                <div className="w-full max-w-sm overflow-hidden">
                  <img
                    src={processedPreview || preview}
                    alt="Item preview"
                    className="w-full border border-gray-200 transition-transform"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  />
                </div>
                {/* Rotation Controls */}
                <div className="flex justify-center gap-6 mt-4">
                  <button
                    onClick={rotateLeft}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                    title="Rotate left"
                  >
                    <RotateCcw size={20} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={rotateRight}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                    title="Rotate right"
                  >
                    <RotateCw size={20} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {aiMetadata?.description && (
                <div className="border-t border-b border-gray-200 py-4">
                  <p className="text-xs text-gray-400 text-center">
                    <span className="font-medium">Description:</span> {aiMetadata.description}
                  </p>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-6">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 text-center">Item Details</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value as Category);
                        setSize("");
                        setSizeLength("");
                        setCustomSize("");
                      }}
                      className="w-full px-4 py-3 border border-gray-300 bg-white text-sm focus:border-black focus:outline-none transition-colors"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Type</label>
                    <select
                      value={subcategory}
                      onChange={(e) => {
                        setSubcategory(e.target.value);
                        if (e.target.value !== "Other") setCustomSubcategory("");
                      }}
                      className="w-full px-4 py-3 border border-gray-300 bg-white text-sm focus:border-black focus:outline-none transition-colors"
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
                      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Custom Type</label>
                      <input
                        type="text"
                        value={customSubcategory}
                        onChange={(e) => setCustomSubcategory(e.target.value)}
                        placeholder="Enter custom type"
                        className="w-full px-4 py-3 border border-gray-300 bg-white text-sm focus:border-black focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Colors</label>
                    {/* Color Palette Display */}
                    {colorPalette.length > 0 && (
                      <div className="mb-3">
                        <div className="flex gap-2 flex-wrap">
                          {colorPalette.slice(0, 8).map((color, idx) => {
                            // Use RGB if available, otherwise fallback to name lookup
                            const bgColor = color.rgb
                              ? `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`
                              : colorNameToHex(color.name);
                            return (
                              <div key={idx} className="flex flex-col items-center">
                                <div
                                  className="w-10 h-10 rounded border border-gray-300 shadow-sm"
                                  style={{ backgroundColor: bgColor }}
                                  title={`${color.name}: ${color.percent}%`}
                                />
                                <span className="text-[9px] text-gray-400 mt-1">{color.percent}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <input
                      type="text"
                      value={colors}
                      onChange={(e) => setColors(e.target.value)}
                      placeholder="e.g., black, white"
                      className="w-full px-4 py-3 border border-gray-300 bg-white text-sm focus:border-black focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Collapsible Optional Fields */}
                <button
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="text-xs uppercase tracking-wider text-gray-400 hover:text-black transition-colors flex items-center gap-2 mx-auto"
                >
                  {showOptionalFields ? "−" : "+"} More Details
                </button>

                {showOptionalFields && (
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Brand</label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g., Nike, Zara"
                        className="w-full px-4 py-3 border border-gray-300 bg-white text-sm focus:border-black focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Size</label>
                      <input
                        type="text"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        placeholder="e.g., M, 32, 10"
                        className="w-full px-4 py-3 border border-gray-300 bg-white text-sm focus:border-black focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Store</label>
                      <input
                        type="text"
                        value={storePurchasedFrom}
                        onChange={(e) => setStorePurchasedFrom(e.target.value)}
                        placeholder="e.g., Amazon, Nordstrom"
                        className="w-full px-4 py-3 border border-gray-300 bg-white text-sm focus:border-black focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-2">Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional notes..."
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 bg-white text-sm focus:border-black focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button
                  onClick={() => {
                    const itemCount = imageQueue.length || 1;
                    const message = itemCount > 1
                      ? `Cancel upload of all ${itemCount} items?`
                      : 'Cancel this upload?';
                    if (confirm(message)) {
                      setImageQueue([]);
                      setCurrentIndex(0);
                      setSelectedFile(null);
                      setPreview("");
                      setProcessedPreview("");
                      setShowConfirmation(false);
                      setAiMetadata(null);
                    }
                  }}
                  className="w-full py-4 text-xs uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                >
                  Cancel All
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
