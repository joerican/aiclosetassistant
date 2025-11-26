import SwiftUI
import SwiftData

struct OutfitsView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Query(sort: \Outfit.createdAt, order: .reverse) private var outfits: [Outfit]
    @Query private var items: [ClothingItem]

    @State private var selectedOutfit: Outfit?
    @State private var showDeleteConfirmation = false
    @State private var outfitToDelete: Outfit?

    private var columns: [GridItem] {
        let count = sizeClass == .compact ? 2 : 3
        return Array(repeating: GridItem(.flexible(), spacing: 16), count: count)
    }

    var body: some View {
        NavigationStack {
            Group {
                if outfits.isEmpty {
                    ContentUnavailableView(
                        "No Saved Outfits",
                        systemImage: "heart",
                        description: Text("Save outfits from Shuffle or create them in Canvas")
                    )
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 16) {
                            ForEach(outfits) { outfit in
                                OutfitCard(outfit: outfit, items: items)
                                    .onTapGesture {
                                        selectedOutfit = outfit
                                    }
                                    .contextMenu {
                                        Button(role: .destructive) {
                                            outfitToDelete = outfit
                                            showDeleteConfirmation = true
                                        } label: {
                                            Label("Delete", systemImage: "trash")
                                        }
                                    }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Saved Outfits")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    NavigationLink(destination: CanvasView()) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(item: $selectedOutfit) { outfit in
                OutfitDetailView(outfit: outfit, items: items)
            }
            .confirmationDialog(
                "Delete Outfit",
                isPresented: $showDeleteConfirmation,
                titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    if let outfit = outfitToDelete {
                        modelContext.delete(outfit)
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Are you sure you want to delete this outfit?")
            }
        }
    }
}

// MARK: - Outfit Card

struct OutfitCard: View {
    let outfit: Outfit
    let items: [ClothingItem]

    private var topItem: ClothingItem? {
        items.first { $0.id == outfit.topId }
    }

    private var bottomItem: ClothingItem? {
        items.first { $0.id == outfit.bottomId }
    }

    private var shoesItem: ClothingItem? {
        items.first { $0.id == outfit.shoesId }
    }

    var body: some View {
        VStack(spacing: 8) {
            // 3-column grid preview
            HStack(spacing: 4) {
                OutfitItemThumbnail(item: topItem)
                OutfitItemThumbnail(item: bottomItem)
                OutfitItemThumbnail(item: shoesItem)
            }
            .aspectRatio(1, contentMode: .fit)
            .clipShape(RoundedRectangle(cornerRadius: 12))

            // Name
            if let name = outfit.name {
                Text(name)
                    .font(.caption)
                    .lineLimit(1)
            }

            // Canvas indicator
            if outfit.isCanvasOutfit {
                HStack(spacing: 4) {
                    Image(systemName: "paintpalette")
                        .font(.caption2)
                    Text("Canvas")
                        .font(.caption2)
                }
                .foregroundStyle(.secondary)
            }
        }
    }
}

struct OutfitItemThumbnail: View {
    let item: ClothingItem?
    @State private var image: UIImage?

    var body: some View {
        ZStack {
            Rectangle()
                .fill(.gray.opacity(0.1))

            if let image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .rotationEffect(.degrees(Double(item?.rotation ?? 0)))
            } else if item == nil {
                Image(systemName: "questionmark")
                    .foregroundStyle(.secondary)
            } else {
                ProgressView()
            }
        }
        .task(id: item?.id) {
            if let path = item?.thumbnailPath ?? item?.displayImagePath {
                image = await StorageService.shared.loadImage(path: path)
            }
        }
    }
}

// MARK: - Outfit Detail View

struct OutfitDetailView: View {
    let outfit: Outfit
    let items: [ClothingItem]
    @Environment(\.dismiss) private var dismiss

    private var outfitItems: [ClothingItem] {
        outfit.allItemIds.compactMap { id in
            items.first { $0.id == id }
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Items grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        ForEach(outfitItems) { item in
                            OutfitItemCard(item: item)
                        }
                    }
                    .padding()

                    // AI Suggestion
                    if let suggestion = outfit.aiSuggestionText {
                        VStack(alignment: .leading, spacing: 8) {
                            Label("AI Suggestion", systemImage: "sparkles")
                                .font(.headline)
                                .foregroundStyle(.purple)

                            Text(suggestion)
                                .font(.body)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(.purple.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal)
                    }

                    // Stats
                    VStack(spacing: 8) {
                        Text("Created \(outfit.createdAt.formatted(date: .abbreviated, time: .omitted))")
                        if outfit.timesWorn > 0 {
                            Text("Worn \(outfit.timesWorn) times")
                        }
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
            }
            .navigationTitle(outfit.displayName)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct OutfitItemCard: View {
    let item: ClothingItem
    @State private var image: UIImage?

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(.gray.opacity(0.1))

                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .rotationEffect(.degrees(Double(item.rotation)))
                } else {
                    ProgressView()
                }
            }
            .aspectRatio(1, contentMode: .fit)

            Text(item.subcategory ?? item.category.capitalized)
                .font(.caption)
        }
        .task {
            image = await StorageService.shared.loadImage(path: item.displayImagePath)
        }
    }
}

#Preview {
    OutfitsView()
        .modelContainer(for: [ClothingItem.self, Outfit.self], inMemory: true)
}
