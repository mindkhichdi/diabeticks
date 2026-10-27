import SwiftUI

struct LogReadingSheet: View {
    @Environment(DataStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var kind: ReadingKind = .fasting
    @State private var text = ""
    @FocusState private var focused: Bool

    private var value: Double? { Double(text) }
    private var valid: Bool { (value ?? 0) >= 20 && (value ?? 0) <= 600 }

    var body: some View {
        NavigationStack {
            Form {
                Picker("When", selection: $kind) {
                    ForEach(ReadingKind.allCases) { Text($0.label).tag($0) }
                }
                .pickerStyle(.segmented)

                Section {
                    HStack {
                        TextField("e.g. 112", text: $text)
                            .keyboardType(.numberPad)
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .focused($focused)
                        Text("mg/dL").foregroundStyle(.secondary)
                    }
                }

                if let value, valid {
                    let zone = store.targets.zone(value, kind: kind)
                    Section {
                        Label(zone.label, systemImage: zone.symbol).foregroundStyle(zone.color).bold()
                        Text(zone.advice).font(.callout)
                    }
                }
            }
            .navigationTitle("Log blood sugar")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        guard let value else { return }
                        Task { await store.addReading(kind: kind, value: value); dismiss() }
                    }
                    .disabled(!valid)
                }
            }
            .onAppear { focused = true }
        }
        .presentationDetents([.medium, .large])
    }
}
