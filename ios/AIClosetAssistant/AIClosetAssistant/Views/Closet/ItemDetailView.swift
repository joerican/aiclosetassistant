import SwiftUI
import SwiftData

struct ItemDetailView: View {
    @Bindable var item: ClothingItem
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @State private var image: UIImage?
    @State private var isEditing = false
    @State private var showDeleteConfirmation = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Image
                    ZStack {
                        RoundedRectangle(cornerRadius: 16)
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
                    .frame(maxHeight: 300)
                    .padding(.horizontal)

                    // Rotation controls
                    HStack(spacing: 24) {
                        Button {
                            item.rotation = (item.rotation - 90 + 360) % 360
                        } label: {
                            Image(systemName: "rotate.left")
                        }
                        .buttonStyle(.bordered)

                        Button {
                            item.isFavorite.toggle()
                        } label: {
                            Image(systemName: item.isFavorite ? "heart.fill" : "heart")
                        }
                        .foregroundStyle(item.isFavorite ? .red : .primary)
                        .buttonStyle(.bordered)

                        Button {
                            item.rotation = (item.rotation + 90) % 360
                        } label: {
                            Image(systemName: "rotate.right")
                        }
                        .buttonStyle(.bordered)
                    }

                    // Metadata Grid
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        MetadataRow(label: "Category", value: item.category.capitalized)
                        MetadataRow(label: "Subcategory", value: item.subcategory)
                        MetadataRow(label: "Colors", value: item.colors.joined(separator: ", "))
                        MetadataRow(label: "Brand", value: item.brand)
                        MetadataRow(label: "Size", value: item.size)
                        MetadataRow(label: "Style", value: item.style)
                        MetadataRow(label: "Fit", value: item.fit)
                        MetadataRow(label: "Material", value: item.material)
                        MetadataRow(label: "Pattern", value: item.pattern)
                        MetadataRow(label: "Season", value: item.season.joined(separator: ", "))
                        MetadataRow(label: "Formality", value: item.formality)
                        MetadataRow(label: "Times Worn", value: "\(item.timesWorn)")
                        MetadataRow(label: "Cost", value: item.formattedCost)
                        MetadataRow(label: "Added", value: item.createdAt.formatted(date: .abbreviated, time: .omitted))
                    }
                    .padding(.horizontal)

                    if let description = item.itemDescription, !description.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Description")
                                .font(.headline)
                            Text(description)
                                .font(.body)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                    }

                    if let notes = item.notes, !notes.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Notes")
                                .font(.headline)
                            Text(notes)
                                .font(.body)
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Item Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .primaryAction) {
                    Menu {
                        Button {
                            isEditing = true
                        } label: {
                            Label("Edit", systemImage: "pencil")
                        }

                        Button(role: .destructive) {
                            showDeleteConfirmation = true
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $isEditing) {
                ItemEditView(item: item)
            }
            .confirmationDialog(
                "Delete Item",
                isPresented: $showDeleteConfirmation,
                titleVisibility: .visible
            ) {
                Button("Delete", role: .destructive) {
                    Task {
                        await deleteItem()
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Are you sure you want to delete this item? This cannot be undone.")
            }
            .task {
                image = await StorageService.shared.loadImage(path: item.displayImagePath)
            }
        }
    }

    private func deleteItem() async {
        await StorageService.shared.deleteAllImages(for: item.id)
        modelContext.delete(item)
        dismiss()
    }
}

// MARK: - Metadata Row

private struct MetadataRow: View {
    let label: String
    let value: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value ?? "—")
                .font(.body)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
