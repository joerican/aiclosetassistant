import UIKit

/// Extracts dominant colors from images using k-means clustering
final class DominantColorExtractor {

    // Named colors for matching
    private static let namedColors: [(name: String, color: UIColor)] = [
        ("black", UIColor(red: 0, green: 0, blue: 0, alpha: 1)),
        ("white", UIColor(red: 1, green: 1, blue: 1, alpha: 1)),
        ("gray", UIColor(red: 0.5, green: 0.5, blue: 0.5, alpha: 1)),
        ("red", UIColor(red: 0.9, green: 0.1, blue: 0.1, alpha: 1)),
        ("orange", UIColor(red: 1, green: 0.5, blue: 0, alpha: 1)),
        ("yellow", UIColor(red: 1, green: 0.9, blue: 0, alpha: 1)),
        ("green", UIColor(red: 0.2, green: 0.7, blue: 0.2, alpha: 1)),
        ("blue", UIColor(red: 0.1, green: 0.4, blue: 0.9, alpha: 1)),
        ("purple", UIColor(red: 0.6, green: 0.2, blue: 0.8, alpha: 1)),
        ("pink", UIColor(red: 1, green: 0.4, blue: 0.7, alpha: 1)),
        ("brown", UIColor(red: 0.6, green: 0.4, blue: 0.2, alpha: 1)),
        ("beige", UIColor(red: 0.96, green: 0.91, blue: 0.78, alpha: 1)),
        ("cream", UIColor(red: 1, green: 0.99, blue: 0.82, alpha: 1)),
        ("navy", UIColor(red: 0, green: 0, blue: 0.5, alpha: 1)),
        ("teal", UIColor(red: 0, green: 0.5, blue: 0.5, alpha: 1)),
        ("olive", UIColor(red: 0.5, green: 0.5, blue: 0, alpha: 1)),
        ("maroon", UIColor(red: 0.5, green: 0, blue: 0, alpha: 1)),
        ("coral", UIColor(red: 1, green: 0.5, blue: 0.31, alpha: 1)),
        ("gold", UIColor(red: 1, green: 0.84, blue: 0, alpha: 1)),
        ("silver", UIColor(red: 0.75, green: 0.75, blue: 0.75, alpha: 1)),
        ("burgundy", UIColor(red: 0.5, green: 0, blue: 0.13, alpha: 1)),
        ("lavender", UIColor(red: 0.9, green: 0.9, blue: 0.98, alpha: 1)),
        ("mint", UIColor(red: 0.6, green: 1, blue: 0.8, alpha: 1)),
        ("charcoal", UIColor(red: 0.21, green: 0.27, blue: 0.31, alpha: 1)),
        ("khaki", UIColor(red: 0.76, green: 0.69, blue: 0.57, alpha: 1))
    ]

    /// Extract dominant colors from an image
    /// - Parameters:
    ///   - image: The source image
    ///   - count: Number of dominant colors to extract (default 3)
    ///   - excludeBackground: Whether to exclude transparent/white background pixels
    /// - Returns: Array of color names
    func extractDominantColors(
        from image: UIImage,
        count: Int = 3,
        excludeBackground: Bool = true
    ) async throws -> [String] {
        // Resize for faster processing
        guard let resized = image.resized(toMaxDimension: 100),
              let cgImage = resized.cgImage else {
            throw ColorExtractionError.invalidImage
        }

        // Extract colors on background thread
        let dominantColors = await Task.detached(priority: .userInitiated) {
            let pixels = self.extractPixels(from: cgImage, excludeBackground: excludeBackground)

            guard !pixels.isEmpty else { return [UIColor]() }

            // Perform k-means clustering
            return self.kMeansClustering(pixels: pixels, k: count, iterations: 10)
        }.value

        guard !dominantColors.isEmpty else {
            throw ColorExtractionError.noColorsFound
        }

        // Convert to named colors
        return dominantColors.map { nearestColorName(for: $0) }
    }

    /// Extract raw RGB values with percentages
    func extractColorPalette(
        from image: UIImage,
        count: Int = 5
    ) async throws -> [ColorPaletteEntry] {
        guard let resized = image.resized(toMaxDimension: 100),
              let cgImage = resized.cgImage else {
            throw ColorExtractionError.invalidImage
        }

        let (colors, percentages) = await Task.detached(priority: .userInitiated) {
            let pixels = self.extractPixels(from: cgImage, excludeBackground: true)
            guard !pixels.isEmpty else { return ([UIColor](), [Double]()) }
            return self.kMeansWithPercentages(pixels: pixels, k: count, iterations: 10)
        }.value

        return zip(colors, percentages).map { color, percentage in
            ColorPaletteEntry(
                color: color,
                name: nearestColorName(for: color),
                percentage: percentage
            )
        }.sorted { $0.percentage > $1.percentage }
    }

    // MARK: - Pixel Extraction

    private func extractPixels(from cgImage: CGImage, excludeBackground: Bool) -> [UIColor] {
        let width = cgImage.width
        let height = cgImage.height
        let bytesPerPixel = 4
        let bytesPerRow = bytesPerPixel * width
        let bitsPerComponent = 8

        var pixelData = [UInt8](repeating: 0, count: width * height * bytesPerPixel)

        guard let context = CGContext(
            data: &pixelData,
            width: width,
            height: height,
            bitsPerComponent: bitsPerComponent,
            bytesPerRow: bytesPerRow,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else {
            return []
        }

        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

        var colors: [UIColor] = []
        let sampleRate = 4  // Sample every 4th pixel for performance

        for y in stride(from: 0, to: height, by: sampleRate) {
            for x in stride(from: 0, to: width, by: sampleRate) {
                let offset = (y * width + x) * bytesPerPixel

                let r = CGFloat(pixelData[offset]) / 255.0
                let g = CGFloat(pixelData[offset + 1]) / 255.0
                let b = CGFloat(pixelData[offset + 2]) / 255.0
                let a = CGFloat(pixelData[offset + 3]) / 255.0

                // Skip transparent pixels
                if excludeBackground && a < 0.5 {
                    continue
                }

                // Skip near-white pixels (likely background)
                if excludeBackground && r > 0.95 && g > 0.95 && b > 0.95 {
                    continue
                }

                colors.append(UIColor(red: r, green: g, blue: b, alpha: 1.0))
            }
        }

        return colors
    }

    // MARK: - K-Means Clustering

    private func kMeansClustering(pixels: [UIColor], k: Int, iterations: Int) -> [UIColor] {
        guard !pixels.isEmpty else { return [] }

        let actualK = min(k, pixels.count)

        // Initialize centroids randomly
        var centroids = Array(pixels.shuffled().prefix(actualK))

        for _ in 0..<iterations {
            // Assign pixels to nearest centroid
            var clusters = [[UIColor]](repeating: [], count: actualK)

            for pixel in pixels {
                var minDistance = Double.infinity
                var closestIndex = 0

                for (i, centroid) in centroids.enumerated() {
                    let distance = colorDistance(pixel, centroid)
                    if distance < minDistance {
                        minDistance = distance
                        closestIndex = i
                    }
                }

                clusters[closestIndex].append(pixel)
            }

            // Update centroids
            for i in 0..<actualK {
                if !clusters[i].isEmpty {
                    centroids[i] = averageColor(of: clusters[i])
                }
            }
        }

        return centroids
    }

    private func kMeansWithPercentages(pixels: [UIColor], k: Int, iterations: Int) -> ([UIColor], [Double]) {
        guard !pixels.isEmpty else { return ([], []) }

        let actualK = min(k, pixels.count)
        var centroids = Array(pixels.shuffled().prefix(actualK))
        var clusterSizes = [Int](repeating: 0, count: actualK)

        for _ in 0..<iterations {
            var clusters = [[UIColor]](repeating: [], count: actualK)

            for pixel in pixels {
                var minDistance = Double.infinity
                var closestIndex = 0

                for (i, centroid) in centroids.enumerated() {
                    let distance = colorDistance(pixel, centroid)
                    if distance < minDistance {
                        minDistance = distance
                        closestIndex = i
                    }
                }

                clusters[closestIndex].append(pixel)
            }

            for i in 0..<actualK {
                clusterSizes[i] = clusters[i].count
                if !clusters[i].isEmpty {
                    centroids[i] = averageColor(of: clusters[i])
                }
            }
        }

        let total = Double(pixels.count)
        let percentages = clusterSizes.map { Double($0) / total * 100 }

        return (centroids, percentages)
    }

    // MARK: - Color Math

    private func colorDistance(_ c1: UIColor, _ c2: UIColor) -> Double {
        var r1: CGFloat = 0, g1: CGFloat = 0, b1: CGFloat = 0
        var r2: CGFloat = 0, g2: CGFloat = 0, b2: CGFloat = 0

        c1.getRed(&r1, green: &g1, blue: &b1, alpha: nil)
        c2.getRed(&r2, green: &g2, blue: &b2, alpha: nil)

        // Weighted Euclidean distance (human eye is more sensitive to green)
        let rDiff = (r1 - r2) * 0.3
        let gDiff = (g1 - g2) * 0.59
        let bDiff = (b1 - b2) * 0.11

        return sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff)
    }

    private func averageColor(of colors: [UIColor]) -> UIColor {
        var totalR: CGFloat = 0
        var totalG: CGFloat = 0
        var totalB: CGFloat = 0

        for color in colors {
            var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0
            color.getRed(&r, green: &g, blue: &b, alpha: nil)
            totalR += r
            totalG += g
            totalB += b
        }

        let count = CGFloat(colors.count)
        return UIColor(red: totalR / count, green: totalG / count, blue: totalB / count, alpha: 1)
    }

    private func nearestColorName(for color: UIColor) -> String {
        var minDistance = Double.infinity
        var closestName = "unknown"

        for (name, namedColor) in Self.namedColors {
            let distance = colorDistance(color, namedColor)
            if distance < minDistance {
                minDistance = distance
                closestName = name
            }
        }

        return closestName
    }
}

// MARK: - Supporting Types

struct ColorPaletteEntry: Identifiable {
    let id = UUID()
    let color: UIColor
    let name: String
    let percentage: Double

    var hexString: String {
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0
        color.getRed(&r, green: &g, blue: &b, alpha: nil)
        return String(format: "#%02X%02X%02X", Int(r * 255), Int(g * 255), Int(b * 255))
    }
}

enum ColorExtractionError: LocalizedError {
    case invalidImage
    case noColorsFound

    var errorDescription: String? {
        switch self {
        case .invalidImage:
            return "Could not process the image for color extraction."
        case .noColorsFound:
            return "No colors could be extracted from the image."
        }
    }
}
