import SwiftUI
import SwiftData
import PhotosUI
import Vision

// MARK: - UploadViewModel (persists across rotation)

@Observable
final class UploadViewModel {
    var selectedPhoto: PhotosPickerItem?
    var selectedImage: UIImage?
    var showCamera = false
    var processedImage: UIImage?  // Background-removed image
    var isProcessing = false
    var processingStatus = ""
    var rotation = 0

    // Multi-subject selection
    var showSubjectSelection = false
    var subjectPreviews: [SubjectPreview] = []
    var visionResult: VNInstanceMaskObservation?
    var visionHandler: VNImageRequestHandler?
    var originalForSubjectSelection: UIImage?

    // AI Analysis results
    var analysisComplete = false

    // Metadata
    var category: ClothingItem.Category = .tops
    var subcategory = ""
    var colors: [String] = []
    var brand = ""
    var size = ""
    var pattern = ""
    var style = ""
    var formality = ""
    var seasons: [String] = []
    var tags: [String] = []

    // Expanded form
    var showAdvancedOptions = false
    var showSaveSuccess = false

    // Display image (prefer processed, fall back to selected)
    var displayImage: UIImage? {
        processedImage ?? selectedImage
    }

    func reset() {
        selectedPhoto = nil
        selectedImage = nil
        processedImage = nil
        isProcessing = false
        processingStatus = ""
        rotation = 0
        showSubjectSelection = false
        subjectPreviews = []
        visionResult = nil
        visionHandler = nil
        originalForSubjectSelection = nil
        analysisComplete = false
        category = .tops
        subcategory = ""
        colors = []
        brand = ""
        size = ""
        pattern = ""
        style = ""
        formality = ""
        seasons = []
        tags = []
        showAdvancedOptions = false
        showSaveSuccess = false
    }
}

struct UploadView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Environment(ErrorHandler.self) private var errorHandler

    // Use @State with ViewModel to persist across rotations
    @State private var viewModel = UploadViewModel()

    // Services
    private let imageProcessor = ImageProcessingService.shared
    private let aiAnalysis = CloudAIAnalysisService()  // Use cloud AI for better accuracy

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Image Preview
                    ZStack {
                        // White background for processed images
                        RoundedRectangle(cornerRadius: 16)
                            .fill(viewModel.processedImage != nil ? Color.white : Color.gray.opacity(0.1))
                            .frame(height: 300)

                        if let image = viewModel.displayImage {
                            Image(uiImage: image)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .rotationEffect(.degrees(Double(viewModel.rotation)))
                                .frame(maxHeight: 280)
                        } else {
                            VStack(spacing: 16) {
                                Image(systemName: "camera.fill")
                                    .font(.system(size: 48))
                                    .foregroundStyle(.secondary)
                                Text("Select a photo")
                                    .foregroundStyle(.secondary)
                            }
                        }

                        if viewModel.isProcessing {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.ultraThinMaterial)

                            VStack(spacing: 12) {
                                ProgressView()
                                    .scaleEffect(1.5)
                                Text(viewModel.processingStatus)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        // Badge showing background removed
                        if viewModel.processedImage != nil && !viewModel.isProcessing {
                            VStack {
                                HStack {
                                    Spacer()
                                    Label("Background Removed", systemImage: "checkmark.circle.fill")
                                        .font(.caption2)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 4)
                                        .background(.green.opacity(0.9))
                                        .foregroundStyle(.white)
                                        .clipShape(Capsule())
                                        .padding(8)
                                }
                                Spacer()
                            }
                        }
                    }
                    .padding(.horizontal)

                    // Photo picker / Camera / Rotation controls
                    HStack(spacing: 12) {
                        PhotosPicker(
                            selection: $viewModel.selectedPhoto,
                            matching: .images,
                            photoLibrary: .shared()
                        ) {
                            Label("Library", systemImage: "photo.on.rectangle")
                        }
                        .buttonStyle(.bordered)

                        Button {
                            viewModel.showCamera = true
                        } label: {
                            Label("Camera", systemImage: "camera")
                        }
                        .buttonStyle(.bordered)

                        if viewModel.selectedImage != nil {
                            Button {
                                viewModel.rotation = (viewModel.rotation - 90 + 360) % 360
                            } label: {
                                Image(systemName: "rotate.left")
                            }
                            .buttonStyle(.bordered)

                            Button {
                                viewModel.rotation = (viewModel.rotation + 90) % 360
                            } label: {
                                Image(systemName: "rotate.right")
                            }
                            .buttonStyle(.bordered)
                        }
                    }

                    if viewModel.selectedImage != nil {
                        Divider()

                        // Detected Colors Display
                        if !viewModel.colors.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Detected Colors")
                                    .font(.headline)

                                FlowLayout(spacing: 8) {
                                    ForEach(viewModel.colors, id: \.self) { color in
                                        ColorChip(colorName: color, onRemove: {
                                            viewModel.colors.removeAll { $0 == color }
                                        })
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }

                        // Required fields
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Category")
                                .font(.headline)

                            Picker("Category", selection: $viewModel.category) {
                                ForEach(ClothingItem.Category.allCases) { cat in
                                    Label(cat.displayName, systemImage: cat.icon)
                                        .tag(cat)
                                }
                            }
                            .pickerStyle(.segmented)
                        }
                        .padding(.horizontal)

                        // Pattern & Style (if detected)
                        if !viewModel.pattern.isEmpty || !viewModel.style.isEmpty {
                            HStack(spacing: 16) {
                                if !viewModel.pattern.isEmpty {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Pattern")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                        Text(viewModel.pattern.capitalized)
                                            .font(.subheadline)
                                    }
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(.gray.opacity(0.1))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                }

                                if !viewModel.style.isEmpty {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Style")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                        Text(viewModel.style.capitalized)
                                            .font(.subheadline)
                                    }
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(.gray.opacity(0.1))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                }

                                Spacer()
                            }
                            .padding(.horizontal)
                        }

                        // Optional fields (expandable)
                        DisclosureGroup("Additional Details", isExpanded: $viewModel.showAdvancedOptions) {
                            VStack(spacing: 16) {
                                TextField("Subcategory (e.g., T-Shirt, Jeans)", text: $viewModel.subcategory)
                                    .textFieldStyle(.roundedBorder)
                                    .textInputAutocapitalization(.words)

                                TextField("Brand", text: $viewModel.brand)
                                    .textFieldStyle(.roundedBorder)

                                TextField("Size", text: $viewModel.size)
                                    .textFieldStyle(.roundedBorder)

                                TextField("Colors (comma separated)", text: Binding(
                                    get: { viewModel.colors.joined(separator: ", ") },
                                    set: { viewModel.colors = $0.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) } }
                                ))
                                .textFieldStyle(.roundedBorder)

                                // Seasons toggle grid
                                VStack(alignment: .leading, spacing: 8) {
                                    Text("Seasons")
                                        .font(.caption)
                                        .foregroundStyle(.secondary)

                                    LazyVGrid(columns: [
                                        GridItem(.flexible()),
                                        GridItem(.flexible()),
                                        GridItem(.flexible()),
                                        GridItem(.flexible())
                                    ], spacing: 8) {
                                        ForEach(["Spring", "Summer", "Fall", "Winter"], id: \.self) { season in
                                            SeasonToggle(
                                                season: season,
                                                isSelected: viewModel.seasons.contains(season.lowercased()),
                                                onToggle: {
                                                    if viewModel.seasons.contains(season.lowercased()) {
                                                        viewModel.seasons.removeAll { $0 == season.lowercased() }
                                                    } else {
                                                        viewModel.seasons.append(season.lowercased())
                                                    }
                                                }
                                            )
                                        }
                                    }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)

                                if !viewModel.formality.isEmpty {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Formality")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                        Text(viewModel.formality.capitalized)
                                            .font(.subheadline)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }
                            .padding(.top, 8)
                        }
                        .padding(.horizontal)

                        // Add button
                        Button {
                            Task {
                                await addToCloset()
                            }
                        } label: {
                            Label("Add to Closet", systemImage: "plus.circle.fill")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(viewModel.isProcessing || viewModel.processedImage == nil)
                        .padding(.horizontal)

                        // Skip processing button (use original)
                        if viewModel.processedImage == nil && !viewModel.isProcessing {
                            Button {
                                // Use original without processing
                                viewModel.processedImage = viewModel.selectedImage
                            } label: {
                                Text("Skip Background Removal")
                                    .font(.subheadline)
                            }
                            .buttonStyle(.borderless)
                            .foregroundStyle(.secondary)
                        }
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Add Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        viewModel.reset()
                        dismiss()
                    }
                }
            }
            .onChange(of: viewModel.selectedPhoto) { _, newValue in
                Task {
                    await loadPhoto(from: newValue)
                }
            }
            .overlay {
                if viewModel.showSaveSuccess {
                    ZStack {
                        Color.black.opacity(0.3)
                            .ignoresSafeArea()

                        VStack(spacing: 16) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 60))
                                .foregroundStyle(.green)

                            Text("Added to Closet!")
                                .font(.headline)
                                .foregroundStyle(.white)
                        }
                        .padding(32)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                    }
                    .transition(.opacity)
                }
            }
            .animation(.easeInOut(duration: 0.3), value: viewModel.showSaveSuccess)
            .sheet(isPresented: $viewModel.showCamera) {
                CameraPicker { image in
                    viewModel.selectedImage = image
                    viewModel.rotation = 0
                    Task {
                        await processImage(image)
                    }
                }
            }
            .sheet(isPresented: $viewModel.showSubjectSelection) {
                if let result = viewModel.visionResult,
                   let handler = viewModel.visionHandler,
                   let original = viewModel.originalForSubjectSelection {
                    SubjectSelectionView(
                        previews: viewModel.subjectPreviews,
                        result: result,
                        handler: handler,
                        originalImage: original,
                        onSelection: { selectedImage in
                            Task {
                                await handleSubjectSelected(selectedImage)
                            }
                        },
                        onCancel: {
                            // Reset processing state
                            viewModel.processedImage = nil
                            viewModel.isProcessing = false
                        }
                    )
                }
            }
        }
    }

    private func loadPhoto(from item: PhotosPickerItem?) async {
        guard let item else { return }

        // Reset state for new photo
        viewModel.processedImage = nil
        viewModel.analysisComplete = false
        viewModel.colors = []
        viewModel.pattern = ""
        viewModel.style = ""
        viewModel.formality = ""
        viewModel.seasons = []
        viewModel.tags = []

        do {
            if let data = try await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                await MainActor.run {
                    viewModel.selectedImage = image
                    viewModel.rotation = 0
                }

                // Start image processing pipeline
                await processImage(image)
            }
        } catch {
            errorHandler.handle(error, context: "loading photo")
        }
    }

    private func processImage(_ image: UIImage) async {
        viewModel.isProcessing = true
        viewModel.processingStatus = "Removing background..."

        do {
            // 1. Background removal
            let result = try await imageProcessor.removeBackground(from: image)

            switch result {
            case .single(let processed):
                // Single subject - proceed with analysis
                await MainActor.run {
                    viewModel.processedImage = processed
                }
                await runAIAnalysis(on: processed)

            case .multipleSubjects(let previews, let visionRes, let handler, let original):
                // Multiple subjects - show selection UI
                await MainActor.run {
                    viewModel.subjectPreviews = previews
                    viewModel.visionResult = visionRes
                    viewModel.visionHandler = handler
                    viewModel.originalForSubjectSelection = original
                    viewModel.isProcessing = false
                    viewModel.showSubjectSelection = true
                }
            }

        } catch ImageProcessingError.noSubjectFound {
            // No subject found - let user proceed with original
            await MainActor.run {
                viewModel.processingStatus = "No subject detected"
                viewModel.isProcessing = false
            }
            errorHandler.handle(ImageProcessingError.noSubjectFound, context: "background removal")

        } catch {
            await MainActor.run {
                viewModel.isProcessing = false
            }
            errorHandler.handle(error, context: "background removal")
        }
    }

    private func handleSubjectSelected(_ image: UIImage) async {
        await MainActor.run {
            viewModel.processedImage = image
            viewModel.showSubjectSelection = false
        }

        await runAIAnalysis(on: image)
    }

    private func runAIAnalysis(on image: UIImage) async {
        await MainActor.run {
            viewModel.processingStatus = "Analyzing with AI..."
            viewModel.isProcessing = true
        }

        do {
            let analysis = try await aiAnalysis.analyzeClothingItem(image: image)

            await MainActor.run {
                // Populate form with AI results
                // Set category from AI if it's valid
                if let detectedCategory = ClothingItem.Category(rawValue: analysis.category) {
                    viewModel.category = detectedCategory
                }
                // Capitalize subcategory and colors
                viewModel.subcategory = (analysis.subcategory ?? "").capitalized
                viewModel.colors = analysis.colors.map { $0.capitalized }
                viewModel.pattern = analysis.pattern ?? ""
                viewModel.style = analysis.style ?? ""
                viewModel.formality = analysis.formality ?? ""
                viewModel.seasons = analysis.season
                viewModel.tags = analysis.tags
                viewModel.brand = analysis.brand ?? ""
                viewModel.analysisComplete = true
                viewModel.isProcessing = false
                viewModel.processingStatus = ""
            }

        } catch {
            await MainActor.run {
                viewModel.isProcessing = false
                viewModel.processingStatus = ""
            }
            // Show error for cloud analysis since it's expected to work
            errorHandler.handle(error, context: "AI analysis")
            print("AI analysis failed: \(error.localizedDescription)")
        }
    }

    private func addToCloset() async {
        guard let image = viewModel.processedImage ?? viewModel.selectedImage else { return }

        viewModel.isProcessing = true
        viewModel.processingStatus = "Saving to closet..."

        do {
            let itemId = UUID()
            let storage = StorageService.shared

            // Create thumbnail
            let thumbnail = image.resized(toMaxDimension: 200)

            // Save images (processed image with background removed)
            let originalPath = try storage.saveImage(viewModel.selectedImage!, type: .original, itemId: itemId)
            let processedPath = try storage.saveImage(image, type: .processed, itemId: itemId)
            let thumbnailPath = try storage.saveImage(thumbnail ?? image, type: .thumbnail, itemId: itemId)

            // Compute hash for duplicate detection (use original for consistency)
            let imageHash = storage.computeImageHash(viewModel.selectedImage!)

            // Create item with all metadata
            let item = ClothingItem(category: viewModel.category.rawValue, originalImagePath: originalPath)
            item.processedImagePath = processedPath
            item.thumbnailPath = thumbnailPath
            item.imageHash = imageHash
            item.rotation = viewModel.rotation
            item.subcategory = viewModel.subcategory.isEmpty ? nil : viewModel.subcategory
            item.brand = viewModel.brand.isEmpty ? nil : viewModel.brand
            item.size = viewModel.size.isEmpty ? nil : viewModel.size
            item.colors = viewModel.colors
            item.pattern = viewModel.pattern.isEmpty ? nil : viewModel.pattern
            item.style = viewModel.style.isEmpty ? nil : viewModel.style
            item.formality = viewModel.formality.isEmpty ? nil : viewModel.formality
            item.season = viewModel.seasons
            item.tags = viewModel.tags

            await MainActor.run {
                modelContext.insert(item)
                try? modelContext.save()
            }

            viewModel.isProcessing = false

            // Show success feedback then dismiss
            await MainActor.run {
                viewModel.showSaveSuccess = true
            }
            try? await Task.sleep(nanoseconds: 800_000_000) // 0.8 seconds
            await MainActor.run {
                viewModel.reset()
                dismiss()
            }

        } catch {
            viewModel.isProcessing = false
            errorHandler.handle(error, context: "saving item")
        }
    }
}

// Note: UIImage.resized(toMaxDimension:) is defined in ImageProcessingService.swift

// MARK: - Flow Layout (wrapping horizontal layout)

private struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrange(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (index, frame) in result.frames.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY), proposal: ProposedViewSize(frame.size))
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, frames: [CGRect]) {
        let maxWidth = proposal.width ?? .infinity
        var frames: [CGRect] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            frames.append(CGRect(x: x, y: y, width: size.width, height: size.height))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), frames)
    }
}

// MARK: - Season Toggle

private struct SeasonToggle: View {
    let season: String
    let isSelected: Bool
    let onToggle: () -> Void

    var body: some View {
        Button(action: onToggle) {
            Text(season)
                .font(.caption)
                .fontWeight(.medium)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(isSelected ? Color.accentColor : Color.gray.opacity(0.2))
                .foregroundStyle(isSelected ? .white : .primary)
                .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Color Chip

private struct ColorChip: View {
    let colorName: String
    var onRemove: (() -> Void)? = nil

    private var chipColor: Color {
        switch colorName.lowercased() {
        case "black": return .black
        case "white": return .white
        case "gray", "grey": return .gray
        case "red": return .red
        case "orange": return .orange
        case "yellow": return .yellow
        case "green": return .green
        case "blue": return .blue
        case "purple": return .purple
        case "pink": return .pink
        case "brown": return .brown
        case "beige", "cream": return Color(red: 0.96, green: 0.91, blue: 0.78)
        case "navy": return Color(red: 0, green: 0, blue: 0.5)
        case "teal": return .teal
        case "olive": return Color(red: 0.5, green: 0.5, blue: 0)
        case "maroon", "burgundy": return Color(red: 0.5, green: 0, blue: 0.13)
        case "coral": return Color(red: 1, green: 0.5, blue: 0.31)
        case "gold": return Color(red: 1, green: 0.84, blue: 0)
        case "silver": return Color(red: 0.75, green: 0.75, blue: 0.75)
        case "lavender": return Color(red: 0.9, green: 0.9, blue: 0.98)
        case "mint": return .mint
        case "charcoal": return Color(red: 0.21, green: 0.27, blue: 0.31)
        case "khaki": return Color(red: 0.76, green: 0.69, blue: 0.57)
        default: return .gray
        }
    }

    private var textColor: Color {
        let lightColors = ["white", "beige", "cream", "yellow", "lavender", "mint", "silver", "gold", "khaki", "coral"]
        return lightColors.contains(colorName.lowercased()) ? .black : .white
    }

    var body: some View {
        HStack(spacing: 4) {
            Text(colorName.capitalized)
                .font(.caption)
                .fontWeight(.medium)

            if onRemove != nil {
                Button(action: { onRemove?() }) {
                    Image(systemName: "xmark.circle.fill")
                        .font(.caption)
                        .foregroundStyle(textColor.opacity(0.7))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(chipColor)
        .foregroundStyle(textColor)
        .clipShape(Capsule())
        .overlay(
            Capsule()
                .stroke(Color.gray.opacity(0.3), lineWidth: colorName.lowercased() == "white" ? 1 : 0)
        )
    }
}

// MARK: - Camera Picker

struct CameraPicker: UIViewControllerRepresentable {
    let onImagePicked: (UIImage) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraPicker

        init(_ parent: CameraPicker) {
            self.parent = parent
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.onImagePicked(image)
            }
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
        }
    }
}

#Preview {
    UploadView()
        .environment(ErrorHandler())
        .modelContainer(for: ClothingItem.self, inMemory: true)
}
