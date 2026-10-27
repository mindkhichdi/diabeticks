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
                }
                .onDelete { offsets in
                    let doomed = offsets.map { store.prescriptions[$0] }
                    Task { for rx in doomed { await store.deletePrescription(rx) } }
                }
            } footer: {
                Text("Tap to view. Swipe to delete.")
            }
        }
        .navigationTitle("Prescriptions")
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
                    await upload(image)
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
                uploading = true
                await store.uploadPrescription(data: data, contentType: "application/pdf", fileExtension: "pdf")
                uploading = false
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraPicker { image in Task { await upload(image) } }.ignoresSafeArea()
        }
        .quickLookPreview($preview)
    }

    private func upload(_ image: UIImage) async {
        guard let data = image.downscaled(maxSide: 2400).jpegData(compressionQuality: 0.8) else { return }
        uploading = true
        await store.uploadPrescription(data: data, contentType: "image/jpeg", fileExtension: "jpg")
        uploading = false
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
