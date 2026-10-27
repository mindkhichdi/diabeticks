import Charts
import SwiftUI

struct GlucoseView: View {
    @Environment(DataStore.self) private var store
    @State private var logging = false

    private var recent: [(date: Date, value: Double, kind: ReadingKind)] {
        let cutoff = Calendar.current.date(byAdding: .day, value: -30, to: .now)!
        return store.readings.compactMap { r in
            guard let d = DateKey.date(r.date), d >= cutoff, let v = r.value, let k = r.kind else { return nil }
            return (d, v, k)
        }
    }

    var body: some View {
        NavigationStack {
            List {
                AIInsightsSection()

                if !recent.isEmpty {
                    Section("Last 30 days") {
                        Chart {
                            RectangleMark(
                                yStart: .value("Min", store.targets.min),
                                yEnd: .value("Max", store.targets.fastingMax)
                            )
                            .foregroundStyle(GlucoseZone.inRange.color.opacity(0.12))
                            ForEach(Array(recent.enumerated()), id: \.offset) { _, p in
                                PointMark(x: .value("Day", p.date, unit: .day), y: .value("mg/dL", p.value))
                                    .foregroundStyle(by: .value("Type", p.kind.label))
                            }
                        }
                        .chartYScale(domain: 40...300)
                        .frame(height: 200)
                        .padding(.vertical, 8)
                    }
                }

                Section("History") {
                    if store.readings.isEmpty {
                        ContentUnavailableView("No readings yet", systemImage: "drop", description: Text("Tap + to log your first one."))
                    }
                    ForEach(store.readings) { r in
                        ReadingRow(reading: r)
                    }
                    .onDelete { offsets in
                        let items = offsets.map { store.readings[$0] }
                        Task { for r in items { await store.deleteReading(r) } }
                    }
                }
            }
            .navigationTitle("Glucose")
            .refreshable { await store.load() }
            .toolbar { Button { logging = true } label: { Label("Log", systemImage: "plus") } }
            .sheet(isPresented: $logging) { LogReadingSheet() }
        }
    }
}

private struct ReadingRow: View {
    @Environment(DataStore.self) private var store
    let reading: Reading

    var body: some View {
        HStack {
            if let value = reading.value {
                if let kind = reading.kind {
                    let zone = store.targets.zone(value, kind: kind)
                    Image(systemName: zone.symbol).foregroundStyle(zone.color)
                    VStack(alignment: .leading) {
                        Text("\(Int(value)) mg/dL").font(.headline)
                        Text("\(kind.label) · \(zone.label)").font(.footnote).foregroundStyle(.secondary)
                    }
                } else {
                    Image(systemName: "chart.line.uptrend.xyaxis").foregroundStyle(.tint)
                    VStack(alignment: .leading) {
                        Text(String(format: "%.1f%%", value)).font(.headline)
                        Text("HbA1c").font(.footnote).foregroundStyle(.secondary)
                    }
                }
            }
            Spacer()
            Text(DateKey.date(reading.date)?.formatted(.dateTime.month(.abbreviated).day()) ?? reading.date)
                .font(.footnote).foregroundStyle(.secondary)
        }
    }
}
