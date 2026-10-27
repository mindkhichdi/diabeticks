import Charts
import SwiftUI

/// HbA1c tab content: latest result, trend chart against the goal, and history.
struct HbA1cSection: View {
    @Environment(DataStore.self) private var store
    @State private var showingLog = false

    var body: some View {
        let points = store.hba1cPoints

        if let latest = points.last {
            Section { summary(latest: latest, previous: points.dropLast().last) }
            if points.count >= 2 {
                Section("Trend") { chart(points) }
            }
            Section("History") {
                ForEach(store.hba1cReadings) { r in
                    HStack {
                        if let v = r.hba1c {
                            VStack(alignment: .leading) {
                                Text(HbA1c.format(v)).font(.headline)
                                Text(HbA1cBand(v).label).font(.footnote).foregroundStyle(HbA1cBand(v).color)
                            }
                        }
                        Spacer()
                        Text(DateKey.date(r.date)?.formatted(.dateTime.month(.abbreviated).day().year()) ?? r.date)
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                }
                .onDelete { offsets in
                    let items = offsets.map { store.hba1cReadings[$0] }
                    Task { for r in items { await store.deleteReading(r) } }
                }
            }
            Section {
            } footer: {
                Text("HbA1c reflects your average blood sugar over about 3 months, so testing every 3 months is typical. Your clinician may set a different goal than \(HbA1c.format(HbA1c.goal)).")
            }
        } else {
            Section {
                ContentUnavailableView {
                    Label("No HbA1c yet", systemImage: "chart.line.uptrend.xyaxis")
                } description: {
                    Text("Add your lab results to see how your 3‑month average is trending.")
                } actions: {
                    Button("Add HbA1c result") { showingLog = true }.buttonStyle(.borderedProminent)
                }
            }
            .sheet(isPresented: $showingLog) { LogHbA1cSheet() }
        }
    }

    private func summary(latest: HbA1cPoint, previous: HbA1cPoint?) -> some View {
        let band = HbA1cBand(latest.value)
        return VStack(alignment: .leading, spacing: 8) {
            Text("Latest · " + latest.date.formatted(.dateTime.month(.abbreviated).day().year()))
                .font(.footnote).foregroundStyle(.secondary)
            HStack(alignment: .firstTextBaseline) {
                Text(HbA1c.format(latest.value)).font(.system(size: 52, weight: .bold, design: .rounded))
                Spacer()
                Label(band.label, systemImage: "circle.fill").font(.subheadline.weight(.semibold))
                    .foregroundStyle(band.color)
            }
            if let previous {
                let diff = latest.value - previous.value
                let better = diff < -0.05, worse = diff > 0.05
                Label(better || worse
                      ? String(format: "%@%.1f from last result", diff > 0 ? "Up " : "Down ", abs(diff))
                      : "Steady since last result",
                      systemImage: better ? "arrow.down.right" : worse ? "arrow.up.right" : "equal")
                    .font(.callout)
                    .foregroundStyle(better ? GlucoseZone.inRange.color : worse ? GlucoseZone.high.color : .secondary)
            }
            Text("About \(HbA1c.estimatedAverage(latest.value)) mg/dL average blood sugar")
                .font(.callout).foregroundStyle(.secondary)
        }
        .padding(.vertical, 4)
    }

    private func chart(_ points: [HbA1cPoint]) -> some View {
        Chart {
            RuleMark(y: .value("Goal", HbA1c.goal))
                .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                .foregroundStyle(GlucoseZone.inRange.color)
                .annotation(position: .top, alignment: .leading) {
                    Text("Goal \(HbA1c.format(HbA1c.goal))").font(.caption2).foregroundStyle(.secondary)
                }
            ForEach(points) { p in
                LineMark(x: .value("Date", p.date), y: .value("HbA1c", p.value))
                    .interpolationMethod(.monotone).foregroundStyle(.tint)
                PointMark(x: .value("Date", p.date), y: .value("HbA1c", p.value))
                    .foregroundStyle(HbA1cBand(p.value).color)
                    .annotation(position: .top) { Text(String(format: "%.1f", p.value)).font(.caption2) }
            }
        }
        .chartYScale(domain: yDomain(points))
        .chartYAxis { AxisMarks(position: .leading) }
        .frame(height: 200)
        .padding(.vertical, 8)
    }

    private func yDomain(_ points: [HbA1cPoint]) -> ClosedRange<Double> {
        let vals = points.map(\.value) + [HbA1c.goal]
        return (floor(vals.min()! - 0.5))...(ceil(vals.max()! + 0.5))
    }
}

struct LogHbA1cSheet: View {
    @Environment(DataStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    @State private var text = ""
    @State private var date = Date.now
    @FocusState private var focused: Bool

    private var value: Double? { Double(text.replacingOccurrences(of: ",", with: ".")) }
    private var valid: Bool { value.map { HbA1c.validRange.contains($0) } ?? false }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    HStack {
                        TextField("e.g. 6.8", text: $text)
                            .keyboardType(.decimalPad)
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .focused($focused)
                        Text("%").foregroundStyle(.secondary)
                    }
                    DatePicker("Test date", selection: $date, in: ...Date.now, displayedComponents: .date)
                } footer: {
                    Text("From your lab report or clinic visit.")
                }

                if let value, valid {
                    let band = HbA1cBand(value)
                    Section {
                        Label(band.label, systemImage: "circle.fill").foregroundStyle(band.color).bold()
                        Text("About \(HbA1c.estimatedAverage(value)) mg/dL average blood sugar. " +
                             (value <= HbA1c.goal ? "That's within the common goal of \(HbA1c.format(HbA1c.goal))."
                                                  : "The common goal is under \(HbA1c.format(HbA1c.goal)). Talk with your clinician about your target."))
                            .font(.callout)
                    }
                }
            }
            .navigationTitle("Log HbA1c")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        guard let value else { return }
                        Task {
                            if await store.addReading(kind: nil, value: value, hba1c: true, date: date) { dismiss() }
                        }
                    }
                    .disabled(!valid)
                }
            }
            .onAppear { focused = true }
        }
        .presentationDetents([.medium, .large])
    }
}
