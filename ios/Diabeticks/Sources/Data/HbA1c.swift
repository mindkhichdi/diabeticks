import SwiftUI

/// HbA1c is a ~3 month average, reported as a percentage. Ranges follow ADA guidance.
enum HbA1cBand {
    case normal, prediabetes, diabetes

    init(_ value: Double) {
        self = value < 5.7 ? .normal : value < 6.5 ? .prediabetes : .diabetes
    }

    var label: String {
        switch self {
        case .normal: "Normal range"
        case .prediabetes: "Prediabetes range"
        case .diabetes: "Diabetes range"
        }
    }

    var color: Color {
        switch self {
        case .normal: GlucoseZone.inRange.color
        case .prediabetes: GlucoseZone.high.color
        case .diabetes: GlucoseZone.veryHigh.color
        }
    }
}

enum HbA1c {
    /// Common goal for adults managing diabetes. Your clinician may set a different one.
    static let goal = 7.0
    static let validRange = 3.0...20.0

    /// Estimated average glucose in mg/dL (ADAG formula).
    static func estimatedAverage(_ a1c: Double) -> Int { Int((28.7 * a1c - 46.7).rounded()) }

    static func format(_ v: Double) -> String { String(format: "%.1f%%", v) }
}

struct HbA1cPoint: Identifiable {
    let id: String
    let date: Date
    let value: Double
}

extension DataStore {
    /// Oldest first, for charting.
    var hba1cPoints: [HbA1cPoint] {
        hba1cReadings.compactMap { r in
            guard let d = DateKey.date(r.date), let v = r.hba1c else { return nil }
            return HbA1cPoint(id: r.id, date: d, value: v)
        }
        .sorted { $0.date < $1.date }
    }
}
