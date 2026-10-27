import SwiftUI

struct MoreView: View {
    @AppStorage("hasSeenOnboarding") private var seenOnboarding = true

    var body: some View {
        NavigationStack {
            List {
                Section {
                    NavigationLink { FitnessView() } label: { Label("Fitness", systemImage: "figure.run") }
                }
                Section {
                    NavigationLink { SettingsView() } label: { Label("Account", systemImage: "person.crop.circle") }
                    Button { seenOnboarding = false } label: { Label("Replay welcome tour", systemImage: "sparkles") }
                }
            }
            .navigationTitle("More")
        }
    }
}
