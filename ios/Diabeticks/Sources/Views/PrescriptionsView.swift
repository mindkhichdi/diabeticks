import PhotosUI
import QuickLook
import SwiftUI
import UniformTypeIdentifiers

struct ScanReview: Identifiable {
    let id = UUID()
    let prescriptionId: String?
    var drafts: [MedicineDraft]
    let note: String?
}

struct PrescriptionsView: View {
    /// Called after scanned medicines are confirmed, so the parent can show them.
    var onMedicinesAdded: () -> Void = {}

    @Environment(DataStore.self) private var store
    @State private var photoItem: PhotosPickerItem?
    @State private var pickingFile = false
    @State private var showCamera = false
    @State private var uploading = false
    @State private var preview: URL?
    @State private var scanning = false
    @State private var review: ScanReview?
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
                        Button { Task { await scanExisting(rx) } } label: { Label("Find medicines", systemImage: "text.viewfinder") }
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
                Text("Uploads are scanned for medicines you can review and add. Tap to view, press and hold to edit or rescan, swipe to delete.")
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
                await process(PendingFile(data: data, contentType: "application/pdf", fileExtension: "pdf", isPDF: true))
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker { image in stage(image) }.ignoresSafeArea()
        }
        .overlay {
            if scanning {
                VStack(spacing: 12) {
                    ProgressView().controlSize(.large)
                    Text("Reading your prescription…").font(.subheadline.weight(.medium))
                    Text("Finding medicines, doses and times").font(.footnote).foregroundStyle(.secondary)
                }
                .padding(24)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
            }
        }
        .sheet(item: $review) { r in
            ReviewMedicinesSheet(review: r) { drafts in
                guard await store.addMedications(drafts) else { return false }
                if let id = r.prescriptionId, let rx = store.prescriptions.first(where: { $0.id == id }) {
                    let first = drafts.count == 1 ? drafts.first : nil
                    await store.updatePrescription(rx, details: PrescriptionDetails(
                        medicineName: drafts.map(\.name).joined(separator: ", "),
                        dosage: first.flatMap { $0.dosage.isEmpty ? nil : $0.dosage },
                        schedule: first.flatMap { $0.schedule.isEmpty ? nil : $0.schedule }))
                }
                onMedicinesAdded()
                return true
            }
        }
        .sheet(item: $editing) { rx in
            PrescriptionDetailsSheet(title: "Prescription details", file: nil, existing: rx) { details in
                await store.updatePrescription(rx, details: details)
            }
        }
        .quickLookPreview($preview)
    }

    private func stage(_ image: UIImage) {
        guard let data = image.downscaled(maxSide: 2400).jpegData(compressionQuality: 0.8) else { return }
        Task { await process(PendingFile(data: data, contentType: "image/jpeg", fileExtension: "jpg", isPDF: false)) }
    }

    /// Saves the file first (so it's kept even if reading fails), then scans it for medicines.
    private func process(_ file: PendingFile) async {
        uploading = true
        let id = await store.uploadPrescription(data: file.data, contentType: file.contentType, fileExtension: file.fileExtension)
        uploading = false
        guard let id else { return }
        await scan(file, prescriptionId: id)
    }

    private func scanExisting(_ rx: Prescription) async {
        guard let url = await store.localFile(for: rx), let data = try? Data(contentsOf: url) else { return }
        await scan(PendingFile(data: data, contentType: rx.fileType, fileExtension: "", isPDF: rx.isPDF), prescriptionId: rx.id)
    }

    private func scan(_ file: PendingFile, prescriptionId: String) async {
        scanning = true
        defer { scanning = false }
        let images = file.isPDF ? UIImage.pages(ofPDF: file.data) : [UIImage(data: file.data)].compactMap { $0 }
        var drafts: [MedicineDraft] = []
        var note: String?
        do {
            drafts = try await AIService.scanPrescription(images).map(MedicineDraft.init)
            if drafts.isEmpty { note = "We couldn't find any medicines on that prescription. You can add them yourself below." }
        } catch {
            note = error.localizedDescription + " You can add the medicines yourself below."
        }
        if drafts.isEmpty { drafts = [MedicineDraft()] }
        review = ScanReview(prescriptionId: prescriptionId, drafts: drafts, note: note)
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
