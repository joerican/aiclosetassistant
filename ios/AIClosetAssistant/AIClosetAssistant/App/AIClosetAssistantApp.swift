import SwiftUI
import SwiftData

@main
struct AIClosetAssistantApp: App {
    @State private var errorHandler = ErrorHandler()
    @State private var authService = AuthService()

    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            ClothingItem.self,
            Outfit.self,
            WearHistory.self
        ])

        let modelConfiguration = ModelConfiguration(
            schema: schema,
            isStoredInMemoryOnly: false,
            cloudKitDatabase: .none  // Local-only for now, iCloud sync later
        )

        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(errorHandler)
                .environment(authService)
                .alert("Error", isPresented: $errorHandler.showError) {
                    Button("OK") {
                        errorHandler.clearError()
                    }
                } message: {
                    Text(errorHandler.currentError?.localizedDescription ?? "An unknown error occurred")
                }
        }
        .modelContainer(sharedModelContainer)
    }
}
