import SwiftUI
import SwiftData

struct ClosetView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Query(sort: \ClothingItem.createdAt, order: .reverse) private var items: [ClothingItem]

    @State private var selectedCategory: ClothingItem.Category?
    @State private var searchText = ""
    @State private var selectedItem: ClothingItem?

    private var filteredItems: [ClothingItem] {
        var result = items

        if let category = selectedCategory {
            result = result.filter { $0.category == category.rawValue }
        }

        if !searchText.isEmpty {
            result = result.filter {
                $0.category.localizedCaseInsensitiveContains(searchText) ||
                ($0.subcategory?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                ($0.brand?.localizedCaseInsensitiveContains(searchText) ?? false) ||
                $0.colors.contains { $0.localizedCaseInsensitiveContains(searchText) }
            }
        }

        return result
    }

    private var columns: [GridItem] {
        let count = sizeClass == .compact ? 2 : 4
        return Array(repeating: GridItem(.flexible(), spacing: 12), count: count)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Category filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        CategoryFilterButton(
                            title: "All",
                            isSelected: selectedCategory == nil,
                            action: { selectedCategory = nil }
                        )

                        ForEach(ClothingItem.Category.allCases) { category in
                            CategoryFilterButton(
                                title: category.displayName,
                                icon: category.icon,
                                isSelected: selectedCategory == category,
                                action: { selectedCategory = category }
                            )
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }
                .background(.ultraThinMaterial)

                if items.isEmpty {
                    ContentUnavailableView(
                        "Your Closet is Empty",
                        systemImage: "cabinet",
                        description: Text("Add your first clothing item to get started")
                    )
                } else if filteredItems.isEmpty {
                    ContentUnavailableView(
                        "No Items Found",
                        systemImage: "magnifyingglass",
                        description: Text("Try a different search or category")
                    )
                } else {
                    ScrollView {
                        LazyVGrid(columns: columns, spacing: 12) {
                            ForEach(filteredItems) { item in
                                ClothingItemCard(item: item)
                                    .onTapGesture {
                                        selectedItem = item
                                    }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Closet")
            .searchable(text: $searchText, prompt: "Search items...")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    NavigationLink(destination: UploadView()) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(item: $selectedItem) { item in
                ItemDetailView(item: item)
            }
        }
    }
}

// MARK: - Category Filter Button

private struct CategoryFilterButton: View {
    let title: String
    var icon: String? = nil
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon {
                    Image(systemName: icon)
                        .font(.caption)
                }
                Text(title)
                    .font(.subheadline)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? .blue : .secondary.opacity(0.2))
            .foregroundStyle(isSelected ? .white : .primary)
            .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Clothing Item Card

struct ClothingItemCard: View {
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

            VStack(spacing: 2) {
                Text(item.subcategory ?? item.category.capitalized)
                    .font(.caption)
                    .lineLimit(1)

                if !item.colors.isEmpty {
                    Text(item.colors.joined(separator: ", "))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .task {
            image = await StorageService.shared.loadImage(
                path: item.thumbnailPath ?? item.displayImagePath
            )
        }
    }
}

#Preview {
    ClosetView()
        .modelContainer(for: ClothingItem.self, inMemory: true)
}
