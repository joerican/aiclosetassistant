import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black">
      <main className="flex flex-col gap-8 items-center max-w-2xl text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          AI Closet Assistant
        </h1>

        <p className="text-xl text-gray-600 dark:text-gray-300">
          Your digital wardrobe organizer with AI-powered outfit suggestions
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 w-full">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-lg font-semibold mb-2">Smart Upload</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Take photos or upload images of your clothing items
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-lg font-semibold mb-2">Auto Background Removal</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered background removal for clean displays
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-4xl mb-4">🎰</div>
            <h3 className="text-lg font-semibold mb-2">Outfit Shuffle</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Casino-style slots to discover new outfit combos
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Link
            href="/sign-up"
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="px-8 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 font-semibold rounded-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
      </main>

      <footer className="mt-16 text-sm text-gray-500">
        <p>Built with Next.js, Cloudflare Pages, and AI</p>
      </footer>
    </div>
  );
}
