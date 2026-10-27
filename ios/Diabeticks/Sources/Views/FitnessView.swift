import SwiftUI

struct FitnessView: View {
    @Environment(DataStore.self) private var store
    @State private var adding = false

    private var todayKey: String { DateKey.string() }
    private var today: [FitnessLog] { store.fitnessWeek.filter { $0.date == todayKey } }

    var body: some View {
        List {
            Section("Last 7 days") {
                HStack {
                    stat("\(store.fitnessWeek.reduce(0) { $0 + $1.durationMinutes })", "minutes")
                    stat("\(store.fitnessWeek.reduce(0) { $0 + $1.caloriesBurned })", "kcal burned")
                    stat("\(store.fitnessWeek.count)", "activities")
                }
            }

            Section("Today") {
                if today.isEmpty {
                    Text("No activity logged today.").foregroundStyle(.secondary)
                }
                ForEach(today) { log in
                    let activity = Activity(rawValue: log.activityType)
                    HStack(spacing: 12) {
                        Image(systemName: activity?.symbol ?? "figure.mixed.cardio")
                            .font(.title3).foregroundStyle(.tint).frame(width: 30)
                        VStack(alignment: .leading) {
                            Text(activity?.label ?? log.activityType.capitalized)
                            Text(detail(log)).font(.footnote).foregroundStyle(.secondary)
                        }
                    }
                }
                .onDelete { offsets in
                    let doomed = offsets.map { today[$0] }
                    Task { for l in doomed { await store.deleteActivity(l) } }
                }
            }
        }
        .navigationTitle("Fitness")
        .refreshable { await store.load() }
        .toolbar { Button { adding = true } label: { Label("Log activity", systemImage: "plus") } }
        .sheet(isPresented: $adding) { AddActivitySheet() }
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack {
            Text(value).font(.title2.bold().monospacedDigit())
            Text(label).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func detail(_ l: FitnessLog) -> String {
        var parts = ["\(l.durationMinutes) min", "\(l.caloriesBurned) kcal"]
        if let s = l.steps { parts.append("\(s) steps") }
        if let d = l.distanceKm { parts.append(String(format: "%.1f km", d)) }
        return parts.joined(separator: " · ")
    }
}

struct AddActivitySheet: View {
    @Environment(DataStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var activity: Activity = .walking
    @State private var minutes = ""
    @State private var steps = ""
    @State private var distance = ""

    private var minutesValue: Int? { Int(minutes).flatMap { $0 > 0 ? $0 : nil } }

    var body: some View {
        NavigationStack {
            Form {
                Picker("Activity", selection: $activity) {
                    ForEach(Activity.allCases) { Label($0.label, systemImage: $0.symbol).tag($0) }
                }
                TextField("Minutes", text: $minutes).keyboardType(.numberPad)
                TextField("Steps (optional)", text: $steps).keyboardType(.numberPad)
                TextField("Distance in km (optional)", text: $distance).keyboardType(.decimalPad)
                if let m = minutesValue {
                    Text("About \(Int((activity.caloriesPerMinute * Double(m)).rounded())) kcal burned")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Log activity")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        guard let m = minutesValue else { return }
                        Task {
                            await store.addActivity(activity, minutes: m, steps: Int(steps),
                                                    distanceKm: Double(distance))
                            dismiss()
                        }
                    }
                    .disabled(minutesValue == nil)
                }
            }
        }
        .presentationDetents([.medium, .large])
    }
}
