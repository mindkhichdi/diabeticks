import Foundation
import Observation
import Supabase

@Observable
@MainActor
final class DataStore {
    private(set) var readings: [Reading] = []
    private(set) var targets = Targets()
    private(set) var medicineSlots: [MedicineSlot] = []
    private(set) var foodToday: [FoodLog] = []
    private(set) var fitnessWeek: [FitnessLog] = []
    private(set) var prescriptions: [Prescription] = []
    private(set) var isLoading = false
    var errorMessage: String?

    private static let defaultSlots: [(id: String, name: String, time: String)] = [
        ("morning", "Morning medicine", "08:00"),
        ("afternoon", "Afternoon medicine", "14:00"),
        ("night", "Night medicine", "20:00"),
    ]

    private func userId() async throws -> String {
        try await supabase.auth.session.user.id.uuidString.lowercased()
    }

    func reset() {
        readings = []; foodToday = []; medicineSlots = []; targets = Targets()
        fitnessWeek = []; prescriptions = []
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            async let r: Void = loadReadings()
            async let t: Void = loadTargets()
            async let m: Void = loadMedicine()
            async let f: Void = loadFood()
            async let fit: Void = loadFitness()
            async let rx: Void = loadPrescriptions()
            _ = try await (r, t, m, f, fit, rx)
        } catch {
            errorMessage = "Couldn't refresh your data. Check your connection."
        }
    }

    // MARK: Glucose

    func loadReadings() async throws {
        let id = try await userId()
        readings = try await supabase.from("blood_sugar_readings")
            .select()
            .eq("user_id", value: id)
            .order("date", ascending: false)
            .order("created_at", ascending: false)
            .execute().value
    }

    func loadTargets() async throws {
        let id = try await userId()
        let rows: [TargetsRow] = try await supabase.from("user_stats")
            .select("blood_sugar_target_min, blood_sugar_target_max")
            .eq("user_id", value: id)
            .limit(1)
            .execute().value
        var t = Targets()
        if let min = rows.first?.min { t.min = Double(min) }
        if let max = rows.first?.max { t.fastingMax = Double(max) }
        targets = t
    }

    func addReading(kind: ReadingKind?, value: Double, hba1c: Bool = false) async {
        do {
            var row = NewReading(userId: try await userId(), date: DateKey.string())
            if hba1c { row.hba1c = value }
            else if kind == .fasting { row.fasting = value }
            else { row.postPrandial = value }
            try await supabase.from("blood_sugar_readings").insert(row).execute()
            try await loadReadings()
        } catch {
            errorMessage = "Couldn't save the reading. Check your connection and try again."
        }
    }

    func deleteReading(_ reading: Reading) async {
        do {
            try await supabase.from("blood_sugar_readings").delete().eq("id", value: reading.id).execute()
            readings.removeAll { $0.id == reading.id }
        } catch {
            errorMessage = "Couldn't delete the reading. Try again."
        }
    }

    // MARK: Medicine

    func loadMedicine() async throws {
        let id = try await userId()
        let start = Calendar.current.startOfDay(for: .now)
        let end = Calendar.current.date(byAdding: .day, value: 1, to: start)!
        let iso = ISO8601DateFormatter()

        async let prefsReq: [MedicinePref] = supabase.from("medicine_preferences")
            .select("slot_id, custom_name, custom_time")
            .eq("user_id", value: id)
            .execute().value
        async let logsReq: [MedicineLog] = supabase.from("medicine_logs")
            .select("id, medicine_time, taken_at")
            .eq("user_id", value: id)
            .gte("taken_at", value: iso.string(from: start))
            .lt("taken_at", value: iso.string(from: end))
            .order("taken_at")
            .execute().value
        let (prefs, logs) = try await (prefsReq, logsReq)

        medicineSlots = Self.defaultSlots.map { slot in
            let pref = prefs.first { $0.slotId == slot.id }
            return MedicineSlot(
                id: slot.id,
                name: pref?.customName.flatMap { $0.isEmpty ? nil : $0 } ?? slot.name,
                time: pref?.customTime.map { String($0.prefix(5)) } ?? slot.time,
                log: logs.first { $0.medicineTime == slot.id }
            )
        }
    }

    func toggleDose(_ slot: MedicineSlot) async {
        do {
            if let log = slot.log {
                try await supabase.from("medicine_logs").delete().eq("id", value: log.id).execute()
            } else {
                let row = NewMedicineLog(userId: try await userId(), medicineTime: slot.id)
                try await supabase.from("medicine_logs").insert(row).execute()
            }
            try await loadMedicine()
        } catch {
            errorMessage = "Couldn't save that dose. Try again."
        }
    }

    // MARK: Food

    func loadFood() async throws {
        let id = try await userId()
        foodToday = try await supabase.from("food_logs")
            .select("id, food_item, meal_type, quantity, calories, carbs, proteins, fats")
            .eq("user_id", value: id)
            .eq("date", value: DateKey.string())
            .order("created_at")
            .execute().value
    }

    func addFood(name: String, meal: MealType, quantity: String, calories: Double?, carbs: Double?,
                 proteins: Double? = nil, fats: Double? = nil) async {
        do {
            let row = NewFoodLog(
                userId: try await userId(), date: DateKey.string(), foodItem: name,
                mealType: meal.rawValue, quantity: quantity,
                calories: calories.map { String(Int($0)) }, carbs: carbs,
                proteins: proteins, fats: fats
            )
            try await supabase.from("food_logs").insert(row).execute()
            try await loadFood()
        } catch {
            errorMessage = "Couldn't save that food. Try again."
        }
    }

    func deleteFood(_ log: FoodLog) async {
        do {
            try await supabase.from("food_logs").delete().eq("id", value: log.id).execute()
            foodToday.removeAll { $0.id == log.id }
        } catch {
            errorMessage = "Couldn't delete that food. Try again."
        }
    }

    // MARK: Medicine customisation

    /// Saves a slot's custom name/time. Blank values fall back to the defaults.
    func savePreference(slotId: String, name: String, time: String?) async {
        do {
            let id = try await userId()
            let trimmed = name.trimmingCharacters(in: .whitespaces)
            let row = MedicinePrefWrite(userId: id, slotId: slotId,
                                        customName: trimmed.isEmpty ? nil : trimmed, customTime: time)
            let existing: [MedicinePrefRow] = try await supabase.from("medicine_preferences")
                .select("id").eq("user_id", value: id).eq("slot_id", value: slotId).limit(1)
                .execute().value
            if let first = existing.first {
                try await supabase.from("medicine_preferences").update(row).eq("id", value: first.id).execute()
            } else {
                try await supabase.from("medicine_preferences").insert(row).execute()
            }
            try await loadMedicine()
        } catch {
            errorMessage = "Couldn't save your preferences. Try again."
        }
    }

    // MARK: Fitness

    func loadFitness() async throws {
        let id = try await userId()
        let since = Calendar.current.date(byAdding: .day, value: -6, to: .now)!
        fitnessWeek = try await supabase.from("fitness_logs")
            .select("id, activity_type, duration_minutes, calories_burned, steps, distance_km, date")
            .eq("user_id", value: id)
            .gte("date", value: DateKey.string(since))
            .order("created_at", ascending: false)
            .execute().value
    }

    func addActivity(_ activity: Activity, minutes: Int, steps: Int?, distanceKm: Double?) async {
        do {
            let row = NewFitnessLog(
                userId: try await userId(), date: DateKey.string(), activityType: activity.rawValue,
                durationMinutes: minutes, caloriesBurned: Int((activity.caloriesPerMinute * Double(minutes)).rounded()),
                steps: steps, distanceKm: distanceKm
            )
            try await supabase.from("fitness_logs").insert(row).execute()
            try await loadFitness()
        } catch {
            errorMessage = "Couldn't save that activity. Try again."
        }
    }

    func deleteActivity(_ log: FitnessLog) async {
        do {
            try await supabase.from("fitness_logs").delete().eq("id", value: log.id).execute()
            fitnessWeek.removeAll { $0.id == log.id }
        } catch {
            errorMessage = "Couldn't delete that activity. Try again."
        }
    }

    // MARK: Prescriptions

    func loadPrescriptions() async throws {
        let id = try await userId()
        prescriptions = try await supabase.from("prescriptions")
            .select()
            .eq("user_id", value: id)
            .order("created_at", ascending: false)
            .execute().value
    }

    func uploadPrescription(data: Data, contentType: String, fileExtension: String) async {
        do {
            let id = try await userId()
            // Files live under the user's own folder, matching the bucket's per-user policies.
            let path = "\(id)/\(Int(Date().timeIntervalSince1970 * 1000))_\(UUID().uuidString.lowercased()).\(fileExtension)"
            try await supabase.storage.from("prescriptions")
                .upload(path, data: data, options: FileOptions(contentType: contentType))
            let row = NewPrescription(id: UUID().uuidString.lowercased(), userId: id, filePath: path, fileType: contentType)
            do {
                try await supabase.from("prescriptions").insert(row).execute()
            } catch {
                _ = try? await supabase.storage.from("prescriptions").remove(paths: [path])
                throw error
            }
            try await loadPrescriptions()
        } catch {
            errorMessage = "Couldn't upload that prescription. Try again."
        }
    }

    func deletePrescription(_ rx: Prescription) async {
        do {
            _ = try await supabase.storage.from("prescriptions").remove(paths: [rx.filePath])
            try await supabase.from("prescriptions").delete().eq("id", value: rx.id).execute()
            prescriptions.removeAll { $0.id == rx.id }
        } catch {
            errorMessage = "Couldn't delete that prescription. Try again."
        }
    }

    /// Downloads a prescription into a temp file that QuickLook can preview.
    func localFile(for rx: Prescription) async -> URL? {
        do {
            let data = try await supabase.storage.from("prescriptions").download(path: rx.filePath)
            let ext = (rx.filePath as NSString).pathExtension
            let url = FileManager.default.temporaryDirectory.appendingPathComponent("prescription-\(rx.id).\(ext)")
            try data.write(to: url)
            return url
        } catch {
            errorMessage = "Couldn't open that file. Try again."
            return nil
        }
    }
}
