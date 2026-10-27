import SwiftUI

struct TodayView: View {
    @Environment(DataStore.self) private var store
    @State private var logging = false

    private var todayKey: String { DateKey.string() }
    private var todays: [Reading] { store.readings.filter { $0.date == todayKey } }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    glucoseCard
                    medicineCard
                    foodCard
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle(Date.now.formatted(.dateTime.weekday(.wide).month().day()))
            .refreshable { await store.load() }
            .toolbar {
                Button { logging = true } label: { Label("Log sugar", systemImage: "plus") }
            }
            .sheet(isPresented: $logging) { LogReadingSheet() }
        }
    }

    private var glucoseCard: some View {
        Card(title: "Blood sugar", symbol: "drop.fill") {
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
                Text("No reading yet today.").foregroundStyle(.secondary)
                Button("Log a reading") { logging = true }.buttonStyle(.borderedProminent)
            }
        }
    }

    private var medicineCard: some View {
        let taken = store.medicineSlots.filter(\.taken).count
        return Card(title: "Medicine · \(taken) of \(store.medicineSlots.count)", symbol: "pills.fill") {
            ForEach(store.medicineSlots) { slot in
                DoseRow(slot: slot)
            }
        }
    }

    private var foodCard: some View {
        let kcal = store.foodToday.reduce(0) { $0 + $1.caloriesValue }
        return Card(title: "Food", symbol: "fork.knife") {
            HStack(alignment: .firstTextBaseline) {
                Text("\(Int(kcal))").font(.title.bold())
                Text("kcal from \(store.foodToday.count) item\(store.foodToday.count == 1 ? "" : "s")")
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct Card<Content: View>: View {
    let title: String
    let symbol: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label(title, systemImage: symbol).font(.headline).foregroundStyle(.tint)
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
                    Text(slot.taken ? "Taken" : slot.displayTime).font(.footnote).foregroundStyle(.secondary)
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
