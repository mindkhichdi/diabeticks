import SwiftUI

enum ReadingKind: String, CaseIterable, Identifiable {
    case fasting, postPrandial
    var id: String { rawValue }
    var label: String { self == .fasting ? "Fasting" : "After meal" }
}

enum GlucoseZone {
    case veryLow, low, inRange, high, veryHigh

    var label: String {
        switch self {
        case .veryLow: "Very low"
        case .low: "Low"
        case .inRange: "In range"
        case .high: "Above range"
        case .veryHigh: "Very high"
        }
    }

    var advice: String {
        switch self {
        case .veryLow: "Treat this now: take 15g of fast sugar and recheck in 15 minutes. Get help if you feel unwell."
        case .low: "Take 15g of fast sugar (half a cup of juice or 3–4 glucose tablets), then recheck in 15 minutes."
        case .inRange: "Nicely done. Keep your usual routine."
        case .high: "Drink water and consider a short walk. Recheck later and note what you ate."
        case .veryHigh: "Recheck soon. If it stays high or you feel unwell, follow your care plan or contact your doctor."
        }
    }

    var color: Color {
        switch self {
        case .veryLow: Color(.sRGB, red: 0.678, green: 0.122, blue: 0.165)
        case .low: Color(.sRGB, red: 0.839, green: 0.259, blue: 0.227)
        case .inRange: Color(.sRGB, red: 0.165, green: 0.561, blue: 0.322)
        case .high: Color(.sRGB, red: 0.851, green: 0.561, blue: 0.071)
        case .veryHigh: Color(.sRGB, red: 0.761, green: 0.337, blue: 0.106)
        }
    }

    var symbol: String {
        switch self {
        case .inRange: "checkmark.circle.fill"
        case .low, .veryLow: "arrow.down.circle.fill"
        case .high, .veryHigh: "arrow.up.circle.fill"
        }
    }
}

/// ADA-style defaults, overridden by the user's `user_stats` when set.
struct Targets {
    var min = 80.0
    var fastingMax = 130.0
    var postMealMax = 180.0

    func upper(for kind: ReadingKind) -> Double { kind == .fasting ? fastingMax : postMealMax }

    func zone(_ value: Double, kind: ReadingKind) -> GlucoseZone {
        if value < 54 { return .veryLow }
        if value < 70 { return .low }
        if value > 250 { return .veryHigh }
        if value > upper(for: kind) { return .high }
        return .inRange
    }
}

enum DateKey {
    private static let formatter: DateFormatter = {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
    static func string(_ date: Date = .now) -> String { formatter.string(from: date) }
    static func date(_ key: String) -> Date? { formatter.date(from: key) }
}
