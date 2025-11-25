"use client";

import { useState, useEffect } from "react";

export default function VersionBadge() {
  const [clicked, setClicked] = useState(false);
  const [version, setVersion] = useState<string>("");

  // Format: buildYYYYMMDD-hhmmss
  const formatBuildVersion = (isoString: string) => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `build${year}${month}${day}-${hours}${minutes}${seconds}`;
  };

  // Only compute version on client side to avoid hydration mismatch
  useEffect(() => {
    const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();
    setVersion(formatBuildVersion(buildTime));
  }, []);

  const handleClick = () => {
    const timestamp = new Date().toISOString();
    const userMessage = prompt("Describe the issue (optional):");

    // Log to console with clear markers
    console.error("🐛 DEBUG MARKER 🐛");
    console.error("Timestamp:", timestamp);
    console.error("User reported issue:", userMessage || "No description provided");
    console.error("User Agent:", navigator.userAgent);
    console.error("Screen:", `${window.screen.width}x${window.screen.height}`);
    console.error("Viewport:", `${window.innerWidth}x${window.innerHeight}`);

    // Visual feedback
    setClicked(true);
    setTimeout(() => setClicked(false), 2000);

    alert(`Issue logged at ${new Date().toLocaleTimeString()}\n\nCheck production logs for details.`);
  };

  // Don't render until version is computed (avoids hydration mismatch)
  if (!version) return null;

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-2 right-2 text-xs px-2 py-1 rounded backdrop-blur-sm z-50 font-mono transition-all duration-200 ${
        clicked
          ? "bg-green-600 text-white scale-110"
          : "text-white bg-gray-900/50 hover:bg-gray-900/70"
      }`}
    >
      {clicked ? "Logged!" : version}
    </button>
  );
}
