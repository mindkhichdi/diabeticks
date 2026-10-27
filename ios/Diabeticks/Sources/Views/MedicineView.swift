import SwiftUI

struct MedicineView: View {
    enum Mode: String, CaseIterable, Identifiable {
        case today = "Today", medicines = "My medicines", prescriptions = "Prescriptions"
        var id: String { rawValue }
    }

    @State private var mode: Mode = .today

    var body: some View {
        NavigationStack {
            Group {
                switch mode {
                case .today: DosesList(goToMedicines: { mode = .medicines })
                case .medicines: MedicationsList()
                case .prescriptions: PrescriptionsView(onMedicinesAdded: { mode = .medicines })
                }
            }
            .safeAreaInset(edge: .top, spacing: 0) {
                Picker("Section", selection: $mode) {
                    ForEach(Mode.allCases) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal).padding(.vertical, 8)
                .background(.bar)
            }
            .navigationTitle("Medicine")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// MARK: Today's checklist

private struct DosesList: View {
    @Environment(DataStore.self) private var store
    @State private var editing: MedicineSlot?
    let goToMedicines: () -> Void

    var body: some View {
        List {
            if store.medications.isEmpty {
                Section {
                    VStack(alignment: .leading, spacing: 10) {
                        Label("Add your own medicines", systemImage: "plus.circle.fill").font(.headline)
                        Text("Right now you're seeing generic morning, afternoon and night doses. Add each medicine with its dose and times for a checklist that matches your routine.")
                            .font(.callout).foregroundStyle(.secondary)
                        Button("Add a medicine", action: goToMedicines).buttonStyle(.borderedProminent)
                    }
                    .padding(.vertical, 4)
                }
            }
            Section {
                ForEach(store.medicineSlots) { slot in
                    HStack {
                        DoseRow(slot: slot)
                        if slot.isBuiltIn {
                            Button { editing = slot } label: {
                                Image(systemName: "slider.horizontal.3").foregroundStyle(.secondary)
                            }
                            .buttonStyle(.borderless)
                            .accessibilityLabel("Edit \(slot.name)")
                        }
                    }
                }
            } header: {
                Text("\(store.medicineSlots.filter(\.taken).count) of \(store.medicineSlots.count) taken today")
            } footer: {
                Text("Tap a dose to mark it taken. Tap again to undo.")
            }
        }
        .refreshable { await store.load() }
        .sheet(item: $editing) { MedicineEditSheet(slot: $0) }
    }
}

// MARK: My medicines

private struct MedicationsList: View {
    @Environment(DataStore.self) private var store
    @State private var editing: Medication?
    @State private var adding = false
    @State private var fromPrescription: Prescription?
    @State private var editingSlot: MedicineSlot?

    /// Prescriptions that name a medicine and aren't already in the daily list.
    private var prescribed: [Prescription] {
        let known = Set(store.medications.map { $0.name.lowercased() })
        return store.prescriptions.filter {
            guard let n = $0.medicineName?.trimmingCharacters(in: .whitespaces), !n.isEmpty else { return false }
            return !known.contains(n.lowercased())
        }
    }

    /// Built-in dose slots the user renamed (the original way to add a medicine).
    private var renamedSlots: [MedicineSlot] {
        guard store.medications.isEmpty else { return [] }
        let defaults = ["Morning medicine", "Afternoon medicine", "Night medicine"]
        return store.medicineSlots.filter { $0.isBuiltIn && !defaults.contains($0.name) }
    }

    var body: some View {
        List {
            if store.medications.isEmpty && prescribed.isEmpty && renamedSlots.isEmpty {
                ContentUnavailableView {
                    Label("No medicines yet", systemImage: "pills")
                } description: {
                    Text("Add each medicine with its dose and the times you take it.")
                } actions: {
                    Button("Add a medicine") { adding = true }.buttonStyle(.borderedProminent)
                }
            }
            if !store.medications.isEmpty {
                Section("Daily medicines") { medicationRows }
            }
            if !renamedSlots.isEmpty {
                Section {
                    ForEach(renamedSlots) { slot in
                        Button { editingSlot = slot } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(slot.name).foregroundStyle(.primary)
                                Text(slot.displayTime).font(.footnote).foregroundStyle(.secondary)
                            }
                        }
                    }
                } header: { Text("Named dose slots") }
            }
            if !prescribed.isEmpty {
                Section {
                    ForEach(prescribed) { rx in
                        Button { fromPrescription = rx } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(rx.medicineName ?? "").foregroundStyle(.primary)
                                Text([rx.dosage, rx.schedule].compactMap { $0 }.joined(separator: " · "))
                                    .font(.footnote).foregroundStyle(.secondary)
                            }
                        }
                    }
                } header: { Text("From your prescriptions") } footer: {
                    Text("Tap one to add it to your daily checklist.")
                }
            }
        }
        .refreshable { await store.load() }
        .toolbar { Button { adding = true } label: { Label("Add medicine", systemImage: "plus") } }
        .sheet(isPresented: $adding) { MedicationEditSheet(medication: nil) }
        .sheet(item: $editing) { MedicationEditSheet(medication: $0) }
        .sheet(item: $fromPrescription) {
            MedicationEditSheet(medication: nil, prefillName: $0.medicineName ?? "", prefillDosage: $0.dosage ?? "")
        }
        .sheet(item: $editingSlot) { MedicineEditSheet(slot: $0) }
    }

    @ViewBuilder private var medicationRows: some View {
        ForEach(store.medications) { med in
                Button { editing = med } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(med.name).foregroundStyle(.primary)
                        Text([med.dosage, med.times.sorted().map(TimeOfDay.display).joined(separator: ", ")]
                            .compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · "))
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                }
            }
            .onDelete { offsets in
                let doomed = offsets.map { store.medications[$0] }
                Task { for m in doomed { await store.deleteMedication(m) } }
            }
    }
}

struct MedicationEditSheet: View {
    @Environment(DataStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let medication: Medication?

    @State private var name: String
    @State private var dosage: String
    @State private var notes: String
    @State private var times: [Date]
    @State private var saving = false

    init(medication: Medication?, prefillName: String = "", prefillDosage: String = "") {
        self.medication = medication
        _name = State(initialValue: medication?.name ?? prefillName)
        _dosage = State(initialValue: medication?.dosage ?? prefillDosage)
        _notes = State(initialValue: medication?.notes ?? "")
        let existing = medication?.times.sorted().map(TimeOfDay.date) ?? []
        _times = State(initialValue: existing.isEmpty ? [TimeOfDay.date("08:00")] : existing)
    }

    private var valid: Bool { !name.trimmingCharacters(in: .whitespaces).isEmpty && !times.isEmpty }

    var body: some View {
        NavigationStack {
            Form {
                Section("Medicine") {
                    TextField("Name, e.g. Metformin", text: $name)
                    TextField("Dose, e.g. 500 mg", text: $dosage)
                }
                Section {
                    Picker("How often", selection: .init(get: { times.count >= 3 ? 3 : times.count }, set: setFrequency)) {
                        Text("Once").tag(1); Text("Twice").tag(2); Text("3×").tag(3)
                    }
                    .pickerStyle(.segmented)
                    ForEach(times.indices, id: \.self) { i in
                        DatePicker("Dose \(i + 1)", selection: $times[i], displayedComponents: .hourAndMinute)
                    }
                    .onDelete { if times.count > 1 { times.remove(atOffsets: $0) } }
                    Button { times.append(TimeOfDay.date("20:00")) } label: { Label("Add another time", systemImage: "plus.circle") }
                } header: { Text("Times each day") }
                Section("Notes") {
                    TextField("e.g. take with food", text: $notes, axis: .vertical)
                }
                if let medication {
                    Section {
                        Button("Delete medicine", role: .destructive) {
                            Task { await store.deleteMedication(medication); dismiss() }
                        }
                    }
                }
            }
            .navigationTitle(medication == nil ? "Add medicine" : "Edit medicine")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        saving = true
                        Task {
                            await store.saveMedication(id: medication?.id, name: name, dosage: dosage,
                                                       times: times.map(TimeOfDay.string), notes: notes)
                            dismiss()
                        }
                    }
                    .disabled(!valid || saving)
                }
            }
        }
    }

    private func setFrequency(_ n: Int) {
        let presets = ["08:00", "14:00", "20:00"]
        let defaults: [String] = n == 1 ? ["08:00"] : n == 2 ? ["08:00", "20:00"] : presets
        times = defaults.map(TimeOfDay.date)
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
