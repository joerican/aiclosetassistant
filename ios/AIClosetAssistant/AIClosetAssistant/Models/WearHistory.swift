import Foundation
import SwiftData

@Model
final class WearHistory {
    static let schemaVersion = 1

    var id: UUID

    // What was worn
    var itemId: UUID?      // Individual item worn
    var outfitId: UUID?    // Or complete outfit

    // When
    var wornDate: Date

    // Optional context
    var occasion: String?  // casual, work, formal, date, etc.
    var weather: String?   // sunny, rainy, cold, hot, etc.
    var notes: String?

    // Rating (optional)
    var rating: Int?       // 1-5 stars

    init(itemId: UUID? = nil, outfitId: UUID? = nil, wornDate: Date = Date()) {
        self.id = UUID()
        self.itemId = itemId
        self.outfitId = outfitId
        self.wornDate = wornDate
    }
}

// MARK: - Convenience Methods

extension WearHistory {
    static func logItemWear(itemId: UUID, occasion: String? = nil) -> WearHistory {
        let history = WearHistory(itemId: itemId)
        history.occasion = occasion
        return history
    }

    static func logOutfitWear(outfitId: UUID, occasion: String? = nil) -> WearHistory {
        let history = WearHistory(outfitId: outfitId)
        history.occasion = occasion
        return history
    }
}

// MARK: - Computed Properties

extension WearHistory {
    var formattedDate: String {
        wornDate.formatted(date: .abbreviated, time: .omitted)
    }

    var isItemWear: Bool {
        itemId != nil
    }

    var isOutfitWear: Bool {
        outfitId != nil
    }
}
