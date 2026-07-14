import Foundation
#if canImport(ActivityKit)
import ActivityKit

// UWAGA: identyczna kopia tej struktury żyje w widget extension
// (ios-extras/Widgets/WorkoutAttributes.swift). ActivityKit dopasowuje
// aktywność do widoku po NAZWIE typu i kształcie pól — obie kopie muszą
// pozostać zsynchronizowane.
@available(iOS 16.2, *)
struct WorkoutAttributes: ActivityAttributes {
    let workoutType: String   // "strength" | "run"
    let planName: String

    struct ContentState: Codable, Hashable {
        // trening siłowy
        var exerciseName: String?
        var setNumber: Int?
        var setTotal: Int?
        var weightKg: Double?
        var plannedReps: Int?
        var nextExercise: String?
        var doneSets: Int?      // postęp całego treningu (zaliczone serie)
        var totalSets: Int?
        var restEndsAt: Date?
        // bieg (LA-2) — pola już w kontrakcie, by nie zmieniać schematu później
        var distanceKm: Double?
        var paceSecPerKm: Int?
        var heartRate: Int?
        var startedAt: Date
    }
}
#endif
