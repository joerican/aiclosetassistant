import SwiftUI
import OSLog

/// Centralized error handling with user-friendly messages
@Observable
final class ErrorHandler {
    var currentError: AppError?
    var showError = false

    private let logger = Logger(subsystem: "com.aicloset.app", category: "errors")

    // MARK: - Handle Errors

    func handle(_ error: Error, context: String? = nil) {
        let appError: AppError

        if let existing = error as? AppError {
            appError = existing
        } else {
            appError = .unknown(error.localizedDescription)
        }

        // Log the error
        logger.error("Error in \(context ?? "unknown"): \(appError.localizedDescription)")

        // Show to user on main thread
        Task { @MainActor in
            self.currentError = appError
            self.showError = true
        }
    }

    func clearError() {
        currentError = nil
        showError = false
    }

    // MARK: - Convenience Methods

    func handleImageProcessing(_ error: Error) {
        handle(error, context: "image processing")
    }

    func handleStorage(_ error: Error) {
        handle(error, context: "storage")
    }

    func handleAuth(_ error: Error) {
        handle(error, context: "authentication")
    }
}

// MARK: - App Error Types

enum AppError: LocalizedError {
    // Image Processing
    case imageProcessingFailed(String)
    case noSubjectDetected
    case invalidImage

    // Storage
    case storageFull
    case fileNotFound(String)
    case saveFailed

    // Auth
    case signInFailed(String)
    case notAuthenticated

    // Network (for future cloud sync)
    case networkUnavailable
    case serverError(String)

    // General
    case unknown(String)

    var errorDescription: String? {
        switch self {
        case .imageProcessingFailed(let detail):
            return "Unable to process image: \(detail)"
        case .noSubjectDetected:
            return "No clothing item detected in the photo. Try a clearer shot with better lighting."
        case .invalidImage:
            return "The selected image could not be read."
        case .storageFull:
            return "Storage is full. Please delete some items to free up space."
        case .fileNotFound(let path):
            return "File not found: \(path)"
        case .saveFailed:
            return "Failed to save. Please try again."
        case .signInFailed(let detail):
            return "Sign in failed: \(detail)"
        case .notAuthenticated:
            return "Please sign in to continue."
        case .networkUnavailable:
            return "No internet connection. Please check your network."
        case .serverError(let detail):
            return "Server error: \(detail)"
        case .unknown(let detail):
            return "An error occurred: \(detail)"
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .noSubjectDetected:
            return "Make sure the clothing item is clearly visible against a contrasting background."
        case .storageFull:
            return "Go to your Closet and delete items you no longer need."
        case .networkUnavailable:
            return "Check your Wi-Fi or cellular connection."
        default:
            return nil
        }
    }
}

// MARK: - SwiftUI Error Alert Modifier

struct ErrorAlertModifier: ViewModifier {
    @Environment(ErrorHandler.self) private var errorHandler

    func body(content: Content) -> some View {
        content
            .alert("Error", isPresented: Binding(
                get: { errorHandler.showError },
                set: { if !$0 { errorHandler.clearError() } }
            )) {
                Button("OK") {
                    errorHandler.clearError()
                }
            } message: {
                if let error = errorHandler.currentError {
                    VStack {
                        Text(error.localizedDescription)
                        if let suggestion = error.recoverySuggestion {
                            Text(suggestion)
                                .font(.caption)
                        }
                    }
                }
            }
    }
}

extension View {
    func withErrorHandling() -> some View {
        modifier(ErrorAlertModifier())
    }
}
