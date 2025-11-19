"use client";

import Link from "next/link";
import { Camera, Sparkles, Shuffle } from "lucide-react";


export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <main className="flex flex-col gap-8 items-center max-w-2xl text-center">
        <h1 className="text-5xl font-bold" style={{
          background: 'linear-gradient(135deg, #D4AF37 0%, #C5A028 50%, #B8941F 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent'
        }}>
          AI Closet Assistant
        </h1>

        <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
          Your digital wardrobe organizer with AI-powered outfit suggestions
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full">
          <div className="p-6 rounded-lg bg-white border-2 border-black">
            <div className="mb-4 flex justify-center">
              <Camera size={48} strokeWidth={1.5} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Smart Upload</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Take photos or upload images of your clothing items.
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white border-2 border-black">
            <div className="mb-4 flex justify-center">
              <Sparkles size={48} strokeWidth={1.5} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Auto Background Removal</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI-powered background removal for clean displays
            </p>
          </div>

          <div className="p-6 rounded-lg bg-white border-2 border-black">
            <div className="mb-4 flex justify-center">
              <Shuffle size={48} strokeWidth={1.5} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Outfit Shuffle</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Casino-style slots to discover new outfit combos
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/closet"
            className="px-8 py-3 text-white font-semibold rounded-lg transition-all hover:shadow-lg inline-block"
            style={{
              background: 'var(--accent-primary)',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-primary)'}
          >
            Get Started
          </Link>
        </div>
      </main>

      <footer className="mt-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>
        <p>Built with Next.js, Cloudflare Pages, and AI</p>
      </footer>
    </div>
  );
}
