import Foundation
import Capacitor
#if canImport(ActivityKit)
import ActivityKit
#endif

@objc(LiveActivityPlugin)
public class LiveActivityPlugin: CAPPlugin {

    private var lastStateJson: String = ""

    @objc func isAvailable(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            let enabled = ActivityAuthorizationInfo().areActivitiesEnabled
            call.resolve(["available": enabled])
            return
        }
        #endif
        call.resolve(["available": false])
    }

    @objc func start(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            guard ActivityAuthorizationInfo().areActivitiesEnabled else {
                call.resolve(["started": false, "reason": "disabled"]); return
            }
            // Zamknij osierocone aktywności z poprzedniej sesji (np. crash)
            for act in Activity<WorkoutAttributes>.activities {
                Task { await act.end(nil, dismissalPolicy: .immediate) }
            }
            let attrs = WorkoutAttributes(
                workoutType: call.getString("workoutType") ?? "strength",
                planName: call.getString("planName") ?? ""
            )
            let state = Self.parseState(call)
            do {
                _ = try Activity.request(
                    attributes: attrs,
                    content: .init(state: state, staleDate: nil)
                )
                lastStateJson = Self.stateKey(state)
                call.resolve(["started": true])
            } catch {
                call.resolve(["started": false, "reason": error.localizedDescription])
            }
            return
        }
        #endif
        call.resolve(["started": false, "reason": "unsupported"])
    }

    @objc func update(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            let state = Self.parseState(call)
            let key = Self.stateKey(state)
            // Dedup: identyczny stan nie budzi systemu
            if key == lastStateJson { call.resolve(); return }
            lastStateJson = key
            Task {
                for act in Activity<WorkoutAttributes>.activities {
                    await act.update(.init(state: state, staleDate: nil))
                }
                call.resolve()
            }
            return
        }
        #endif
        call.resolve()
    }

    @objc func end(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            lastStateJson = ""
            Task {
                for act in Activity<WorkoutAttributes>.activities {
                    await act.end(nil, dismissalPolicy: .immediate)
                }
                call.resolve()
            }
            return
        }
        #endif
        call.resolve()
    }

    #if canImport(ActivityKit)
    @available(iOS 16.2, *)
    private static func parseState(_ call: CAPPluginCall) -> WorkoutAttributes.ContentState {
        var st = WorkoutAttributes.ContentState(
            startedAt: Date(timeIntervalSince1970: (call.getDouble("startedAt") ?? Date().timeIntervalSince1970 * 1000) / 1000)
        )
        st.exerciseName = call.getString("exerciseName")
        st.setNumber = call.getInt("setNumber")
        st.setTotal = call.getInt("setTotal")
        st.weightKg = call.getDouble("weightKg")
        st.plannedReps = call.getInt("plannedReps")
        st.nextExercise = call.getString("nextExercise")
        if let restMs = call.getDouble("restEndsAt") {
            st.restEndsAt = Date(timeIntervalSince1970: restMs / 1000)
        }
        st.distanceKm = call.getDouble("distanceKm")
        st.paceSecPerKm = call.getInt("paceSecPerKm")
        st.heartRate = call.getInt("heartRate")
        return st
    }

    @available(iOS 16.2, *)
    private static func stateKey(_ s: WorkoutAttributes.ContentState) -> String {
        return "\(s.exerciseName ?? "")|\(s.setNumber ?? -1)|\(s.weightKg ?? -1)|\(s.restEndsAt?.timeIntervalSince1970 ?? -1)|\(s.distanceKm ?? -1)|\(s.heartRate ?? -1)"
    }
    #endif
}
