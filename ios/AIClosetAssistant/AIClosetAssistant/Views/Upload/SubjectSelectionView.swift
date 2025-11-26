import SwiftUI
import Vision

/// View for selecting which subject to use when multiple are detected
struct SubjectSelectionView: View {
    let previews: [SubjectPreview]
    let result: VNInstanceMaskObservation
    let handler: VNImageRequestHandler
    let originalImage: UIImage
    let onSelection: (UIImage) -> Void
    let onCancel: () -> Void

    @State private var selectedIndex: Int?
    @State private var isProcessing = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: "square.on.square.dashed")
                        .font(.system(size: 40))
                        .foregroundStyle(.blue)

                    Text("Multiple Items Detected")
                        .font(.title2.bold())

                    Text("Tap the item you want to add to your closet")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                .padding()

                // Subject previews
                ScrollView {
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 16) {
                        ForEach(Array(previews.enumerated()), id: \.offset) { index, preview in
                            SubjectPreviewCard(
                                image: preview.image,
                                index: index + 1,
                                isSelected: selectedIndex == index
                            )
                            .onTapGesture {
                                selectedIndex = index
                            }
                        }
                    }
                    .padding()
                }

                // Actions
                VStack(spacing: 12) {
                    Button {
                        selectSubject()
                    } label: {
                        if isProcessing {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Use Selected Item")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(selectedIndex == nil || isProcessing)
                    .padding(.horizontal)

                    Button("Use All Items Together") {
                        selectAllSubjects()
                    }
                    .buttonStyle(.bordered)
                    .disabled(isProcessing)
                    .padding(.horizontal)
                }
                .padding(.bottom)
            }
            .navigationTitle("Select Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        onCancel()
                        dismiss()
                    }
                }
            }
        }
    }

    private func selectSubject() {
        guard let index = selectedIndex else { return }

        isProcessing = true

        Task {
            do {
                let preview = previews[index]
                let processed = try await ImageProcessingService.shared.processSelectedSubject(
                    instance: preview.indexSet,
                    result: result,
                    handler: handler,
                    originalImage: originalImage
                )

                await MainActor.run {
                    onSelection(processed)
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isProcessing = false
                }
            }
        }
    }

    private func selectAllSubjects() {
        isProcessing = true

        Task {
            do {
                // Combine all instances
                var allInstances = IndexSet()
                for preview in previews {
                    allInstances.insert(preview.instance)
                }

                let processed = try await ImageProcessingService.shared.processSelectedSubject(
                    instance: allInstances,
                    result: result,
                    handler: handler,
                    originalImage: originalImage
                )

                await MainActor.run {
                    onSelection(processed)
                    dismiss()
                }
            } catch {
                await MainActor.run {
                    isProcessing = false
                }
            }
        }
    }
}

// MARK: - Subject Preview Card

private struct SubjectPreviewCard: View {
    let image: UIImage
    let index: Int
    let isSelected: Bool

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(.gray.opacity(0.1))

                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .padding(8)

                // Selection indicator
                if isSelected {
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(.blue, lineWidth: 3)

                    VStack {
                        HStack {
                            Spacer()
                            Image(systemName: "checkmark.circle.fill")
                                .font(.title2)
                                .foregroundStyle(.white, .blue)
                                .padding(8)
                        }
                        Spacer()
                    }
                }
            }
            .aspectRatio(1, contentMode: .fit)

            Text("Item \(index)")
                .font(.caption)
                .foregroundStyle(isSelected ? .blue : .secondary)
        }
        .contentShape(Rectangle())
        .scaleEffect(isSelected ? 1.02 : 1.0)
        .animation(.spring(duration: 0.2), value: isSelected)
    }
}

// MARK: - Preview

// Note: Preview disabled because VNInstanceMaskObservation and VNImageRequestHandler
// have no public initializers. Test this view by running the app and uploading
// an image with multiple subjects detected.
