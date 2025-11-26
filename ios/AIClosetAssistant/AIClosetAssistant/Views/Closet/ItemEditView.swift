import SwiftUI
import SwiftData

struct ItemEditView: View {
    @Bindable var item: ClothingItem
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Category") {
                    Picker("Category", selection: $item.category) {
                        ForEach(ClothingItem.Category.allCases) { category in
                            Text(category.displayName).tag(category.rawValue)
                        }
                    }

                    TextField("Subcategory", text: Binding(
                        get: { item.subcategory ?? "" },
                        set: { item.subcategory = $0.isEmpty ? nil : $0 }
                    ))
                }

                Section("Appearance") {
                    TextField("Colors (comma separated)", text: Binding(
                        get: { item.colors.joined(separator: ", ") },
                        set: { item.colors = $0.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) } }
                    ))

                    TextField("Pattern", text: Binding(
                        get: { item.pattern ?? "" },
                        set: { item.pattern = $0.isEmpty ? nil : $0 }
                    ))

                    TextField("Material", text: Binding(
                        get: { item.material ?? "" },
                        set: { item.material = $0.isEmpty ? nil : $0 }
                    ))
                }

                Section("Details") {
                    TextField("Brand", text: Binding(
                        get: { item.brand ?? "" },
                        set: { item.brand = $0.isEmpty ? nil : $0 }
                    ))

                    TextField("Size", text: Binding(
                        get: { item.size ?? "" },
                        set: { item.size = $0.isEmpty ? nil : $0 }
                    ))

                    TextField("Fit", text: Binding(
                        get: { item.fit ?? "" },
                        set: { item.fit = $0.isEmpty ? nil : $0 }
                    ))

                    TextField("Style", text: Binding(
                        get: { item.style ?? "" },
                        set: { item.style = $0.isEmpty ? nil : $0 }
                    ))

                    TextField("Formality", text: Binding(
                        get: { item.formality ?? "" },
                        set: { item.formality = $0.isEmpty ? nil : $0 }
                    ))
                }

                Section("Season") {
                    TextField("Seasons (comma separated)", text: Binding(
                        get: { item.season.joined(separator: ", ") },
                        set: { item.season = $0.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) } }
                    ))
                }

                Section("Purchase Info") {
                    TextField("Cost", value: Binding(
                        get: { item.cost ?? 0 },
                        set: { item.cost = $0 > 0 ? $0 : nil }
                    ), format: .currency(code: "USD"))

                    DatePicker("Date Purchased",
                               selection: Binding(
                                get: { item.datePurchased ?? Date() },
                                set: { item.datePurchased = $0 }
                               ),
                               displayedComponents: .date)

                    TextField("Store", text: Binding(
                        get: { item.storePurchasedFrom ?? "" },
                        set: { item.storePurchasedFrom = $0.isEmpty ? nil : $0 }
                    ))
                }

                Section("Notes") {
                    TextField("Description", text: Binding(
                        get: { item.itemDescription ?? "" },
                        set: { item.itemDescription = $0.isEmpty ? nil : $0 }
                    ), axis: .vertical)
                    .lineLimit(3...6)

                    TextField("Notes", text: Binding(
                        get: { item.notes ?? "" },
                        set: { item.notes = $0.isEmpty ? nil : $0 }
                    ), axis: .vertical)
                    .lineLimit(3...6)
                }
            }
            .navigationTitle("Edit Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        item.updatedAt = Date()
                        dismiss()
                    }
                }
            }
        }
    }
}
