import SwiftUI

struct AIInsightsSection: View {
    @Environment(DataStore.self) private var store
    @State private var insights: Insights?
    @State private var loading = false
    @State private var error: String?

    var body: some View {
        Section {
            VStack(alignment: .leading, spacing: 6) {
                Label("AI insights", systemImage: "sparkles").font(.headline).foregroundStyle(.tint)
                Text("A plain-language look at your readings, plus questions for your clinician.")
                    .font(.footnote).foregroundStyle(.secondary)
            }

            Button {
                Task { await run() }
            } label: {
                if loading {
                    HStack { ProgressView(); Text("Thinking…") }
                } else {
                    Text(insights == nil ? "Summarize my trends" : "Refresh")
                }
            }
            .disabled(loading || store.readings.isEmpty)

            if let error { Text(error).font(.callout).foregroundStyle(.red) }

            if let insights, !loading {
                Text(insights.summary)
                if let trends = insights.trends, !trends.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Label("What stands out", systemImage: "chart.line.uptrend.xyaxis").font(.subheadline.bold())
                        ForEach(trends, id: \.self) { Text("• \($0)").font(.callout) }
                    }
                }
                if let questions = insights.questions, !questions.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Label("Ask your clinician", systemImage: "questionmark.bubble").font(.subheadline.bold())
                        ForEach(Array(questions.enumerated()), id: \.offset) { i, q in
                            Text("\(i + 1). \(q)").font(.callout)
                        }
                    }
                }
                Text("AI-generated from your logs. Not medical advice — always check with your care team.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
    }

    private func run() async {
        loading = true; error = nil
        defer { loading = false }
        do { insights = try await AIService.insights() }
        catch { self.error = error.localizedDescription }
    }
}
