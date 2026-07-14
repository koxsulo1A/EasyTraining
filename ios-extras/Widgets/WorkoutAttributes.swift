import Foundation
import ActivityKit

// KOPIA struktury z plugins/live-activity/ios/Plugin/WorkoutAttributes.swift —
// musi mieć identyczną nazwę i pola (ActivityKit dopasowuje po typie).
struct WorkoutAttributes: ActivityAttributes {
    let workoutType: String
    let planName: String

    struct ContentState: Codable, Hashable {
        var exerciseName: String?
        var setNumber: Int?
        var setTotal: Int?
        var weightKg: Double?
        var plannedReps: Int?
        var nextExercise: String?
        var doneSets: Int?      // postęp całego treningu (zaliczone serie)
        var totalSets: Int?
        var restEndsAt: Date?
        var distanceKm: Double?
        var paceSecPerKm: Int?
        var heartRate: Int?
        var startedAt: Date
    }
}
