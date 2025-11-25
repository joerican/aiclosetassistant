"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import Logo from "./components/Logo";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen relative" style={{ background: 'radial-gradient(ellipse at center, #ffffff 0%, #f5f5f5 50%, #d0d0d0 100%)' }}>
      {/* Logo at top */}
      <header className="absolute top-16 left-0 right-0">
        <div className="flex justify-center">
          <Logo size="xl-custom" />
        </div>
      </header>

      {/* Button centered on entire screen */}
      <main className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <div className="flex flex-col items-stretch gap-4">
          <Link
            href="/shuffle"
            className="px-10 py-4 bg-gray-900 text-white text-4xl tracking-wide hover:bg-gray-800 active:bg-gray-950 transition-colors rounded-sm text-center"
            style={{ fontWeight: 300 }}
          >
            Dress Me
          </Link>

          {/* Secondary buttons - only show when logged in */}
          {isSignedIn && (
            <div className="flex gap-2">
              <Link
                href="/closet"
                className="flex-1 py-2 border border-gray-900 text-gray-900 text-xs text-center hover:bg-gray-100 active:bg-gray-200 transition-colors rounded-sm"
                style={{ fontWeight: 400 }}
              >
                Closet
              </Link>
              <Link
                href="/outfits"
                className="flex-1 py-2 border border-gray-900 text-gray-900 text-xs text-center hover:bg-gray-100 active:bg-gray-200 transition-colors rounded-sm"
                style={{ fontWeight: 400 }}
              >
                Saved Outfits
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
