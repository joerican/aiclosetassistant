import UIKit

/// Cloud-based AI analysis service using Cloudflare Workers API
@Observable
final class CloudAIAnalysisService: AIAnalysisProtocol {

    // MARK: - Configuration

    /// Base URL for your Cloudflare Workers API
    private let baseURL = "https://theclosetai.com"

    /// API key for authentication (stored securely)
    /// In production, retrieve this from Keychain or secure storage
    private let apiKey = "closetai-ios-2024-secret"

    var isAnalyzing = false
    var analysisStatus = ""

    // MARK: - AIAnalysisProtocol

    func analyzeClothingItem(image: UIImage) async throws -> ClothingAnalysis {
        isAnalyzing = true
        analysisStatus = "Uploading to cloud..."

        defer {
            Task { @MainActor in
                self.isAnalyzing = false
                self.analysisStatus = ""
            }
        }

        // 1. Resize image to reduce upload size
        guard let resizedImage = image.resized(toMaxDimension: 800),
              let imageData = resizedImage.jpegData(compressionQuality: 0.8) else {
            throw CloudAIError.imageConversionFailed
        }

        await MainActor.run {
            self.analysisStatus = "Analyzing with AI..."
        }

        // 2. Create multipart form data
        let boundary = UUID().uuidString
        var request = URLRequest(url: URL(string: "\(baseURL)/api/analyze-image")!)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        request.timeoutInterval = 60 // AI analysis can take time

        var body = Data()

        // Add image field
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"image\"; filename=\"photo.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        // 3. Send request
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw CloudAIError.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            let errorBody = String(data: data, encoding: .utf8) ?? "Unknown error"
            print("Cloud AI error (\(httpResponse.statusCode)): \(errorBody)")
            throw CloudAIError.serverError(statusCode: httpResponse.statusCode, message: errorBody)
        }

        // 4. Parse response
        let decoder = JSONDecoder()
        let apiResponse = try decoder.decode(AnalyzeImageResponse.self, from: data)

        guard apiResponse.success, let metadata = apiResponse.metadata else {
            throw CloudAIError.analysisError(apiResponse.error ?? "Unknown error")
        }

        await MainActor.run {
            self.analysisStatus = "Processing results..."
        }

        // 5. Convert API response to ClothingAnalysis
        return ClothingAnalysis(
            category: metadata.category ?? "unknown",
            subcategory: metadata.subcategory,
            colors: metadata.colors ?? [],
            brand: metadata.brand,
            style: metadata.style,
            material: metadata.material,
            pattern: metadata.pattern,
            fit: metadata.fit,
            season: metadata.season ?? [],
            formality: metadata.formality,
            description: metadata.description,
            tags: metadata.tags ?? []
        )
    }
}

// MARK: - API Response Types

private struct AnalyzeImageResponse: Codable {
    let success: Bool
    let metadata: AIMetadata?
    let error: String?
}

private struct AIMetadata: Codable {
    let category: String?
    let subcategory: String?
    let colors: [String]?
    let brand: String?
    let description: String?
    let tags: [String]?
    let material: String?
    let pattern: String?
    let style: String?
    let fit: String?
    let season: [String]?
    let occasion: [String]?
    let features: [String]?
    let condition: String?
    let formality: String?
    let colorDetails: ColorDetails?
    let additionalObservations: String?
    let orientation: String?

    enum CodingKeys: String, CodingKey {
        case category, subcategory, colors, brand, description, tags
        case material, pattern, style, fit, season, occasion, features
        case condition, formality, orientation
        case colorDetails = "color_details"
        case additionalObservations = "additional_observations"
    }
}

private struct ColorDetails: Codable {
    let primary: String?
    let secondary: String?
    let accent: String?
}

// MARK: - Errors

enum CloudAIError: LocalizedError {
    case imageConversionFailed
    case invalidResponse
    case serverError(statusCode: Int, message: String)
    case analysisError(String)
    case networkUnavailable

    var errorDescription: String? {
        switch self {
        case .imageConversionFailed:
            return "Failed to prepare image for upload."
        case .invalidResponse:
            return "Received invalid response from server."
        case .serverError(let code, let message):
            return "Server error (\(code)): \(message)"
        case .analysisError(let message):
            return "Analysis failed: \(message)"
        case .networkUnavailable:
            return "No internet connection. Please check your network."
        }
    }
}
