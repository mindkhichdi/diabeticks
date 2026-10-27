import SwiftUI

enum AppTab: Hashable { case today, glucose, medicine, food, more }

private struct SelectTabKey: EnvironmentKey {
    static let defaultValue: (AppTab) -> Void = { _ in }
}
extension EnvironmentValues {
    /// Lets any screen jump to another tab (e.g. a Today card opening Glucose).
    var selectTab: (AppTab) -> Void {
        get { self[SelectTabKey.self] }
        set { self[SelectTabKey.self] = newValue }
    }
}

struct RootView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(DataStore.self) private var store

    var body: some View {
        Group {
            switch auth.state {
            case .loading:
                ProgressView().controlSize(.large)
            case .signedOut:
                AuthView()
            case .signedIn:
                MainTabs()
                    .task { await store.load() }
            }
        }
        .animation(.default, value: auth.state)
        .onChange(of: auth.state) { _, new in
            if new == .signedOut { store.reset() }
        }
        .alert("Something went wrong", isPresented: .init(
            get: { store.errorMessage != nil },
            set: { if !$0 { store.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(store.errorMessage ?? "")
        }
    }
}

struct MainTabs: View {
    @AppStorage("hasSeenOnboarding") private var seenOnboarding = false
    @State private var selection: AppTab = .today

    var body: some View {
        TabView(selection: $selection) {
            TodayView().tabItem { Label("Today", systemImage: "sun.max.fill") }.tag(AppTab.today)
            GlucoseView().tabItem { Label("Glucose", systemImage: "drop.fill") }.tag(AppTab.glucose)
            MedicineView().tabItem { Label("Medicine", systemImage: "pills.fill") }.tag(AppTab.medicine)
            FoodView().tabItem { Label("Food", systemImage: "fork.knife") }.tag(AppTab.food)
            MoreView().tabItem { Label("More", systemImage: "ellipsis.circle") }.tag(AppTab.more)
        }
        .environment(\.selectTab, { selection = $0 })
        .fullScreenCover(isPresented: .init(get: { !seenOnboarding }, set: { seenOnboarding = !$0 })) {
            OnboardingView { destination in
                seenOnboarding = true
                if let destination { selection = destination }
            }
        }
    }
}
