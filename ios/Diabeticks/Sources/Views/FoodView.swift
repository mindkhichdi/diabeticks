import PhotosUI
import SwiftUI

struct FoodView: View {
    @Environment(DataStore.self) private var store
    @State private var addingTo: MealType?

    var body: some View {
        NavigationStack {
            List {
                ForEach(MealType.allCases) { meal in
                    let items = store.foodToday.filter { $0.mealType == meal.rawValue }
                    Section {
                        ForEach(items) { item in
                            VStack(alignment: .leading) {
                                Text(item.foodItem)
                                Text(detail(item)).font(.footnote).foregroundStyle(.secondary)
                            }
                        }
                        .onDelete { offsets in
                            let doomed = offsets.map { items[$0] }
                            Task { for f in doomed { await store.deleteFood(f) } }
                        }
                        Button { addingTo = meal } label: { Label("Add food", systemImage: "plus.circle") }
                    } header: {
                        Label(meal.label, systemImage: meal.symbol)
                    }
                }
            }
            .navigationTitle("Food")
            .refreshable { await store.load() }
            .sheet(item: $addingTo) { AddFoodSheet(meal: $0) }
        }
    }

    private func detail(_ f: FoodLog) -> String {
        var parts = [f.quantity]
        if f.caloriesValue > 0 { parts.append("\(Int(f.caloriesValue)) kcal") }
        if let c = f.carbs { parts.append("\(Int(c))g carbs") }
        return parts.joined(separator: " · ")
    }
}

struct AddFoodSheet: View {
    @Environment(DataStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let meal: MealType

    @State private var name = ""
    @State private var quantity = ""
    @State private var calories = ""
    @State private var carbs = ""
    @State private var proteins = ""
    @State private var fats = ""

    @State private var photoItem: PhotosPickerItem?
    @State private var showCamera = false
    @State private var scanning = false
    @State private var scanError: String?
    @State private var scanned = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if scanning {
                        HStack { ProgressView(); Text("Reading your photo…") }
                    } else {
                        PhotosPicker(selection: $photoItem, matching: .images) {
                            Label("Scan a photo of your food", systemImage: "photo.on.rectangle")
                        }
                        if CameraPicker.isAvailable {
                            Button { showCamera = true } label: { Label("Take a photo", systemImage: "camera") }
                        }
                    }
                    if let scanError { Text(scanError).font(.callout).foregroundStyle(.red) }
                } footer: {
                    if scanned { Text("Estimated by AI from your photo. Check the numbers and adjust before saving.") }
                }

                Section {
                    TextField("Food", text: $name)
                    TextField("Quantity (e.g. 1 bowl)", text: $quantity)
                    TextField("Calories (optional)", text: $calories).keyboardType(.numberPad)
                    TextField("Carbs in grams (optional)", text: $carbs).keyboardType(.decimalPad)
                    TextField("Protein in grams (optional)", text: $proteins).keyboardType(.decimalPad)
                    TextField("Fat in grams (optional)", text: $fats).keyboardType(.decimalPad)
                }
            }
            .navigationTitle("Add to \(meal.label)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        Task {
                            await store.addFood(
                                name: name.trimmingCharacters(in: .whitespaces), meal: meal,
                                quantity: quantity.isEmpty ? "1 serving" : quantity,
                                calories: Double(calories), carbs: Double(carbs),
                                proteins: Double(proteins), fats: Double(fats)
                            )
                            dismiss()
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || scanning)
                }
            }
            .onChange(of: photoItem) { _, item in
                guard let item else { return }
                Task {
                    if let data = try? await item.loadTransferable(type: Data.self), let image = UIImage(data: data) {
                        await scan(image)
                    }
                    photoItem = nil
                }
            }
            .fullScreenCover(isPresented: $showCamera) {
                CameraPicker { image in Task { await scan(image) } }.ignoresSafeArea()
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func scan(_ image: UIImage) async {
        scanning = true; scanError = nil
        defer { scanning = false }
        do {
            let r = try await AIService.analyzeFood(image)
            name = r.foodItem; quantity = r.quantity
            calories = String(Int(r.calories)); carbs = String(Int(r.carbs))
            proteins = String(Int(r.proteins)); fats = String(Int(r.fats))
            scanned = true
        } catch {
            scanError = error.localizedDescription
        }
    }
}
