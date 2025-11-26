import UIKit

/// Actor-based LRU image cache to prevent memory issues
actor ImageCache {
    static let shared = ImageCache()

    private var cache: [String: CacheEntry] = [:]
    private let maxCacheSize = 50  // Maximum images in memory
    private let maxMemoryBytes: Int = 100 * 1024 * 1024  // 100MB limit

    private var currentMemoryBytes: Int = 0

    private struct CacheEntry {
        let image: UIImage
        let sizeBytes: Int
        var lastAccessed: Date
    }

    // MARK: - Public API

    func image(for path: String) -> UIImage? {
        guard var entry = cache[path] else { return nil }
        entry.lastAccessed = Date()
        cache[path] = entry
        return entry.image
    }

    func store(_ image: UIImage, for path: String) {
        let sizeBytes = estimateMemorySize(of: image)

        // Evict if needed
        while (cache.count >= maxCacheSize || currentMemoryBytes + sizeBytes > maxMemoryBytes) && !cache.isEmpty {
            evictOldest()
        }

        cache[path] = CacheEntry(
            image: image,
            sizeBytes: sizeBytes,
            lastAccessed: Date()
        )
        currentMemoryBytes += sizeBytes
    }

    func remove(for path: String) {
        if let entry = cache.removeValue(forKey: path) {
            currentMemoryBytes -= entry.sizeBytes
        }
    }

    func clearAll() {
        cache.removeAll()
        currentMemoryBytes = 0
    }

    // MARK: - Private

    private func evictOldest() {
        guard let oldest = cache.min(by: { $0.value.lastAccessed < $1.value.lastAccessed }) else {
            return
        }
        currentMemoryBytes -= oldest.value.sizeBytes
        cache.removeValue(forKey: oldest.key)
    }

    private func estimateMemorySize(of image: UIImage) -> Int {
        guard let cgImage = image.cgImage else { return 0 }
        return cgImage.bytesPerRow * cgImage.height
    }

    // MARK: - Stats

    var cacheCount: Int {
        cache.count
    }

    var memoryUsageMB: Double {
        Double(currentMemoryBytes) / (1024 * 1024)
    }
}
