import SwiftUI

struct ContentView: View {
    @Environment(AuthService.self) private var authService
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        Group {
            if !hasCompletedOnboarding {
                OnboardingView()
            } else if horizontalSizeClass == .compact {
                // iPhone - Tab bar navigation
                TabView {
                    HomeView()
                        .tabItem {
                            Label("Home", systemImage: "house")
                        }

                    ClosetView()
                        .tabItem {
                            Label("Closet", systemImage: "cabinet")
                        }

                    UploadView()
                        .tabItem {
                            Label("Add", systemImage: "plus.circle.fill")
                        }

                    ShuffleView()
                        .tabItem {
                            Label("Shuffle", systemImage: "sparkles")
                        }

                    OutfitsView()
                        .tabItem {
                            Label("Outfits", systemImage: "heart")
                        }
                }
            } else {
                // iPad - Sidebar navigation
                NavigationSplitView {
                    List {
                        NavigationLink {
                            HomeView()
                        } label: {
                            Label("Home", systemImage: "house")
                        }

                        NavigationLink {
                            ClosetView()
                        } label: {
                            Label("Closet", systemImage: "cabinet")
                        }

                        NavigationLink {
                            UploadView()
                        } label: {
                            Label("Add Item", systemImage: "plus.circle")
                        }

                        NavigationLink {
                            ShuffleView()
                        } label: {
                            Label("Shuffle", systemImage: "sparkles")
                        }

                        NavigationLink {
                            OutfitsView()
                        } label: {
                            Label("Saved Outfits", systemImage: "heart")
                        }

                        NavigationLink {
                            CanvasView()
                        } label: {
                            Label("Canvas", systemImage: "paintpalette")
                        }

                        Divider()

                        NavigationLink {
                            SettingsView()
                        } label: {
                            Label("Settings", systemImage: "gear")
                        }
                    }
                    .navigationTitle("AI Closet")
                } detail: {
                    HomeView()
                }
            }
        }
    }
}

#Preview {
    ContentView()
        .environment(AuthService())
        .environment(ErrorHandler())
        .modelContainer(for: [ClothingItem.self, Outfit.self], inMemory: true)
}
