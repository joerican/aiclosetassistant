import UIKit
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins

/// Vision framework-based image processing for background removal
@Observable
final class ImageProcessingService: @unchecked Sendable {
    static let shared = ImageProcessingService()

    // Reuse CIContext for performance (expensive to create)
    private let ciContext = CIContext(options: [
        .useSoftwareRenderer: false,  // Use GPU
        .cacheIntermediates: false    // Don't cache (saves memory)
    ])

    var isProcessing = false
    var processingStatus = ""

    // MARK: - Background Removal

    /// Remove background using Apple's subject lifting API (iOS 16+)
    /// Returns either a single processed image or multiple subject previews for user selection
    func removeBackground(from image: UIImage, maxDimension: CGFloat = 800) async throws -> BackgroundRemovalResult {
        isProcessing = true
        processingStatus = "Analyzing image..."

        defer {
            Task { @MainActor in
                self.isProcessing = false
                self.processingStatus = ""
            }
        }

        // 1. Resize BEFORE processing (Vision is expensive on large images)
        let resized = image.resized(toMaxDimension: maxDimension) ?? image

        guard let cgImage = resized.cgImage else {
            throw ImageProcessingError.invalidImage
        }

        // 2. Run Vision on background thread
        let request = VNGenerateForegroundInstanceMaskRequest()
        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

        try await Task.detached(priority: .userInitiated) {
            try handler.perform([request])
        }.value

        guard let result = request.results?.first else {
            throw ImageProcessingError.noSubjectFound
        }

        // 3. Check for multiple subjects
        let instances = result.allInstances

        await MainActor.run {
            self.processingStatus = "Found \(instances.count) subject(s)..."
        }

        if instances.count > 1 {
            // Multiple subjects detected - return previews for user selection
            var previews: [SubjectPreview] = []

            for (index, instance) in instances.enumerated() {
                await MainActor.run {
                    self.processingStatus = "Generating preview \(index + 1)/\(instances.count)..."
                }

                let maskBuffer = try result.generateScaledMaskForImage(
                    forInstances: [instance],
                    from: handler
                )

                let preview = try await applyMask(maskBuffer, to: resized)
                previews.append(SubjectPreview(
                    image: preview,
                    instanceIndex: index,
                    instance: instance
                ))
            }

            return .multipleSubjects(previews: previews, result: result, handler: handler, originalImage: resized)
        } else {
            // Single subject - process directly
            await MainActor.run {
                self.processingStatus = "Removing background..."
            }

            let maskBuffer = try result.generateScaledMaskForImage(
                forInstances: instances,
                from: handler
            )

            let processedImage = try await applyMask(maskBuffer, to: resized)
            return .single(processedImage)
        }
    }

    /// Process a specific subject when user selects from multiple
    func processSelectedSubject(
        instance: IndexSet,
        result: VNInstanceMaskObservation,
        handler: VNImageRequestHandler,
        originalImage: UIImage
    ) async throws -> UIImage {
        isProcessing = true
        processingStatus = "Processing selected subject..."

        defer {
            Task { @MainActor in
                self.isProcessing = false
                self.processingStatus = ""
            }
        }

        let maskBuffer = try result.generateScaledMaskForImage(
            forInstances: instance,
            from: handler
        )

        return try await applyMask(maskBuffer, to: originalImage)
    }

    // MARK: - Apply Mask

    private func applyMask(_ mask: CVPixelBuffer, to image: UIImage) async throws -> UIImage {
        return try await Task.detached(priority: .userInitiated) {
            guard let ciImage = CIImage(image: image) else {
                throw ImageProcessingError.invalidImage
            }

            let maskImage = CIImage(cvPixelBuffer: mask)

            // Scale mask to match image size if needed
            let scaleX = ciImage.extent.width / maskImage.extent.width
            let scaleY = ciImage.extent.height / maskImage.extent.height
            let scaledMask = maskImage.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))

            // Apply mask using blend filter
            let filter = CIFilter.blendWithMask()
            filter.inputImage = ciImage
            filter.maskImage = scaledMask
            filter.backgroundImage = CIImage.empty()

            guard let outputImage = filter.outputImage else {
                throw ImageProcessingError.processingFailed
            }

            // Render with explicit extent (prevents memory issues)
            let extent = outputImage.extent
            guard let cgImage = self.ciContext.createCGImage(outputImage, from: extent) else {
                throw ImageProcessingError.processingFailed
            }

            return UIImage(cgImage: cgImage)
        }.value
    }

    // MARK: - Image Resizing

    func resizeImage(_ image: UIImage, to size: CGSize) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(size: size)
        return renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
    }

    func createThumbnail(_ image: UIImage, maxDimension: CGFloat = 200) -> UIImage? {
        image.resized(toMaxDimension: maxDimension)
    }

    // MARK: - Image Rotation

    func rotateImage(_ image: UIImage, degrees: Int) -> UIImage? {
        guard degrees != 0 else { return image }

        let radians = CGFloat(degrees) * .pi / 180

        var newSize = image.size
        if degrees == 90 || degrees == 270 || degrees == -90 {
            newSize = CGSize(width: image.size.height, height: image.size.width)
        }

        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { context in
            context.cgContext.translateBy(x: newSize.width / 2, y: newSize.height / 2)
            context.cgContext.rotate(by: radians)
            image.draw(in: CGRect(
                x: -image.size.width / 2,
                y: -image.size.height / 2,
                width: image.size.width,
                height: image.size.height
            ))
        }
    }
}

// MARK: - Result Types

enum BackgroundRemovalResult {
    case single(UIImage)
    case multipleSubjects(
        previews: [SubjectPreview],
        result: VNInstanceMaskObservation,
        handler: VNImageRequestHandler,
        originalImage: UIImage
    )

    var isSingleSubject: Bool {
        if case .single = self { return true }
        return false
    }
}

struct SubjectPreview: Identifiable {
    let id = UUID()
    let image: UIImage
    let instanceIndex: Int
    let instance: IndexSet.Element

    var indexSet: IndexSet {
        IndexSet(integer: instance)
    }
}

// MARK: - Errors

enum ImageProcessingError: LocalizedError {
    case invalidImage
    case noSubjectFound
    case processingFailed
    case cancelled

    var errorDescription: String? {
        switch self {
        case .invalidImage:
            return "The image could not be processed."
        case .noSubjectFound:
            return "No clothing item was detected in the photo."
        case .processingFailed:
            return "Failed to remove background."
        case .cancelled:
            return "Processing was cancelled."
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .noSubjectFound:
            return "Try taking a photo with the item against a contrasting background."
        default:
            return nil
        }
    }
}

// MARK: - UIImage Extension

extension UIImage {
    func resized(toMaxDimension maxDimension: CGFloat) -> UIImage? {
        let scale = min(maxDimension / size.width, maxDimension / size.height)

        // Don't upscale
        if scale >= 1.0 { return self }

        let newSize = CGSize(
            width: size.width * scale,
            height: size.height * scale
        )

        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in
            draw(in: CGRect(origin: .zero, size: newSize))
        }
    }
}
