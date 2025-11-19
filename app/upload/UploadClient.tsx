"use client";

import { useState, useRef } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Category } from "@/types";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [processedPreview, setProcessedPreview] = useState<string>("");
  const [category, setCategory] = useState<Category>("tops");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const categories: Category[] = ["tops", "bottoms", "shoes", "outerwear", "accessories"];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setProcessedPreview("");
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
            setSelectedFile(file);
            setPreview(canvas.toDataURL("image/jpeg"));
            setProcessedPreview("");
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      // TODO: Implement background removal using Cloudflare AI Workers
      // For now, just use the original image
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProcessedPreview(preview);
      alert("Background removal coming soon! For now, using original image.");
    } catch (error) {
      console.error("Error removing background:", error);
      alert("Failed to remove background. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !category) return;

    setIsUploading(true);
    try {
      // TODO: Implement actual upload to R2 and save to D1
      // For now, just simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("Item uploaded successfully!");
      window.location.href = "/closet";
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add Item
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload or take a photo of your clothing
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* Upload Options */}
          {!selectedFile && !isCameraActive && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Choose an option</h3>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="text-4xl mb-4">📁</div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Choose Image File
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Upload from your device
                </p>
              </div>

              {/* Camera */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">📸</div>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors"
                >
                  Take Photo
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Use your camera
                </p>
              </div>
            </div>
          )}

          {/* Camera View */}
          {isCameraActive && (
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <div className="flex gap-4 justify-center">
                <button
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Image Preview and Processing */}
          {selectedFile && !isCameraActive && (
            <div className="space-y-6">
              {/* Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Original</h4>
                  <img
                    src={preview}
                    alt="Original"
                    className="w-full rounded-lg border dark:border-gray-700"
                  />
                </div>
                {processedPreview && (
                  <div>
                    <h4 className="font-medium mb-2">Background Removed</h4>
                    <img
                      src={processedPreview}
                      alt="Processed"
                      className="w-full rounded-lg border dark:border-gray-700"
                    />
                  </div>
                )}
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                {!processedPreview && (
                  <button
                    onClick={handleRemoveBackground}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {isProcessing ? "Processing..." : "Remove Background"}
                  </button>
                )}
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {isUploading ? "Uploading..." : "Add to Closet"}
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview("");
                    setProcessedPreview("");
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
    </div>
  );
}
