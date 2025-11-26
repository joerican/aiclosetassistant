import Foundation
import SwiftData

@Model
final class Outfit {
    static let schemaVersion = 1

    var id: UUID
    var name: String?

    // Item references (UUIDs of ClothingItems)
    var topId: UUID?
    var bottomId: UUID?
    var shoesId: UUID?
    var outerwearId: UUID?
    var accessoryIds: [UUID]

    // AI-generated suggestion text
    var aiSuggestionText: String?

    // Canvas layout
    var isCanvasOutfit: Bool
    var canvasLayout: Data?  // JSON-encoded CanvasLayout

    // Tracking
    var timesWorn: Int
    var lastWornDate: Date?
    var isFavorite: Bool

    // Metadata
    var createdAt: Date
    var updatedAt: Date

    init() {
        self.id = UUID()
        self.accessoryIds = []
        self.isCanvasOutfit = false
        self.timesWorn = 0
        self.isFavorite = false
        self.createdAt = Date()
        self.updatedAt = Date()
    }

    // MARK: - Convenience Initializer

    convenience init(
        name: String? = nil,
        topId: UUID? = nil,
        bottomId: UUID? = nil,
        shoesId: UUID? = nil,
        outerwearId: UUID? = nil,
        accessoryIds: [UUID] = [],
        aiSuggestionText: String? = nil
    ) {
        self.init()
        self.name = name
        self.topId = topId
        self.bottomId = bottomId
        self.shoesId = shoesId
        self.outerwearId = outerwearId
        self.accessoryIds = accessoryIds
        self.aiSuggestionText = aiSuggestionText
    }
}

// MARK: - Canvas Layout

extension Outfit {
    struct CanvasLayout: Codable {
        var items: [CanvasItem]

        struct CanvasItem: Codable, Identifiable {
            var id: UUID
            var itemId: UUID
            var position: CGPoint
            var size: CGSize
            var zIndex: Int
            var rotation: Double

            init(
                itemId: UUID,
                position: CGPoint = .zero,
                size: CGSize = CGSize(width: 150, height: 150),
                zIndex: Int = 0,
                rotation: Double = 0
            ) {
                self.id = UUID()
                self.itemId = itemId
                self.position = position
                self.size = size
                self.zIndex = zIndex
                self.rotation = rotation
            }
        }
    }

    var decodedCanvasLayout: CanvasLayout? {
        guard let data = canvasLayout else { return nil }
        return try? JSONDecoder().decode(CanvasLayout.self, from: data)
    }

    func setCanvasLayout(_ layout: CanvasLayout) {
        canvasLayout = try? JSONEncoder().encode(layout)
        updatedAt = Date()
    }
}

// MARK: - Computed Properties

extension Outfit {
    var displayName: String {
        name ?? "Outfit \(createdAt.formatted(date: .abbreviated, time: .omitted))"
    }

    var itemCount: Int {
        var count = 0
        if topId != nil { count += 1 }
        if bottomId != nil { count += 1 }
        if shoesId != nil { count += 1 }
        if outerwearId != nil { count += 1 }
        count += accessoryIds.count
        return count
    }

    var allItemIds: [UUID] {
        var ids: [UUID] = []
        if let topId { ids.append(topId) }
        if let bottomId { ids.append(bottomId) }
        if let shoesId { ids.append(shoesId) }
        if let outerwearId { ids.append(outerwearId) }
        ids.append(contentsOf: accessoryIds)
        return ids
    }
}

// Note: CGPoint and CGSize already conform to Codable in CoreGraphics (iOS 17+)
