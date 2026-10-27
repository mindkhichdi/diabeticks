import Foundation

struct Reading: Codable, Identifiable, Hashable {
    let id: String
    let date: String
    let fasting: Double?
    let postPrandial: Double?
    let hba1c: Double?
    let createdAt: String

    enum CodingKeys: String, CodingKey {
        case id, date, fasting, hba1c
        case postPrandial = "post_prandial"
        case createdAt = "created_at"
    }

    var kind: ReadingKind? {
        if fasting != nil { return .fasting }
        if postPrandial != nil { return .postPrandial }
        return nil
    }
    var value: Double? { fasting ?? postPrandial ?? hba1c }
    var isHbA1c: Bool { hba1c != nil && fasting == nil && postPrandial == nil }
}

struct NewReading: Encodable {
    let userId: String
    let date: String
    var fasting: Double?
    var postPrandial: Double?
    var hba1c: Double?

    enum CodingKeys: String, CodingKey {
        case date, fasting, hba1c
        case userId = "user_id"
        case postPrandial = "post_prandial"
    }
}

struct TargetsRow: Decodable {
    let min: Int?
    let max: Int?
    enum CodingKeys: String, CodingKey {
        case min = "blood_sugar_target_min"
        case max = "blood_sugar_target_max"
    }
}

struct MedicinePref: Decodable {
    let slotId: String
    let customName: String?
    let customTime: String?
    enum CodingKeys: String, CodingKey {
        case slotId = "slot_id"
        case customName = "custom_name"
        case customTime = "custom_time"
    }
}

struct MedicineLog: Decodable, Identifiable {
    let id: String
    let medicineTime: String
    let takenAt: Date
    enum CodingKeys: String, CodingKey {
        case id
        case medicineTime = "medicine_time"
        case takenAt = "taken_at"
    }
}

struct NewMedicineLog: Encodable {
    let userId: String
    let medicineTime: String
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case medicineTime = "medicine_time"
    }
}

struct FoodLog: Decodable, Identifiable {
    let id: String
    let foodItem: String
    let mealType: String
    let quantity: String
    let calories: String?
    let carbs: Double?
    let proteins: Double?
    let fats: Double?
    enum CodingKeys: String, CodingKey {
        case id, quantity, calories, carbs, proteins, fats
        case foodItem = "food_item"
        case mealType = "meal_type"
    }
    var caloriesValue: Double { Double(calories ?? "") ?? 0 }
}

struct NewFoodLog: Encodable {
    let userId: String
    let date: String
    let foodItem: String
    let mealType: String
    let quantity: String
    var calories: String?
    var carbs: Double?
    var proteins: Double?
    var fats: Double?
    enum CodingKeys: String, CodingKey {
        case date, quantity, calories, carbs, proteins, fats
        case userId = "user_id"
        case foodItem = "food_item"
        case mealType = "meal_type"
    }
}

enum MealType: String, CaseIterable, Identifiable {
    case breakfast, lunch, snacks, dinner
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .breakfast: "cup.and.saucer.fill"
        case .lunch: "fork.knife"
        case .snacks: "apple.logo"
        case .dinner: "takeoutbag.and.cup.and.straw.fill"
        }
    }
}

struct MedicineSlot: Identifiable {
    let id: String          // morning | afternoon | night
    let name: String
    let time: String        // HH:mm
    let log: MedicineLog?
    var dosage: String? = nil
    var taken: Bool { log != nil }
    /// The three built-in slots; user-added medicines use `med:<id>:<HH:mm>` ids.
    var isBuiltIn: Bool { !id.hasPrefix("med:") }

    var displayTime: String {
        let parts = time.split(separator: ":").compactMap { Int($0) }
        var c = DateComponents(); c.hour = parts.first ?? 0; c.minute = parts.count > 1 ? parts[1] : 0
        guard let d = Calendar.current.date(from: c) else { return time }
        return d.formatted(date: .omitted, time: .shortened)
    }
}

// MARK: Medications

struct Medication: Decodable, Identifiable, Hashable {
    let id: String
    let name: String
    let dosage: String?
    let times: [String]
    let notes: String?
}

struct MedicationWrite: Encodable {
    let userId: String
    let name: String
    let dosage: String?
    let times: [String]
    let notes: String?
    enum CodingKeys: String, CodingKey {
        case name, dosage, times, notes
        case userId = "user_id"
    }
    // Explicit nulls so clearing a field really clears it on update.
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(userId, forKey: .userId)
        try c.encode(name, forKey: .name)
        try c.encode(dosage, forKey: .dosage)
        try c.encode(times, forKey: .times)
        try c.encode(notes, forKey: .notes)
    }
}

enum TimeOfDay {
    /// "HH:mm" -> a Date today, for DatePicker.
    static func date(_ hhmm: String) -> Date {
        let parts = hhmm.split(separator: ":").compactMap { Int($0) }
        return Calendar.current.date(from: DateComponents(hour: parts.first ?? 8, minute: parts.count > 1 ? parts[1] : 0)) ?? .now
    }
    static func string(_ date: Date) -> String {
        let c = Calendar.current.dateComponents([.hour, .minute], from: date)
        return String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0)
    }
    static func display(_ hhmm: String) -> String { date(hhmm).formatted(date: .omitted, time: .shortened) }
}

// MARK: Prescription scan

struct ScannedMedicine: Decodable {
    let name: String
    let dosage: String?
    let schedule: String?
    let times: [String]?
    let notes: String?
}
struct ScanResult: Decodable { let medicines: [ScannedMedicine] }

/// An editable medicine in the review screen.
struct MedicineDraft: Identifiable {
    let id = UUID()
    var include = true
    var name = ""
    var dosage = ""
    var notes = ""
    var times: [Date] = [TimeOfDay.date("08:00")]
    /// What the prescription said, shown as a hint while editing.
    var schedule = ""
    var needsTimeCheck = false

    init() {}
    init(_ s: ScannedMedicine) {
        name = s.name
        dosage = s.dosage ?? ""
        schedule = s.schedule ?? ""
        notes = s.notes ?? ""
        if let t = s.times, !t.isEmpty { times = t.sorted().map(TimeOfDay.date) } else { needsTimeCheck = true }
    }
}

// MARK: Fitness

struct FitnessLog: Decodable, Identifiable {
    let id: String
    let activityType: String
    let durationMinutes: Int
    let caloriesBurned: Int
    let steps: Int?
    let distanceKm: Double?
    let date: String?
    enum CodingKeys: String, CodingKey {
        case id, steps, date
        case activityType = "activity_type"
        case durationMinutes = "duration_minutes"
        case caloriesBurned = "calories_burned"
        case distanceKm = "distance_km"
    }
}

struct NewFitnessLog: Encodable {
    let userId: String
    let date: String
    let activityType: String
    let durationMinutes: Int
    let caloriesBurned: Int
    var steps: Int?
    var distanceKm: Double?
    enum CodingKeys: String, CodingKey {
        case date, steps
        case userId = "user_id"
        case activityType = "activity_type"
        case durationMinutes = "duration_minutes"
        case caloriesBurned = "calories_burned"
        case distanceKm = "distance_km"
    }
}

enum Activity: String, CaseIterable, Identifiable {
    case walking, running, cycling, strength
    var id: String { rawValue }
    var label: String { rawValue.capitalized }
    var symbol: String {
        switch self {
        case .walking: "figure.walk"
        case .running: "figure.run"
        case .cycling: "bicycle"
        case .strength: "dumbbell.fill"
        }
    }
    /// Same estimates the web app uses.
    var caloriesPerMinute: Double {
        switch self {
        case .walking: 4
        case .running: 11.5
        case .cycling: 7.5
        case .strength: 6
        }
    }
}

// MARK: Prescriptions

struct Prescription: Decodable, Identifiable {
    let id: String
    let filePath: String
    let fileType: String
    let createdAt: String
    let medicineName: String?
    let dosage: String?
    let schedule: String?
    enum CodingKeys: String, CodingKey {
        case id, dosage, schedule
        case filePath = "file_path"
        case fileType = "file_type"
        case createdAt = "created_at"
        case medicineName = "medicine_name"
    }
    var isPDF: Bool { fileType == "application/pdf" }
}

struct PrescriptionDetails: Encodable {
    let medicineName: String?
    let dosage: String?
    let schedule: String?
    enum CodingKeys: String, CodingKey {
        case dosage, schedule
        case medicineName = "medicine_name"
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(medicineName, forKey: .medicineName)
        try c.encode(dosage, forKey: .dosage)
        try c.encode(schedule, forKey: .schedule)
    }
}

struct NewPrescription: Encodable {
    let id: String
    let userId: String
    let filePath: String
    let fileType: String
    var medicineName: String?
    var dosage: String?
    var schedule: String?
    enum CodingKeys: String, CodingKey {
        case id, dosage, schedule
        case medicineName = "medicine_name"
        case userId = "user_id"
        case filePath = "file_path"
        case fileType = "file_type"
    }
}

// MARK: AI

struct Insights: Decodable {
    let summary: String
    let trends: [String]?
    let questions: [String]?
}

struct FoodAnalysis: Decodable {
    let foodItem: String
    let quantity: String
    let calories: Double
    let proteins: Double
    let carbs: Double
    let fats: Double
    enum CodingKeys: String, CodingKey {
        case quantity, calories, proteins, carbs, fats
        case foodItem = "food_item"
    }
}

struct MedicinePrefRow: Decodable { let id: String }
struct MedicinePrefWrite: Encodable {
    let userId: String
    let slotId: String
    let customName: String?
    let customTime: String?
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case slotId = "slot_id"
        case customName = "custom_name"
        case customTime = "custom_time"
    }
    // Send explicit nulls so clearing a field really clears it.
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(userId, forKey: .userId)
        try c.encode(slotId, forKey: .slotId)
        try c.encode(customName, forKey: .customName)
        try c.encode(customTime, forKey: .customTime)
    }
}
