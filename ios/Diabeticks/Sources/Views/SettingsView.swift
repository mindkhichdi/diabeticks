import SwiftUI

struct SettingsView: View {
    @Environment(AuthStore.self) private var auth
    @State private var confirmSignOut = false
    @State private var confirmDelete = false
    @State private var deleting = false
    @State private var deleteError: String?

    var body: some View {
        List {
                Section {
                    LabeledContent("Signed in as", value: auth.displayName)
                    if let email = auth.user?.email { LabeledContent("Email", value: email) }
                }
                Section {
                    Link("Privacy policy", destination: URL(string: "https://diabeticks.lovable.app/privacy")!)
                    Link("Terms of use", destination: URL(string: "https://diabeticks.lovable.app/terms")!)
                }
                Section {
                    Button("Sign out", role: .destructive) { confirmSignOut = true }
                }
                Section {
                    Button("Delete account", role: .destructive) { confirmDelete = true }
                        .disabled(deleting)
                } footer: {
                    Text("Permanently deletes your account and all your readings, medicine, food and prescription data. This can't be undone.")
                }
            }
            .navigationTitle("Account")
            .confirmationDialog("Sign out of Diabeticks?", isPresented: $confirmSignOut, titleVisibility: .visible) {
                Button("Sign out", role: .destructive) { Task { await auth.signOut() } }
            }
            .confirmationDialog("Delete your account?", isPresented: $confirmDelete, titleVisibility: .visible) {
                Button("Delete account and all data", role: .destructive) {
                    Task {
                        deleting = true
                        defer { deleting = false }
                        do { try await auth.deleteAccount() }
                        catch { deleteError = "Couldn't delete your account. Check your connection and try again." }
                    }
                }
            } message: {
                Text("Everything you've logged will be permanently erased.")
            }
            .alert("Delete failed", isPresented: .init(
                get: { deleteError != nil }, set: { if !$0 { deleteError = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(deleteError ?? "")
            }
            .overlay { if deleting { ProgressView("Deleting…").padding().background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12)) } }
    }
}
