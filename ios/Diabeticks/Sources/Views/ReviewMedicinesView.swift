import SwiftUI

/// Shown after a prescription is scanned: edit what was found, then confirm to add it to My medicines.
struct ReviewMedicinesSheet: View {
    @Environment(\.dismiss) private var dismiss
    let review: ScanReview
    /// Returns true when the medicines were saved.
    let onConfirm: ([MedicineDraft]) async -> Bool

    @State private var drafts: [MedicineDraft]
    @State private var saving = false

    init(review: ScanReview, onConfirm: @escaping ([MedicineDraft]) async -> Bool) {
        self.review = review
        self.onConfirm = onConfirm
        _drafts = State(initialValue: review.drafts)
    }

    private var chosen: [MedicineDraft] {
        drafts.filter { $0.include && !$0.name.trimmingCharacters(in: .whitespaces).isEmpty && !$0.times.isEmpty }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if let note = review.note {
                        Label(note, systemImage: "exclamationmark.triangle.fill").foregroundStyle(.orange)
                    } else {
                        Label("Found \(drafts.count) medicine\(drafts.count == 1 ? "" : "s")", systemImage: "sparkles")
                            .foregroundStyle(.tint)
                    }
                    Text("Scanning can make mistakes. Check each name, dose and time against your prescription before adding.")
                        .font(.footnote).foregroundStyle(.secondary)
                }

                ForEach($drafts) { $d in
                    DraftSection(draft: $d) {
                        drafts.removeAll { $0.id == d.id }
                    }
                }

                Section {
                    Button { drafts.append(MedicineDraft()) } label: { Label("Add another medicine", systemImage: "plus.circle") }
                }
            }
            .navigationTitle("Review medicines")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Not now") { dismiss() } }
            }
            .safeAreaInset(edge: .bottom) {
                Button {
                    saving = true
                    Task {
                        let ok = await onConfirm(chosen)
                        saving = false
                        if ok { dismiss() }
                    }
                } label: {
                    Group {
                        if saving { ProgressView() }
                        else { Text(chosen.isEmpty ? "Nothing to add" : "Add \(chosen.count) medicine\(chosen.count == 1 ? "" : "s")") }
                    }
                    .font(.headline).frame(maxWidth: .infinity).padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent).controlSize(.large)
                .disabled(chosen.isEmpty || saving)
                .padding().background(.bar)
            }
        }
        .interactiveDismissDisabled(saving)
    }
}

private struct DraftSection: View {
    @Binding var draft: MedicineDraft
    let remove: () -> Void

    var body: some View {
        Section {
            Toggle("Add this medicine", isOn: $draft.include)
            if draft.include {
                TextField("Name", text: $draft.name)
                TextField("Dose, e.g. 500 mg", text: $draft.dosage)
                ForEach(draft.times.indices, id: \.self) { i in
                    DatePicker("Dose \(i + 1)", selection: $draft.times[i], displayedComponents: .hourAndMinute)
                }
                .onDelete { if draft.times.count > 1 { draft.times.remove(atOffsets: $0) } }
                Button { draft.times.append(TimeOfDay.date("20:00")) } label: { Label("Add a time", systemImage: "plus") }
                TextField("Notes", text: $draft.notes, axis: .vertical)
            }
        } header: {
            HStack {
                Text(draft.name.isEmpty ? "New medicine" : draft.name)
                Spacer()
                Button("Remove", role: .destructive, action: remove).font(.footnote).textCase(nil)
            }
        } footer: {
            if draft.include {
                if !draft.schedule.isEmpty {
                    Text("Prescription says: \(draft.schedule)")
                }
                if draft.needsTimeCheck {
                    Text("No clear time was found, so we set 8:00 AM. Please adjust it.").foregroundStyle(.orange)
                }
            }
        }
    }
}
