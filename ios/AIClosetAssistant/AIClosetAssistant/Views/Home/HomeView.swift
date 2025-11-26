import SwiftUI
import SwiftData

struct HomeView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var items: [ClothingItem]
    @Environment(AuthService.self) private var authService

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Spacer()

                // Logo
                Image(systemName: "tshirt.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(.blue)

                Text("AI Closet")
                    .font(.largeTitle.bold())

                if !items.isEmpty {
                    Text("\(items.count) items in your closet")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                // Primary action
                NavigationLink(destination: ShuffleView()) {
                    Label("Dress Me", systemImage: "sparkles")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(.blue)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding(.horizontal)
                .disabled(items.count < 3)

                if items.count < 3 {
                    Text("Add at least 3 items to use Shuffle")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                // Secondary actions
                HStack(spacing: 16) {
                    NavigationLink(destination: ClosetView()) {
                        Label("Closet", systemImage: "cabinet")
                    }
                    .buttonStyle(.bordered)

                    NavigationLink(destination: OutfitsView()) {
                        Label("Outfits", systemImage: "heart")
                    }
                    .buttonStyle(.bordered)
                }

                Spacer()

                // Quick add button
                NavigationLink(destination: UploadView()) {
                    Label("Add Item", systemImage: "plus.circle.fill")
                        .font(.headline)
                }
                .buttonStyle(.borderedProminent)

                Spacer()
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

#Preview {
    HomeView()
        .environment(AuthService())
        .modelContainer(for: ClothingItem.self, inMemory: true)
}
