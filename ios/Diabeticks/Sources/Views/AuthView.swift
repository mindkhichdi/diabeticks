import AuthenticationServices
import SwiftUI

struct AuthView: View {
    @Environment(AuthStore.self) private var auth
    @Environment(\.colorScheme) private var scheme

    enum Mode { case signIn, signUp, forgot }

    @State private var mode: Mode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var busy = false
    @State private var error: String?
    @State private var notice: String?

    private var title: String {
        switch mode {
        case .signIn: "Welcome back"
        case .signUp: "Create your account"
        case .forgot: "Reset your password"
        }
    }
    private var subtitle: String {
        switch mode {
        case .signIn: "Sign in to see today's readings and doses."
        case .signUp: "Free, and it takes under a minute."
        case .forgot: "We'll email you a link to choose a new one."
        }
    }
    private var action: String {
        switch mode {
        case .signIn: "Sign in"
        case .signUp: "Create account"
        case .forgot: "Send reset link"
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 6) {
                    Image(systemName: "drop.fill").font(.largeTitle).foregroundStyle(.tint)
                    Text("Diabeticks").font(.title3.weight(.semibold)).foregroundStyle(.tint)
                }
                .padding(.top, 40)

                VStack(alignment: .leading, spacing: 6) {
                    Text(title).font(.largeTitle.bold())
                    Text(subtitle).foregroundStyle(.secondary)
                }

                VStack(spacing: 12) {
                    TextField("Email", text: $email)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .fieldStyle()
                    if mode != .forgot {
                        SecureField("Password", text: $password)
                            .textContentType(mode == .signUp ? .newPassword : .password)
                            .fieldStyle()
                    }
                }

                if let error {
                    Text(error).font(.callout).foregroundStyle(.red)
                }
                if let notice {
                    Text(notice).font(.callout).foregroundStyle(.tint)
                }

                Button {
                    Task { await submit() }
                } label: {
                    Text(busy ? "Please wait…" : action)
                        .font(.headline).frame(maxWidth: .infinity, minHeight: 28)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(busy || email.isEmpty || (mode != .forgot && password.count < 6))

                if mode != .forgot {
                    HStack {
                        Rectangle().frame(height: 1).foregroundStyle(.separator)
                        Text("or").font(.footnote).foregroundStyle(.secondary)
                        Rectangle().frame(height: 1).foregroundStyle(.separator)
                    }

                    SignInWithAppleButton(mode == .signUp ? .signUp : .signIn) { request in
                        auth.prepare(request)
                    } onCompletion: { result in
                        Task { await apple(result) }
                    }
                    .signInWithAppleButtonStyle(scheme == .dark ? .white : .black)
                    .frame(height: 50)
                    .disabled(busy)
                }

                VStack(alignment: .leading, spacing: 10) {
                    switch mode {
                    case .signIn:
                        Button("Forgot password?") { switchTo(.forgot) }
                        Button("New here? Create an account") { switchTo(.signUp) }
                    case .signUp:
                        Button("Already have an account? Sign in") { switchTo(.signIn) }
                    case .forgot:
                        Button("Back to sign in") { switchTo(.signIn) }
                    }
                }
                .font(.callout)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 32)
        }
        .scrollDismissesKeyboard(.interactively)
    }

    private func switchTo(_ new: Mode) {
        mode = new; error = nil; notice = nil
    }

    private func submit() async {
        busy = true; error = nil; notice = nil
        defer { busy = false }
        let mail = email.trimmingCharacters(in: .whitespaces)
        do {
            switch mode {
            case .signIn:
                try await auth.signIn(email: mail, password: password)
            case .signUp:
                if try await auth.signUp(email: mail, password: password) {
                    notice = "Check your email to confirm your account, then sign in."
                    mode = .signIn
                }
            case .forgot:
                try await auth.sendPasswordReset(email: mail)
                notice = "If that email has an account, a reset link is on its way."
            }
        } catch {
            self.error = friendly(error)
        }
    }

    private func apple(_ result: Result<ASAuthorization, Error>) async {
        busy = true; error = nil
        defer { busy = false }
        do { try await auth.completeApple(result) }
        catch { self.error = friendly(error) }
    }

    private func friendly(_ error: Error) -> String {
        let message = error.localizedDescription
        if message.localizedCaseInsensitiveContains("invalid login") { return "That email and password don't match." }
        if message.localizedCaseInsensitiveContains("already registered") { return "That email already has an account. Try signing in." }
        return message
    }
}

private extension View {
    func fieldStyle() -> some View {
        padding(14)
            .background(.fill.tertiary, in: RoundedRectangle(cornerRadius: 12))
    }
}
