import Foundation
import SwiftData

@Model
final class ClothingItem {
    // Schema version for migrations
    static let schemaVersion = 1

    // Primary identifier
    var id: UUID

    // Category (required)
    var category: String  // tops, bottoms, shoes, outerwear, accessories

    // AI-detected metadata
    var subcategory: String?
    var colors: [String]
    var brand: String?
    var size: String?
    var fit: String?
    var style: String?
    var material: String?
    var pattern: String?
    var season: [String]
    var formality: String?
    var itemDescription: String?  // renamed from 'description' to avoid keyword conflict
    var notes: String?
    var tags: [String]

    // Purchase info
    var cost: Double?
    var datePurchased: Date?
    var storePurchasedFrom: String?

    // Usage tracking
    var timesWorn: Int
    var lastWornDate: Date?
    var isFavorite: Bool

    // Image paths (local file URLs relative to Documents/ClothingImages/)
    var originalImagePath: String
    var processedImagePath: String?   // Background removed (PNG)
    var thumbnailPath: String?        // 200px thumbnail

    // Display properties
    var rotation: Int  // 0, 90, 180, 270 degrees

    // Metadata
    var createdAt: Date
    var updatedAt: Date
    var imageHash: String?  // SHA-256 for duplicate detection

    init(
        category: String,
        originalImagePath: String
    ) {
        self.id = UUID()
        self.category = category
        self.originalImagePath = originalImagePath
        self.colors = []
        self.tags = []
        self.season = []
        self.timesWorn = 0
        self.isFavorite = false
        self.rotation = 0
        self.createdAt = Date()
        self.updatedAt = Date()
    }

    // MARK: - Convenience Initializer for full creation

    convenience init(
        category: String,
        subcategory: String? = nil,
        colors: [String] = [],
        brand: String? = nil,
        size: String? = nil,
        originalImagePath: String,
        processedImagePath: String? = nil,
        thumbnailPath: String? = nil
    ) {
        self.init(category: category, originalImagePath: originalImagePath)
        self.subcategory = subcategory
        self.colors = colors
        self.brand = brand
        self.size = size
        self.processedImagePath = processedImagePath
        self.thumbnailPath = thumbnailPath
    }
}

// MARK: - Category Enum

extension ClothingItem {
    enum Category: String, CaseIterable, Identifiable {
        case tops
        case bottoms
        case shoes
        case outerwear
        case accessories

        var id: String { rawValue }

        var displayName: String {
            switch self {
            case .tops: return "Tops"
            case .bottoms: return "Bottoms"
            case .shoes: return "Shoes"
            case .outerwear: return "Outerwear"
            case .accessories: return "Accessories"
            }
        }

        var icon: String {
            switch self {
            case .tops: return "tshirt"
            case .bottoms: return "figure.stand"
            case .shoes: return "shoe"
            case .outerwear: return "cloud.rain"
            case .accessories: return "eyeglasses"
            }
        }
    }
}

// MARK: - Computed Properties

extension ClothingItem {
    var categoryEnum: Category? {
        Category(rawValue: category)
    }

    var primaryColor: String? {
        colors.first
    }

    var formattedCost: String? {
        guard let cost = cost else { return nil }
        return String(format: "$%.2f", cost)
    }

    var displayImagePath: String {
        // Prefer processed (transparent bg), fallback to original
        processedImagePath ?? originalImagePath
    }
}
