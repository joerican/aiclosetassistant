"use client";

import { useState } from "react";
import { Bug } from "lucide-react";

export default function DebugButton() {
  const [clicked, setClicked] = useState(false);

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

  return (
    <button
      onClick={handleClick}
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-200 ${
        clicked
          ? "bg-green-600 text-white scale-110"
          : "bg-red-500 text-white hover:bg-red-600 hover:scale-105"
      }`}
      title="Report an issue (logs timestamp for debugging)"
    >
      <Bug size={20} className={clicked ? "animate-spin" : ""} />
      <span className="text-sm font-medium">
        {clicked ? "Logged!" : "Debug"}
      </span>
    </button>
  );
}
