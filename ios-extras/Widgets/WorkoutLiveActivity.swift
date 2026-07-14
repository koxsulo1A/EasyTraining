import ActivityKit
import WidgetKit
import SwiftUI

@main
struct EasyTrainingWidgetsBundle: WidgetBundle {
    var body: some Widget {
        WorkoutLiveActivity()
    }
}

struct WorkoutLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutAttributes.self) { context in
            // ── EKRAN BLOKADY ──
            LockScreenView(context: context)
                .activityBackgroundTint(Color(red: 0.03, green: 0.03, blue: 0.06))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                // ── EXPANDED ──
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.state.exerciseName ?? context.attributes.planName)
                            .font(.headline).lineLimit(1)
                        if let n = context.state.setNumber, let t = context.state.setTotal {
                            Text("Seria \(n)/\(t)").font(.caption).foregroundColor(.secondary)
                        }
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        if let w = context.state.weightKg, let r = context.state.plannedReps {
                            Text("\(fmtKg(w)) × \(r)").font(.headline)
                        }
                        if let next = context.state.nextExercise {
                            Text("→ \(next)").font(.caption2).foregroundColor(.secondary).lineLimit(1)
                        }
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if let end = context.state.restEndsAt, end > Date() {
                        HStack {
                            Text("Przerwa").font(.caption).foregroundColor(.secondary)
                            Spacer()
                            Text(timerInterval: Date()...end, countsDown: true)
                                .font(.title2.monospacedDigit().weight(.bold))
                                .foregroundColor(.orange)
                                .frame(maxWidth: 70)
                        }
                    }
                }
            } compactLeading: {
                Text("💪")
            } compactTrailing: {
                if let end = context.state.restEndsAt, end > Date() {
                    Text(timerInterval: Date()...end, countsDown: true)
                        .font(.caption2.monospacedDigit())
                        .foregroundColor(.orange)
                        .frame(maxWidth: 44)
                } else {
                    Text(timerInterval: context.state.startedAt...Date().addingTimeInterval(8*3600), countsDown: false)
                        .font(.caption2.monospacedDigit())
                        .frame(maxWidth: 44)
                }
            } minimal: {
                if let end = context.state.restEndsAt, end > Date() {
                    Text(timerInterval: Date()...end, countsDown: true)
                        .font(.caption2.monospacedDigit())
                        .foregroundColor(.orange)
                        .frame(maxWidth: 36)
                } else {
                    Text("💪")
                }
            }
        }
    }
}

private struct LockScreenView: View {
    let context: ActivityViewContext<WorkoutAttributes>

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(context.attributes.workoutType == "run" ? "🏃 " : "💪 ")
                    + Text(context.attributes.planName).font(.caption).foregroundColor(.secondary)
                Spacer()
                Text(timerInterval: context.state.startedAt...Date().addingTimeInterval(8*3600), countsDown: false)
                    .font(.caption.monospacedDigit())
                    .foregroundColor(.secondary)
                    .frame(maxWidth: 60)
            }

            if let ex = context.state.exerciseName {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(ex).font(.headline).lineLimit(1)
                        HStack(spacing: 8) {
                            if let n = context.state.setNumber, let t = context.state.setTotal {
                                Text("Seria \(n)/\(t)").font(.caption).foregroundColor(.secondary)
                            }
                            if let w = context.state.weightKg, let r = context.state.plannedReps {
                                Text("\(fmtKg(w)) × \(r)").font(.caption.weight(.semibold))
                            }
                        }
                    }
                    Spacer()
                    if let end = context.state.restEndsAt, end > Date() {
                        VStack(alignment: .trailing, spacing: 0) {
                            Text("PRZERWA").font(.system(size: 9, weight: .bold)).foregroundColor(.secondary)
                            Text(timerInterval: Date()...end, countsDown: true)
                                .font(.title.monospacedDigit().weight(.bold))
                                .foregroundColor(.orange)
                                .frame(maxWidth: 90)
                                .multilineTextAlignment(.trailing)
                        }
                    }
                }
            }

            // Bieg (LA-2): sekcje pojawią się tylko gdy są dane
            if context.attributes.workoutType == "run" {
                HStack(spacing: 16) {
                    if let d = context.state.distanceKm {
                        metric("DYSTANS", String(format: "%.2f km", d))
                    }
                    if let p = context.state.paceSecPerKm {
                        metric("TEMPO", String(format: "%d:%02d /km", p / 60, p % 60))
                    }
                    if let hr = context.state.heartRate {
                        metric("TĘTNO", "\(hr) ♥")
                    }
                }
            }

            if let next = context.state.nextExercise {
                Text("Następne: \(next)").font(.caption2).foregroundColor(.secondary).lineLimit(1)
            }

            // Postęp całego treningu — pasek zaliczonych serii
            if let done = context.state.doneSets, let total = context.state.totalSets, total > 0 {
                VStack(alignment: .leading, spacing: 3) {
                    ProgressView(value: Double(done), total: Double(total))
                        .tint(.orange)
                    Text("\(done)/\(total) serii")
                        .font(.system(size: 9, weight: .semibold))
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(14)
    }

    private func metric(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label).font(.system(size: 9, weight: .bold)).foregroundColor(.secondary)
            Text(value).font(.callout.monospacedDigit().weight(.semibold))
        }
    }
}

private func fmtKg(_ v: Double) -> String {
    return v == v.rounded() ? "\(Int(v)) kg" : String(format: "%.1f kg", v)
}
