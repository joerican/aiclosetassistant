import SwiftUI
import AuthenticationServices

/// Sign in with Apple authentication service
@Observable
final class AuthService {
    var isAuthenticated = false
    var userID: String?
    var userName: String?
    var userEmail: String?
    var isLoading = false

    private let keychainKey = "appleUserID"

    init() {
        checkExistingAuth()
    }

    // MARK: - Check Existing Auth

    func checkExistingAuth() {
        if let savedUserID = KeychainHelper.load(key: keychainKey) {
            userID = savedUserID
            isAuthenticated = true

            // Verify credential state with Apple
            Task {
                await verifyCredentialState(userID: savedUserID)
            }
        }
    }

    private func verifyCredentialState(userID: String) async {
        let provider = ASAuthorizationAppleIDProvider()

        do {
            let state = try await provider.credentialState(forUserID: userID)
            await MainActor.run {
                switch state {
                case .authorized:
                    self.isAuthenticated = true
                case .revoked, .notFound:
                    self.signOut()
                case .transferred:
                    // Handle account transfer if needed
                    break
                @unknown default:
                    break
                }
            }
        } catch {
            print("Failed to verify credential state: \(error)")
        }
    }

    // MARK: - Handle Sign In Result

    func handleSignInWithApple(result: Result<ASAuthorization, Error>) {
        isLoading = false

        switch result {
        case .success(let auth):
            guard let credential = auth.credential as? ASAuthorizationAppleIDCredential else {
                return
            }

            userID = credential.user

            // Full name and email are only provided on first sign in
            if let fullName = credential.fullName {
                userName = PersonNameComponentsFormatter().string(from: fullName)
            }

            if let email = credential.email {
                userEmail = email
            }

            // Persist user ID in Keychain
            KeychainHelper.save(key: keychainKey, value: credential.user)

            isAuthenticated = true

        case .failure(let error):
            // User cancelled or other error
            if (error as NSError).code != ASAuthorizationError.canceled.rawValue {
                print("Sign in with Apple failed: \(error)")
            }
        }
    }

    // MARK: - Sign Out

    func signOut() {
        KeychainHelper.delete(key: keychainKey)
        userID = nil
        userName = nil
        userEmail = nil
        isAuthenticated = false
    }
}

// MARK: - Sign In Button View

struct SignInWithAppleButtonView: View {
    @Environment(AuthService.self) private var authService

    var body: some View {
        SignInWithAppleButton(.signIn) { request in
            request.requestedScopes = [.fullName, .email]
        } onCompletion: { result in
            authService.handleSignInWithApple(result: result)
        }
        .signInWithAppleButtonStyle(.black)
        .frame(height: 50)
        .cornerRadius(10)
    }
}
