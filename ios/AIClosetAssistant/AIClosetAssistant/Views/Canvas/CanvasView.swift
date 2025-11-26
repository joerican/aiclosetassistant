import SwiftUI
import SwiftData

struct CanvasView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Environment(\.horizontalSizeClass) private var sizeClass
    @Query private var items: [ClothingItem]

    @State private var canvasItems: [CanvasItemState] = []
    @State private var selectedCategory: ClothingItem.Category?
    @State private var outfitName = ""
    @State private var showingSaveSheet = false

    private var filteredItems: [ClothingItem] {
        guard let category = selectedCategory else { return items }
        return items.filter { $0.category == category.rawValue }
    }

    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                HStack(spacing: 0) {
                    // Canvas area
                    ZStack {
                        // Background
                        RoundedRectangle(cornerRadius: 16)
                            .fill(.gray.opacity(0.1))

                        // Draggable items
                        ForEach($canvasItems) { $item in
                            CanvasItemView(
                                state: $item,
                                onDelete: { removeItem(item) }
                            )
                        }

                        if canvasItems.isEmpty {
                            VStack(spacing: 12) {
                                Image(systemName: "hand.draw")
                                    .font(.system(size: 48))
                                    .foregroundStyle(.secondary)
                                Text("Drag items here")
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding()

                    // Item picker sidebar (iPad) or bottom sheet (iPhone)
                    if sizeClass == .regular {
                        itemPickerSidebar
                            .frame(width: 250)
                    }
                }
            }
            .navigationTitle("Canvas")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .primaryAction) {
                    Button("Save") {
                        showingSaveSheet = true
                    }
                    .disabled(canvasItems.isEmpty)
                }

                if sizeClass == .compact {
                    ToolbarItem(placement: .bottomBar) {
                        itemPickerCompact
                    }
                }
            }
            .sheet(isPresented: $showingSaveSheet) {
                saveSheet
            }
        }
    }

    // MARK: - Item Picker (iPad Sidebar)

    private var itemPickerSidebar: some View {
        VStack(spacing: 0) {
            // Category filter
            Picker("Category", selection: $selectedCategory) {
                Text("All").tag(nil as ClothingItem.Category?)
                ForEach(ClothingItem.Category.allCases) { cat in
                    Text(cat.displayName).tag(cat as ClothingItem.Category?)
                }
            }
            .pickerStyle(.segmented)
            .padding()

            Divider()

            // Items list
            ScrollView {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 8) {
                    ForEach(filteredItems) { item in
                        ItemPickerThumbnail(item: item) {
                            addToCanvas(item)
                        }
                    }
                }
                .padding()
            }
        }
        .background(.ultraThinMaterial)
    }

    // MARK: - Item Picker (iPhone Compact)

    private var itemPickerCompact: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(items.prefix(20)) { item in
                    ItemPickerThumbnail(item: item, size: 60) {
                        addToCanvas(item)
                    }
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Save Sheet

    private var saveSheet: some View {
        NavigationStack {
            Form {
                TextField("Outfit Name (optional)", text: $outfitName)
            }
            .navigationTitle("Save Outfit")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        showingSaveSheet = false
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saveOutfit()
                    }
                }
            }
        }
        .presentationDetents([.height(200)])
    }

    // MARK: - Actions

    private func addToCanvas(_ item: ClothingItem) {
        let newState = CanvasItemState(
            itemId: item.id,
            position: CGPoint(x: 200, y: 200),
            size: CGSize(width: 120, height: 120)
        )
        canvasItems.append(newState)
    }

    private func removeItem(_ item: CanvasItemState) {
        canvasItems.removeAll { $0.id == item.id }
    }

    private func saveOutfit() {
        let outfit = Outfit()
        outfit.name = outfitName.isEmpty ? nil : outfitName
        outfit.isCanvasOutfit = true

        // Encode canvas layout
        let layout = Outfit.CanvasLayout(
            items: canvasItems.enumerated().map { index, state in
                Outfit.CanvasLayout.CanvasItem(
                    itemId: state.itemId,
                    position: state.position,
                    size: state.size,
                    zIndex: index
                )
            }
        )
        outfit.setCanvasLayout(layout)

        modelContext.insert(outfit)
        showingSaveSheet = false
        dismiss()
    }
}

// MARK: - Canvas Item State

struct CanvasItemState: Identifiable {
    let id = UUID()
    var itemId: UUID
    var position: CGPoint
    var size: CGSize
}

// MARK: - Canvas Item View

struct CanvasItemView: View {
    @Binding var state: CanvasItemState
    let onDelete: () -> Void
    @Query private var items: [ClothingItem]

    @State private var image: UIImage?
    @State private var isDragging = false

    private var item: ClothingItem? {
        items.first { $0.id == state.itemId }
    }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .rotationEffect(.degrees(Double(item?.rotation ?? 0)))
            } else {
                ProgressView()
            }

            // Delete button
            Button(action: onDelete) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.white, .red)
            }
            .offset(x: 8, y: -8)
        }
        .frame(width: state.size.width, height: state.size.height)
        .position(state.position)
        .gesture(
            DragGesture()
                .onChanged { value in
                    state.position = value.location
                    isDragging = true
                }
                .onEnded { _ in
                    isDragging = false
                }
        )
        .scaleEffect(isDragging ? 1.05 : 1.0)
        .animation(.spring(duration: 0.2), value: isDragging)
        .task {
            if let path = item?.displayImagePath {
                image = await StorageService.shared.loadImage(path: path)
            }
        }
    }
}

// MARK: - Item Picker Thumbnail

struct ItemPickerThumbnail: View {
    let item: ClothingItem
    var size: CGFloat = 80
    let onTap: () -> Void

    @State private var image: UIImage?

    var body: some View {
        Button(action: onTap) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
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
            .frame(width: size, height: size)
        }
        .buttonStyle(.plain)
        .task {
            image = await StorageService.shared.loadImage(
                path: item.thumbnailPath ?? item.displayImagePath
            )
        }
    }
}

#Preview {
    CanvasView()
        .modelContainer(for: [ClothingItem.self, Outfit.self], inMemory: true)
}
