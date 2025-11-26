import UIKit

/// Protocol for AI-powered clothing analysis
/// Allows swapping between local and cloud implementations
protocol AIAnalysisProtocol {
    /// Analyze a clothing image and extract metadata
    func analyzeClothingItem(image: UIImage) async throws -> ClothingAnalysis
}

/// Result of AI clothing analysis
struct ClothingAnalysis {
    var category: String           // tops, bottoms, shoes, outerwear, accessories
    var subcategory: String?       // t-shirt, jeans, sneakers, etc.
    var colors: [String]           // Primary colors detected
    var brand: String?             // Brand if detected
    var style: String?             // casual, formal, athletic, etc.
    var material: String?          // cotton, denim, leather, etc.
    var pattern: String?           // solid, striped, plaid, etc.
    var fit: String?               // slim, regular, oversized, etc.
    var season: [String]           // spring, summer, fall, winter
    var formality: String?         // casual, business casual, formal
    var description: String?       // AI-generated description
    var tags: [String]             // Additional tags

    /// Create an empty analysis with unknown category
    static var unknown: ClothingAnalysis {
        ClothingAnalysis(
            category: "unknown",
            subcategory: nil,
            colors: [],
            brand: nil,
            style: nil,
            material: nil,
            pattern: nil,
            fit: nil,
            season: [],
            formality: nil,
            description: nil,
            tags: []
        )
    }

    /// Check if analysis has meaningful data
    var hasData: Bool {
        !colors.isEmpty || pattern != nil || style != nil
    }
}

// MARK: - Color Palette Extension

extension ClothingAnalysis {
    /// Enhanced color information with percentages
    struct ColorDetail {
        let name: String
        let percentage: Double
        let hexCode: String?
    }

    var colorDetails: [ColorDetail] {
        colors.map { ColorDetail(name: $0, percentage: 0, hexCode: nil) }
    }
}

// MARK: - Formality Levels

extension ClothingAnalysis {
    enum FormalityLevel: String, CaseIterable {
        case casual
        case smartCasual = "smart casual"
        case businessCasual = "business casual"
        case businessFormal = "business formal"
        case formal

        var displayName: String {
            rawValue.capitalized
        }
    }
}

// MARK: - Season Inference

extension ClothingAnalysis {
    /// Infer seasons based on colors and patterns
    static func inferSeasons(from colors: [String], pattern: String?) -> [String] {
        var seasons = Set<String>()

        let warmColors = ["red", "orange", "yellow", "brown", "beige", "burgundy", "maroon", "gold", "olive"]
        let coolColors = ["blue", "navy", "white", "gray", "silver", "charcoal", "black"]
        let brightColors = ["pink", "coral", "mint", "lavender", "teal"]
        let neutralColors = ["white", "black", "gray", "beige", "cream"]

        for color in colors {
            let lowercased = color.lowercased()

            if warmColors.contains(lowercased) {
                seasons.insert("fall")
                seasons.insert("winter")
            }

            if coolColors.contains(lowercased) {
                seasons.insert("winter")
                seasons.insert("spring")
            }

            if brightColors.contains(lowercased) {
                seasons.insert("spring")
                seasons.insert("summer")
            }

            if neutralColors.contains(lowercased) {
                // Neutrals work all year
                seasons.formUnion(["spring", "summer", "fall", "winter"])
            }
        }

        // Pattern-based inference
        if let pattern = pattern?.lowercased() {
            if pattern.contains("floral") {
                seasons.insert("spring")
                seasons.insert("summer")
            }
            if pattern.contains("plaid") {
                seasons.insert("fall")
                seasons.insert("winter")
            }
        }

        return seasons.isEmpty ? ["all seasons"] : Array(seasons).sorted()
    }
}
