import PhotosUI
import QuickLook
import SwiftUI
import UniformTypeIdentifiers

struct PrescriptionsView: View {
    @Environment(DataStore.self) private var store
    @State private var photoItem: PhotosPickerItem?
    @State private var pickingFile = false
    @State private var showCamera = false
    @State private var uploading = false
    @State private var preview: URL?
    @State private var pending: PendingFile?
    @State private var editing: Prescription?

    var body: some View {
        List {
            Section {
                if store.prescriptions.isEmpty {
                    ContentUnavailableView("No prescriptions yet", systemImage: "doc.text",
                                           description: Text("Keep photos of your prescriptions in one place."))
                }
                ForEach(store.prescriptions) { rx in
                    Button {
                        Task { preview = await store.localFile(for: rx) }
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: rx.isPDF ? "doc.richtext" : "photo")
                                .font(.title2).foregroundStyle(.tint).frame(width: 32)
                            VStack(alignment: .leading) {
                                Text(rx.medicineName ?? (rx.isPDF ? "PDF prescription" : "Prescription photo"))
                                    .foregroundStyle(.primary)
                                Text(subtitle(rx)).font(.footnote).foregroundStyle(.secondary)
                            }
                        }
                    }
                    .contextMenu {
                        Button { editing = rx } label: { Label("Edit details", systemImage: "pencil") }
                    }
                    .swipeActions(edge: .leading) {
                        Button { editing = rx } label: { Label("Edit", systemImage: "pencil") }.tint(.accentColor)
                    }
                }
                .onDelete { offsets in
                    let doomed = offsets.map { store.prescriptions[$0] }
                    Task { for rx in doomed { await store.deletePrescription(rx) } }
                }
            } footer: {
                Text("Tap to view. Press and hold to add the medicine name, dose and schedule. Swipe to delete.")
            }
        }
        .refreshable { await store.load() }
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                if uploading {
                    ProgressView()
                } else {
                    Menu {
                        PhotosPicker(selection: $photoItem, matching: .images) {
                            Label("Photo library", systemImage: "photo.on.rectangle")
                        }
                        if CameraPicker.isAvailable {
                            Button { showCamera = true } label: { Label("Take photo", systemImage: "camera") }
                        }
                        Button { pickingFile = true } label: { Label("Choose PDF", systemImage: "doc") }
                    } label: {
                        Label("Upload", systemImage: "plus")
                    }
                }
            }
        }
        .onChange(of: photoItem) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self), let image = UIImage(data: data) {
                    stage(image)
                }
                photoItem = nil
            }
        }
        .fileImporter(isPresented: $pickingFile, allowedContentTypes: [.pdf]) { result in
            guard case .success(let url) = result else { return }
            Task {
                let scoped = url.startAccessingSecurityScopedResource()
                defer { if scoped { url.stopAccessingSecurityScopedResource() } }
                guard let data = try? Data(contentsOf: url) else { return }
                pending = PendingFile(data: data, contentType: "application/pdf", fileExtension: "pdf", isPDF: true)
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker { image in stage(image) }.ignoresSafeArea()
        }
        .sheet(item: $pending) { file in
            PrescriptionDetailsSheet(title: "New prescription", file: file, existing: nil) { details in
                uploading = true
                await store.uploadPrescription(data: file.data, contentType: file.contentType,
                                               fileExtension: file.fileExtension, details: details)
                uploading = false
            }
        }
        .sheet(item: $editing) { rx in
            PrescriptionDetailsSheet(title: "Prescription details", file: nil, existing: rx) { details in
                await store.updatePrescription(rx, details: details)
            }
        }
        .quickLookPreview($preview)
    }

    /// Holds the picked file while the user adds details, then uploads on save.
    private func stage(_ image: UIImage) {
        guard let data = image.downscaled(maxSide: 2400).jpegData(compressionQuality: 0.8) else { return }
        pending = PendingFile(data: data, contentType: "image/jpeg", fileExtension: "jpg", isPDF: false)
    }

    private func subtitle(_ rx: Prescription) -> String {
        var parts = [rx.dosage, rx.schedule].compactMap { $0 }
        if let d = ISO8601DateFormatter.flexible(rx.createdAt) {
            parts.append("Added " + d.formatted(.dateTime.month(.abbreviated).day().year()))
        }
        return parts.joined(separator: " · ")
    }
}

extension ISO8601DateFormatter {
    static func flexible(_ s: String) -> Date? {
        let a = ISO8601DateFormatter(); a.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = a.date(from: s) { return d }
        return ISO8601DateFormatter().date(from: s)
    }
}

struct PendingFile: Identifiable {
    let id = UUID()
    let data: Data
    let contentType: String
    let fileExtension: String
    let isPDF: Bool
}

struct PrescriptionDetailsSheet: View {
    @Environment(\.dismiss) private var dismiss
    let title: String
    let file: PendingFile?
    let existing: Prescription?
    let onSave: (PrescriptionDetails) async -> Void

    @State private var name: String
    @State private var dosage: String
    @State private var schedule: String
    @State private var saving = false

    init(title: String, file: PendingFile?, existing: Prescription?, onSave: @escaping (PrescriptionDetails) async -> Void) {
        self.title = title; self.file = file; self.existing = existing; self.onSave = onSave
        _name = State(initialValue: existing?.medicineName ?? "")
        _dosage = State(initialValue: existing?.dosage ?? "")
        _schedule = State(initialValue: existing?.schedule ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                if let file, !file.isPDF, let image = UIImage(data: file.data) {
                    Section {
                        Image(uiImage: image).resizable().scaledToFit().frame(maxHeight: 180)
                            .frame(maxWidth: .infinity).clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                } else if file?.isPDF == true {
                    Section { Label("PDF attached", systemImage: "doc.richtext") }
                }
                Section {
                    TextField("Medicine, e.g. Metformin", text: $name)
                    TextField("Dose, e.g. 500 mg", text: $dosage)
                    TextField("Schedule, e.g. twice daily with meals", text: $schedule)
                } header: { Text("Details (optional)") } footer: {
                    Text("Makes your prescriptions easy to find later.")
                }
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button(file == nil ? "Save" : "Upload") {
                        saving = true
                        func clean(_ s: String) -> String? {
                            let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
                            return t.isEmpty ? nil : t
                        }
                        let details = PrescriptionDetails(medicineName: clean(name), dosage: clean(dosage), schedule: clean(schedule))
                        Task { await onSave(details); dismiss() }
                    }
                    .disabled(saving)
                }
            }
        }
        .presentationDetents([.large])
    }
}
