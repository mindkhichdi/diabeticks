import SwiftUI

struct MedicineView: View {
    @Environment(DataStore.self) private var store
    @State private var editing: MedicineSlot?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    ForEach(store.medicineSlots) { slot in
                        HStack {
                            DoseRow(slot: slot)
                            Button { editing = slot } label: {
                                Image(systemName: "slider.horizontal.3").foregroundStyle(.secondary)
                            }
                            .buttonStyle(.borderless)
                            .accessibilityLabel("Edit \(slot.name)")
                        }
                    }
                } footer: {
                    Text("Tap a dose to mark it taken. Tap again to undo. Use the sliders to rename a dose or change its time.")
                }
            }
            .navigationTitle("Medicine")
            .refreshable { await store.load() }
            .sheet(item: $editing) { MedicineEditSheet(slot: $0) }
        }
    }
}

struct MedicineEditSheet: View {
    @Environment(DataStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let slot: MedicineSlot

    @State private var name: String
    @State private var time: Date

    init(slot: MedicineSlot) {
        self.slot = slot
        let defaults = ["morning": "Morning medicine", "afternoon": "Afternoon medicine", "night": "Night medicine"]
        _name = State(initialValue: slot.name == defaults[slot.id] ? "" : slot.name)
        let parts = slot.time.split(separator: ":").compactMap { Int($0) }
        _time = State(initialValue: Calendar.current.date(
            from: DateComponents(hour: parts.first ?? 8, minute: parts.count > 1 ? parts[1] : 0)) ?? .now)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("Name") {
                    TextField("e.g. Metformin 500 mg", text: $name)
                }
                Section("Time") {
                    DatePicker("Reminder time", selection: $time, displayedComponents: .hourAndMinute)
                }
            }
            .navigationTitle("Customize dose")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let c = Calendar.current.dateComponents([.hour, .minute], from: time)
                        let hhmm = String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0)
                        Task {
                            await store.savePreference(slotId: slot.id, name: name, time: hhmm)
                            dismiss()
                        }
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}
