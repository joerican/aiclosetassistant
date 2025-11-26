import UIKit

/// Local AI analysis service using color extraction and pattern detection
/// No Core ML classifier for MVP - user selects category manually
@Observable
final class LocalAIAnalysisService: AIAnalysisProtocol {

    private let colorExtractor = DominantColorExtractor()
    private let patternDetector = PatternDetector()

    var isAnalyzing = false
    var analysisStatus = ""

    /// Analyze a clothing image using local processing
    /// - Parameter image: The source image (preferably with background removed)
    /// - Returns: Analysis results with colors, pattern, and inferred attributes
    func analyzeClothingItem(image: UIImage) async throws -> ClothingAnalysis {
        isAnalyzing = true
        analysisStatus = "Analyzing colors..."

        defer {
            Task { @MainActor in
                self.isAnalyzing = false
                self.analysisStatus = ""
            }
        }

        // Run color and pattern extraction in parallel
        async let colorsTask = colorExtractor.extractDominantColors(from: image, count: 4)
        async let patternTask = patternDetector.detectPattern(in: image)

        await MainActor.run {
            self.analysisStatus = "Detecting pattern..."
        }

        let colors = try await colorsTask
        let pattern = try await patternTask

        await MainActor.run {
            self.analysisStatus = "Finalizing analysis..."
        }

        // Infer seasons from colors
        let seasons = ClothingAnalysis.inferSeasons(from: colors, pattern: pattern.rawValue)

        // Build analysis result
        return ClothingAnalysis(
            category: "unknown",  // User selects manually for MVP
            subcategory: nil,
            colors: colors,
            brand: nil,           // Can't detect locally
            style: inferStyle(from: colors, pattern: pattern),
            material: nil,        // Can't detect locally
            pattern: pattern.rawValue,
            fit: nil,             // Can't detect locally
            season: seasons,
            formality: inferFormality(from: colors, pattern: pattern),
            description: nil,
            tags: generateTags(colors: colors, pattern: pattern)
        )
    }

    /// Quick analysis for color palette only (faster)
    func extractColorPalette(from image: UIImage) async throws -> [ColorPaletteEntry] {
        try await colorExtractor.extractColorPalette(from: image, count: 5)
    }

    // MARK: - Inference Helpers

    private func inferStyle(from colors: [String], pattern: PatternDetector.ClothingPattern) -> String? {
        // Dark, neutral colors suggest formal/business
        let formalColors = ["black", "navy", "gray", "charcoal", "white"]
        let casualColors = ["blue", "red", "green", "yellow", "orange", "pink"]

        let hasFormalColors = colors.contains { formalColors.contains($0.lowercased()) }
        let hasCasualColors = colors.contains { casualColors.contains($0.lowercased()) }

        switch pattern {
        case .solid:
            return hasFormalColors ? "classic" : "casual"
        case .striped:
            return hasFormalColors ? "business" : "casual"
        case .plaid:
            return "classic"
        case .floral:
            return "feminine"
        case .graphic:
            return "casual"
        case .animal:
            return "bold"
        case .geometric:
            return "modern"
        default:
            return hasCasualColors ? "casual" : nil
        }
    }

    private func inferFormality(from colors: [String], pattern: PatternDetector.ClothingPattern) -> String? {
        let formalColors = ["black", "navy", "gray", "white", "charcoal"]
        let casualPatterns: [PatternDetector.ClothingPattern] = [.graphic, .animal, .camouflage, .polkaDot]

        if casualPatterns.contains(pattern) {
            return "casual"
        }

        let formalColorCount = colors.filter { formalColors.contains($0.lowercased()) }.count

        if formalColorCount >= 2 && pattern == .solid {
            return "business casual"
        } else if formalColorCount >= 1 {
            return "smart casual"
        }

        return "casual"
    }

    private func generateTags(colors: [String], pattern: PatternDetector.ClothingPattern) -> [String] {
        var tags: [String] = []

        // Add color tags
        tags.append(contentsOf: colors.prefix(2))

        // Add pattern tag
        if pattern != .solid {
            tags.append(pattern.rawValue)
        }

        // Add style-based tags
        if colors.contains("black") || colors.contains("white") {
            tags.append("classic")
        }

        if colors.contains("pink") || colors.contains("lavender") {
            tags.append("feminine")
        }

        if colors.contains("navy") || colors.contains("gray") {
            tags.append("professional")
        }

        return Array(Set(tags))  // Remove duplicates
    }
}

// MARK: - Analysis Result with Extended Info

extension LocalAIAnalysisService {
    /// Full analysis result including color palette with percentages
    struct DetailedAnalysis {
        let basic: ClothingAnalysis
        let colorPalette: [ColorPaletteEntry]
        let patternConfidence: Float
        let textureAnalysis: TextureAnalysis?
    }

    /// Perform detailed analysis with all available metrics
    func performDetailedAnalysis(image: UIImage) async throws -> DetailedAnalysis {
        isAnalyzing = true
        analysisStatus = "Performing detailed analysis..."

        defer {
            Task { @MainActor in
                self.isAnalyzing = false
                self.analysisStatus = ""
            }
        }

        // Run all analysis in parallel
        async let basicAnalysis = analyzeClothingItem(image: image)
        async let paletteTask = colorExtractor.extractColorPalette(from: image, count: 5)
        async let patternConfidenceTask = patternDetector.detectPatternWithConfidence(in: image)
        async let textureTask = patternDetector.analyzeTextureVariance(in: image)

        let basic = try await basicAnalysis
        let palette = try await paletteTask
        let (_, confidence) = try await patternConfidenceTask
        let texture = try? await textureTask

        return DetailedAnalysis(
            basic: basic,
            colorPalette: palette,
            patternConfidence: confidence,
            textureAnalysis: texture
        )
    }
}
