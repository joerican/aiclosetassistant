import SwiftUI
import SwiftData
import PhotosUI
import Vision

struct UploadView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    @Environment(ErrorHandler.self) private var errorHandler

    @State private var selectedPhoto: PhotosPickerItem?
    @State private var selectedImage: UIImage?
    @State private var processedImage: UIImage?  // Background-removed image
    @State private var isProcessing = false
    @State private var processingStatus = ""
    @State private var rotation = 0

    // Multi-subject selection
    @State private var showSubjectSelection = false
    @State private var subjectPreviews: [SubjectPreview] = []
    @State private var visionResult: VNInstanceMaskObservation?
    @State private var visionHandler: VNImageRequestHandler?
    @State private var originalForSubjectSelection: UIImage?

    // AI Analysis results
    @State private var analysisComplete = false

    // Metadata
    @State private var category: ClothingItem.Category = .tops
    @State private var subcategory = ""
    @State private var colors: [String] = []
    @State private var brand = ""
    @State private var size = ""
    @State private var pattern = ""
    @State private var style = ""
    @State private var formality = ""
    @State private var seasons: [String] = []
    @State private var tags: [String] = []

    // Expanded form
    @State private var showAdvancedOptions = false

    // Services
    private let imageProcessor = ImageProcessingService.shared
    private let aiAnalysis = CloudAIAnalysisService()  // Use cloud AI for better accuracy

    // Display image (prefer processed, fall back to selected)
    private var displayImage: UIImage? {
        processedImage ?? selectedImage
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Image Preview
                    ZStack {
                        // Checkerboard background to show transparency
                        if processedImage != nil {
                            CheckerboardBackground()
                                .frame(height: 300)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                        } else {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.gray.opacity(0.1))
                                .frame(height: 300)
                        }

                        if let image = displayImage {
                            Image(uiImage: image)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .rotationEffect(.degrees(Double(rotation)))
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

                        if isProcessing {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(.ultraThinMaterial)

                            VStack(spacing: 12) {
                                ProgressView()
                                    .scaleEffect(1.5)
                                Text(processingStatus)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }

                        // Badge showing background removed
                        if processedImage != nil && !isProcessing {
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

                    // Photo picker / Rotation controls
                    HStack(spacing: 16) {
                        PhotosPicker(
                            selection: $selectedPhoto,
                            matching: .images,
                            photoLibrary: .shared()
                        ) {
                            Label("Choose Photo", systemImage: "photo.on.rectangle")
                        }
                        .buttonStyle(.bordered)

                        if selectedImage != nil {
                            Button {
                                rotation = (rotation - 90 + 360) % 360
                            } label: {
                                Image(systemName: "rotate.left")
                            }
                            .buttonStyle(.bordered)

                            Button {
                                rotation = (rotation + 90) % 360
                            } label: {
                                Image(systemName: "rotate.right")
                            }
                            .buttonStyle(.bordered)
                        }
                    }

                    if selectedImage != nil {
                        Divider()

                        // Detected Colors Display
                        if !colors.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Detected Colors")
                                    .font(.headline)

                                HStack(spacing: 8) {
                                    ForEach(colors, id: \.self) { color in
                                        ColorChip(colorName: color)
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }

                        // Required fields
                        VStack(alignment: .leading, spacing: 16) {
                            Text("Category")
                                .font(.headline)

                            Picker("Category", selection: $category) {
                                ForEach(ClothingItem.Category.allCases) { cat in
                                    Label(cat.displayName, systemImage: cat.icon)
                                        .tag(cat)
                                }
                            }
                            .pickerStyle(.segmented)
                        }
                        .padding(.horizontal)

                        // Pattern & Style (if detected)
                        if !pattern.isEmpty || !style.isEmpty {
                            HStack(spacing: 16) {
                                if !pattern.isEmpty {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Pattern")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                        Text(pattern.capitalized)
                                            .font(.subheadline)
                                    }
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(.gray.opacity(0.1))
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                                }

                                if !style.isEmpty {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Style")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                        Text(style.capitalized)
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
                        DisclosureGroup("Additional Details", isExpanded: $showAdvancedOptions) {
                            VStack(spacing: 16) {
                                TextField("Subcategory (e.g., t-shirt, jeans)", text: $subcategory)
                                    .textFieldStyle(.roundedBorder)

                                TextField("Brand", text: $brand)
                                    .textFieldStyle(.roundedBorder)

                                TextField("Size", text: $size)
                                    .textFieldStyle(.roundedBorder)

                                TextField("Colors (comma separated)", text: Binding(
                                    get: { colors.joined(separator: ", ") },
                                    set: { colors = $0.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) } }
                                ))
                                .textFieldStyle(.roundedBorder)

                                if !seasons.isEmpty {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Seasons")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                        Text(seasons.joined(separator: ", ").capitalized)
                                            .font(.subheadline)
                                    }
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                }

                                if !formality.isEmpty {
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text("Formality")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                        Text(formality.capitalized)
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
                        .disabled(isProcessing || processedImage == nil)
                        .padding(.horizontal)

                        // Skip processing button (use original)
                        if processedImage == nil && !isProcessing {
                            Button {
                                // Use original without processing
                                processedImage = selectedImage
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
                        dismiss()
                    }
                }
            }
            .onChange(of: selectedPhoto) { _, newValue in
                Task {
                    await loadPhoto(from: newValue)
                }
            }
            .sheet(isPresented: $showSubjectSelection) {
                if let result = visionResult,
                   let handler = visionHandler,
                   let original = originalForSubjectSelection {
                    SubjectSelectionView(
                        previews: subjectPreviews,
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
                            processedImage = nil
                            isProcessing = false
                        }
                    )
                }
            }
        }
    }

    private func loadPhoto(from item: PhotosPickerItem?) async {
        guard let item else { return }

        // Reset state for new photo
        processedImage = nil
        analysisComplete = false
        colors = []
        pattern = ""
        style = ""
        formality = ""
        seasons = []
        tags = []

        do {
            if let data = try await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                await MainActor.run {
                    selectedImage = image
                    rotation = 0
                }

                // Start image processing pipeline
                await processImage(image)
            }
        } catch {
            errorHandler.handle(error, context: "loading photo")
        }
    }

    private func processImage(_ image: UIImage) async {
        isProcessing = true
        processingStatus = "Removing background..."

        do {
            // 1. Background removal
            let result = try await imageProcessor.removeBackground(from: image)

            switch result {
            case .single(let processed):
                // Single subject - proceed with analysis
                await MainActor.run {
                    processedImage = processed
                }
                await runAIAnalysis(on: processed)

            case .multipleSubjects(let previews, let visionRes, let handler, let original):
                // Multiple subjects - show selection UI
                await MainActor.run {
                    subjectPreviews = previews
                    visionResult = visionRes
                    visionHandler = handler
                    originalForSubjectSelection = original
                    isProcessing = false
                    showSubjectSelection = true
                }
            }

        } catch ImageProcessingError.noSubjectFound {
            // No subject found - let user proceed with original
            await MainActor.run {
                processingStatus = "No subject detected"
                isProcessing = false
            }
            errorHandler.handle(ImageProcessingError.noSubjectFound, context: "background removal")

        } catch {
            await MainActor.run {
                isProcessing = false
            }
            errorHandler.handle(error, context: "background removal")
        }
    }

    private func handleSubjectSelected(_ image: UIImage) async {
        await MainActor.run {
            processedImage = image
            showSubjectSelection = false
        }

        await runAIAnalysis(on: image)
    }

    private func runAIAnalysis(on image: UIImage) async {
        await MainActor.run {
            processingStatus = "Analyzing with AI..."
            isProcessing = true
        }

        do {
            let analysis = try await aiAnalysis.analyzeClothingItem(image: image)

            await MainActor.run {
                // Populate form with AI results
                // Set category from AI if it's valid
                if let detectedCategory = ClothingItem.Category(rawValue: analysis.category) {
                    category = detectedCategory
                }
                subcategory = analysis.subcategory ?? ""
                colors = analysis.colors
                pattern = analysis.pattern ?? ""
                style = analysis.style ?? ""
                formality = analysis.formality ?? ""
                seasons = analysis.season
                tags = analysis.tags
                brand = analysis.brand ?? ""
                analysisComplete = true
                isProcessing = false
                processingStatus = ""
            }

        } catch {
            await MainActor.run {
                isProcessing = false
                processingStatus = ""
            }
            // Show error for cloud analysis since it's expected to work
            errorHandler.handle(error, context: "AI analysis")
            print("AI analysis failed: \(error.localizedDescription)")
        }
    }

    private func addToCloset() async {
        guard let image = processedImage ?? selectedImage else { return }

        isProcessing = true
        processingStatus = "Saving to closet..."

        do {
            let itemId = UUID()
            let storage = StorageService.shared

            // Create thumbnail
            let thumbnail = image.resized(toMaxDimension: 200)

            // Save images (processed image with background removed)
            let originalPath = try storage.saveImage(selectedImage!, type: .original, itemId: itemId)
            let processedPath = try storage.saveImage(image, type: .processed, itemId: itemId)
            let thumbnailPath = try storage.saveImage(thumbnail ?? image, type: .thumbnail, itemId: itemId)

            // Compute hash for duplicate detection (use original for consistency)
            let imageHash = storage.computeImageHash(selectedImage!)

            // Create item with all metadata
            let item = ClothingItem(category: category.rawValue, originalImagePath: originalPath)
            item.processedImagePath = processedPath
            item.thumbnailPath = thumbnailPath
            item.imageHash = imageHash
            item.rotation = rotation
            item.subcategory = subcategory.isEmpty ? nil : subcategory
            item.brand = brand.isEmpty ? nil : brand
            item.size = size.isEmpty ? nil : size
            item.colors = colors
            item.pattern = pattern.isEmpty ? nil : pattern
            item.style = style.isEmpty ? nil : style
            item.formality = formality.isEmpty ? nil : formality
            item.season = seasons
            item.tags = tags

            await MainActor.run {
                modelContext.insert(item)
            }

            isProcessing = false
            dismiss()

        } catch {
            isProcessing = false
            errorHandler.handle(error, context: "saving item")
        }
    }
}

// Note: UIImage.resized(toMaxDimension:) is defined in ImageProcessingService.swift

// MARK: - Checkerboard Background (shows transparency)

private struct CheckerboardBackground: View {
    let squareSize: CGFloat = 10

    var body: some View {
        Canvas { context, size in
            let rows = Int(ceil(size.height / squareSize))
            let cols = Int(ceil(size.width / squareSize))

            for row in 0..<rows {
                for col in 0..<cols {
                    let isLight = (row + col) % 2 == 0
                    let rect = CGRect(
                        x: CGFloat(col) * squareSize,
                        y: CGFloat(row) * squareSize,
                        width: squareSize,
                        height: squareSize
                    )
                    context.fill(
                        Path(rect),
                        with: .color(isLight ? .white : Color(.systemGray5))
                    )
                }
            }
        }
    }
}

// MARK: - Color Chip

private struct ColorChip: View {
    let colorName: String

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
        Text(colorName.capitalized)
            .font(.caption)
            .fontWeight(.medium)
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

#Preview {
    UploadView()
        .environment(ErrorHandler())
        .modelContainer(for: ClothingItem.self, inMemory: true)
}
