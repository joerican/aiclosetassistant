import UIKit
import Vision

/// Detects patterns in clothing images using Vision framework
final class PatternDetector {

    /// Known clothing patterns
    enum ClothingPattern: String, CaseIterable {
        case solid = "solid"
        case striped = "striped"
        case plaid = "plaid"
        case floral = "floral"
        case polkaDot = "polka dot"
        case geometric = "geometric"
        case abstract = "abstract"
        case animal = "animal print"
        case camouflage = "camouflage"
        case checkered = "checkered"
        case paisley = "paisley"
        case graphic = "graphic"

        var displayName: String {
            rawValue.capitalized
        }
    }

    /// Detect the pattern in a clothing image
    /// - Parameter image: The source image (preferably with background removed)
    /// - Returns: The detected pattern type
    func detectPattern(in image: UIImage) async throws -> ClothingPattern {
        guard let cgImage = image.cgImage else {
            throw PatternDetectionError.invalidImage
        }

        // Use Vision's image classification
        let request = VNClassifyImageRequest()

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

        try await Task.detached(priority: .userInitiated) {
            try handler.perform([request])
        }.value

        guard let observations = request.results, !observations.isEmpty else {
            return .solid  // Default to solid if no pattern detected
        }

        // Analyze top classifications to determine pattern
        return analyzeClassifications(observations)
    }

    /// Detect pattern with confidence score
    func detectPatternWithConfidence(in image: UIImage) async throws -> (pattern: ClothingPattern, confidence: Float) {
        guard let cgImage = image.cgImage else {
            throw PatternDetectionError.invalidImage
        }

        let request = VNClassifyImageRequest()
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

        try await Task.detached(priority: .userInitiated) {
            try handler.perform([request])
        }.value

        guard let observations = request.results, !observations.isEmpty else {
            return (.solid, 0.5)
        }

        let pattern = analyzeClassifications(observations)
        let confidence = calculatePatternConfidence(observations, for: pattern)

        return (pattern, confidence)
    }

    // MARK: - Pattern Analysis

    private func analyzeClassifications(_ observations: [VNClassificationObservation]) -> ClothingPattern {
        // Check top 10 classifications for pattern indicators
        for observation in observations.prefix(10) {
            let identifier = observation.identifier.lowercased()

            // Check for specific patterns
            if containsPatternKeyword(identifier, keywords: ["stripe", "striped", "lines"]) {
                return .striped
            }

            if containsPatternKeyword(identifier, keywords: ["plaid", "tartan", "scottish"]) {
                return .plaid
            }

            if containsPatternKeyword(identifier, keywords: ["checkered", "check", "gingham"]) {
                return .checkered
            }

            if containsPatternKeyword(identifier, keywords: ["floral", "flower", "botanical", "rose"]) {
                return .floral
            }

            if containsPatternKeyword(identifier, keywords: ["dot", "polka", "spotted"]) {
                return .polkaDot
            }

            if containsPatternKeyword(identifier, keywords: ["geometric", "triangle", "square", "circle"]) {
                return .geometric
            }

            if containsPatternKeyword(identifier, keywords: ["animal", "leopard", "zebra", "tiger", "snake"]) {
                return .animal
            }

            if containsPatternKeyword(identifier, keywords: ["camo", "camouflage", "military"]) {
                return .camouflage
            }

            if containsPatternKeyword(identifier, keywords: ["paisley"]) {
                return .paisley
            }

            if containsPatternKeyword(identifier, keywords: ["abstract", "art"]) {
                return .abstract
            }

            if containsPatternKeyword(identifier, keywords: ["graphic", "print", "logo", "text"]) {
                return .graphic
            }
        }

        // If no specific pattern found, analyze color variance to determine if solid
        return .solid
    }

    private func containsPatternKeyword(_ identifier: String, keywords: [String]) -> Bool {
        for keyword in keywords {
            if identifier.contains(keyword) {
                return true
            }
        }
        return false
    }

    private func calculatePatternConfidence(_ observations: [VNClassificationObservation], for pattern: ClothingPattern) -> Float {
        // If solid, calculate based on lack of pattern indicators
        if pattern == .solid {
            // Higher confidence if no pattern-related classifications
            let patternIndicators = observations.prefix(10).filter { obs in
                let id = obs.identifier.lowercased()
                return id.contains("stripe") || id.contains("floral") ||
                       id.contains("dot") || id.contains("plaid") ||
                       id.contains("pattern") || id.contains("print")
            }
            return patternIndicators.isEmpty ? 0.8 : 0.5
        }

        // For specific patterns, use the confidence from Vision
        for observation in observations.prefix(10) {
            let id = observation.identifier.lowercased()

            switch pattern {
            case .striped where id.contains("stripe"):
                return observation.confidence
            case .floral where id.contains("floral") || id.contains("flower"):
                return observation.confidence
            case .plaid where id.contains("plaid"):
                return observation.confidence
            case .polkaDot where id.contains("dot"):
                return observation.confidence
            default:
                continue
            }
        }

        return 0.6  // Default moderate confidence
    }

    // MARK: - Texture Analysis (Alternative Method)

    /// Analyze texture variance to help determine if pattern is solid
    func analyzeTextureVariance(in image: UIImage) async throws -> TextureAnalysis {
        guard let cgImage = image.cgImage else {
            throw PatternDetectionError.invalidImage
        }

        // Sample pixels and calculate variance
        let result = await Task.detached(priority: .userInitiated) {
            self.calculateColorVariance(cgImage)
        }.value

        return result
    }

    private func calculateColorVariance(_ cgImage: CGImage) -> TextureAnalysis {
        let width = min(cgImage.width, 100)
        let height = min(cgImage.height, 100)
        let bytesPerPixel = 4
        let bytesPerRow = bytesPerPixel * width

        var pixelData = [UInt8](repeating: 0, count: width * height * bytesPerPixel)

        guard let context = CGContext(
            data: &pixelData,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else {
            return TextureAnalysis(variance: 0, isLikelySolid: true)
        }

        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

        // Calculate color variance
        var colors: [(r: CGFloat, g: CGFloat, b: CGFloat)] = []

        for y in stride(from: 0, to: height, by: 4) {
            for x in stride(from: 0, to: width, by: 4) {
                let offset = (y * width + x) * bytesPerPixel
                let a = CGFloat(pixelData[offset + 3]) / 255.0

                // Skip transparent pixels
                guard a > 0.5 else { continue }

                let r = CGFloat(pixelData[offset]) / 255.0
                let g = CGFloat(pixelData[offset + 1]) / 255.0
                let b = CGFloat(pixelData[offset + 2]) / 255.0

                colors.append((r, g, b))
            }
        }

        guard !colors.isEmpty else {
            return TextureAnalysis(variance: 0, isLikelySolid: true)
        }

        // Calculate mean
        let meanR = colors.map(\.r).reduce(0, +) / CGFloat(colors.count)
        let meanG = colors.map(\.g).reduce(0, +) / CGFloat(colors.count)
        let meanB = colors.map(\.b).reduce(0, +) / CGFloat(colors.count)

        // Calculate variance
        var varianceSum: CGFloat = 0
        for color in colors {
            varianceSum += pow(color.r - meanR, 2)
            varianceSum += pow(color.g - meanG, 2)
            varianceSum += pow(color.b - meanB, 2)
        }

        let variance = varianceSum / CGFloat(colors.count * 3)

        // Low variance indicates solid color
        let isLikelySolid = variance < 0.02

        return TextureAnalysis(variance: Double(variance), isLikelySolid: isLikelySolid)
    }
}

// MARK: - Supporting Types

struct TextureAnalysis {
    let variance: Double
    let isLikelySolid: Bool

    var description: String {
        if isLikelySolid {
            return "Solid color (variance: \(String(format: "%.4f", variance)))"
        } else {
            return "Patterned (variance: \(String(format: "%.4f", variance)))"
        }
    }
}

enum PatternDetectionError: LocalizedError {
    case invalidImage
    case analysisFailled

    var errorDescription: String? {
        switch self {
        case .invalidImage:
            return "Could not process the image for pattern detection."
        case .analysisFailled:
            return "Pattern analysis failed."
        }
    }
}
