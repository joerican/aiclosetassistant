import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(AuthService.self) private var authService
    @Environment(\.modelContext) private var modelContext
    @Query private var items: [ClothingItem]
    @Query private var outfits: [Outfit]

    @State private var storageUsed: Double = 0
    @State private var showDeleteAllConfirmation = false
    @State private var showSignOutConfirmation = false

    var body: some View {
        NavigationStack {
            List {
                // Account Section
                Section("Account") {
                    if authService.isAuthenticated {
                        HStack {
                            Image(systemName: "person.crop.circle.fill")
                                .font(.title)
                                .foregroundStyle(.blue)

                            VStack(alignment: .leading) {
                                Text(authService.userName ?? "Signed In")
                                    .font(.headline)
                                if let email = authService.userEmail {
                                    Text(email)
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                        .padding(.vertical, 4)

                        Button("Sign Out", role: .destructive) {
                            showSignOutConfirmation = true
                        }
                    } else {
                        SignInWithAppleButtonView()
                            .frame(height: 44)
                    }
                }

                // Stats Section
                Section("Your Closet") {
                    LabeledContent("Items", value: "\(items.count)")
                    LabeledContent("Outfits", value: "\(outfits.count)")
                    LabeledContent("Storage Used", value: String(format: "%.1f MB", storageUsed))
                }

                // Storage Section
                Section("Storage") {
                    Button("Clear Image Cache") {
                        Task {
                            await ImageCache.shared.clearAll()
                        }
                    }

                    Button("Delete All Data", role: .destructive) {
                        showDeleteAllConfirmation = true
                    }
                }

                // About Section
                Section("About") {
                    LabeledContent("Version", value: Bundle.main.appVersion)

                    Link(destination: URL(string: "https://github.com/joerican/aiclosetassistant")!) {
                        Label("View on GitHub", systemImage: "link")
                    }
                }

                // Debug Section
                #if DEBUG
                Section("Debug") {
                    NavigationLink("View Logs") {
                        DebugLogsView()
                    }

                    Button("Reset Onboarding") {
                        UserDefaults.standard.removeObject(forKey: "hasCompletedOnboarding")
                    }
                }
                #endif
            }
            .navigationTitle("Settings")
            .task {
                storageUsed = await StorageService.shared.totalStorageUsedMB
            }
            .confirmationDialog(
                "Delete All Data",
                isPresented: $showDeleteAllConfirmation,
                titleVisibility: .visible
            ) {
                Button("Delete Everything", role: .destructive) {
                    Task {
                        await deleteAllData()
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("This will permanently delete all your clothing items and outfits. This cannot be undone.")
            }
            .confirmationDialog(
                "Sign Out",
                isPresented: $showSignOutConfirmation,
                titleVisibility: .visible
            ) {
                Button("Sign Out", role: .destructive) {
                    authService.signOut()
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
    }

    private func deleteAllData() async {
        // Delete all images
        await StorageService.shared.clearAllStorage()

        // Delete all items
        for item in items {
            modelContext.delete(item)
        }

        // Delete all outfits
        for outfit in outfits {
            modelContext.delete(outfit)
        }

        storageUsed = 0
    }
}

// MARK: - Debug Logs View

struct DebugLogsView: View {
    var body: some View {
        List {
            Text("Debug logs would appear here")
                .foregroundStyle(.secondary)
        }
        .navigationTitle("Debug Logs")
    }
}

// MARK: - Bundle Extension

extension Bundle {
    var appVersion: String {
        let version = infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = infoDictionary?["CFBundleVersion"] as? String ?? "1"
        return "\(version) (\(build))"
    }
}

#Preview {
    SettingsView()
        .environment(AuthService())
        .modelContainer(for: [ClothingItem.self, Outfit.self], inMemory: true)
}
