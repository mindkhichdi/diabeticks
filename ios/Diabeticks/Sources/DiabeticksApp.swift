import SwiftUI

@main
struct DiabeticksApp: App {
    @State private var auth = AuthStore()
    @State private var store = DataStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(auth)
                .environment(store)
        }
    }
}
