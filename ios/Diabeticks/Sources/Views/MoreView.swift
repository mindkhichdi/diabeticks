import SwiftUI

struct MoreView: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink { FitnessView() } label: { Label("Fitness", systemImage: "figure.run") }
                NavigationLink { PrescriptionsView() } label: { Label("Prescriptions", systemImage: "doc.text.fill") }
                NavigationLink { SettingsView() } label: { Label("Account", systemImage: "person.crop.circle") }
            }
            .navigationTitle("More")
        }
    }
}
