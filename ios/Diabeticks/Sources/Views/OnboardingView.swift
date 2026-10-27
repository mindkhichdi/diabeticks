import SwiftUI

/// First-run tour: welcome, a bento grid of what the app does, then a first step.
/// `finish` receives the tab to open (nil to stay on Today).
struct OnboardingView: View {
    let finish: (AppTab?) -> Void
    @State private var page = 0

    var body: some View {
        ZStack(alignment: .top) {
            Color(.systemGroupedBackground).ignoresSafeArea()
            TabView(selection: $page) {
                WelcomePage().tag(0)
                BentoPage().tag(1)
                StartPage(finish: finish).tag(2)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .ignoresSafeArea(edges: .bottom)

            HStack {
                Spacer()
                if page < 2 {
                    Button("Skip") { finish(nil) }.font(.subheadline.weight(.medium))
                }
            }
            .padding(.horizontal, 20).padding(.top, 8).frame(height: 44)
        }
        .overlay(alignment: .bottom) {
            VStack(spacing: 16) {
                HStack(spacing: 8) {
                    ForEach(0..<3) { i in
                        Capsule().fill(i == page ? Color.accentColor : Color.secondary.opacity(0.3))
                            .frame(width: i == page ? 22 : 8, height: 8)
                    }
                }
                .animation(.spring(duration: 0.35), value: page)
                if page < 2 {
                    Button {
                        withAnimation(.snappy) { page += 1 }
                    } label: {
                        Text(page == 0 ? "Show me around" : "Continue").font(.headline).frame(maxWidth: .infinity).padding(.vertical, 6)
                    }
                    .buttonStyle(.borderedProminent).controlSize(.large)
                }
            }
            .padding(.horizontal, 24).padding(.bottom, 16)
        }
    }
}

// MARK: Page 1 — welcome

private struct WelcomePage: View {
    @State private var draw = false
    @State private var pulse = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(spacing: 28) {
            Spacer()
            ZStack {
                Circle().fill(Color.accentColor.opacity(0.12)).frame(width: 240, height: 240)
                    .scaleEffect(pulse ? 1.08 : 0.92)
                Circle().fill(Color.accentColor.opacity(0.10)).frame(width: 180, height: 180)
                    .scaleEffect(pulse ? 0.95 : 1.08)
                Image(systemName: "drop.fill").font(.system(size: 76))
                    .foregroundStyle(.tint)
                    .offset(y: pulse ? -4 : 4)
                TraceLine()
                    .trim(from: 0, to: draw ? 1 : 0)
                    .stroke(Color.accentColor, style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round))
                    .frame(width: 260, height: 60)
                    .offset(y: 100)
            }
            .frame(height: 300)

            VStack(spacing: 10) {
                Text("Your diabetes,\nclearer every day").font(.system(size: 32, weight: .bold, design: .rounded))
                    .multilineTextAlignment(.center)
                Text("Log sugar, medicine and meals in seconds, and see what's working.")
                    .font(.body).foregroundStyle(.secondary).multilineTextAlignment(.center)
            }
            .padding(.horizontal, 32)
            Spacer(); Spacer()
        }
        .onAppear {
            guard !reduceMotion else { draw = true; return }
            withAnimation(.easeInOut(duration: 2.2).repeatForever(autoreverses: true)) { draw = true }
            withAnimation(.easeInOut(duration: 2.8).repeatForever(autoreverses: true)) { pulse = true }
        }
    }
}

private struct TraceLine: Shape {
    func path(in r: CGRect) -> Path {
        var p = Path()
        let pts: [(CGFloat, CGFloat)] = [(0, 0.6), (0.14, 0.55), (0.26, 0.8), (0.4, 0.3), (0.54, 0.5),
                                         (0.68, 0.15), (0.82, 0.45), (1, 0.25)]
        p.move(to: CGPoint(x: r.minX, y: r.minY + r.height * pts[0].1))
        for i in 1..<pts.count {
            let a = CGPoint(x: r.minX + r.width * pts[i - 1].0, y: r.minY + r.height * pts[i - 1].1)
            let b = CGPoint(x: r.minX + r.width * pts[i].0, y: r.minY + r.height * pts[i].1)
            let mx = (a.x + b.x) / 2
            p.addCurve(to: b, control1: CGPoint(x: mx, y: a.y), control2: CGPoint(x: mx, y: b.y))
        }
        return p
    }
}

// MARK: Page 2 — bento grid

private struct BentoPage: View {
    @State private var shown = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Everything in one place").font(.system(size: 28, weight: .bold, design: .rounded))
                Text("Five things Diabeticks does for you.").foregroundStyle(.secondary)
            }
            .padding(.top, 52)

            Grid(horizontalSpacing: 12, verticalSpacing: 12) {
                GridRow {
                    BentoTile(title: "Blood sugar", subtitle: "Log it, see if it's in range, get gentle advice.", tint: .blue, index: 0, shown: shown) { SugarArt() }
                        .gridCellColumns(2)
                }
                GridRow {
                    BentoTile(title: "Medicine", subtitle: "Add yours, tick off doses.", tint: .green, index: 1, shown: shown) { CheckArt() }
                    BentoTile(title: "HbA1c", subtitle: "Track your 3‑month trend.", tint: .orange, index: 2, shown: shown) { RingArt() }
                }
                GridRow {
                    BentoTile(title: "Food scan", subtitle: "Snap a meal, get carbs.", tint: .pink, index: 3, shown: shown) { ScanArt() }
                    BentoTile(title: "Prescriptions", subtitle: "Keep every one handy.", tint: .purple, index: 4, shown: shown) { StackArt() }
                }
                GridRow {
                    BentoTile(title: "AI insights", subtitle: "Plain-language trends and questions for your clinician.", tint: .indigo, index: 5, shown: shown) { SparkArt() }
                        .gridCellColumns(2)
                }
            }
            Spacer(minLength: 90)
        }
        .padding(.horizontal, 20)
        .onAppear { shown = true }
        .onDisappear { shown = false }
    }
}

private struct BentoTile<Art: View>: View {
    let title: String
    let subtitle: String
    let tint: Color
    let index: Int
    let shown: Bool
    @ViewBuilder var art: Art

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            art.frame(maxWidth: .infinity, maxHeight: .infinity)
            Text(title).font(.headline)
            Text(subtitle).font(.caption).foregroundStyle(.secondary).lineLimit(3).fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 130, alignment: .leading)
        .background(tint.opacity(0.12), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
        .tint(tint)
        .scaleEffect(shown ? 1 : 0.85).opacity(shown ? 1 : 0)
        .animation(.spring(duration: 0.55, bounce: 0.3).delay(Double(index) * 0.08), value: shown)
        .accessibilityElement(children: .combine)
    }
}

// Looping mini-illustrations. Each is a small self-contained animation.

private struct SugarArt: View {
    @State private var on = false
    var body: some View {
        TraceLine().trim(from: 0, to: on ? 1 : 0)
            .stroke(.tint, style: StrokeStyle(lineWidth: 3, lineCap: .round)).frame(height: 36)
            .onAppear { withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) { on = true } }
    }
}

private struct CheckArt: View {
    @State private var on = false
    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<3) { i in
                Image(systemName: on && i < 2 ? "checkmark.circle.fill" : "circle")
                    .font(.title2).foregroundStyle(.tint).scaleEffect(on && i < 2 ? 1 : 0.9)
                    .animation(.spring(duration: 0.4, bounce: 0.5).delay(Double(i) * 0.25), value: on)
            }
        }
        .task { while !Task.isCancelled { on.toggle(); try? await Task.sleep(for: .seconds(1.8)) } }
    }
}

private struct RingArt: View {
    @State private var on = false
    var body: some View {
        ZStack {
            Circle().stroke(.tint.opacity(0.2), lineWidth: 6)
            Circle().trim(from: 0, to: on ? 0.7 : 0.15).stroke(.tint, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Text("6.8%").font(.caption2.bold())
        }
        .frame(width: 44, height: 44)
        .onAppear { withAnimation(.easeInOut(duration: 1.6).repeatForever(autoreverses: true)) { on = true } }
    }
}

private struct ScanArt: View {
    @State private var on = false
    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 8).stroke(.tint, lineWidth: 2).frame(width: 44, height: 36)
            Image(systemName: "fork.knife").foregroundStyle(.tint)
            Rectangle().fill(.tint).frame(width: 44, height: 2).offset(y: on ? 16 : -16)
        }
        .onAppear { withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) { on = true } }
    }
}

private struct StackArt: View {
    @State private var on = false
    var body: some View {
        ZStack {
            ForEach(0..<3) { i in
                RoundedRectangle(cornerRadius: 6).fill(.tint.opacity(0.25 + Double(i) * 0.25))
                    .frame(width: 34, height: 40)
                    .rotationEffect(.degrees(on ? Double(i - 1) * 12 : 0))
                    .offset(x: on ? CGFloat(i - 1) * 8 : 0)
            }
        }
        .onAppear { withAnimation(.spring(duration: 1.4, bounce: 0.4).repeatForever(autoreverses: true)) { on = true } }
    }
}

private struct SparkArt: View {
    @State private var on = false
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "sparkles").font(.title).foregroundStyle(.tint).scaleEffect(on ? 1.2 : 0.85)
            Image(systemName: "sparkle").foregroundStyle(.tint).scaleEffect(on ? 0.8 : 1.2).offset(y: -8)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onAppear { withAnimation(.easeInOut(duration: 1.1).repeatForever(autoreverses: true)) { on = true } }
    }
}

// MARK: Page 3 — first step

private struct StartPage: View {
    let finish: (AppTab?) -> Void
    @State private var shown = false

    private let steps: [(String, String, String, AppTab)] = [
        ("drop.fill", "Log a blood sugar reading", "Takes 5 seconds", .glucose),
        ("pills.fill", "Add your medicines", "Get a daily checklist", .medicine),
        ("chart.line.uptrend.xyaxis", "Record your latest HbA1c", "Start your trend line", .glucose),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Spacer(minLength: 60)
            Text("Where would you like to start?").font(.system(size: 28, weight: .bold, design: .rounded))
            Text("You can do all of this later from the tabs below.").foregroundStyle(.secondary)

            VStack(spacing: 12) {
                ForEach(Array(steps.enumerated()), id: \.offset) { i, s in
                    Button { finish(s.3) } label: {
                        HStack(spacing: 14) {
                            Image(systemName: s.0).font(.title3).frame(width: 40, height: 40)
                                .background(Color.accentColor.opacity(0.15), in: Circle())
                            VStack(alignment: .leading) {
                                Text(s.1).font(.headline).foregroundStyle(.primary)
                                Text(s.2).font(.footnote).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.footnote).foregroundStyle(.tertiary)
                        }
                        .padding(14)
                        .background(Color(.secondarySystemGroupedBackground), in: RoundedRectangle(cornerRadius: 18))
                    }
                    .buttonStyle(.plain)
                    .offset(y: shown ? 0 : 30).opacity(shown ? 1 : 0)
                    .animation(.spring(duration: 0.5).delay(Double(i) * 0.1), value: shown)
                }
            }

            Button { finish(nil) } label: {
                Text("Explore on my own").font(.headline).frame(maxWidth: .infinity).padding(.vertical, 6)
            }
            .buttonStyle(.borderedProminent).controlSize(.large).padding(.top, 8)
            Spacer(); Spacer(minLength: 40)
        }
        .padding(.horizontal, 24)
        .onAppear { shown = true }
        .onDisappear { shown = false }
    }
}
