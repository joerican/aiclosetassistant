import UIKit
import CryptoKit

/// Handles local image storage with caching
@Observable
final class StorageService: @unchecked Sendable {
    static let shared = StorageService()

    private let fileManager = FileManager.default
    private let imageCache = ImageCache.shared

    // MARK: - Directory Management

    var imagesDirectory: URL {
        let docs = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let imagesDir = docs.appendingPathComponent("ClothingImages", isDirectory: true)

        if !fileManager.fileExists(atPath: imagesDir.path) {
            try? fileManager.createDirectory(at: imagesDir, withIntermediateDirectories: true)
        }

        return imagesDir
    }

    // MARK: - Save Image

    func saveImage(_ image: UIImage, type: ImageType, itemId: UUID) throws -> String {
        let fileName = "\(type.prefix)_\(itemId.uuidString).\(type.fileExtension)"
        let url = imagesDirectory.appendingPathComponent(fileName)

        let data: Data?
        switch type {
        case .original:
            data = image.jpegData(compressionQuality: 0.85)
        case .processed:
            data = image.pngData()  // PNG for transparency
        case .thumbnail:
            data = image.jpegData(compressionQuality: 0.80)
        }

        guard let imageData = data else {
            throw StorageError.encodingFailed
        }

        try imageData.write(to: url)

        // Also store in cache
        Task {
            await imageCache.store(image, for: fileName)
        }

        return fileName
    }

    // MARK: - Load Image

    func loadImage(path: String) async -> UIImage? {
        // Check cache first
        if let cached = await imageCache.image(for: path) {
            return cached
        }

        // Load from disk
        let url = imagesDirectory.appendingPathComponent(path)
        guard let data = try? Data(contentsOf: url),
              let image = UIImage(data: data) else {
            return nil
        }

        // Store in cache for next time
        await imageCache.store(image, for: path)
        return image
    }

    /// Synchronous version for non-async contexts
    func loadImageSync(path: String) -> UIImage? {
        let url = imagesDirectory.appendingPathComponent(path)
        guard let data = try? Data(contentsOf: url) else { return nil }
        return UIImage(data: data)
    }

    // MARK: - Delete Image

    func deleteImage(path: String) async {
        let url = imagesDirectory.appendingPathComponent(path)
        try? fileManager.removeItem(at: url)
        await imageCache.remove(for: path)
    }

    /// Delete all images for an item (original, processed, thumbnail)
    func deleteAllImages(for itemId: UUID) async {
        for type in ImageType.allCases {
            let fileName = "\(type.prefix)_\(itemId.uuidString).\(type.fileExtension)"
            await deleteImage(path: fileName)
        }
    }

    // MARK: - Image Hashing (for duplicate detection)

    func computeImageHash(_ image: UIImage) -> String? {
        guard let data = image.jpegData(compressionQuality: 0.5) else { return nil }
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }

    // MARK: - Storage Stats

    var totalStorageUsedMB: Double {
        get async {
            guard let files = try? fileManager.contentsOfDirectory(
                at: imagesDirectory,
                includingPropertiesForKeys: [.fileSizeKey]
            ) else { return 0 }

            var totalBytes: Int64 = 0
            for file in files {
                if let size = try? file.resourceValues(forKeys: [.fileSizeKey]).fileSize {
                    totalBytes += Int64(size)
                }
            }

            return Double(totalBytes) / (1024 * 1024)
        }
    }

    func clearAllStorage() async {
        guard let files = try? fileManager.contentsOfDirectory(
            at: imagesDirectory,
            includingPropertiesForKeys: nil
        ) else { return }

        for file in files {
            try? fileManager.removeItem(at: file)
        }

        await imageCache.clearAll()
    }
}

// MARK: - Supporting Types

extension StorageService {
    enum ImageType: CaseIterable {
        case original
        case processed
        case thumbnail

        var prefix: String {
            switch self {
            case .original: return "orig"
            case .processed: return "proc"
            case .thumbnail: return "thumb"
            }
        }

        var fileExtension: String {
            switch self {
            case .original, .thumbnail: return "jpg"
            case .processed: return "png"
            }
        }
    }
}

enum StorageError: LocalizedError {
    case encodingFailed
    case saveFailed(String)
    case loadFailed(String)
    case fileNotFound(String)

    var errorDescription: String? {
        switch self {
        case .encodingFailed:
            return "Failed to encode image data"
        case .saveFailed(let path):
            return "Failed to save image to \(path)"
        case .loadFailed(let path):
            return "Failed to load image from \(path)"
        case .fileNotFound(let path):
            return "Image file not found: \(path)"
        }
    }
}
