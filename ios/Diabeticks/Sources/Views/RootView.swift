import SwiftUI

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
    var body: some View {
        TabView {
            TodayView().tabItem { Label("Today", systemImage: "sun.max.fill") }
            GlucoseView().tabItem { Label("Glucose", systemImage: "drop.fill") }
            MedicineView().tabItem { Label("Medicine", systemImage: "pills.fill") }
            FoodView().tabItem { Label("Food", systemImage: "fork.knife") }
            MoreView().tabItem { Label("More", systemImage: "ellipsis.circle") }
        }
    }
}
