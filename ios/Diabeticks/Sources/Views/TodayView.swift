import SwiftUI

struct TodayView: View {
    @Environment(DataStore.self) private var store
    @Environment(AuthStore.self) private var auth
    @Environment(\.selectTab) private var selectTab
    @State private var logging = false

    private var todayKey: String { DateKey.string() }
    private var todays: [Reading] { store.glucoseReadings.filter { $0.date == todayKey } }

    private var greeting: String {
        let h = Calendar.current.component(.hour, from: .now)
        let part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
        let first = auth.displayName.split(separator: " ").first.map(String.init) ?? ""
        return first.isEmpty || first.contains("@") ? part : "\(part), \(first)"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    quickActions
                    glucoseCard
                    medicineCard
                    HStack(alignment: .top, spacing: 16) {
                        hba1cCard
                        foodCard
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(greeting)
            .refreshable { await store.load() }
            .sheet(isPresented: $logging) { LogReadingSheet() }
        }
    }

    private var quickActions: some View {
        HStack(spacing: 10) {
            QuickAction(title: "Log sugar", symbol: "drop.fill") { logging = true }
            QuickAction(title: "Add food", symbol: "fork.knife") { selectTab(.food) }
            QuickAction(title: "Medicine", symbol: "pills.fill") { selectTab(.medicine) }
        }
    }

    private var glucoseCard: some View {
        Card(title: "Blood sugar today", symbol: "drop.fill", onTap: { selectTab(.glucose) }) {
            if let latest = todays.first, let value = latest.value, let kind = latest.kind {
                let zone = store.targets.zone(value, kind: kind)
                HStack(alignment: .firstTextBaseline) {
                    Text("\(Int(value))").font(.system(size: 52, weight: .bold, design: .rounded))
                    Text("mg/dL").foregroundStyle(.secondary)
                    Spacer()
                    Label(zone.label, systemImage: zone.symbol)
                        .font(.subheadline.weight(.semibold)).foregroundStyle(zone.color)
                }
                Text(zone.advice).font(.callout).foregroundStyle(.secondary)
            } else {
                Text("No reading yet today. A quick check helps you spot patterns early.")
                    .foregroundStyle(.secondary)
                Button("Log a reading") { logging = true }.buttonStyle(.borderedProminent)
            }
        }
    }

    private var medicineCard: some View {
        let slots = store.medicineSlots
        let taken = slots.filter(\.taken).count
        let next = slots.first { !$0.taken }
        return Card(title: "Medicine · \(taken) of \(slots.count) taken", symbol: "pills.fill",
                    onTap: { selectTab(.medicine) }) {
            if slots.isEmpty {
                Text("Add your medicines to get a daily checklist.").foregroundStyle(.secondary)
            } else if next == nil {
                Label("All done for today", systemImage: "checkmark.seal.fill")
                    .foregroundStyle(GlucoseZone.inRange.color)
            } else {
                ProgressView(value: Double(taken), total: Double(max(slots.count, 1))).tint(GlucoseZone.inRange.color)
                // Only the next few, so the card stays glanceable.
                ForEach(slots.filter { !$0.taken }.prefix(3)) { DoseRow(slot: $0) }
            }
        }
    }

    private var hba1cCard: some View {
        let latest = store.hba1cPoints.last
        return Card(title: "HbA1c", symbol: "chart.line.uptrend.xyaxis", onTap: { selectTab(.glucose) }) {
            if let latest {
                Text(HbA1c.format(latest.value)).font(.system(.title, design: .rounded, weight: .bold))
                Text(latest.date.formatted(.dateTime.month(.abbreviated).day().year()))
                    .font(.footnote).foregroundStyle(.secondary)
            } else {
                Text("Track your 3‑month average.").font(.footnote).foregroundStyle(.secondary)
            }
        }
    }

    private var foodCard: some View {
        let kcal = store.foodToday.reduce(0) { $0 + $1.caloriesValue }
        return Card(title: "Food", symbol: "fork.knife", onTap: { selectTab(.food) }) {
            Text("\(Int(kcal))").font(.system(.title, design: .rounded, weight: .bold))
            Text("kcal · \(store.foodToday.count) item\(store.foodToday.count == 1 ? "" : "s")")
                .font(.footnote).foregroundStyle(.secondary)
        }
    }
}

private struct QuickAction: View {
    let title: String
    let symbol: String
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: symbol).font(.title3)
                Text(title).font(.footnote.weight(.semibold))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
    }
}

struct Card<Content: View>: View {
    let title: String
    let symbol: String
    var onTap: (() -> Void)? = nil
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label(title, systemImage: symbol).font(.headline).foregroundStyle(.tint)
                if onTap != nil {
                    Spacer()
                    Image(systemName: "chevron.right").font(.caption.weight(.semibold)).foregroundStyle(.tertiary)
                }
            }
            .contentShape(Rectangle())
            .onTapGesture { onTap?() }
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 16))
    }
}

struct DoseRow: View {
    @Environment(DataStore.self) private var store
    let slot: MedicineSlot

    var body: some View {
        Button {
            Task { await store.toggleDose(slot) }
        } label: {
            HStack(spacing: 12) {
                Image(systemName: slot.taken ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundStyle(slot.taken ? AnyShapeStyle(GlucoseZone.inRange.color) : AnyShapeStyle(.secondary))
                VStack(alignment: .leading) {
                    Text(slot.name).foregroundStyle(.primary)
                    Text(slot.taken ? "Taken" : [slot.dosage, slot.displayTime].compactMap { $0 }.joined(separator: " · "))
                        .font(.footnote).foregroundStyle(.secondary)
                }
                Spacer()
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("\(slot.name), \(slot.taken ? "taken" : "not taken")")
        .accessibilityHint(slot.taken ? "Double tap to undo" : "Double tap to mark as taken")
    }
}
