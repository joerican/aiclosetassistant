import SwiftUI
import SwiftData

struct ShuffleView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var items: [ClothingItem]

    @State private var selectedTop: ClothingItem?
    @State private var selectedBottom: ClothingItem?
    @State private var selectedShoes: ClothingItem?

    @State private var lockedSlots: Set<SlotType> = []
    @State private var isShuffling = false
    @State private var aiSuggestion: String?
    @State private var showSaveSuccess = false
    @State private var isSaving = false

    private var tops: [ClothingItem] { items.filter { $0.category == "tops" } }
    private var bottoms: [ClothingItem] { items.filter { $0.category == "bottoms" } }
    private var shoes: [ClothingItem] { items.filter { $0.category == "shoes" } }

    private var hasEnoughItems: Bool {
        !tops.isEmpty && !bottoms.isEmpty && !shoes.isEmpty
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                if !hasEnoughItems {
                    ContentUnavailableView(
                        "Not Enough Items",
                        systemImage: "cabinet",
                        description: Text("Add at least one top, one bottom, and one pair of shoes")
                    )
                } else {
                    // Outfit slots
                    VStack(spacing: 12) {
                        OutfitSlotView(
                            item: selectedTop,
                            category: "Top",
                            isLocked: lockedSlots.contains(.top),
                            onLockToggle: { toggleLock(.top) }
                        )

                        OutfitSlotView(
                            item: selectedBottom,
                            category: "Bottom",
                            isLocked: lockedSlots.contains(.bottom),
                            onLockToggle: { toggleLock(.bottom) }
                        )

                        OutfitSlotView(
                            item: selectedShoes,
                            category: "Shoes",
                            isLocked: lockedSlots.contains(.shoes),
                            onLockToggle: { toggleLock(.shoes) }
                        )
                    }
                    .padding(.horizontal)

                    // AI Suggestion
                    if let suggestion = aiSuggestion {
                        HStack {
                            Image(systemName: "sparkles")
                                .foregroundStyle(.purple)
                            Text(suggestion)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding()
                        .background(.purple.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .padding(.horizontal)
                    }

                    Spacer()

                    // Action buttons
                    HStack(spacing: 16) {
                        Button {
                            dislikeOutfit()
                        } label: {
                            Image(systemName: "hand.thumbsdown")
                        }
                        .buttonStyle(.bordered)
                        .disabled(selectedTop == nil)

                        Button {
                            withAnimation(.spring(duration: 0.5)) {
                                shuffle()
                            }
                        } label: {
                            Label(isShuffling ? "Shuffling..." : "Shuffle",
                                  systemImage: "shuffle")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(isShuffling)

                        Button {
                            saveOutfit()
                        } label: {
                            Image(systemName: isSaving ? "heart.fill" : "heart")
                        }
                        .buttonStyle(.bordered)
                        .disabled(selectedTop == nil || isSaving)
                    }
                    .padding(.horizontal)
                }
            }
            .navigationTitle("Shuffle")
            .overlay {
                if showSaveSuccess {
                    VStack(spacing: 12) {
                        Image(systemName: "heart.fill")
                            .font(.system(size: 50))
                            .foregroundStyle(.pink)

                        Text("Outfit Saved!")
                            .font(.headline)
                    }
                    .padding(32)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .transition(.scale.combined(with: .opacity))
                }
            }
            .animation(.spring(duration: 0.3), value: showSaveSuccess)
            .onAppear {
                if hasEnoughItems && selectedTop == nil {
                    shuffle()
                }
            }
        }
    }

    private func toggleLock(_ slot: SlotType) {
        if lockedSlots.contains(slot) {
            lockedSlots.remove(slot)
        } else {
            lockedSlots.insert(slot)
        }
    }

    private func shuffle() {
        isShuffling = true

        // Random selection (rule-based matching can be added later)
        if !lockedSlots.contains(.top) {
            selectedTop = tops.randomElement()
        }
        if !lockedSlots.contains(.bottom) {
            selectedBottom = bottoms.randomElement()
        }
        if !lockedSlots.contains(.shoes) {
            selectedShoes = shoes.randomElement()
        }

        // Simple color-based suggestion
        if let top = selectedTop, let bottom = selectedBottom {
            aiSuggestion = generateSuggestion(top: top, bottom: bottom)
        }

        isShuffling = false
    }

    private func generateSuggestion(top: ClothingItem, bottom: ClothingItem) -> String? {
        let topColors = top.colors.joined(separator: " and ")
        let bottomType = bottom.subcategory ?? bottom.category

        if !topColors.isEmpty {
            return "This \(topColors) top pairs nicely with \(bottomType)."
        }
        return nil
    }

    private func dislikeOutfit() {
        // TODO: Track disliked combinations
        shuffle()
    }

    private func saveOutfit() {
        guard let top = selectedTop,
              let bottom = selectedBottom,
              let shoes = selectedShoes else { return }

        isSaving = true

        let outfit = Outfit(
            topId: top.id,
            bottomId: bottom.id,
            shoesId: shoes.id,
            aiSuggestionText: aiSuggestion
        )

        modelContext.insert(outfit)
        try? modelContext.save()

        // Show feedback
        showSaveSuccess = true

        // Hide after delay
        Task {
            try? await Task.sleep(nanoseconds: 1_500_000_000) // 1.5 seconds
            await MainActor.run {
                showSaveSuccess = false
                isSaving = false
            }
        }
    }

    enum SlotType: Hashable {
        case top, bottom, shoes
    }
}

// MARK: - Outfit Slot View

struct OutfitSlotView: View {
    let item: ClothingItem?
    let category: String
    let isLocked: Bool
    let onLockToggle: () -> Void

    @State private var image: UIImage?
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        HStack(spacing: 16) {
            // Image
            ZStack {
                // Only show background in light mode to avoid white box around transparent images
                if colorScheme == .light {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(.gray.opacity(0.1))
                }

                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .rotationEffect(.degrees(Double(item?.rotation ?? 0)))
                } else {
                    Image(systemName: "questionmark")
                        .font(.title)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 100, height: 100)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isLocked ? .blue : .clear, lineWidth: 3)
            )

            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(category)
                    .font(.headline)

                if let item {
                    Text(item.subcategory ?? item.category.capitalized)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)

                    if !item.colors.isEmpty {
                        Text(item.colors.joined(separator: ", "))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } else {
                    Text("None selected")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            // Lock button
            Button(action: onLockToggle) {
                Image(systemName: isLocked ? "lock.fill" : "lock.open")
                    .foregroundStyle(isLocked ? .blue : .secondary)
            }
            .buttonStyle(.bordered)
            .disabled(item == nil)
        }
        .padding()
        .background(isLocked ? .blue.opacity(0.05) : .clear)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(.secondary.opacity(0.2), lineWidth: 1)
        )
        .task(id: item?.id) {
            if let path = item?.thumbnailPath ?? item?.displayImagePath {
                image = await StorageService.shared.loadImage(path: path)
            } else {
                image = nil
            }
        }
    }
}

#Preview {
    ShuffleView()
        .modelContainer(for: [ClothingItem.self, Outfit.self], inMemory: true)
}
