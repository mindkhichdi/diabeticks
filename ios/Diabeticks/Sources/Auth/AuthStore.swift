import AuthenticationServices
import CryptoKit
import Foundation
import Observation
import Supabase

@Observable
@MainActor
final class AuthStore {
    enum State { case loading, signedOut, signedIn }

    private(set) var state: State = .loading
    private(set) var user: User?
    private var currentNonce: String?
    @ObservationIgnored private var listener: Task<Void, Never>?

    init() {
        listener = Task { [weak self] in
            for await (event, session) in supabase.auth.authStateChanges {
                guard let self else { return }
                switch event {
                case .initialSession, .signedIn, .tokenRefreshed, .userUpdated:
                    // An expired stored session is treated as signed out.
                    if let session, !session.isExpired {
                        self.user = session.user
                        self.state = .signedIn
                    } else if event == .initialSession {
                        self.user = nil
                        self.state = .signedOut
                    }
                case .signedOut:
                    self.user = nil
                    self.state = .signedOut
                default:
                    break
                }
            }
        }
    }

    var displayName: String {
        if case let .string(name)? = user?.userMetadata["full_name"], !name.isEmpty { return name }
        return user?.email ?? "Your account"
    }

    // MARK: Email

    func signIn(email: String, password: String) async throws {
        try await supabase.auth.signIn(email: email, password: password)
    }

    /// Returns true when the project requires email confirmation before first sign-in.
    func signUp(email: String, password: String) async throws -> Bool {
        let result = try await supabase.auth.signUp(email: email, password: password)
        return result.session == nil
    }

    func sendPasswordReset(email: String) async throws {
        try await supabase.auth.resetPasswordForEmail(email)
    }

    func signOut() async {
        try? await supabase.auth.signOut()
    }

    /// Permanently deletes the account and all its data (server-side), then signs out locally.
    func deleteAccount() async throws {
        try await supabase.functions.invoke("delete-account", options: FunctionInvokeOptions(method: .post))
        try? await supabase.auth.signOut(scope: .local)
    }

    // MARK: Sign in with Apple

    /// Configure Apple's request. The hashed nonce goes to Apple; the raw one to Supabase.
    func prepare(_ request: ASAuthorizationAppleIDRequest) {
        let raw = Self.randomNonce()
        currentNonce = raw
        request.requestedScopes = [.fullName, .email]
        request.nonce = Self.sha256(raw)
    }

    func completeApple(_ result: Result<ASAuthorization, Error>) async throws {
        switch result {
        case .failure(let error):
            if (error as? ASAuthorizationError)?.code == .canceled { return }
            throw error
        case .success(let authorization):
            guard
                let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                let tokenData = credential.identityToken,
                let idToken = String(data: tokenData, encoding: .utf8),
                let nonce = currentNonce
            else { throw AuthError.appleCredentialMissing }

            try await supabase.auth.signInWithIdToken(
                credentials: .init(provider: .apple, idToken: idToken, nonce: nonce)
            )
            currentNonce = nil

            // Apple only provides the name on the very first authorization, so save it now.
            if let name = credential.fullName {
                let full = PersonNameComponentsFormatter().string(from: name)
                if !full.isEmpty {
                    _ = try? await supabase.auth.update(user: UserAttributes(data: ["full_name": .string(full)]))
                }
            }
        }
    }

    enum AuthError: LocalizedError {
        case appleCredentialMissing
        var errorDescription: String? { "Sign in with Apple didn't return a valid credential. Try again." }
    }

    private static func randomNonce(length: Int = 32) -> String {
        let chars = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var bytes = [UInt8](repeating: 0, count: length)
        precondition(SecRandomCopyBytes(kSecRandomDefault, length, &bytes) == errSecSuccess)
        return String(bytes.map { chars[Int($0) % chars.count] })
    }

    private static func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8)).map { String(format: "%02x", $0) }.joined()
    }
}
